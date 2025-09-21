import { useState, useEffect, useCallback } from 'react';
import { SharePointFile } from '../types';
import { api } from '../services/api';

interface UseRecentFilesReturn {
  recentFiles: SharePointFile[];
  recentCount: number;
  loading: boolean;
  error: string | null;
  refreshRecentFiles: () => Promise<void>;
}

const getSampleRecentFiles = (): SharePointFile[] => {
  const now = new Date();
  const getRecentDate = (hoursAgo: number) => {
    const date = new Date(now);
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
  };

  return [
    {
      id: 'sample-1',
      displayName: 'Q4 Sales Report.xlsx',
      name: 'Q4_Sales_Report.xlsx',
      extension: 'xlsx',
      lastModifiedDateTime: getRecentDate(2),
      size: 2456789,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Documents' },
      createdDateTime: getRecentDate(48),
      lastModifiedBy: { user: { displayName: 'John Smith' } }
    },
    {
      id: 'sample-2',
      displayName: 'Project Proposal - ThakralONE.docx',
      name: 'Project_Proposal_ThakralONE.docx',
      extension: 'docx',
      lastModifiedDateTime: getRecentDate(4),
      size: 1234567,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Documents' },
      createdDateTime: getRecentDate(72),
      lastModifiedBy: { user: { displayName: 'Sarah Johnson' } }
    },
    {
      id: 'sample-3',
      displayName: 'Team Meeting Notes.pdf',
      name: 'Team_Meeting_Notes.pdf',
      extension: 'pdf',
      lastModifiedDateTime: getRecentDate(6),
      size: 567890,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Documents' },
      createdDateTime: getRecentDate(96),
      lastModifiedBy: { user: { displayName: 'Mike Chen' } }
    },
    {
      id: 'sample-4',
      displayName: 'Brand Guidelines 2025.pptx',
      name: 'Brand_Guidelines_2025.pptx',
      extension: 'pptx',
      lastModifiedDateTime: getRecentDate(8),
      size: 3456789,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Marketing' },
      createdDateTime: getRecentDate(120),
      lastModifiedBy: { user: { displayName: 'Emma Wilson' } }
    },
    {
      id: 'sample-5',
      displayName: 'Database Schema.xlsx',
      name: 'Database_Schema.xlsx',
      extension: 'xlsx',
      lastModifiedDateTime: getRecentDate(12),
      size: 987654,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Development' },
      createdDateTime: getRecentDate(168),
      lastModifiedBy: { user: { displayName: 'David Park' } }
    },
    {
      id: 'sample-6',
      displayName: 'Customer Feedback Analysis.docx',
      name: 'Customer_Feedback_Analysis.docx',
      extension: 'docx',
      lastModifiedDateTime: getRecentDate(16),
      size: 1876543,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Analytics' },
      createdDateTime: getRecentDate(200),
      lastModifiedBy: { user: { displayName: 'Lisa Garcia' } }
    },
    {
      id: 'sample-7',
      displayName: 'Security Protocol.pdf',
      name: 'Security_Protocol.pdf',
      extension: 'pdf',
      lastModifiedDateTime: getRecentDate(20),
      size: 654321,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Compliance' },
      createdDateTime: getRecentDate(240),
      lastModifiedBy: { user: { displayName: 'Alex Turner' } }
    },
    {
      id: 'sample-8',
      displayName: 'Product Roadmap Q1-Q2.pptx',
      name: 'Product_Roadmap_Q1_Q2.pptx',
      extension: 'pptx',
      lastModifiedDateTime: getRecentDate(24),
      size: 4567890,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Product' },
      createdDateTime: getRecentDate(300),
      lastModifiedBy: { user: { displayName: 'Rachel Kim' } }
    },
    {
      id: 'sample-9',
      displayName: 'Training Manual.docx',
      name: 'Training_Manual.docx',
      extension: 'docx',
      lastModifiedDateTime: getRecentDate(30),
      size: 2345678,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/HR' },
      createdDateTime: getRecentDate(360),
      lastModifiedBy: { user: { displayName: 'Tom Anderson' } }
    },
    {
      id: 'sample-10',
      displayName: 'Budget Forecast.xlsx',
      name: 'Budget_Forecast.xlsx',
      extension: 'xlsx',
      lastModifiedDateTime: getRecentDate(36),
      size: 1765432,
      isFolder: false,
      webUrl: '#',
      downloadUrl: '#',
      parentReference: { path: '/Finance' },
      createdDateTime: getRecentDate(400),
      lastModifiedBy: { user: { displayName: 'Jennifer Lee' } }
    }
  ];
};

