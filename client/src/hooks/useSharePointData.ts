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
      console.log('🔍 useSharePointData: Starting to fetch sites...');

      // Use the same endpoint as the main content that works with universal site discovery
      const response = await api.get<ApiResponse<any>>('/api/sharepoint-advanced/drives/root/items/root/children');

      console.log('📡 useSharePointData: Received response:', {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        dataKeys: response.data?.data ? Object.keys(response.data.data) : 'No data'
      });

      if (response.data.success && response.data.data) {
        // Convert the folder-like items back to site format for navigation
        const rawData = response.data.data;
        console.log('📦 useSharePointData: Raw data structure:', {
          isArray: Array.isArray(rawData),
          hasItems: !!rawData.items,
          itemsIsArray: Array.isArray(rawData.items),
          itemsLength: rawData.items ? rawData.items.length : 'No items',
          dataType: typeof rawData,
          dataKeys: typeof rawData === 'object' ? Object.keys(rawData) : 'Not object'
        });

        const items = Array.isArray(rawData.items) ? rawData.items : rawData;
        console.log('🎯 useSharePointData: Processing items:', {
          itemsIsArray: Array.isArray(items),
          itemsLength: Array.isArray(items) ? items.length : 'Not array',
          firstItem: Array.isArray(items) && items.length > 0 ? items[0] : 'No items'
        });

        const sites = Array.isArray(items) ? items.map((item: any) => ({
          id: item.id,
          name: item.displayName || item.name,
          webUrl: item.webUrl || '',
          displayName: item.displayName || item.name,
          description: item.description || 'SharePoint site',
          createdDateTime: item.createdDateTime || new Date().toISOString(),
          lastModifiedDateTime: item.lastModifiedDateTime || new Date().toISOString(),
          libraries: []
        })) : [];

        console.log('✅ useSharePointData: Successfully processed', sites.length, 'SharePoint sites');
        console.log('🎭 useSharePointData: Sites array:', sites.map(s => ({ id: s.id, name: s.displayName })));
        return sites;
      } else {
        console.error('❌ useSharePointData: Response not successful or no data:', {
          success: response.data?.success,
          hasData: !!response.data?.data,
          error: response.data?.error
        });
        throw new Error(response.data.error?.message || 'Failed to fetch sites');
      }
    } catch (err: any) {
      console.error('💥 useSharePointData: Error fetching sites:', {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        fullError: err
      });
      // Don't fall back to mock data - let the user know there's an issue
      throw new Error(`Unable to access SharePoint sites: ${err.message || 'Please check your authentication.'}`);
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
    console.log('🔄 useSharePointData: Starting refreshData...');
    setLoading(true);
    setError(null);

    try {
      // Fetch sites first
      console.log('📊 useSharePointData: Calling fetchSites...');
      const fetchedSites = await fetchSites();
      console.log('📈 useSharePointData: fetchSites returned:', fetchedSites.length, 'sites');

      setSites(fetchedSites);
      console.log('🏪 useSharePointData: Updated sites state with', fetchedSites.length, 'sites');

      // Then fetch libraries for each site
      if (fetchedSites.length > 0) {
        console.log('📚 useSharePointData: Fetching libraries for', fetchedSites.length, 'sites...');
        const siteIds = fetchedSites.map(site => site.id);
        const fetchedLibraries = await fetchLibraries(siteIds);
        setLibraries(fetchedLibraries);
        console.log('📖 useSharePointData: Set', fetchedLibraries.length, 'libraries');
      } else {
        console.log('📭 useSharePointData: No sites found, clearing libraries');
        setLibraries([]);
      }
    } catch (err: any) {
      console.error('💔 useSharePointData: refreshData failed:', err.message);
      setError(err.message);
      setSites([]);
      setLibraries([]);
    } finally {
      setLoading(false);
      console.log('⏹️ useSharePointData: refreshData completed');
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