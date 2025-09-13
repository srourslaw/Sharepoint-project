import { useState, useEffect, useRef } from 'react';
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
  const currentFileIdRef = useRef<string | null>(null);

  const fetchFile = async (id: string): Promise<void> => {
    try {
      console.log('🔍 useFilePreview: Starting fetch for file ID:', id);
      currentFileIdRef.current = id;
      setLoading(true);
      setError(null);

      // First, get the file metadata
      const fileResponse = await api.get<ApiResponse<SharePointFile>>(
        `/api/sharepoint-advanced/files/${id}`
      );

      console.log('📄 useFilePreview: File response:', JSON.stringify(fileResponse.data, null, 2));

      // Check if this is still the current file request before updating state
      if (currentFileIdRef.current !== id) {
        console.log('🚫 useFilePreview: File changed during fetch, ignoring response for:', id);
        return;
      }

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

      // Only set error state if this is still the current file request
      if (currentFileIdRef.current === id) {
        setError(err.response?.data?.error?.message || 'Failed to fetch file');
        setFile(null);
        setContent(null);
      }
    } finally {
      // Only set loading false if this is still the current file request
      if (currentFileIdRef.current === id) {
        setLoading(false);
      }
    }
  };

  const fetchFileContent = async (id: string, fileData: SharePointFile): Promise<void> => {
    try {
      console.log('🔍 useFilePreview: Fetching content for file:', String(fileData.name), 'Type:', String(fileData.mimeType), 'Extension:', String(fileData.extension));
      const isPreviewable = isFilePreviewable(fileData);
      console.log('📋 useFilePreview: Is previewable?', isPreviewable);
      
      if (!isPreviewable) {
        setContent(null);
        return;
      }

      // For images, get the file content as a blob URL
      if (fileData.mimeType.startsWith('image/')) {
        console.log('🖼️ useFilePreview: Processing image file');
        
        try {
          const contentResponse = await api.get(
            `/api/sharepoint-advanced/files/${id}/content`,
            { 
              responseType: 'blob',
              withCredentials: true,
              headers: {
                'Accept': fileData.mimeType + ',image/*,*/*'
              }
            }
          );
          
          const responseBlob = contentResponse.data;
          console.log('🖼️ useFilePreview: Got image blob response, size:', responseBlob.size, 'type:', responseBlob.type);
          console.log('🖼️ useFilePreview: Response data type:', typeof responseBlob, 'constructor:', responseBlob.constructor.name);
          console.log('🖼️ useFilePreview: Response headers:', contentResponse.headers);
          
          // Check if the blob is valid
          if (!responseBlob || responseBlob.size === 0) {
            throw new Error(`Empty blob received for image: ${fileData.name}`);
          }
          
          // Ensure we have a proper blob with correct MIME type
          const blob = responseBlob instanceof Blob ? 
            new Blob([responseBlob], { type: fileData.mimeType }) : 
            new Blob([responseBlob], { type: fileData.mimeType });
          
          console.log('🖼️ useFilePreview: Final blob size:', blob.size, 'type:', blob.type);
          
          // Test if we can read the blob as array buffer for debugging
          blob.arrayBuffer().then(buffer => {
            console.log('🖼️ useFilePreview: Blob array buffer size:', buffer.byteLength);
            const first10Bytes = new Uint8Array(buffer.slice(0, 10));
            console.log('🖼️ useFilePreview: First 10 bytes:', Array.from(first10Bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
          });
          
          // Convert blob to base64 data URL to avoid authentication issues
          const reader = new FileReader();
          reader.onload = () => {
            const base64DataUrl = reader.result as string;
            console.log('🖼️ useFilePreview: Created base64 data URL, length:', base64DataUrl.length);
            // Only update content if this is still the current file request
            if (currentFileIdRef.current === id) {
              setContent(base64DataUrl);
            }
          };
          reader.onerror = (error) => {
            console.error('🖼️ useFilePreview: FileReader error:', error);
            // Fallback to blob URL
            const blobUrl = URL.createObjectURL(blob);
            console.log('🖼️ useFilePreview: Fallback to blob URL:', blobUrl);
            if (currentFileIdRef.current === id) {
              setContent(blobUrl);
            }
          };
          reader.readAsDataURL(blob);
          return;
          
        } catch (imageError) {
          console.error('🖼️ useFilePreview: Image processing error:', imageError);
          // Fallback: try direct URL
          const directUrl = `/api/sharepoint-advanced/files/${id}/content`;
          console.log('🖼️ useFilePreview: Trying direct URL fallback:', directUrl);
          setContent(directUrl);
          return;
        }
      }

      // For PDFs, get as blob to avoid authentication issues
      if (fileData.mimeType === 'application/pdf') {
        console.log('📕 useFilePreview: Processing PDF file');
        
        try {
          const contentResponse = await api.get(
            `/api/sharepoint-advanced/files/${id}/content`,
            { 
              responseType: 'blob',
              withCredentials: true,
              headers: {
                'Accept': 'application/pdf,*/*'
              }
            }
          );
          
          const responseBlob = contentResponse.data;
          console.log('📕 useFilePreview: Got PDF blob response, size:', responseBlob.size, 'type:', responseBlob.type);
          console.log('📕 useFilePreview: Response data type:', typeof responseBlob, 'constructor:', responseBlob.constructor.name);
          console.log('📕 useFilePreview: Response headers:', contentResponse.headers);
          
          // Check if the blob is valid
          if (!responseBlob || responseBlob.size === 0) {
            throw new Error(`Empty blob received for PDF: ${fileData.name}`);
          }
          
          // Ensure we have a proper blob with correct MIME type
          const blob = responseBlob instanceof Blob ? 
            new Blob([responseBlob], { type: 'application/pdf' }) : 
            new Blob([responseBlob], { type: 'application/pdf' });
          
          console.log('📕 useFilePreview: Final blob size:', blob.size, 'type:', blob.type);
          
          // Test if we can read the first few bytes to verify it's a PDF
          blob.arrayBuffer().then(buffer => {
            console.log('📕 useFilePreview: Blob array buffer size:', buffer.byteLength);
            const first10Bytes = new Uint8Array(buffer.slice(0, 10));
            const pdfSignature = Array.from(first10Bytes.slice(0, 4)).map(b => String.fromCharCode(b)).join('');
            console.log('📕 useFilePreview: First 10 bytes:', Array.from(first10Bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log('📕 useFilePreview: PDF signature:', pdfSignature, 'Is PDF:', pdfSignature === '%PDF');
          });
          
          // Convert PDF blob to base64 data URL to avoid authentication issues
          const reader = new FileReader();
          reader.onload = () => {
            const base64DataUrl = reader.result as string;
            console.log('📕 useFilePreview: Created PDF base64 data URL, length:', base64DataUrl.length);
            if (currentFileIdRef.current === id) {
              setContent(base64DataUrl);
            }
          };
          reader.onerror = (error) => {
            console.error('📕 useFilePreview: PDF FileReader error:', error);
            // Fallback to blob URL
            const blobUrl = URL.createObjectURL(blob);
            console.log('📕 useFilePreview: Fallback to PDF blob URL:', blobUrl);
            if (currentFileIdRef.current === id) {
              setContent(blobUrl);
            }
          };
          reader.readAsDataURL(blob);
          return;
          
        } catch (pdfError) {
          console.error('📕 useFilePreview: PDF processing error:', pdfError);
          // Fallback: try direct URL
          const directUrl = `/api/sharepoint-advanced/files/${id}/content`;
          console.log('📕 useFilePreview: Trying direct URL fallback:', directUrl);
          setContent(directUrl);
          return;
        }
      }

      // For videos and audio, get the download URL
      if (
        fileData.mimeType.startsWith('video/') ||
        fileData.mimeType.startsWith('audio/')
      ) {
        if (currentFileIdRef.current === id) {
          if (fileData.downloadUrl) {
            setContent(fileData.downloadUrl);
          } else {
            // Fallback to content endpoint
            const contentUrl = `/api/sharepoint-advanced/files/${id}/content`;
            setContent(contentUrl);
          }
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

        if (contentResponse.data.success && contentResponse.data.data && currentFileIdRef.current === id) {
          setContent(contentResponse.data.data.content);
        }
        return;
      }

      // Handle different file types based on extension and MIME type
      const fileExtension = fileData.extension.toLowerCase();
      const mimeType = fileData.mimeType;
      
      // Office documents - get text content
      const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      if (officeExtensions.includes(fileExtension)) {
        console.log('📄 useFilePreview: Processing Office document');
        try {
          const contentResponse = await api.get(
            `/api/sharepoint-advanced/files/${id}/content`,
            { responseType: 'text' }
          );
          
          console.log('📄 useFilePreview: Got Office text response, length:', contentResponse.data?.length);
          if (currentFileIdRef.current === id) {
            setContent(contentResponse.data || 'Document content available - please use AI features to analyze this file.');
          }
        } catch (officeError) {
          console.log('📄 useFilePreview: Office content error:', JSON.stringify(officeError, null, 2));
          if (currentFileIdRef.current === id) {
            setContent(`This ${fileData.extension.toUpperCase()} document is available for AI processing. Click on AI features to analyze, summarize, or edit this document.`);
          }
        }
        return;
      }
      
      // Image files - get binary data for display (this should not be reached due to early return above)
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
      if (imageExtensions.includes(fileExtension) || mimeType.startsWith('image/')) {
        console.log('🖼️ useFilePreview: Processing image file (fallback)');
        try {
          const contentResponse = await api.get(
            `/api/sharepoint-advanced/files/${id}/content`,
            { responseType: 'blob' }
          );
          
          const blob = new Blob([contentResponse.data], { type: fileData.mimeType });
          const blobUrl = URL.createObjectURL(blob);
          console.log('🖼️ useFilePreview: Created fallback image blob URL:', blobUrl);
          if (currentFileIdRef.current === id) {
            setContent(blobUrl);
          }
        } catch (imageError) {
          console.log('🖼️ useFilePreview: Image error:', JSON.stringify(imageError, null, 2));
          if (currentFileIdRef.current === id) {
            setContent('Image preview not available');
          }
        }
        return;
      }
      
      // PDF files are handled earlier with blob URL, this is just for text extraction fallback
      if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
        console.log('📕 useFilePreview: PDF already processed with blob URL');
        return;
      }

      // For other file types, show not available message
      if (currentFileIdRef.current === id) {
        setContent(null);
      }
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
    // Immediately reset states when fileId changes to prevent showing old content
    setFile(null);
    setContent(null);
    setError(null);

    // Update current file ref to prevent race conditions
    currentFileIdRef.current = fileId;

    if (fileId) {
      console.log('🔄 useFilePreview: File ID changed, fetching new file:', fileId);
      fetchFile(fileId);
    }

    // Cleanup blob URLs when component unmounts or fileId changes
    return () => {
      // Use a ref or capture current content value to avoid stale closure
      const currentContent = content;
      if (currentContent && typeof currentContent === 'string' && currentContent.startsWith('blob:')) {
        console.log('🧹 useFilePreview: Cleaning up blob URL:', currentContent);
        URL.revokeObjectURL(currentContent);
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