export const useRecentFiles = (): UseRecentFilesReturn => {
  console.log('🟢 useRecentFiles hook initialized');
  const [recentFiles, setRecentFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchRecentFiles = async (): Promise<SharePointFile[]> => {
    try {
      console.log('🟢 Starting to fetch recent files from SharePoint sites');

      // First, get the list of SharePoint sites
      const sitesResponse = await api.get('/api/sharepoint-advanced/drives/root/items/root/children', {
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      console.log('Sites API Response:', sitesResponse.data);

      if (!sitesResponse.data.success || !sitesResponse.data.data || !Array.isArray(sitesResponse.data.data.items)) {
        throw new Error('No sites data received from SharePoint API');
      }

      const sites = sitesResponse.data.data.items.filter((item: SharePointFile) => item.isFolder);
      console.log('Found SharePoint sites:', sites.length);

      // Now fetch files from each site
      const allFiles: SharePointFile[] = [];

      // Try to get files from the first few sites to avoid too many API calls
      const sitesToCheck = sites.slice(0, 3); // Check first 3 sites

      for (const site of sitesToCheck) {
        try {
          console.log(`🟢 Fetching files from site: ${site.displayName}`);

          // Try to get files from the site's default drive
          const siteId = site.id.split(',')[1]; // Extract site ID from the compound ID
          const filesResponse = await api.get(`/api/sharepoint-advanced/sites/${siteId}/drives/default/root/children`, {
            page: 1,
            limit: 20,
            sortBy: 'lastModifiedDateTime',
            sortOrder: 'desc'
          });

          if (filesResponse.data.success && filesResponse.data.data && Array.isArray(filesResponse.data.data.items)) {
            const siteFiles = filesResponse.data.data.items.filter((item: SharePointFile) => !item.isFolder);
            console.log(`Found ${siteFiles.length} files in ${site.displayName}`);
            allFiles.push(...siteFiles);
          }
        } catch (siteErr: any) {
          console.warn(`Error fetching files from site ${site.displayName}:`, siteErr);
          // Continue to next site
        }
      }

      console.log('Total files found across all sites:', allFiles.length);

      if (allFiles.length > 0) {
        // Sort all files by lastModifiedDateTime and take the most recent
        const recentFiles = allFiles
          .sort((a, b) => {
            const dateA = new Date(a.lastModifiedDateTime).getTime();
            const dateB = new Date(b.lastModifiedDateTime).getTime();
            return dateB - dateA;
          })
          .slice(0, 25);

        console.log('Recent files after sorting:', recentFiles.length);
        return recentFiles;
      } else {
        console.log('No files found in any sites, falling back to sample data');
        return getSampleRecentFiles();
      }
    } catch (err: any) {
      console.error('Error fetching recent files from SharePoint API:', err);
      console.log('Falling back to sample data for demonstration');
      return getSampleRecentFiles();
    }
  };

  const refreshRecentFiles = useCallback(async (): Promise<void> => {
    console.log('🟢 refreshRecentFiles called');
    setLoading(true);
    setError(null);

    try {
      const fetchedFiles = await fetchRecentFiles();
      console.log('🟢 fetchedFiles result:', fetchedFiles.length);
      setRecentFiles(fetchedFiles);
    } catch (err: any) {
      console.error('🔴 refreshRecentFiles error:', err);
      setError(err.message);
      setRecentFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🟡 useEffect triggered in useRecentFiles');
    refreshRecentFiles();

    // Refresh recent files every 5 minutes
    const interval = setInterval(refreshRecentFiles, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshRecentFiles]);

  return {
    recentFiles,
    recentCount: recentFiles.length,
    loading,
    error,
    refreshRecentFiles,
  };
};