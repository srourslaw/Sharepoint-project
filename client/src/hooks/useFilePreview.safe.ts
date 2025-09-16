import { useState, useEffect } from 'react';
import { SharePointFile } from '../types';

interface UseFilePreviewReturn {
  file: SharePointFile | null;
  content: string | null;
  loading: boolean;
  error: string | null;
  downloadFile: () => Promise<void>;
  refreshFile: () => Promise<void>;
}


export const useFilePreview = (fileId: string | null): UseFilePreviewReturn => {
  const [file, setFile] = useState<SharePointFile | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('useFilePreview: Attempting to fetch file for ID:', id);

      // Make actual API call to SharePoint
      const response = await fetch(`/api/sharepoint-advanced/files/${id}/preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found');
        }
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }

      setFile(result.data);

      // Set content if available
      if (result.data.isFolder) {
        setContent(null);
      } else {
        setContent(result.data.content || null);
      }

    } catch (err: any) {
      console.error('Error fetching file preview:', err);
      setError(err.message || 'Failed to fetch file');
      setFile(null);
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (): Promise<void> => {
    if (!file) return;

    try {
      setLoading(true);

      console.log('Download initiated for:', file.name);

      // Make API call to download the file
      const response = await fetch(`/api/sharepoint-advanced/files/${file.id}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const refreshFile = async (): Promise<void> => {
    if (fileId) {
      await fetchFile(fileId);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchFile(fileId);
    } else {
      setFile(null);
      setContent(null);
      setError(null);
    }
  }, [fileId]);

  return {
    file,
    content,
    loading,
    error,
    downloadFile,
    refreshFile,
  };
};