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
import { formatFileSize, formatDate, getFileIcon } from '../utils/formatters';
// Step 3: Add useSharePointFiles hook - this is likely the culprit!
import { useSharePointFiles } from '../hooks/useSharePointFiles';

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
  console.log('MainContent.step3 rendering...', { currentPath, selectedFiles: selectedFiles.length });

  const [viewMode, setViewMode] = useState<ViewMode>({
    type: 'grid',
    itemsPerPage: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    fileType: [],
    dateRange: {},
    sizeRange: {},
    author: [],
  });

  // This is the likely culprit - useSharePointFiles hook
  const { files, loading, error, totalCount, refreshFiles } = useSharePointFiles({
    path: currentPath,
    filters: searchFilters,
    viewMode,
  });

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          MainContent Step 3 - With useSharePointFiles Hook
        </Typography>
        <Typography variant="body1" gutterBottom>
          Testing with useSharePointFiles hook - this is likely where the S.length error occurs.
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
          Files from hook: {files.map(f => f.name || f.displayName || 'Unnamed').join(', ') || 'No files'}
        </Typography>
      </Paper>
    </Box>
  );
};