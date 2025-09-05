import React, { useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { FileBrowser } from './FileBrowser';
import { SharePointFile, SearchFilters } from '../types';

export const FileBrowserExample: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<SharePointFile[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleFileSelect = (files: SharePointFile[]) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      showNotification(`Selected ${files.length} file${files.length > 1 ? 's' : ''}`, 'info');
    }
  };

  const handleFileOpen = (file: SharePointFile) => {
    if (file.isFolder) {
      const newPath = `${currentPath}/${file.name}`.replace(/\/+/g, '/');
      setCurrentPath(newPath);
      showNotification(`Navigated to ${file.name}`, 'info');
    } else {
      showNotification(`Opening ${file.name}`, 'info');
      // Here you would implement file opening logic
      // For example, opening in a preview modal or downloading
      if (file.webUrl) {
        window.open(file.webUrl, '_blank');
      }
    }
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]); // Clear selection when navigating
  };

  const handleUpload = async (files: File[], targetPath: string) => {
    try {
      showNotification(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`, 'info');
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification(
        `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''} to ${targetPath}`,
        'success'
      );
    } catch (error: any) {
      showNotification(`Upload failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const customActions = [
    {
      id: 'analyze-with-ai',
      label: 'Analyze with AI',
      icon: '🤖',
      handler: (files: SharePointFile[]) => {
        showNotification(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''} with AI...`, 'info');
        // Implement AI analysis logic
      },
      requiresSelection: true,
    },
    {
      id: 'add-to-favorites',
      label: 'Add to Favorites',
      icon: '⭐',
      handler: (files: SharePointFile[]) => {
        showNotification(`Added ${files.length} item${files.length > 1 ? 's' : ''} to favorites`, 'success');
        // Implement favorites logic
      },
      requiresSelection: true,
    },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          SharePoint File Browser
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a comprehensive file browser component with table/grid views, sorting, filtering, 
          drag-and-drop upload, context menus, and file operations.
        </Alert>

        {selectedFiles.length > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Selected files:</strong> {selectedFiles.map(f => f.name).join(', ')}
            </Typography>
          </Alert>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, mx: 2, mb: 2 }}>
        <FileBrowser
          path={currentPath}
          height="100%"
          showBreadcrumbs={true}
          allowMultiSelect={true}
          allowUpload={true}
          allowDelete={true}
          onFileSelect={handleFileSelect}
          onFileOpen={handleFileOpen}
          onPathChange={handlePathChange}
          onUpload={handleUpload}
          customActions={customActions}
          readOnly={false}
        />
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};