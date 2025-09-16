import { Client } from '@microsoft/microsoft-graph-client';
import {
  SharePointSite,
  DocumentLibrary,
  SharePointFile,
  SharePointFolder,
  SharePointItem,
  FileContent,
  UploadFileOptions,
  SearchOptions,
  ListOptions,
  SharePointServiceConfig,
  SharePointApiResponse,
  DriveItem,
  UploadSession,
  UploadProgress
} from '../types/sharepoint';
import { SharePointClient } from '../utils/sharepoint-client';
import { SharePointCache, CacheKeys } from '../utils/cache';
import { FileTypeHandler, TextExtractor, ContentProcessor } from '../utils/file-handlers';
import { AdvancedFileProcessor } from '../utils/advanced-file-processor';
import { FileValidator, QuickFileValidator } from '../utils/file-validator';

/**
 * Comprehensive SharePoint service with caching, retry logic, and file processing
 */
export class SharePointService {
  private client: SharePointClient;
  private cache: SharePointCache;
  private config: SharePointServiceConfig;

  constructor(graphClient: Client, config?: Partial<SharePointServiceConfig>) {
    this.config = {
      retryOptions: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
      },
      cacheOptions: {
        ttl: 300000, // 5 minutes
        maxSize: 1000,
        enabled: true
      },
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedMimeTypes: FileTypeHandler.getAllSupportedMimeTypes(),
      textExtractionEnabled: true,
      ...config
    };

