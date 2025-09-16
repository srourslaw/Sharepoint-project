import { useState, useEffect } from 'react';
import { SharePointFile, ViewMode, SearchFilters } from '../types';

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

  const fetchFiles = async (page = 1, append = false): Promise<void> => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log('useSharePointFiles: Fetching files from path:', path, 'page:', page);

      // Make actual API call to SharePoint
      const searchParams = new URLSearchParams({
        path: path || '',
        page: page.toString(),
        ...filters,
      });

      const response = await fetch(`/api/sharepoint-advanced/files?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch files');
      }

      const fetchedFiles = result.data || [];

      if (!append) {
        setFiles(fetchedFiles);
        setCurrentPage(page);
      } else {
        setFiles(prev => [...prev, ...fetchedFiles]);
        setCurrentPage(page);
      }

      setTotalCount(result.totalCount || fetchedFiles.length);
      setTotalPages(result.totalPages || 1);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching SharePoint files:', err);
      setError(err.message || 'Unable to load files at this time');
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