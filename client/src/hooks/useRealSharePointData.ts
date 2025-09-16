import { useState, useEffect, useCallback } from 'react';
import { useMSALAuth } from '../contexts/MSALAuthContext';

// Real SharePoint data hooks following successful DMS patterns
export interface SharePointSite {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
  description?: string;
}

export interface SharePointDrive {
  id: string;
  name: string;
  driveType: string;
  webUrl: string;
}

export interface SharePointFile {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  file?: {
    mimeType: string;
    hashes?: any;
  };
  folder?: {
    childCount: number;
  };
  lastModifiedDateTime: string;
  createdDateTime: string;
  lastModifiedBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
  createdBy?: {
    user?: {
      displayName: string;
      email: string;
    };
  };
}

// Hook for SharePoint sites
export const useSharePointSites = () => {
  const { sharepointService, isAuthenticated } = useMSALAuth();
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Loading SharePoint sites...');
      const sitesData = await sharepointService.getSites();

      const formattedSites: SharePointSite[] = sitesData.map((site: any) => ({
        id: site.id,
        name: site.name || site.displayName,
        displayName: site.displayName || site.name,
        webUrl: site.webUrl,
        description: site.description,
      }));

      setSites(formattedSites);
      console.log(`Loaded ${formattedSites.length} SharePoint sites`);
    } catch (err) {
      console.error('Failed to load SharePoint sites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, [sharepointService, isAuthenticated]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  return {
    sites,
    loading,
    error,
    refetch: loadSites,
  };
};

// Hook for document libraries (drives) in a site
export const useSharePointDrives = (siteId?: string) => {
  const { sharepointService, isAuthenticated } = useMSALAuth();
  const [drives, setDrives] = useState<SharePointDrive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDrives = useCallback(async () => {
    if (!isAuthenticated || !siteId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Loading drives for site: ${siteId}`);
      const drivesData = await sharepointService.getDocumentLibraries(siteId);

      const formattedDrives: SharePointDrive[] = drivesData.map((drive: any) => ({
        id: drive.id,
        name: drive.name,
        driveType: drive.driveType,
        webUrl: drive.webUrl,
      }));

      setDrives(formattedDrives);
      console.log(`Loaded ${formattedDrives.length} drives for site ${siteId}`);
    } catch (err) {
      console.error('Failed to load SharePoint drives:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  }, [sharepointService, isAuthenticated, siteId]);

  useEffect(() => {
    loadDrives();
  }, [loadDrives]);

  return {
    drives,
    loading,
    error,
    refetch: loadDrives,
  };
};

// Hook for files in a drive/folder
export const useSharePointFiles = (siteId?: string, driveId?: string, folderId?: string) => {
  const { sharepointService, isAuthenticated } = useMSALAuth();
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!isAuthenticated || !siteId || !driveId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Loading files for site: ${siteId}, drive: ${driveId}, folder: ${folderId || 'root'}`);
      const filesData = await sharepointService.getFiles(siteId, driveId, folderId);

      const formattedFiles: SharePointFile[] = filesData.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size || 0,
        webUrl: file.webUrl,
        file: file.file,
        folder: file.folder,
        lastModifiedDateTime: file.lastModifiedDateTime,
        createdDateTime: file.createdDateTime,
        lastModifiedBy: file.lastModifiedBy,
        createdBy: file.createdBy,
      }));

      setFiles(formattedFiles);
      console.log(`Loaded ${formattedFiles.length} files`);
    } catch (err) {
      console.error('Failed to load SharePoint files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [sharepointService, isAuthenticated, siteId, driveId, folderId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    refetch: loadFiles,
  };
};