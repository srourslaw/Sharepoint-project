import { useState, useEffect, useCallback } from 'react';
import { SharePointFile, SearchFilters, BreadcrumbItem, ApiResponse, PaginatedResponse } from '../types';
import { api } from '../services/api';

interface UseFileBrowserOptions {
  path: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  filters?: SearchFilters;
  pageSize?: number;
}

interface UseFileBrowserReturn {
  files: SharePointFile[];
  loading: boolean;
  error: string | null;
  breadcrumbs: BreadcrumbItem[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  refreshFiles: () => Promise<void>;
  uploadFiles: (files: File[], targetPath: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  copyFiles: (fileIds: string[], targetPath: string) => Promise<void>;
  moveFiles: (fileIds: string[], targetPath: string) => Promise<void>;
  loadMore: () => Promise<void>;
  createFolder: (name: string, path: string) => Promise<void>;
}

export const useFileBrowser = (options: UseFileBrowserOptions): UseFileBrowserReturn => {
  const { path, sortField, sortOrder, searchQuery, filters, pageSize = 50 } = options;
  
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Build API endpoint based on path
  const getApiEndpoint = useCallback((pathStr: string): string => {
    if (!pathStr || pathStr === '/') {
      return '/api/sharepoint-advanced/drives/root/items/root/children';
    }

    const pathParts = pathStr.split('/').filter(Boolean);
    
    if (pathParts.length >= 2 && pathParts[0] === 'sites') {
      const siteId = pathParts[1];
      
      if (pathParts.length === 2) {
        return `/api/sharepoint-advanced/sites/${siteId}/drives/default/root/children`;
      } else if (pathParts.length >= 4 && pathParts[2] === 'libraries') {
        const libraryId = pathParts[3];
        if (pathParts.length === 4) {
          return `/api/sharepoint-advanced/drives/${libraryId}/items/root/children`;
        } else {
          const folderPath = pathParts.slice(4).join('/');
          return `/api/sharepoint-advanced/drives/${libraryId}/items/root:/${folderPath}:/children`;
        }
      }
    } else if (pathParts[0] === 'onedrive') {
      if (pathParts.length === 1) {
        return '/api/sharepoint/files';
      } else {
        const folderPath = pathParts.slice(1).join('/');
        return `/api/sharepoint-advanced/drives/me/items/root:/${folderPath}:/children`;
      }
    }

    return '/api/sharepoint-advanced/drives/root/items/root/children';
  }, []);

  // Build breadcrumbs from path
  const buildBreadcrumbs = useCallback((pathStr: string): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [];
    
    if (!pathStr || pathStr === '/') {
      return crumbs;
    }

    const pathParts = pathStr.split('/').filter(Boolean);
    let currentPath = '';

    pathParts.forEach((part, index) => {
      currentPath += '/' + part;
      
      let label = part;
      let icon = 'folder';

      // Customize labels for known path types
      if (index === 0) {
        switch (part) {
          case 'sites':
            label = 'SharePoint Sites';
            icon = 'site';
            break;
          case 'onedrive':
            label = 'OneDrive';
            icon = 'onedrive';
            break;
        }
      } else if (index === 2 && pathParts[0] === 'sites' && part === 'libraries') {
        label = 'Document Libraries';
        icon = 'library';
      }

      crumbs.push({
        label: decodeURIComponent(label),
        href: currentPath,
        icon,
      });
    });

    return crumbs;
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    if (!append) {
      setError(null);
    }

    try {
      const endpoint = getApiEndpoint(path);
      const params: any = {
        page,
        limit: pageSize,
        sortBy: sortField,
        sortOrder,
      };

      // Add search query
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add filters
      if (filters?.fileType.length) {
        params.fileTypes = filters.fileType.join(',');
      }

      if (filters?.dateRange.start) {
        params.dateStart = filters.dateRange.start.toISOString();
      }

      if (filters?.dateRange.end) {
        params.dateEnd = filters.dateRange.end.toISOString();
      }

      if (filters?.sizeRange.min !== undefined) {
        params.minSize = filters.sizeRange.min;
      }

      if (filters?.sizeRange.max !== undefined) {
        params.maxSize = filters.sizeRange.max;
      }

      if (filters?.author.length) {
        params.authors = filters.author.join(',');
      }

      const response = await api.get<ApiResponse<PaginatedResponse<SharePointFile>>>(endpoint, params);

      if (response.data.success && response.data.data) {
        const { items, totalCount: total, currentPage: current, totalPages } = response.data.data;
        
        setFiles(prevFiles => append ? [...prevFiles, ...items] : items);
        setTotalCount(total);
        setCurrentPage(current);
        setHasMore(current < totalPages);
        setBreadcrumbs(buildBreadcrumbs(path));
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch files');
      }
    } catch (err: any) {
      console.error('Error fetching files:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch files';
      setError(errorMessage);
      
      if (!append) {
        setFiles([]);
        setTotalCount(0);
        setCurrentPage(1);
        setHasMore(false);
        setBreadcrumbs(buildBreadcrumbs(path));
      }
    } finally {
      setLoading(false);
    }
  }, [path, sortField, sortOrder, searchQuery, filters, pageSize, getApiEndpoint, buildBreadcrumbs]);

  // Load more files
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchFiles(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, fetchFiles]);

  // Refresh files
  const refreshFiles = useCallback(async () => {
    setCurrentPage(1);
    await fetchFiles(1, false);
  }, [fetchFiles]);

  // File operations
  const uploadFiles = useCallback(async (filesToUpload: File[], targetPath: string) => {
    const endpoint = getApiEndpoint(targetPath);
    const formData = new FormData();
    
    filesToUpload.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    try {
      const response = await api.post<ApiResponse<SharePointFile[]>>(
        endpoint.replace('/children', '/upload'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Upload failed');
      }

      // Refresh the file list
      await refreshFiles();
    } catch (err: any) {
      console.error('Upload error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to upload files');
    }
  }, [getApiEndpoint, refreshFiles]);

  const deleteFiles = useCallback(async (fileIds: string[]) => {
    try {
      const response = await api.post<ApiResponse<void>>('/api/sharepoint-advanced/files/delete', {
        fileIds,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Delete failed');
      }

      // Remove deleted files from state
      setFiles(prevFiles => prevFiles.filter(file => !fileIds.includes(file.id)));
      setTotalCount(prev => Math.max(0, prev - fileIds.length));
    } catch (err: any) {
      console.error('Delete error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to delete files');
    }
  }, []);

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      const response = await api.patch<ApiResponse<SharePointFile>>(
        `/api/sharepoint-advanced/files/${fileId}`,
        { name: newName }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Rename failed');
      }

      // Update file in state
      if (response.data.data) {
        setFiles(prevFiles => 
          prevFiles.map(file => 
            file.id === fileId ? response.data.data! : file
          )
        );
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to rename file');
    }
  }, []);

  const copyFiles = useCallback(async (fileIds: string[], targetPath: string) => {
    try {
      const response = await api.post<ApiResponse<SharePointFile[]>>('/api/sharepoint-advanced/files/copy', {
        fileIds,
        targetPath,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Copy failed');
      }
    } catch (err: any) {
      console.error('Copy error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to copy files');
    }
  }, []);

  const moveFiles = useCallback(async (fileIds: string[], targetPath: string) => {
    try {
      const response = await api.post<ApiResponse<SharePointFile[]>>('/api/sharepoint-advanced/files/move', {
        fileIds,
        targetPath,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Move failed');
      }

      // Remove moved files from current view if they're no longer in the current path
      setFiles(prevFiles => prevFiles.filter(file => !fileIds.includes(file.id)));
      setTotalCount(prev => Math.max(0, prev - fileIds.length));
    } catch (err: any) {
      console.error('Move error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to move files');
    }
  }, []);

  const createFolder = useCallback(async (name: string, folderPath: string) => {
    try {
      const endpoint = getApiEndpoint(folderPath);
      const response = await api.post<ApiResponse<SharePointFile>>(
        endpoint.replace('/children', '/folder'),
        { name }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create folder');
      }

      // Add new folder to state if it's in current path
      if (folderPath === path && response.data.data) {
        setFiles(prevFiles => [response.data.data!, ...prevFiles]);
        setTotalCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Create folder error:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to create folder');
    }
  }, [getApiEndpoint, path]);

  // Effect to fetch files when dependencies change
  useEffect(() => {
    fetchFiles(1, false);
  }, [fetchFiles]);

  // Effect to reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
    setFiles([]);
  }, [searchQuery, JSON.stringify(filters)]);

  return {
    files,
    loading,
    error,
    breadcrumbs,
    totalCount,
    hasMore,
    currentPage,
    refreshFiles,
    uploadFiles,
    deleteFiles,
    renameFile,
    copyFiles,
    moveFiles,
    loadMore,
    createFolder,
  };
};