    this.client = new SharePointClient(graphClient, this.config);
    this.cache = new SharePointCache(this.config.cacheOptions);
  }

  // ==================== SITES AND LIBRARIES ====================

  /**
   * Get all SharePoint sites accessible to the user
   */
  async getSites(): Promise<SharePointSite[]> {
    const cacheKey = CacheKeys.sites();
    
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.makeRequest<SharePointApiResponse<SharePointSite>>(
        'GET',
        '/sites?$select=id,displayName,name,webUrl,description,createdDateTime,lastModifiedDateTime,siteCollection,root'
      );
      
      return response.value || [];
    });
  }

  /**
   * Get a specific SharePoint site
   */
  async getSite(siteId: string): Promise<SharePointSite> {
    const cacheKey = CacheKeys.site(siteId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      return await this.client.makeRequest<SharePointSite>(
        'GET',
        `/sites/${siteId}?$select=id,displayName,name,webUrl,description,createdDateTime,lastModifiedDateTime,siteCollection,root`
      );
    });
  }

  /**
   * Get document libraries (drives) for a site
   */
  async getDocumentLibraries(siteId: string): Promise<DocumentLibrary[]> {
    const cacheKey = CacheKeys.documentLibraries(siteId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const response = await this.client.makeRequest<SharePointApiResponse<DocumentLibrary>>(
        'GET',
        `/sites/${siteId}/drives?$select=id,name,description,webUrl,createdDateTime,lastModifiedDateTime,driveType,quota`
      );
      
      return response.value || [];
    });
  }

  /**
   * Get user's OneDrive
   */
  async getUserDrive(): Promise<DocumentLibrary> {
    const cacheKey = CacheKeys.userDrives();
    
    return this.cache.getOrSet(cacheKey, async () => {
      return await this.client.makeRequest<DocumentLibrary>('GET', '/me/drive');
    });
  }

  // ==================== FILES AND FOLDERS ====================

  /**
   * List files and folders in a drive/folder
   */
  async listItems(
    driveId: string, 
    itemId: string = 'root', 
    options: ListOptions = {}
  ): Promise<SharePointItem[]> {
    const cacheKey = CacheKeys.folderContents(driveId, itemId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      let endpoint = `/drives/${driveId}/items/${itemId}/children`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (options.orderBy) {
        params.append('$orderby', `${options.orderBy} ${options.orderDirection || 'asc'}`);
      }
      
      if (options.limit) {
        params.append('$top', options.limit.toString());
      }
      
      if (options.filter) {
        params.append('$filter', options.filter);
      }

      // Add standard select fields
      params.append('$select', 'id,name,size,webUrl,createdDateTime,lastModifiedDateTime,file,folder,parentReference,createdBy,lastModifiedBy,@microsoft.graph.downloadUrl');
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.client.makeRequest<SharePointApiResponse<DriveItem>>(
        'GET',
        endpoint
      );
      
      const items = response.value || [];
      
      // Convert to SharePoint items
      return items.map(item => this.convertDriveItemToSharePointItem(item));
    }, 60000); // 1 minute cache for folder contents
  }

  /**
   * Get file/folder metadata
   */
  async getItemMetadata(driveId: string, itemId: string): Promise<SharePointItem> {
    const cacheKey = CacheKeys.fileMetadata(driveId, itemId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const item = await this.client.makeRequest<DriveItem>(
        'GET',
        `/drives/${driveId}/items/${itemId}?$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,file,folder,parentReference,createdBy,lastModifiedBy,@microsoft.graph.downloadUrl`
      );
      
      return this.convertDriveItemToSharePointItem(item);
    });
  }

  /**
   * Search for files and folders
   */
  async searchItems(
    query: string,
    driveId?: string,
    options: SearchOptions = {}
  ): Promise<SharePointItem[]> {
    const cacheKey = CacheKeys.searchResults(query, driveId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      let endpoint = driveId 
        ? `/drives/${driveId}/search(q='${encodeURIComponent(query)}')`
        : `/me/drive/search(q='${encodeURIComponent(query)}')`;
      
      // Add filters if provided
      const filters: string[] = [];
      
      if (options.fileType) {
        const mimeTypes = FileTypeHandler.getSupportedMimeTypes(options.fileType);
        if (mimeTypes.length > 0) {
          const mimeTypeFilter = mimeTypes.map(mt => `file/mimeType eq '${mt}'`).join(' or ');
          filters.push(`(${mimeTypeFilter})`);
        }
      }
      
      if (options.modifiedAfter) {
        filters.push(`lastModifiedDateTime ge ${options.modifiedAfter.toISOString()}`);
      }
      
      if (options.modifiedBefore) {
        filters.push(`lastModifiedDateTime le ${options.modifiedBefore.toISOString()}`);
      }
      
      if (options.sizeMin) {
        filters.push(`size ge ${options.sizeMin}`);
      }
      
      if (options.sizeMax) {
        filters.push(`size le ${options.sizeMax}`);
      }

      if (filters.length > 0) {
        endpoint += `?$filter=${encodeURIComponent(filters.join(' and '))}`;
      }

      const response = await this.client.makeRequest<SharePointApiResponse<DriveItem>>(
        'GET',
        endpoint
      );
      
      let items = response.value || [];
      
      // Apply additional filtering
      if (options.limit) {
        items = items.slice(0, options.limit);
      }
      
      if (options.offset) {
        items = items.slice(options.offset);
      }
      
      return items.map(item => this.convertDriveItemToSharePointItem(item));
    }, 120000); // 2 minutes cache for search results
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Download file content
   */
  async downloadFile(
    driveId: string, 
    itemId: string, 
    extractText: boolean = false
  ): Promise<FileContent> {
    const cacheKey = CacheKeys.fileContent(driveId, itemId);
    
    return this.cache.getOrSet(cacheKey, async () => {
      // Get file metadata first
      const fileItem = await this.getItemMetadata(driveId, itemId);
      
      if (fileItem.folder) {
        throw new Error('Cannot download folder content');
      }
      
      const file = fileItem as SharePointFile;
      
      // Check file size limits
      const validation = ContentProcessor.validateFileForProcessing(
        file.size,
        file.mimeType,
        file.name,
        this.config.maxFileSize
      );
      
      if (!validation.isValid) {
        throw new Error(validation.reason);
      }

      // Get download URL
      let downloadUrl = file.downloadUrl;
      if (!downloadUrl) {
        const itemWithDownloadUrl = await this.client.makeRequest<DriveItem>(
          'GET',
          `/drives/${driveId}/items/${itemId}?$select=@microsoft.graph.downloadUrl`
        );
        downloadUrl = itemWithDownloadUrl['@microsoft.graph.downloadUrl'];
      }

      if (!downloadUrl) {
        throw new Error('No download URL available for file');
      }

      // Download the file
      const content = await this.client.downloadFile(downloadUrl);
      
      // Process the content
      return await ContentProcessor.processFileContent(
        content,
        file.mimeType,
        file.name,
        extractText && this.config.textExtractionEnabled
      );
    }, 600000); // 10 minutes cache for file content
  }

  /**
   * Upload a new file
   */
  async uploadFile(
    driveId: string,
    parentItemId: string,
    options: UploadFileOptions
  ): Promise<SharePointFile> {
    const { fileName, content, mimeType, conflictBehavior, chunkSize } = options;
    
    // Validate file
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const detectedMimeType = mimeType || 'application/octet-stream';
    
    const validation = ContentProcessor.validateFileForProcessing(
      buffer.length,
      detectedMimeType,
      fileName,
      this.config.maxFileSize
    );
    
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // Determine upload method based on file size
    const endpoint = parentItemId === 'root' 
      ? `/drives/${driveId}/root:/${encodeURIComponent(fileName)}:/content`
      : `/drives/${driveId}/items/${parentItemId}:/${encodeURIComponent(fileName)}:/content`;

    try {
      const result = await this.client.uploadFile(
        endpoint,
        buffer,
        fileName,
        detectedMimeType,
        chunkSize
      );

      // Invalidate cache for the parent folder
      this.cache.invalidateByPattern(`sharepoint:drive:${driveId}:folder:${parentItemId}`);
      
      return this.convertDriveItemToSharePointItem(result) as SharePointFile;
    } catch (error) {
      console.error(`File upload failed for ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing file
   */
  async updateFile(
    driveId: string,
    itemId: string,
    content: Buffer | string,
    mimeType?: string
  ): Promise<SharePointFile> {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    
    // Get current file info
    const currentFile = await this.getItemMetadata(driveId, itemId) as SharePointFile;
    const detectedMimeType = mimeType || currentFile.mimeType;
    
    // Validate file
    const validation = ContentProcessor.validateFileForProcessing(
      buffer.length,
      detectedMimeType,
      currentFile.name,
      this.config.maxFileSize
    );
    
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    try {
      const result = await this.client.uploadFile(
        `/drives/${driveId}/items/${itemId}/content`,
        buffer,
        currentFile.name,
        detectedMimeType
      );

      // Invalidate related cache entries
      this.cache.delete(CacheKeys.fileMetadata(driveId, itemId));
      this.cache.delete(CacheKeys.fileContent(driveId, itemId));
      this.cache.invalidateByPattern(`sharepoint:drive:${driveId}:folder:`);
      
      return this.convertDriveItemToSharePointItem(result) as SharePointFile;
    } catch (error) {
      console.error(`File update failed for ${currentFile.name}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file or folder
   */
  async deleteItem(driveId: string, itemId: string): Promise<void> {
    await this.client.makeRequest('DELETE', `/drives/${driveId}/items/${itemId}`);
    
    // Invalidate cache
    this.cache.delete(CacheKeys.fileMetadata(driveId, itemId));
    this.cache.delete(CacheKeys.fileContent(driveId, itemId));
    this.cache.invalidateByPattern(`sharepoint:drive:${driveId}:folder:`);
  }

  /**
   * Create a new folder
   */
  async createFolder(
    driveId: string,
    parentItemId: string,
    folderName: string
  ): Promise<SharePointFolder> {
    const body = {
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    };

    const endpoint = parentItemId === 'root'
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${parentItemId}/children`;

    const result = await this.client.makeRequest<DriveItem>('POST', endpoint, body);
    
    // Invalidate cache for parent folder
    this.cache.invalidateByPattern(`sharepoint:drive:${driveId}:folder:${parentItemId}`);
    
    return this.convertDriveItemToSharePointItem(result) as SharePointFolder;
  }

  // ==================== ADVANCED OPERATIONS ====================

  /**
   * Copy item to another location
   */
  async copyItem(
    driveId: string,
    itemId: string,
    targetDriveId: string,
    targetParentId: string,
    newName?: string
  ): Promise<void> {
    const body = {
      parentReference: {
        driveId: targetDriveId,
        id: targetParentId
      },
      name: newName
    };

    await this.client.makeRequest('POST', `/drives/${driveId}/items/${itemId}/copy`, body);
    
    // Invalidate target folder cache
    this.cache.invalidateByPattern(`sharepoint:drive:${targetDriveId}:folder:${targetParentId}`);
  }

  /**
   * Move item to another location
   */
  async moveItem(
    driveId: string,
    itemId: string,
    targetParentId: string,
    newName?: string
  ): Promise<SharePointItem> {
    const body = {
      parentReference: {
        id: targetParentId
      },
      name: newName
    };

    const result = await this.client.makeRequest<DriveItem>('PATCH', `/drives/${driveId}/items/${itemId}`, body);
    
    // Invalidate cache
    this.cache.invalidateByPattern(`sharepoint:drive:${driveId}:folder:`);
    
    return this.convertDriveItemToSharePointItem(result);
  }

  /**
   * Get file versions
   */
  async getFileVersions(driveId: string, itemId: string): Promise<any[]> {
    const response = await this.client.makeRequest<SharePointApiResponse<any>>(
      'GET',
      `/drives/${driveId}/items/${itemId}/versions`
    );
    
    return response.value || [];
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string | RegExp): number {
    return this.cache.invalidateByPattern(pattern);
  }

  /**
   * Convert Graph DriveItem to SharePoint item
   */
  private convertDriveItemToSharePointItem(item: DriveItem): SharePointItem {
    const baseItem = {
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      size: item.size,
      createdDateTime: item.createdDateTime,
      lastModifiedDateTime: item.lastModifiedDateTime,
      parentReference: {
        driveId: item.parentReference?.driveId || '',
        path: item.parentReference?.path || '',
      },
      createdBy: item.createdBy || { user: { displayName: 'Unknown' } },
      lastModifiedBy: item.lastModifiedBy || { user: { displayName: 'Unknown' } },
    };

    if (item.file) {
      // It's a file
      return {
        ...baseItem,
        mimeType: item.file.mimeType,
        file: {
          hashes: item.file.hashes
        },
        downloadUrl: item['@microsoft.graph.downloadUrl']
      } as SharePointFile;
    } else if (item.folder) {
      // It's a folder
      return {
        ...baseItem,
        folder: {
          childCount: item.folder.childCount
        }
      } as SharePointFolder;
    }

    // Fallback - treat as file
    return {
      ...baseItem,
      mimeType: 'application/octet-stream'
    } as SharePointFile;
  }
}