import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface UserSettings {
  notifications: {
    emailUpdates: boolean;
    desktopNotifications: boolean;
    weeklyDigest: boolean;
    shareNotifications: boolean;
  };
  appearance: {
    darkMode: boolean;
    compactView: boolean;
    showThumbnails: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    allowExternalSharing: boolean;
    requireTwoFactor: boolean;
  };
  general: {
    language: string;
    timezone: string;
    defaultView: string;
  };
}

interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  preferredLanguage?: string;
}

interface SharePointQuota {
  used: number;
  total: number;
  percentage: number;
  usedFormatted: string;
  totalFormatted: string;
}

interface SettingsData {
  userInfo: UserInfo | null;
  settings: UserSettings;
  quota: SharePointQuota | null;
  lastSyncDate: string;
}

interface UseSharePointSettingsReturn {
  settingsData: SettingsData;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: UserSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export const useSharePointSettings = (): UseSharePointSettingsReturn => {
  const [settingsData, setSettingsData] = useState<SettingsData>({
    userInfo: null,
    settings: {
      notifications: {
        emailUpdates: true,
        desktopNotifications: false,
        weeklyDigest: true,
        shareNotifications: true,
      },
      appearance: {
        darkMode: false,
        compactView: false,
        showThumbnails: true,
      },
      privacy: {
        shareAnalytics: true,
        allowExternalSharing: false,
        requireTwoFactor: true,
      },
      general: {
        language: 'en',
        timezone: 'UTC+10',
        defaultView: 'list',
      },
    },
    quota: null,
    lastSyncDate: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchSettings = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get current user info
      let userInfo: UserInfo | null = null;
      try {
        const userResponse = await api.get('/api/sharepoint/user/profile');
        if (userResponse.data.success && userResponse.data.data) {
          const data = userResponse.data.data;
          userInfo = {
            id: data.id || 'current-user',
            displayName: data.displayName || 'Current User',
            email: data.mail || data.userPrincipalName || 'user@company.com',
            jobTitle: data.jobTitle || undefined,
            department: data.department || undefined,
            officeLocation: data.officeLocation || undefined,
            mobilePhone: data.mobilePhone || undefined,
            businessPhones: data.businessPhones || [],
            preferredLanguage: data.preferredLanguage || 'en'
          };
        }
      } catch (err) {
        console.warn('Could not fetch user profile:', err);
      }

      // Try to get OneDrive quota information
      let quota: SharePointQuota | null = null;
      try {
        const driveResponse = await api.get('/api/sharepoint-advanced/me/drive');
        if (driveResponse.data.success && driveResponse.data.data?.quota) {
          const quotaData = driveResponse.data.data.quota;
          const used = quotaData.used || 0;
          const total = quotaData.total || 1073741824000; // Default 1TB if not available
          quota = {
            used,
            total,
            percentage: Math.round((used / total) * 100),
            usedFormatted: formatBytes(used),
            totalFormatted: formatBytes(total)
          };
        }
      } catch (err) {
        console.warn('Could not fetch storage quota:', err);
      }

      // Load settings from localStorage if available
      const savedSettings = localStorage.getItem('sharepoint-settings');
      let settings = settingsData.settings;
      
      if (savedSettings) {
        try {
          settings = JSON.parse(savedSettings);
        } catch (err) {
          console.warn('Could not parse saved settings:', err);
        }
      }

      // Use user's preferred language if available
      if (userInfo?.preferredLanguage) {
        settings.general.language = userInfo.preferredLanguage;
      }

      const newSettingsData = {
        userInfo,
        settings,
        quota,
        lastSyncDate: new Date().toISOString()
      };

      setSettingsData(newSettingsData);
      setOriginalSettings(settings);
      setHasUnsavedChanges(false);

    } catch (err: any) {
      console.error('Error fetching SharePoint settings:', err);
      setError('Failed to load settings data');
      
      // Set minimal data on error
      setSettingsData(prev => ({
        ...prev,
        userInfo: {
          id: 'current-user',
          displayName: 'Current User',
          email: 'user@company.com'
        },
        lastSyncDate: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: UserSettings): Promise<void> => {
    try {
      // Save settings to localStorage
      localStorage.setItem('sharepoint-settings', JSON.stringify(newSettings));
      
      setSettingsData(prev => ({ ...prev, settings: newSettings }));
      setOriginalSettings(newSettings);
      setHasUnsavedChanges(false);
      
      // Here you could also sync to SharePoint if there's an API for it
      // await api.post('/api/sharepoint/user/settings', newSettings);
      
    } catch (err: any) {
      console.error('Error saving settings:', err);
      throw new Error('Failed to save settings');
    }
  };

  const checkForChanges = (currentSettings: UserSettings) => {
    if (!originalSettings) return false;
    return JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);
  };

  useEffect(() => {
    fetchSettings();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchSettings, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Track changes to settings
  useEffect(() => {
    setHasUnsavedChanges(checkForChanges(settingsData.settings));
  }, [settingsData.settings, originalSettings]);

  return {
    settingsData,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
    hasUnsavedChanges
  };
};