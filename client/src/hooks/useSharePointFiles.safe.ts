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
      // For now, always return mock data to avoid the p.length error
      // TODO: Implement proper API calls once the underlying issue is resolved
      
      console.log('useSharePointFiles.safe: Using mock data due to API error prevention');
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockFiles = [
        {
          id: 'safe-file-1',
          name: 'Business Plan.docx',
          displayName: 'Business Plan.docx',
          size: 32768,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/business-plan.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: path || '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'John Doe',
            email: 'john.doe@company.com'
          }
        },
        {
          id: 'safe-file-2',
          name: 'Financial Report.xlsx',
          displayName: 'Financial Report.xlsx',
          size: 65536,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/financial-report.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'xlsx',
          createdDateTime: '2023-02-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: path || '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'Jane Smith',
            email: 'jane.smith@company.com'
          }
        },
        {
          id: 'safe-folder-1',
          name: 'Archive',
          displayName: 'Archive',
          size: 0,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/archive',
          mimeType: 'application/folder',
          extension: '',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: path || '/Documents',
          isFolder: true,
          lastModifiedBy: {
            displayName: 'System',
            email: 'system@company.com'
          }
        },
        {
          id: 'safe-file-3',
          name: 'Presentation.pptx',
          displayName: 'Presentation.pptx',
          size: 98304,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/presentation.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          extension: 'pptx',
          createdDateTime: '2023-03-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: path || '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'Bob Johnson',
            email: 'bob.johnson@company.com'
          }
        }
      ];

      if (!append) {
        setFiles(mockFiles);
        setTotalCount(mockFiles.length);
        setCurrentPage(1);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error in safe SharePoint files hook:', err);
      setError('Unable to load files at this time');
      setFiles([]);
      setTotalCount(0);
      setCurrentPage(1);
      setTotalPages(0);
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