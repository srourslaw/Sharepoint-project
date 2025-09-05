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
import { SearchAndFilter } from './SearchAndFilter';
import { useSharePointFiles } from '../hooks/useSharePointFiles';
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
  const [showFilters, setShowFilters] = useState(false);

  const { files, loading, error, totalCount, refreshFiles } = useSharePointFiles({
    path: currentPath,
    filters: searchFilters,
    viewMode,
  });
  
  // Debug log to see what data we're getting and validate objects
  React.useEffect(() => {
    if (files.length > 0) {
      console.log('📄 MainContent: Files data received (count):', files.length);
      files.forEach((file, index) => {
        console.log(`📄 File ${index}:`, JSON.stringify({
          id: typeof file.id, idValue: file.id,
          name: typeof file.name, nameValue: file.name,
          displayName: typeof file.displayName, displayNameValue: file.displayName,
          size: typeof file.size, sizeValue: file.size,
          lastModifiedDateTime: typeof file.lastModifiedDateTime, dateValue: file.lastModifiedDateTime,
          lastModifiedBy: typeof file.lastModifiedBy, lastModifiedByValue: file.lastModifiedBy,
          createdBy: typeof file.createdBy, createdByValue: file.createdBy,
        }, null, 2));
        
        // Check if any objects are being passed to React text rendering
        Object.keys(file).forEach(key => {
          const value = (file as any)[key];
          if (value && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            console.warn(`🚨 Object found in file.${key}:`, JSON.stringify(value, null, 2));
            if (!value.toString || typeof value.toString !== 'function') {
              console.error(`❌ Object ${key} has no toString method!`, JSON.stringify(value, null, 2));
            }
          }
        });
      });
    }
  }, [files]);

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

  const handleViewModeChange = (type: ViewMode['type']) => {
    setViewMode(prev => ({ ...prev, type }));
  };

  const handleSortChange = (sortBy: string) => {
    setViewMode(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setSortAnchorEl(null);
  };

  const handleFileAction = (action: string, fileId: string) => {
    switch (action) {
      case 'download':
        // Handle download
        console.log('Download file:', fileId);
        break;
      case 'share':
        // Handle share
        console.log('Share file:', fileId);
        break;
      case 'edit':
        // Handle edit
        console.log('Edit file:', fileId);
        break;
      case 'delete':
        // Handle delete
        console.log('Delete file:', fileId);
        break;
      case 'preview':
        onFileSelect([fileId]);
        onPreviewToggle();
        break;
      default:
        break;
    }
    setAnchorEl(null);
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
    <Grid container spacing={2} sx={{ p: { xs: 1, sm: 2 } }}>
      {files.map((file, index) => {
        // Debug logging for each file - properly stringify objects
        console.log(`🐛 Grid item ${index}:`, JSON.stringify({
          id: file.id,
          name: file.name,
          displayName: file.displayName,
          size: file.size,
          lastModifiedDateTime: file.lastModifiedDateTime,
          extension: file.extension,
          isFolder: file.isFolder
        }, null, 2));
        
        // Validate all properties that will be rendered
        const safeDisplayName = String(file.displayName || file.name || 'Unknown');
        const safeSize = typeof file.size === 'number' ? file.size : 0;
        const safeDate = file.lastModifiedDateTime || new Date().toISOString();
        
        console.log(`🔍 Safe values for ${index}:`, JSON.stringify({
          safeDisplayName,
          safeSize,
          safeDate: typeof safeDate
        }, null, 2));
        
        return (
          <Grid item xs={6} sm={4} md={3} lg={2} xl={2} key={String(file.id || `file-${index}`)}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                border: (file.id && selectedFiles.includes(String(file.id))) ? 2 : 0,
                borderColor: 'primary.main',
              }}
              onClick={() => {
                if (file.isFolder) {
                  onNavigate(file.parentPath + '/' + file.name);
                } else if (file.id) {
                  // For files, select them and open preview
                  console.log('Clicking file:', file.name, 'ID:', file.id);
                  onFileSelect([String(file.id)]);
                  onPreviewToggle();
                }
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Checkbox
                    checked={file.id ? selectedFiles.includes(String(file.id)) : false}
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
                  <Box mb={1}>
                    {renderFileIcon(file)}
                  </Box>
                  
                  <Typography variant="body2" noWrap sx={{ width: '100%', fontWeight: 500 }}>
                    {safeDisplayName}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {file.isFolder ? 'Folder' : formatFileSize(safeSize)}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(safeDate)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderListView = () => (
    <List sx={{ px: 1 }}>
      {files.map((file) => (
        <ListItem
          key={String(file.id || Math.random())}
          sx={{
            border: (file.id && selectedFiles.includes(String(file.id))) ? 1 : 0,
            borderColor: 'primary.main',
            borderRadius: 1,
            mb: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
          onClick={() => {
            if (file.isFolder) {
              onNavigate(file.parentPath + '/' + file.name);
            } else if (file.id) {
              // For files, select them and open preview
              console.log('Clicking file (list):', file.name, 'ID:', file.id);
              onFileSelect([String(file.id)]);
              onPreviewToggle();
            }
          }}
        >
          <Checkbox
            checked={file.id ? selectedFiles.includes(String(file.id)) : false}
            onChange={(e) => {
              e.stopPropagation();
              handleFileSelect(file.id, e.target.checked);
            }}
            size="small"
          />
          
          <ListItemIcon sx={{ minWidth: 48 }}>
            {renderFileIcon(file)}
          </ListItemIcon>
          
          <ListItemText
            primary={String(file.displayName || file.name || 'Unknown')}
            secondary={
              <Box component="span">
                <Typography component="span" variant="caption" color="text.secondary">
                  {file.isFolder ? 'Folder' : `${formatFileSize(file.size || 0)} • `}
                  {formatDate(file.lastModifiedDateTime || new Date())}
                  {(file.lastModifiedBy && 
                    typeof file.lastModifiedBy === 'object' && 
                    file.lastModifiedBy !== null &&
                    Object.keys(file.lastModifiedBy).length > 0 &&
                    file.lastModifiedBy.displayName && 
                    typeof file.lastModifiedBy.displayName === 'string') 
                    ? ` • ${file.lastModifiedBy.displayName}` 
                    : ''}
                </Typography>
              </Box>
            }
          />
          
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreIcon />
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
              checked={selectedFiles.length === files.length && files.length > 0}
              indeterminate={selectedFiles.length > 0 && selectedFiles.length < files.length}
              onChange={handleSelectAll}
              size="small"
            />
            
            {selectedFiles.length > 0 && (
              <Chip
                label={`${selectedFiles.length} selected`}
                size="small"
                onDelete={() => onFileSelect([])}
                sx={{ ml: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'flex' } }}
              />
            )}
            
            <Box flexGrow={1} />
            
            <Tooltip title="Search and Filter">
              <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Sort">
              <IconButton size="small" onClick={(e) => setSortAnchorEl(e.currentTarget)}>
                <SortIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
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
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <ListViewIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </Paper>

      {/* Search and Filter Panel */}
      {showFilters && (
        <SearchAndFilter
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
            <Typography variant="body2" color="text.secondary">
              This folder is empty or no files match your filters
            </Typography>
          </Box>
        ) : (
          viewMode.type === 'grid' ? renderGridView() : renderListView()
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleFileAction('preview', selectedFiles[0] || '')}>
          <ListItemIcon><SearchIcon fontSize="small" /></ListItemIcon>
          Preview
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('download', selectedFiles[0] || '')}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          Download
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('share', selectedFiles[0] || '')}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('edit', selectedFiles[0] || '')}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleFileAction('delete', selectedFiles[0] || '')}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem onClick={() => handleSortChange('name')}>Name</MenuItem>
        <MenuItem onClick={() => handleSortChange('lastModifiedDateTime')}>Modified</MenuItem>
        <MenuItem onClick={() => handleSortChange('size')}>Size</MenuItem>
        <MenuItem onClick={() => handleSortChange('extension')}>Type</MenuItem>
      </Menu>
    </Box>
  );
};