import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

import { SharePointFile, ViewMode, SearchFilters } from '../types';
import { formatFileSize, formatDate, getFileIcon } from '../utils/formatters';

interface MainContentProps {
  currentPath: string;
  selectedFiles: string[];
  onFileSelect: (fileIds: string[]) => void;
  onNavigate: (path: string) => void;
  onPreviewToggle: () => void;
}

// Mock hook that doesn't make any API calls
const useMockSharePointFiles = () => {
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setFiles([
        {
          id: 'mock-file-1',
          name: 'Sample Document.docx',
          displayName: 'Sample Document.docx',
          size: 24576,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/sample.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/Documents',
          isFolder: false
        },
        {
          id: 'mock-file-2',
          name: 'Project Proposal.pptx',
          displayName: 'Project Proposal.pptx',
          size: 1048576,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/proposal.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          extension: 'pptx',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/Documents',
          isFolder: false
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    files,
    loading,
    error,
    totalCount: 2,
    refreshFiles: async () => {},
  };
};

export const MainContent: React.FC<MainContentProps> = ({
  currentPath,
  selectedFiles,
  onFileSelect,
  onNavigate,
  onPreviewToggle,
}) => {
  console.log('MainContent.step4 rendering...', { currentPath, selectedFiles: selectedFiles.length });

  // Use mock hook instead of real API hook
  const { files, loading, error, totalCount, refreshFiles } = useMockSharePointFiles();

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          MainContent Step 4 - No API Calls (Mock Data Only)
        </Typography>
        <Typography variant="body1" gutterBottom>
          Testing without any API calls or external dependencies.
        </Typography>
        <Typography variant="body2">
          Current Path: {currentPath || 'None'}
        </Typography>
        <Typography variant="body2">
          Selected Files: {selectedFiles.length}
        </Typography>
        <Typography variant="body2">
          Hook State - Loading: {loading.toString()}, Error: {error || 'None'}, Files: {files.length}, Total: {totalCount}
        </Typography>
        
        {loading && <CircularProgress size={20} />}
        {error && <Alert severity="error">{error}</Alert>}
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          Files from mock hook: {files.map(f => f.name || f.displayName || 'Unnamed').join(', ') || 'Loading...'}
        </Typography>
      </Paper>
    </Box>
  );
};