import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SharePointFile, SharePointSite, SharePointLibrary } from '../types';

interface AnalyticsData {
  totalFiles: number;
  totalStorage: string;
  totalSites: number;
  totalLibraries: number;
  fileTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    extension: string;
  }>;
  recentActivity: Array<{
    fileName: string;
    action: string;
    timestamp: string;
    site: string;
  }>;
  storageByType: Array<{
    type: string;
    size: number;
    sizeFormatted: string;
  }>;
}

interface UseSharePointAnalyticsReturn {
  analytics: AnalyticsData;
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
}

export const useSharePointAnalytics = (): UseSharePointAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalFiles: 0,
    totalStorage: '0 MB',
    totalSites: 0,
    totalLibraries: 0,
    fileTypes: [],
    recentActivity: [],
    storageByType: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeFromExtension = (extension: string): string => {
    const typeMap: { [key: string]: string } = {
      'docx': 'Word Documents',
      'doc': 'Word Documents',
      'xlsx': 'Excel Sheets',
      'xls': 'Excel Sheets',
      'pptx': 'PowerPoint',
      'ppt': 'PowerPoint',
      'pdf': 'PDFs',
      'jpg': 'Images',
      'jpeg': 'Images',
      'png': 'Images',
      'gif': 'Images',
      'mp4': 'Videos',
      'mov': 'Videos',
      'avi': 'Videos',
      'txt': 'Text Files',
      'zip': 'Archives',
      'rar': 'Archives',
    };
    return typeMap[extension.toLowerCase()] || 'Other Files';
  };

  const fetchAnalytics = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch sites data
      const sitesResponse = await api.get('/api/sharepoint-advanced/sites');
      const sites: SharePointSite[] = sitesResponse.data.data || [];

      // Fetch all files from all sites
      const allFiles: SharePointFile[] = [];
      let totalLibraries = 0;

      // Get files from root drive
      try {
        const rootResponse = await api.get('/api/sharepoint-advanced/drives/root/items/root/children', {
          sortBy: 'lastModifiedDateTime',
          sortOrder: 'desc',
          limit: 100
        });
        
        if (rootResponse.data.success && rootResponse.data.data?.items) {
          const rootFiles = rootResponse.data.data.items.filter((item: SharePointFile) => !item.isFolder);
          allFiles.push(...rootFiles);
        }
      } catch (err) {
        console.warn('Could not fetch root drive files:', err);
      }

      // Try to get files from Communication site
      try {
        const commResponse = await api.get('/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com/items/root/children', {
          sortBy: 'lastModifiedDateTime',
          sortOrder: 'desc',
          limit: 100
        });
        
        if (commResponse.data.success && commResponse.data.data?.items) {
          const commFiles = commResponse.data.data.items.filter((item: SharePointFile) => !item.isFolder);
          allFiles.push(...commFiles);
        }
      } catch (err) {
        console.warn('Could not fetch Communication site files:', err);
      }

      // Try to get files from All Company site
      try {
        const allCompanyResponse = await api.get('/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com.allcompany/items/root/children', {
          sortBy: 'lastModifiedDateTime',
          sortOrder: 'desc',
          limit: 100
        });
        
        if (allCompanyResponse.data.success && allCompanyResponse.data.data?.items) {
          const allCompanyFiles = allCompanyResponse.data.data.items.filter((item: SharePointFile) => !item.isFolder);
          allFiles.push(...allCompanyFiles);
        }
      } catch (err) {
        console.warn('Could not fetch All Company site files:', err);
      }

      // Calculate analytics
      const totalFiles = allFiles.length;
      const totalStorage = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);

      // Analyze file types
      const fileTypeMap = new Map<string, { count: number; size: number; extensions: Set<string> }>();
      
      allFiles.forEach(file => {
        const extension = file.extension || 'unknown';
        const fileType = getFileTypeFromExtension(extension);
        
        if (!fileTypeMap.has(fileType)) {
          fileTypeMap.set(fileType, { count: 0, size: 0, extensions: new Set() });
        }
        
        const typeData = fileTypeMap.get(fileType)!;
        typeData.count += 1;
        typeData.size += file.size || 0;
        typeData.extensions.add(extension);
      });

      // Convert to arrays with percentages
      const fileTypes = Array.from(fileTypeMap.entries())
        .map(([type, data]) => ({
          type,
          count: data.count,
          percentage: Math.round((data.count / totalFiles) * 100),
          extension: Array.from(data.extensions)[0] || 'unknown'
        }))
        .sort((a, b) => b.count - a.count);

      const storageByType = Array.from(fileTypeMap.entries())
        .map(([type, data]) => ({
          type,
          size: data.size,
          sizeFormatted: formatBytes(data.size)
        }))
        .sort((a, b) => b.size - a.size);

      // Create recent activity from the most recent files
      const recentActivity = allFiles
        .sort((a, b) => new Date(b.lastModifiedDateTime).getTime() - new Date(a.lastModifiedDateTime).getTime())
        .slice(0, 10)
        .map(file => ({
          fileName: file.displayName || file.name,
          action: 'modified',
          timestamp: new Date(file.lastModifiedDateTime).toLocaleString(),
          site: file.parentPath || 'SharePoint'
        }));

      setAnalytics({
        totalFiles,
        totalStorage: formatBytes(totalStorage),
        totalSites: sites.length,
        totalLibraries,
        fileTypes,
        recentActivity,
        storageByType
      });

    } catch (err: any) {
      console.error('Error fetching SharePoint analytics:', err);
      console.log('🔄 Falling back to mock SharePoint analytics data');
      
      // Generate realistic mock analytics based on your SharePoint structure
      const mockAnalytics = {
        totalFiles: 147,
        totalStorage: formatBytes(892 * 1024 * 1024), // 892 MB
        totalSites: 2, // Communication site + All Company site
        totalLibraries: 4,
        fileTypes: [
          { type: 'Word Documents', count: 42, percentage: 29, extension: 'docx' },
          { type: 'Excel Sheets', count: 31, percentage: 21, extension: 'xlsx' },
          { type: 'PDFs', count: 28, percentage: 19, extension: 'pdf' },
          { type: 'PowerPoint', count: 23, percentage: 16, extension: 'pptx' },
          { type: 'Images', count: 15, percentage: 10, extension: 'jpg' },
          { type: 'Text Files', count: 8, percentage: 5, extension: 'txt' }
        ],
        recentActivity: [
          { fileName: 'Quarterly Report Q4.docx', action: 'modified', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(), site: 'Communication site' },
          { fileName: 'Budget Analysis.xlsx', action: 'modified', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toLocaleString(), site: 'All Company' },
          { fileName: 'Team Meeting Notes.pdf', action: 'modified', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toLocaleString(), site: 'Communication site' },
          { fileName: 'Project Timeline.pptx', action: 'modified', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString(), site: 'All Company' },
          { fileName: 'Site Overview.docx', action: 'modified', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toLocaleString(), site: 'Communication site' },
          { fileName: 'Financial Summary.xlsx', action: 'modified', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(), site: 'All Company' },
          { fileName: 'Policy Document.pdf', action: 'modified', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), site: 'Communication site' },
          { fileName: 'Training Materials.pptx', action: 'modified', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(), site: 'All Company' },
          { fileName: 'Workflow Diagram.png', action: 'modified', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleString(), site: 'Communication site' },
          { fileName: 'Data Export.csv', action: 'modified', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString(), site: 'All Company' }
        ],
        storageByType: [
          { type: 'Word Documents', size: 268 * 1024 * 1024, sizeFormatted: formatBytes(268 * 1024 * 1024) },
          { type: 'Excel Sheets', size: 192 * 1024 * 1024, sizeFormatted: formatBytes(192 * 1024 * 1024) },
          { type: 'PDFs', size: 156 * 1024 * 1024, sizeFormatted: formatBytes(156 * 1024 * 1024) },
          { type: 'PowerPoint', size: 134 * 1024 * 1024, sizeFormatted: formatBytes(134 * 1024 * 1024) },
          { type: 'Images', size: 98 * 1024 * 1024, sizeFormatted: formatBytes(98 * 1024 * 1024) },
          { type: 'Text Files', size: 44 * 1024 * 1024, sizeFormatted: formatBytes(44 * 1024 * 1024) }
        ]
      };

      setAnalytics(mockAnalytics);
      setError('Using sample analytics data (SharePoint API connection failed)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics: fetchAnalytics
  };
};