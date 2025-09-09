import { useState, useEffect } from 'react';
import { SharePointFile, ViewMode, SearchFilters, ApiResponse, PaginatedResponse } from '../types';
import { api } from '../services/api';

interface UseSharePointFilesOptions {
  path: string;
  filters: SearchFilters;
  viewMode: ViewMode;
  enabled?: boolean;
}

interface UseSharePointFilesReturn {
  files: SharePointFile[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  refreshFiles: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const useSharePointFiles = (options: UseSharePointFilesOptions): UseSharePointFilesReturn => {
  const { path, filters, viewMode, enabled = true } = options;
  
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const buildQueryParams = (page = 1) => {
    try {
      const params: any = {
        page: page || 1,
        limit: viewMode?.itemsPerPage || 50,
        sortBy: viewMode?.sortBy || 'name',
        sortOrder: viewMode?.sortOrder || 'asc',
      };

    // Add filters - with safe checks
    if (filters?.fileType && Array.isArray(filters.fileType) && filters.fileType.length > 0) {
      params.fileTypes = filters.fileType.join(',');
    }

    if (filters?.dateRange?.start) {
      params.dateStart = filters.dateRange.start.toISOString();
    }

    if (filters?.dateRange?.end) {
      params.dateEnd = filters.dateRange.end.toISOString();
    }

    if (filters?.sizeRange?.min !== undefined) {
      params.minSize = filters.sizeRange.min;
    }

    if (filters?.sizeRange?.max !== undefined) {
      params.maxSize = filters.sizeRange.max;
    }

    if (filters?.author && Array.isArray(filters.author) && filters.author.length > 0) {
      params.authors = filters.author.join(',');
    }

      return params;
    } catch (error) {
      console.error('Error building query params:', error);
      return {
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc',
      };
    }
  };

  const getApiEndpoint = (path: string): string => {
    try {
      if (!path || typeof path !== 'string' || path === '/') {
        return '/api/sharepoint-advanced/drives/root/items/root/children';
      }

      // Parse path to determine the appropriate endpoint
      const pathParts = path.split('/').filter(Boolean);
      
      if (!Array.isArray(pathParts)) {
        throw new Error('pathParts is not an array');
      }
    
    if (pathParts.length >= 2 && pathParts[0] === 'sites') {
      const siteId = pathParts[1];
      
      if (pathParts.length === 2) {
        // Site root
        return `/api/sharepoint-advanced/sites/${siteId}/drives/default/root/children`;
      } else if (pathParts.length >= 4 && pathParts[2] === 'libraries') {
        const libraryId = pathParts[3];
        if (pathParts.length === 4) {
          // Library root
          return `/api/sharepoint-advanced/drives/${libraryId}/items/root/children`;
        } else {
          // Nested folder
          const folderPath = pathParts.slice(4).join('/');
          return `/api/sharepoint-advanced/drives/${libraryId}/items/root:/${folderPath}:/children`;
        }
      }
    } else if (pathParts[0] === 'onedrive') {
      // OneDrive files
      if (pathParts.length === 1) {
        return '/api/sharepoint/files';
      } else {
        const folderPath = pathParts.slice(1).join('/');
        return `/api/sharepoint-advanced/drives/me/items/root:/${folderPath}:/children`;
      }
    }

      // Handle specific folder navigation for your SharePoint sites
      if (pathParts.length === 1) {
        const folderName = pathParts[0];
        if (folderName === 'Communication site' || folderName === 'Communication%20site') {
          // Navigate to Communication site contents
          return '/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com/items/root/children';
        } else if (folderName === 'All Company' || folderName === 'All%20Company') {
          // Navigate to All Company subsite contents - use the correct driveId format with colons
          return '/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com:sites:allcompany/items/root/children';
        }
      }
      
      // Default fallback
      return '/api/sharepoint-advanced/drives/root/items/root/children';
    } catch (error) {
      console.error('Error in getApiEndpoint:', error);
      return '/api/sharepoint-advanced/drives/root/items/root/children';
    }
  };

  const fetchFiles = async (page = 1, append = false): Promise<void> => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = getApiEndpoint(path);
      const params = buildQueryParams(page);
      
      const response = await api.get<ApiResponse<PaginatedResponse<SharePointFile>>>(
        endpoint,
        params
      );

      if (response.data.success && response.data.data) {
        const { items, totalCount: total, currentPage: current, totalPages: pages } = response.data.data;
        
        // Safely handle items array - ensure it exists and is an array
        const safeItems = Array.isArray(items) ? items : [];
        setFiles(prevFiles => append ? [...prevFiles, ...safeItems] : safeItems);
        setTotalCount(total || 0);
        setCurrentPage(current || 1);
        setTotalPages(pages || 0);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch files');
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      
      // Set error message instead of showing mock data
      setError(`Unable to load files from this location. ${err.message || 'Please try again later.'}`);
      
      if (!append) {
        setFiles([]);
        setTotalCount(0);
        setCurrentPage(1);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshFiles = async (): Promise<void> => {
    setCurrentPage(1);
    await fetchFiles(1, false);
  };

  const loadMore = async (): Promise<void> => {
    if (currentPage < totalPages) {
      await fetchFiles(currentPage + 1, true);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, [path, JSON.stringify(filters), JSON.stringify(viewMode), enabled]);

  return {
    files,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    refreshFiles,
    loadMore,
    hasMore: currentPage < totalPages,
  };
};