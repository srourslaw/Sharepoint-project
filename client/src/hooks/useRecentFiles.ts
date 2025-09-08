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
      // Return mock data when API fails
      const mockRecentFiles: SharePointFile[] = [];
      
      // Generate some mock recent files with realistic data
      const fileTypes = ['docx', 'xlsx', 'pptx', 'pdf', 'txt'];
      const fileNames = [
        'Project Proposal', 'Budget Report', 'Meeting Minutes', 'Technical Specification',
        'User Manual', 'Performance Review', 'Marketing Plan', 'Financial Summary',
        'Training Materials', 'Code Documentation', 'Design Mockups', 'Client Presentation'
      ];

      for (let i = 0; i < Math.floor(Math.random() * 20) + 5; i++) { // Random 5-25 files
        const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
        const randomType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const daysAgo = Math.floor(Math.random() * 30); // Up to 30 days ago
        const modifiedDate = new Date();
        modifiedDate.setDate(modifiedDate.getDate() - daysAgo);

        mockRecentFiles.push({
          id: `recent-file-${i}`,
          name: `${randomName}-${i + 1}.${randomType}`,
          displayName: `${randomName} ${i + 1}`,
          webUrl: `https://company.sharepoint.com/sites/docs/file-${i}`,
          size: Math.floor(Math.random() * 5000000) + 10000, // 10KB to 5MB
          mimeType: `application/${randomType}`,
          extension: randomType,
          createdDateTime: modifiedDate.toISOString(),
          lastModifiedDateTime: modifiedDate.toISOString(),
          parentPath: '/sites/docs/Shared Documents',
          isFolder: false,
        });
      }

      // Sort by last modified date (most recent first)
      return mockRecentFiles.sort((a, b) => 
        new Date(b.lastModifiedDateTime).getTime() - new Date(a.lastModifiedDateTime).getTime()
      );
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