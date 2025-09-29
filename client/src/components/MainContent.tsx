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
  TextField,
  InputAdornment,
  alpha,
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
  AutoAwesome as AIIcon,
} from '@mui/icons-material';

import { SharePointFile, ViewMode, SearchFilters } from '../types';
import { formatFileSize, formatDate, getFileIcon } from '../utils/formatters';
// Use the safe version that doesn't make problematic API calls
import { useSharePointFiles } from '../hooks/useSharePointFiles';
import { AIFeaturesPanel } from './AIFeaturesPanel';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';

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

  const { currentTheme } = useDynamicTheme();

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFileForMenu, setSelectedFileForMenu] = useState<SharePointFile | null>(null);
  const [showAIFeatures, setShowAIFeatures] = useState<boolean>(false);

  // Use the safe version of the hook
  const { files, loading, error, totalCount, refreshFiles } = useSharePointFiles({
    path: currentPath,
    filters: searchFilters,
    viewMode,
  });

  // Filter files based on search query and sort alphabetically
  const filteredFiles = files
    .filter(file =>
      (file.displayName || file.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort folders first, then files, both alphabetically
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const handleFileSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      const newSelection = [...selectedFiles, fileId];
      onFileSelect(newSelection);
      // Auto-show AI features when first file is selected
      if (selectedFiles.length === 0) {
        setShowAIFeatures(true);
      }
    } else {
      const newSelection = selectedFiles.filter(id => id !== fileId);
      onFileSelect(newSelection);
      // Hide AI features when no files are selected
      if (newSelection.length === 0) {
        setShowAIFeatures(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      onFileSelect([]);
      setShowAIFeatures(false);
    } else {
      onFileSelect(filteredFiles.map(file => file.id));
      setShowAIFeatures(true);
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

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedFileForMenu(null);
  };

  const handleMenuAction = (action: string) => {
    if (selectedFileForMenu) {
      switch (action) {
        case 'preview':
          if (!selectedFileForMenu.isFolder) {
            onFileSelect([selectedFileForMenu.id]);
            onPreviewToggle();
          }
          break;
        case 'select':
          handleFileSelect(selectedFileForMenu.id, true);
          break;
        case 'download':
          console.log('Download:', selectedFileForMenu.displayName);
          // Implement download functionality
          break;
        case 'share':
          console.log('Share:', selectedFileForMenu.displayName);
          // Implement share functionality
          break;
        case 'delete':
          console.log('Delete:', selectedFileForMenu.displayName);
          // Implement delete functionality
          break;
        default:
          break;
      }
    }
    handleCloseMenu();
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
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3, lg: 3 }} sx={{ mb: 3 }}>
        {filteredFiles.map((file) => (
        <Grid item xs={6} sm={4} md={3} lg={2.4} xl={2} key={file.id}>
          <Card
            sx={{
              cursor: 'pointer',
              border: selectedFiles.includes(file.id) ? 2 : 1,
              borderColor: selectedFiles.includes(file.id) ? 'primary.main' : 'divider',
              backgroundColor: selectedFiles.includes(file.id) ? 'primary.50' : 'background.paper',
              transition: 'all 0.3s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              height: 'auto',
              minHeight: { xs: 140, sm: 150 },
              maxHeight: { xs: 160, sm: 170 },
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
                borderColor: 'primary.light',
              },
              '&:active': {
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => {
              if (file.isFolder) {
                onNavigate(file.parentPath + '/' + file.name);
              } else {
                // Only trigger preview if file is not already selected
                if (!selectedFiles.includes(file.id)) {
                  onFileSelect([file.id]);
                }
                onPreviewToggle();
              }
            }}
          >
            <CardContent sx={{
              p: { xs: 0.5, sm: 0.75 },
              pb: { xs: 0.5, sm: 0.75 },
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
              '&:last-child': {
                pb: { xs: 0.5, sm: 0.75 }
              }
            }}>
              <Box display="flex" alignItems="center" mb={{ xs: 0.5, sm: 1 }}>
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleFileSelect(file.id, e.target.checked);
                  }}
                  size="small"
                  sx={{ p: 0.25 }}
                />
                <Box flexGrow={1} />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                    setSelectedFileForMenu(file);
                  }}
                  sx={{ p: 0.25 }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                justifyContent="center"
                flexGrow={1}
              >
                <Box
                  mb={{ xs: 0.5, sm: 1 }}
                  sx={{
                    p: { xs: 0.5, sm: 0.75 },
                    borderRadius: 1.5,
                    backgroundColor: alpha(currentTheme.primary, 0.04),
                    border: `1px solid ${alpha(currentTheme.primary, 0.08)}`,
                    transition: 'all 0.2s ease',
                    '& > *': {
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      color: currentTheme.primary,
                      filter: `drop-shadow(0 1px 2px ${alpha(currentTheme.primary, 0.1)})`
                    }
                  }}
                >
                  {renderFileIcon(file)}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    width: '100%',
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: { xs: 0.25, sm: 0.5 },
                    color: 'text.primary'
                  }}
                >
                  {file.displayName}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    opacity: 0.8,
                    display: { xs: 'block', md: 'block' }
                  }}
                >
                  {file.isFolder ? 'Folder' : formatFileSize(file.size)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      </Grid>
    </Box>
  );

  const renderListView = () => (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {filteredFiles.map((file, index) => (
        <ListItem
          key={file.id}
          sx={{
            border: selectedFiles.includes(file.id) ? '2px solid' : '1px solid',
            borderColor: selectedFiles.includes(file.id) ? 'primary.main' : 'divider',
            backgroundColor: selectedFiles.includes(file.id) ? 'primary.50' : 'transparent',
            mb: 1,
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
          onClick={() => {
            if (file.isFolder) {
              onNavigate(file.parentPath + '/' + file.name);
            } else {
              // Only trigger preview if file is not already selected
              if (!selectedFiles.includes(file.id)) {
                onFileSelect([file.id]);
              }
              onPreviewToggle();
            }
          }}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedFiles.includes(file.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleFileSelect(file.id, e.target.checked);
              }}
              size="small"
            />
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 48 }}>
            {renderFileIcon(file)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  wordBreak: 'break-word',
                }}
              >
                {file.displayName}
              </Typography>
            }
            secondary={
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {file.isFolder ? 'Folder' : formatFileSize(file.size)} • {formatDate(file.lastModifiedDateTime)}
                </Typography>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
                setSelectedFileForMenu(file);
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } }}>
          <Box display="flex" alignItems="center" flexGrow={1} gap={{ xs: 0.5, sm: 1 }}>
            <Checkbox
              checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
              indeterminate={selectedFiles.length > 0 && selectedFiles.length < filteredFiles.length}
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

            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                minWidth: { xs: 120, sm: 200 },
                ml: { xs: 0.5, sm: 1 },
                '& .MuiOutlinedInput-root': {
                  height: 32,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Box flexGrow={1} />
            
            <Box display="flex" ml={{ xs: 0.5, sm: 1 }} gap={0.5}>
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
              <Tooltip title="AI Features">
                <IconButton
                  size="small"
                  color={showAIFeatures ? 'primary' : 'default'}
                  onClick={() => setShowAIFeatures(!showAIFeatures)}
                  disabled={selectedFiles.length === 0}
                >
                  <AIIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </Paper>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* AI Features Panel */}
        {showAIFeatures && selectedFiles.length > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <AIFeaturesPanel
              selectedFiles={selectedFiles}
              onAnalysisComplete={(results) => {
                console.log('Analysis completed:', results);
              }}
            />
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : filteredFiles.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="200px">
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No files found
            </Typography>
          </Box>
        ) : (
          viewMode.type === 'list' ? renderListView() : renderGridView()
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { width: 200 }
        }}
      >
        {selectedFileForMenu && !selectedFileForMenu.isFolder && (
          <MenuItem onClick={() => handleMenuAction('preview')}>
            <ListItemIcon>
              <SearchIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('select')}>
          <ListItemIcon>
            <Checkbox size="small" />
          </ListItemIcon>
          <ListItemText>Select</ListItemText>
        </MenuItem>
        {selectedFileForMenu && !selectedFileForMenu.isFolder && (
          <MenuItem onClick={() => handleMenuAction('download')}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('share')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};