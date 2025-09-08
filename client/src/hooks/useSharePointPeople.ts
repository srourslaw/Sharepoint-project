import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SharePointUser {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  photoUrl?: string;
  userPrincipalName: string;
  permissions?: string;
}

interface SharedItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  sharedWith: string[];
  sharedBy: string;
  sharedDate: string;
  permissions: 'read' | 'write' | 'owner';
  webUrl: string;
}

interface PeopleData {
  currentUser: SharePointUser | null;
  recentContacts: SharePointUser[];
  sharedFiles: SharedItem[];
  totalSharedItems: number;
  recentShares: SharedItem[];
}

interface UseSharePointPeopleReturn {
  peopleData: PeopleData;
  loading: boolean;
  error: string | null;
  refreshPeopleData: () => Promise<void>;
}

export const useSharePointPeople = (): UseSharePointPeopleReturn => {
  const [peopleData, setPeopleData] = useState<PeopleData>({
    currentUser: null,
    recentContacts: [],
    sharedFiles: [],
    totalSharedItems: 0,
    recentShares: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeopleData = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get current user info
      let currentUser: SharePointUser | null = null;
      try {
        const userResponse = await api.get('/api/sharepoint-advanced/me/profile');
        if (userResponse.data.success && userResponse.data.data) {
          currentUser = {
            id: userResponse.data.data.id || 'current-user',
            displayName: userResponse.data.data.displayName || 'Current User',
            email: userResponse.data.data.mail || userResponse.data.data.userPrincipalName || 'user@company.com',
            jobTitle: userResponse.data.data.jobTitle || undefined,
            department: userResponse.data.data.department || undefined,
            officeLocation: userResponse.data.data.officeLocation || undefined,
            userPrincipalName: userResponse.data.data.userPrincipalName || 'user@company.com'
          };
        }
      } catch (err) {
        console.warn('Could not fetch user profile:', err);
      }

      // Try to get files and analyze sharing patterns
      const sharedItems: SharedItem[] = [];
      let allFiles: any[] = [];

      // Get files from different sources
      try {
        const sources = [
          '/api/sharepoint-advanced/drives/root/items/root/children',
          '/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com/items/root/children',
          '/api/sharepoint-advanced/drives/netorgft18344752.sharepoint.com:sites:allcompany/items/root/children'
        ];

        for (const source of sources) {
          try {
            const response = await api.get(source, { limit: 50 });
            if (response.data.success && response.data.data?.items) {
              allFiles.push(...response.data.data.items.filter((item: any) => !item.isFolder));
            }
          } catch (err) {
            console.warn(`Could not fetch from ${source}:`, err);
          }
        }
      } catch (err) {
        console.warn('Error fetching files for sharing analysis:', err);
      }

      // Create mock shared items based on files (since we don't have real sharing API)
      const recentShares = allFiles.slice(0, 5).map((file, index) => ({
        id: file.id || `shared-${index}`,
        name: file.displayName || file.name,
        type: file.isFolder ? 'folder' as const : 'file' as const,
        sharedWith: [`user${index + 1}@company.com`],
        sharedBy: currentUser?.email || 'user@company.com',
        sharedDate: file.lastModifiedDateTime || new Date().toISOString(),
        permissions: 'read' as const,
        webUrl: file.webUrl || '#'
      }));

      // Try to get real people from SharePoint
      let recentContacts: SharePointUser[] = [];
      try {
        console.log('🔍 Fetching people from SharePoint API...');
        const peopleResponse = await api.get('/api/sharepoint-advanced/me/people');
        console.log('📊 People API Response:', peopleResponse.data);
        
        if (peopleResponse.data.success && peopleResponse.data.data) {
          recentContacts = peopleResponse.data.data.map((person: any) => ({
            id: person.id,
            displayName: person.displayName,
            email: person.email,
            jobTitle: person.jobTitle,
            department: person.department,
            officeLocation: person.officeLocation,
            userPrincipalName: person.userPrincipalName,
            permissions: person.permissions || 'Read'
          }));
          console.log(`✅ Successfully mapped ${recentContacts.length} people from API`);
        } else {
          console.warn('⚠️ People API returned no data, using fallback');
        }
      } catch (err) {
        console.error('❌ Could not fetch people from API:', err);
        
        // Only show real data - no more fake fallback contacts
        if (recentContacts.length === 0) {
          console.log('⚠️ No people data available from API - showing only current user');
          // If we have current user, show at least that
          if (currentUser) {
            recentContacts = [
              {
                id: currentUser.id,
                displayName: currentUser.displayName,
                email: currentUser.email,
                jobTitle: currentUser.jobTitle || 'Current User',
                department: currentUser.department || 'Your Organization',
                userPrincipalName: currentUser.userPrincipalName,
                permissions: 'Full Control'
              }
            ];
          }
        }
      }

      setPeopleData({
        currentUser,
        recentContacts,
        sharedFiles: recentShares,
        totalSharedItems: allFiles.length,
        recentShares
      });

    } catch (err: any) {
      console.error('Error fetching SharePoint people data:', err);
      setError('Failed to load people and sharing data');
      
      // Set minimal data on error
      setPeopleData({
        currentUser: {
          id: 'current-user',
          displayName: 'Current User',
          email: 'user@company.com',
          userPrincipalName: 'user@company.com'
        },
        recentContacts: [],
        sharedFiles: [],
        totalSharedItems: 0,
        recentShares: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeopleData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchPeopleData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    peopleData,
    loading,
    error,
    refreshPeopleData: fetchPeopleData
  };
};