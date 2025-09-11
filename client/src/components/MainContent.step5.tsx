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
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

import { SharePointFile, ViewMode, SearchFilters } from '../types';
import { formatFileSize, formatDate, getFileIcon } from '../utils/formatters';
// Use the safe version that doesn't make problematic API calls
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
  console.log('MainContent.step5 rendering...', JSON.stringify({ currentPath, selectedFiles: selectedFiles.length }, null, 2));

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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  // Use the safe version of the hook
  const { files, loading, error, totalCount, refreshFiles } = useSharePointFiles({
    path: currentPath,
    filters: searchFilters,
    viewMode,
  });

  const handleFileSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      onFileSelect([...selectedFiles, fileId]);
    } else {
      onFileSelect(selectedFiles.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      onFileSelect([]);
    } else {
      onFileSelect(files.map(file => file.id));
    }
  };

  const handleGoBack = () => {
    if (!currentPath || currentPath === '' || currentPath === '/') {
      // If we're at root, can't go back further
      return;
    }

    // Split the path and go up one level
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      // Go to root
      onNavigate('');
    } else {
      // Remove the last part to go up one level
      pathParts.pop();
      const parentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
      onNavigate(parentPath);
    }
  };

  // Determine if we can go back (not at root level)
  const canGoBack = currentPath && currentPath !== '' && currentPath !== '/';

  const handleViewModeChange = (type: ViewMode['type']) => {
    setViewMode(prev => ({ ...prev, type }));
  };

  const renderFileIcon = (file: SharePointFile) => {
    const IconComponent = getFileIcon(file.extension);
    
    if (file.thumbnail) {
      return (
        <Avatar
          src={file.thumbnail}
          sx={{ width: 40, height: 40 }}
          variant="rounded"
        >
          <IconComponent />
        </Avatar>
      );
    }
    
    return <IconComponent color="primary" />;
  };

  const renderGridView = () => (
    <Grid container spacing={3} sx={{ p: { xs: 1, sm: 2 } }}>
      {files.map((file) => (
        <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={file.id}>
          <Card
            sx={{
              cursor: 'pointer',
              border: selectedFiles.includes(file.id) ? 2 : 1,
              borderColor: selectedFiles.includes(file.id) ? 'primary.main' : 'divider',
              backgroundColor: selectedFiles.includes(file.id) ? 'primary.50' : 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => {
              if (file.isFolder) {
                onNavigate(file.parentPath + '/' + file.name);
              } else {
                // Select the file and trigger preview
                onFileSelect([file.id]);
                onPreviewToggle();
              }
            }}
          >
            <CardContent sx={{ pb: 2, minHeight: 140 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleFileSelect(file.id, e.target.checked);
                  }}
                  size="small"
                />
                <Box flexGrow={1} />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box mb={2}>
                  {renderFileIcon(file)}
                </Box>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    width: '100%', 
                    fontWeight: 500, 
                    mb: 1,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {file.displayName}
                </Typography>
                
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  {file.isFolder ? 'Folder' : formatFileSize(file.size)}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {formatDate(file.lastModifiedDateTime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } }}>
          <Box display="flex" alignItems="center" flexGrow={1} gap={{ xs: 0.5, sm: 1 }}>
            <Checkbox
              checked={selectedFiles.length === files.length && files.length > 0}
              indeterminate={selectedFiles.length > 0 && selectedFiles.length < files.length}
              onChange={handleSelectAll}
              size="small"
            />
            
            {canGoBack && (
              <>
                <Tooltip title="Go back / Up one level">
                  <IconButton
                    size="small"
                    onClick={handleGoBack}
                    sx={{ ml: 0.5 }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Go to Home">
                  <IconButton
                    size="small"
                    onClick={() => onNavigate('')}
                    sx={{ ml: 0.5 }}
                  >
                    <HomeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {/* Current Path Display */}
            {currentPath && (
              <Typography
                variant="body2"
                sx={{ 
                  ml: 1, 
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'block' },
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                📁 {currentPath.split('/').filter(Boolean).pop() || 'Root'}
              </Typography>
            )}
            
            {selectedFiles.length > 0 && (
              <Chip
                label={`${selectedFiles.length} selected`}
                size="small"
                onDelete={() => onFileSelect([])}
                sx={{ ml: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'flex' } }}
              />
            )}
            
            <Box flexGrow={1} />
            
            <Box display="flex" ml={{ xs: 0.5, sm: 1 }}>
              <IconButton
                size="small"
                color={viewMode.type === 'grid' ? 'primary' : 'default'}
                onClick={() => handleViewModeChange('grid')}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color={viewMode.type === 'list' ? 'primary' : 'default'}
                onClick={() => handleViewModeChange('list')}
              >
                <ListViewIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </Paper>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            SharePoint Files - Real API Version
          </Typography>
          <Typography variant="body2" gutterBottom>
            Using real SharePoint files hook with direct Microsoft Graph API calls
          </Typography>
          <Typography variant="body2">
            Files: {files.length}, Loading: {loading.toString()}, Error: {error || 'None'}
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Current Path: {currentPath} | Real SharePoint: {process.env.REACT_APP_ENVIRONMENT || 'development'}
          </Typography>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : files.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="200px">
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No files found
            </Typography>
          </Box>
        ) : (
          renderGridView()
        )}
      </Box>
    </Box>
  );
};