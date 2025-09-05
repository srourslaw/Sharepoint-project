import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CreateNewFolder as CreateFolderIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  FileCopy as CopyIcon,
  DriveFileMove as MoveIcon,
  Security as SecurityIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { SharePointFile, SharePointLibrary, User } from '../types';

interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdBy: User;
  createdDateTime: string;
  lastModifiedDateTime: string;
  itemCount: number;
  isFolder: boolean;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canShare: boolean;
    canManagePermissions: boolean;
  };
  isHidden: boolean;
  description?: string;
  template?: string;
}

interface FolderManagerProps {
  currentLibrary: SharePointLibrary;
  currentPath: string;
  onPathChange: (path: string) => void;
  onFolderCreated?: (folder: FolderItem) => void;
  onFolderDeleted?: (folderId: string) => void;
  onFolderRenamed?: (folderId: string, newName: string) => void;
  showHidden?: boolean;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  currentLibrary,
  currentPath,
  onPathChange,
  onFolderCreated,
  onFolderDeleted,
  onFolderRenamed,
  showHidden = false,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState<FolderItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FolderItem | null>(null);
  const [propertiesDialog, setPropertiesDialog] = useState<FolderItem | null>(null);
  
  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderTemplate, setNewFolderTemplate] = useState('');
  const [renameValue, setRenameValue] = useState('');
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; folder: FolderItem } | null>(null);
  
  // Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Load folders for current path
  useEffect(() => {
    loadFolders();
    loadBreadcrumbs();
  }, [currentLibrary.id, currentPath]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/libraries/${currentLibrary.id}/folders?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();

      if (data.success) {
        const filteredFolders = showHidden 
          ? data.data 
          : data.data.filter((folder: FolderItem) => !folder.isHidden);
        setFolders(filteredFolders);
      } else {
        setError(data.error?.message || 'Failed to load folders');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBreadcrumbs = async () => {
    try {
      const response = await fetch(`/api/libraries/${currentLibrary.id}/breadcrumbs?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();

      if (data.success) {
        setBreadcrumbs([
          { id: 'root', name: currentLibrary.displayName, path: '' },
          ...data.data
        ]);
      }
    } catch (error) {
      // Fallback breadcrumbs
      const pathParts = currentPath.split('/').filter(Boolean);
      const fallbackBreadcrumbs: BreadcrumbItem[] = [
        { id: 'root', name: currentLibrary.displayName, path: '' }
      ];
      
      pathParts.forEach((part, index) => {
        const path = pathParts.slice(0, index + 1).join('/');
        fallbackBreadcrumbs.push({
          id: path,
          name: part,
          path
        });
      });
      
      setBreadcrumbs(fallbackBreadcrumbs);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(`/api/libraries/${currentLibrary.id}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim(),
          parentPath: currentPath,
          template: newFolderTemplate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newFolder: FolderItem = data.data;
        setFolders(prev => [...prev, newFolder]);
        onFolderCreated?.(newFolder);
        
        // Reset form
        setNewFolderName('');
        setNewFolderDescription('');
        setNewFolderTemplate('');
        setCreateDialog(false);
      } else {
        setError(data.error?.message || 'Failed to create folder');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Rename folder
  const handleRenameFolder = async () => {
    if (!renameDialog || !renameValue.trim()) return;

    try {
      const response = await fetch(`/api/folders/${renameDialog.id}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: renameValue.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFolders(prev => prev.map(folder => 
          folder.id === renameDialog.id 
            ? { ...folder, name: renameValue.trim() }
            : folder
        ));
        onFolderRenamed?.(renameDialog.id, renameValue.trim());
        setRenameDialog(null);
        setRenameValue('');
      } else {
        setError(data.error?.message || 'Failed to rename folder');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Delete folder
  const handleDeleteFolder = async () => {
    if (!deleteDialog) return;

    try {
      const response = await fetch(`/api/folders/${deleteDialog.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setFolders(prev => prev.filter(folder => folder.id !== deleteDialog.id));
        onFolderDeleted?.(deleteDialog.id);
        setDeleteDialog(null);
      } else {
        setError(data.error?.message || 'Failed to delete folder');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Handle folder navigation
  const handleFolderClick = (folder: FolderItem) => {
    const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
    onPathChange(newPath);
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    onPathChange(breadcrumb.path);
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, folder: FolderItem) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, folder });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuAction = (action: string, folder: FolderItem) => {
    handleMenuClose();
    
    switch (action) {
      case 'rename':
        setRenameDialog(folder);
        setRenameValue(folder.name);
        break;
      case 'delete':
        setDeleteDialog(folder);
        break;
      case 'properties':
        setPropertiesDialog(folder);
        break;
      case 'copy':
        // Implement copy functionality
        break;
      case 'move':
        // Implement move functionality
        break;
      case 'share':
        // Implement share functionality
        break;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getFolderTemplates = () => [
    { value: '', label: 'Standard Folder' },
    { value: 'document', label: 'Document Library' },
    { value: 'project', label: 'Project Folder' },
    { value: 'archive', label: 'Archive Folder' },
    { value: 'shared', label: 'Shared Folder' },
  ];

  return (
    <Box>
      {/* Header with Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 1 }}
          >
            {breadcrumbs.map((breadcrumb, index) => (
              <Link
                key={breadcrumb.id}
                underline="hover"
                color={index === breadcrumbs.length - 1 ? "text.primary" : "inherit"}
                onClick={() => handleBreadcrumbClick(breadcrumb)}
                sx={{ 
                  cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {index === 0 && <HomeIcon fontSize="small" />}
                {breadcrumb.name}
              </Link>
            ))}
          </Breadcrumbs>
          
          <Typography variant="body2" color="text.secondary">
            {folders.length} folders
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<CreateFolderIcon />}
          onClick={() => setCreateDialog(true)}
          disabled={!currentLibrary}
        >
          New Folder
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Folders List */}
      {!isLoading && (
        <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {folders.length === 0 ? (
            <ListItem>
              <Box sx={{ textAlign: 'center', width: '100%', py: 4 }}>
                <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No folders in this location
                </Typography>
              </Box>
            </ListItem>
          ) : (
            folders.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ListItem
                  button
                  onClick={() => handleFolderClick(folder)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <FolderIcon 
                      color={folder.isHidden ? 'disabled' : 'primary'}
                      sx={{ opacity: folder.isHidden ? 0.5 : 1 }}
                    />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            opacity: folder.isHidden ? 0.5 : 1,
                            fontStyle: folder.isHidden ? 'italic' : 'normal',
                          }}
                        >
                          {folder.name}
                        </Typography>
                        
                        {folder.isHidden && (
                          <Chip label="Hidden" size="small" variant="outlined" />
                        )}
                        
                        {!folder.permissions.canWrite && (
                          <Tooltip title="Read-only">
                            <VisibilityOffIcon fontSize="small" color="disabled" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {folder.itemCount} items • Created {formatDate(folder.createdDateTime)}
                        </Typography>
                        
                        {folder.description && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {folder.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, folder)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < folders.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleMenuAction('rename', menuAnchor!.folder)}>
          <EditIcon sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('copy', menuAnchor!.folder)}>
          <CopyIcon sx={{ mr: 1 }} />
          Copy
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('move', menuAnchor!.folder)}>
          <MoveIcon sx={{ mr: 1 }} />
          Move
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('share', menuAnchor!.folder)}>
          <ShareIcon sx={{ mr: 1 }} />
          Share
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('properties', menuAnchor!.folder)}>
          <InfoIcon sx={{ mr: 1 }} />
          Properties
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleMenuAction('delete', menuAnchor!.folder)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description (Optional)"
            multiline
            rows={2}
            fullWidth
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
            placeholder="Enter folder description"
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Folder Template</InputLabel>
            <Select
              value={newFolderTemplate}
              label="Folder Template"
              onChange={(e) => setNewFolderTemplate(e.target.value)}
            >
              {getFolderTemplates().map(template => (
                <MenuItem key={template.value} value={template.value}>
                  {template.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim()}
          >
            Create Folder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog !== null}
        onClose={() => setRenameDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new folder name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>Cancel</Button>
          <Button
            onClick={handleRenameFolder}
            variant="contained"
            disabled={!renameValue.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete "{deleteDialog?.name}"?
            This action cannot be undone and will delete all files and subfolders within it.
          </Alert>
          
          {deleteDialog && deleteDialog.itemCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              This folder contains {deleteDialog.itemCount} items.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteFolder}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Properties Dialog */}
      <Dialog
        open={propertiesDialog !== null}
        onClose={() => setPropertiesDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Folder Properties</DialogTitle>
        <DialogContent>
          {propertiesDialog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FolderIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">{propertiesDialog.name}</Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    General Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Name:</strong> {propertiesDialog.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Path:</strong> {propertiesDialog.path}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Items:</strong> {propertiesDialog.itemCount}
                  </Typography>
                  {propertiesDialog.description && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Description:</strong> {propertiesDialog.description}
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Dates & Users
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Created:</strong> {formatDate(propertiesDialog.createdDateTime)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Created By:</strong> {propertiesDialog.createdBy.displayName}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Modified:</strong> {formatDate(propertiesDialog.lastModifiedDateTime)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Permissions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {propertiesDialog.permissions.canRead && (
                    <Chip label="Read" size="small" color="success" />
                  )}
                  {propertiesDialog.permissions.canWrite && (
                    <Chip label="Write" size="small" color="primary" />
                  )}
                  {propertiesDialog.permissions.canDelete && (
                    <Chip label="Delete" size="small" color="error" />
                  )}
                  {propertiesDialog.permissions.canShare && (
                    <Chip label="Share" size="small" color="info" />
                  )}
                  {propertiesDialog.permissions.canManagePermissions && (
                    <Chip label="Manage Permissions" size="small" color="warning" />
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPropertiesDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};