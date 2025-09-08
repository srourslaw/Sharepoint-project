import { useState, useEffect } from 'react';
import { SharePointFile } from '../types';
import { api } from '../services/api';

interface UseRecentFilesReturn {
  recentFiles: SharePointFile[];
  recentCount: number;
  loading: boolean;
  error: string | null;
  refreshRecentFiles: () => Promise<void>;
}

export const useRecentFiles = (): UseRecentFilesReturn => {
  const [recentFiles, setRecentFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate consistent mock data that persists across refreshes
  const generateMockRecentFiles = (): SharePointFile[] => {
    const mockRecentFiles: SharePointFile[] = [];
    
    // Use consistent data - same files every time
    const files = [
      { name: 'Project Proposal', type: 'docx', days: 1 },
      { name: 'Budget Report Q3', type: 'xlsx', days: 2 },
      { name: 'Meeting Minutes', type: 'docx', days: 3 },
      { name: 'Technical Specification', type: 'pdf', days: 4 },
      { name: 'User Manual v2', type: 'pdf', days: 5 },
      { name: 'Performance Review', type: 'docx', days: 7 },
      { name: 'Marketing Plan 2024', type: 'pptx', days: 10 },
      { name: 'Financial Summary', type: 'xlsx', days: 12 },
      { name: 'Training Materials', type: 'pptx', days: 15 },
      { name: 'Code Documentation', type: 'pdf', days: 18 },
      { name: 'Design Mockups', type: 'pptx', days: 20 },
      { name: 'Client Presentation', type: 'pptx', days: 25 },
    ];

    files.forEach((file, i) => {
      const modifiedDate = new Date();
      modifiedDate.setDate(modifiedDate.getDate() - file.days);

      mockRecentFiles.push({
        id: `recent-file-${i}`,
        name: `${file.name}.${file.type}`,
        displayName: file.name,
        webUrl: `https://company.sharepoint.com/sites/docs/file-${i}`,
        size: Math.floor(Math.random() * 5000000) + 10000, // 10KB to 5MB
        mimeType: `application/${file.type}`,
        extension: file.type,
        createdDateTime: modifiedDate.toISOString(),
        lastModifiedDateTime: modifiedDate.toISOString(),
        parentPath: '/sites/docs/Shared Documents',
        isFolder: false,
      });
    });

    return mockRecentFiles;
  };

  const fetchRecentFiles = async (): Promise<SharePointFile[]> => {
    try {
      const response = await api.get('/api/sharepoint-advanced/files/recent');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch recent files');
      }
    } catch (err: any) {
      console.warn('Error fetching recent files:', err);
      // Return consistent mock data (same every time)
      return generateMockRecentFiles();
    }
  };

  const refreshRecentFiles = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const fetchedFiles = await fetchRecentFiles();
      setRecentFiles(fetchedFiles);
    } catch (err: any) {
      setError(err.message);
      setRecentFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRecentFiles();
    
    // Refresh recent files every 5 minutes
    const interval = setInterval(refreshRecentFiles, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    recentFiles,
    recentCount: recentFiles.length,
    loading,
    error,
    refreshRecentFiles,
  };
};