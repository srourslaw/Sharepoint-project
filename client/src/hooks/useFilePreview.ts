import { useState, useEffect } from 'react';
import { SharePointFile, ApiResponse } from '../types';
import { api } from '../services/api';

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
      console.log('🔍 useFilePreview: Starting fetch for file ID:', id);
      setLoading(true);
      setError(null);

      // First, get the file metadata
      const fileResponse = await api.get<ApiResponse<SharePointFile>>(
        `/api/sharepoint-advanced/files/${id}`
      );
      
      console.log('📄 useFilePreview: File response:', JSON.stringify(fileResponse.data, null, 2));

      if (fileResponse.data.success && fileResponse.data.data) {
        const fileData = fileResponse.data.data;
        setFile(fileData);

        // Then, try to get the file content for preview
        await fetchFileContent(id, fileData);
      } else {
        throw new Error(fileResponse.data.error?.message || 'Failed to fetch file');
      }
    } catch (err: any) {
      console.error('Error fetching file:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch file');
      setFile(null);
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (id: string, fileData: SharePointFile): Promise<void> => {
    try {
      console.log('🔍 useFilePreview: Fetching content for file:', fileData.name, 'Type:', fileData.mimeType, 'Extension:', fileData.extension);
      const isPreviewable = isFilePreviewable(fileData);
      console.log('📋 useFilePreview: Is previewable?', isPreviewable);
      
      if (!isPreviewable) {
        setContent(null);
        return;
      }

      // For images, get the file content as a blob URL
      if (fileData.mimeType.startsWith('image/')) {
        console.log('🖼️ useFilePreview: Processing image file');
        const contentResponse = await api.get(
          `/api/sharepoint-advanced/files/${id}/content`,
          { responseType: 'blob' }
        );
        
        console.log('🖼️ useFilePreview: Got blob response, size:', contentResponse.data.size);
        const blob = new Blob([contentResponse.data], { type: fileData.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        console.log('🖼️ useFilePreview: Created blob URL:', blobUrl);
        setContent(blobUrl);
        return;
      }

      // For PDFs, videos, and audio, get the download URL
      if (
        fileData.mimeType === 'application/pdf' ||
        fileData.mimeType.startsWith('video/') ||
        fileData.mimeType.startsWith('audio/')
      ) {
        if (fileData.downloadUrl) {
          setContent(fileData.downloadUrl);
        } else {
          // Fallback to content endpoint
          const contentUrl = `/api/sharepoint-advanced/files/${id}/content`;
          setContent(contentUrl);
        }
        return;
      }

      // For text files, get the actual text content
      if (
        fileData.mimeType.startsWith('text/') ||
        ['application/json', 'application/javascript', 'application/xml'].includes(fileData.mimeType)
      ) {
        const contentResponse = await api.get<ApiResponse<{ content: string }>>(
          `/api/sharepoint-advanced/files/${id}/text`
        );

        if (contentResponse.data.success && contentResponse.data.data) {
          setContent(contentResponse.data.data.content);
        }
        return;
      }

      // For Office documents (DOCX, Excel, PowerPoint), get text content
      const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      if (officeExtensions.includes(fileData.extension.toLowerCase())) {
        console.log('📄 useFilePreview: Processing Office document');
        try {
          const contentResponse = await api.get(
            `/api/sharepoint-advanced/files/${id}/content`,
            { responseType: 'text' }
          );
          
          console.log('📄 useFilePreview: Got text response, length:', contentResponse.data?.length);
          // For Office docs, we'll get the raw content and display it
          setContent(contentResponse.data || 'Document content available - please use AI features to analyze this file.');
        } catch (officeError) {
          console.log('📄 useFilePreview: Office content error:', JSON.stringify(officeError, null, 2));
          // If we can't get text content, show a helpful message
          setContent(`This ${fileData.extension.toUpperCase()} document is available for AI processing. Click on AI features to analyze, summarize, or edit this document.`);
        }
        return;
      }

      // For other file types, show not available message
      setContent(null);
    } catch (err: any) {
      console.warn('Could not fetch file content for preview:', err);
      // Don't set error for content fetch failures - file metadata is still valid
      setContent(null);
    }
  };

  const isFilePreviewable = (fileData: SharePointFile): boolean => {
    const { mimeType, extension, size } = fileData;
    
    // Size limit for previews (10MB)
    const maxPreviewSize = 10 * 1024 * 1024;
    if (size > maxPreviewSize) return false;

    // Supported image types
    if (mimeType.startsWith('image/')) {
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension.toLowerCase());
    }

    // Supported document types
    if (mimeType === 'application/pdf') return true;

    // Supported video types
    if (mimeType.startsWith('video/')) {
      return ['mp4', 'webm', 'ogg'].includes(extension.toLowerCase());
    }

    // Supported audio types
    if (mimeType.startsWith('audio/')) {
      return ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension.toLowerCase());
    }

    // Supported text types
    if (mimeType.startsWith('text/')) return true;
    if (['application/json', 'application/javascript', 'application/xml'].includes(mimeType)) return true;

    // Microsoft Office files (if preview service is available)
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (officeExtensions.includes(extension.toLowerCase())) return true;

    return false;
  };

  const downloadFile = async (): Promise<void> => {
    if (!file) return;

    try {
      setLoading(true);
      await api.downloadFile(
        `/api/sharepoint-advanced/files/${file.id}/download`,
        file.name
      );
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

    // Cleanup blob URLs when component unmounts or fileId changes
    return () => {
      if (content && content.startsWith('blob:')) {
        URL.revokeObjectURL(content);
      }
    };
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