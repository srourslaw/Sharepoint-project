import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Toolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  ViewHeadline as TableViewIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
} from '@mui/icons-material';

import { SharePointFile, ViewMode, SearchFilters } from '../types';
// Step 2: Add utility functions
import { formatFileSize, formatDate, getFileIcon } from '../utils/formatters';

interface MainContentProps {
  currentPath: string;
  selectedFiles: string[];
  onFileSelect: (fileIds: string[]) => void;
  onNavigate: (path: string) => void;
  onPreviewToggle: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  currentPath,
  selectedFiles,
  onFileSelect,
  onNavigate,
  onPreviewToggle,
}) => {
  console.log('MainContent.step2 rendering...', { currentPath, selectedFiles: selectedFiles.length });

  // Test the utility functions with safe values
  const testFileSize = formatFileSize(1024);
  const testDate = formatDate('2023-01-01T00:00:00Z');
  const testIcon = getFileIcon('pdf');

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          MainContent Step 2 - With Utility Functions
        </Typography>
        <Typography variant="body1" gutterBottom>
          Testing with formatFileSize, formatDate, and getFileIcon utilities.
        </Typography>
        <Typography variant="body2">
          Current Path: {currentPath || 'None'}
        </Typography>
        <Typography variant="body2">
          Selected Files: {selectedFiles.length}
        </Typography>
        <Typography variant="body2">
          Test formatFileSize(1024): {testFileSize}
        </Typography>
        <Typography variant="body2">
          Test formatDate('2023-01-01T00:00:00Z'): {testDate}
        </Typography>
        <Typography variant="body2">
          Test getFileIcon('pdf'): {testIcon.toString()}
        </Typography>
      </Paper>
    </Box>
  );
};