import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface MainContentMinimalProps {
  currentPath: string;
  selectedFiles: string[];
  onFileSelect: (fileIds: string[]) => void;
  onNavigate: (path: string) => void;
  onPreviewToggle: () => void;
}

export const MainContentMinimal: React.FC<MainContentMinimalProps> = ({
  currentPath,
  selectedFiles,
  onFileSelect,
  onNavigate,
  onPreviewToggle,
}) => {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Minimal MainContent - Testing for Object Rendering Error
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Current Path: {currentPath || 'Root'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          Selected Files: {selectedFiles.length}
        </Typography>
        
        <Typography variant="body2" color="success.main">
          If you can see this text without errors, the issue is in the complex MainContent component.
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          This component only renders safe strings and numbers - no objects or complex data.
        </Typography>
      </Paper>
    </Box>
  );
};