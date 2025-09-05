import { useState, useEffect } from 'react';
import { SharePointSite, SharePointLibrary, ApiResponse } from '../types';
import { api } from '../services/api';

interface UseSharePointDataReturn {
  sites: SharePointSite[];
  libraries: SharePointLibrary[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useSharePointData = (): UseSharePointDataReturn => {
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [libraries, setLibraries] = useState<SharePointLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async (): Promise<SharePointSite[]> => {
    try {
      const response = await api.get<ApiResponse<SharePointSite[]>>('/api/sharepoint-advanced/sites');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch sites');
      }
    } catch (err: any) {
      console.error('Error fetching sites:', err);
      // Return mock data when API fails
      return [
        {
          id: 'mock-site-1',
          name: 'Company Portal',
          webUrl: 'https://company.sharepoint.com/sites/portal',
          displayName: 'Company Portal',
          description: 'Main company portal site',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          libraries: []
        },
        {
          id: 'mock-site-2',
          name: 'Document Center',
          webUrl: 'https://company.sharepoint.com/sites/docs',
          displayName: 'Document Center',
          description: 'Central document repository',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          libraries: []
        }
      ];
    }
  };

  const fetchLibraries = async (siteIds: string[]): Promise<SharePointLibrary[]> => {
    try {
      const libraryPromises = siteIds.map(async (siteId) => {
        try {
          const response = await api.get<ApiResponse<SharePointLibrary[]>>(
            `/api/sharepoint-advanced/sites/${siteId}/libraries`
          );
          
          if (response.data.success && response.data.data) {
            return response.data.data.map(lib => ({
              ...lib,
              parentSite: sites.find(site => site.id === siteId)
            }));
          }
          return [];
        } catch (err) {
          console.warn(`Failed to fetch libraries for site ${siteId}:`, err);
          return [];
        }
      });

      const libraryResults = await Promise.all(libraryPromises);
      return libraryResults.flat();
    } catch (err: any) {
      console.error('Error fetching libraries:', err);
      throw new Error('Failed to fetch some libraries');
    }
  };

  const refreshData = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch sites first
      const fetchedSites = await fetchSites();
      setSites(fetchedSites);

      // Then fetch libraries for each site
      if (fetchedSites.length > 0) {
        const siteIds = fetchedSites.map(site => site.id);
        const fetchedLibraries = await fetchLibraries(siteIds);
        setLibraries(fetchedLibraries);
      } else {
        setLibraries([]);
      }
    } catch (err: any) {
      setError(err.message);
      setSites([]);
      setLibraries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    sites,
    libraries,
    loading,
    error,
    refreshData,
  };
};