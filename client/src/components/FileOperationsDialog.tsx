import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  DriveFileMove as MoveIcon,
  Warning as WarningIcon,
  Folder as FolderIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

import { SharePointFile } from '../types';
import { formatFileSize, getFileIcon } from '../utils/formatters';

interface FileOperationsDialogProps {
  open: boolean;
  type: 'delete' | 'rename' | 'move' | 'copy' | null;
  files: SharePointFile[];
  onClose: () => void;
  onConfirm: (operation: string, data: {
    files: SharePointFile[];
    newName?: string;
    targetPath?: string;
  }) => Promise<void>;
  availablePaths?: Array<{ path: string; name: string }>;
}

export const FileOperationsDialog: React.FC<FileOperationsDialogProps> = ({
  open,
  type,
  files,
  onClose,
  onConfirm,
  availablePaths = [],
}) => {
  const [newName, setNewName] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMultiple = files.length > 1;
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  useEffect(() => {
    if (open && type === 'rename' && files.length === 1) {
      const file = files[0];
      const nameWithoutExtension = file.isFolder 
        ? file.name 
        : file.name.replace(/\.[^/.]+$/, '');
      setNewName(nameWithoutExtension);
    } else {
      setNewName('');
    }
    setTargetPath('');
    setError(null);
  }, [open, type, files]);

  const handleConfirm = async () => {
    if (!type) return;

    setLoading(true);
    setError(null);

    try {
      const data: any = { files };
      
      if (type === 'rename') {
        if (!newName.trim()) {
          setError('Please enter a new name');
          setLoading(false);
          return;
        }
        
        const file = files[0];
        const extension = file.isFolder ? '' : file.name.match(/\.[^/.]+$/)?.[0] || '';
        data.newName = newName.trim() + extension;
      }
      
      if (type === 'copy' || type === 'move') {
        if (!targetPath) {
          setError('Please select a destination');
          setLoading(false);
          return;
        }
        data.targetPath = targetPath;
      }

      await onConfirm(type, data);
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${type} files`);
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'delete':
        return isMultiple ? `Delete ${files.length} items?` : `Delete "${files[0]?.name}"?`;
      case 'rename':
        return `Rename "${files[0]?.name}"`;
      case 'copy':
        return isMultiple ? `Copy ${files.length} items` : `Copy "${files[0]?.name}"`;
      case 'move':
        return isMultiple ? `Move ${files.length} items` : `Move "${files[0]?.name}"`;
      default:
        return 'File Operation';
    }
  };

  const getDialogIcon = () => {
    switch (type) {
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'rename':
        return <EditIcon color="primary" />;
      case 'copy':
        return <CopyIcon color="primary" />;
      case 'move':
        return <MoveIcon color="primary" />;
      default:
        return <FileIcon />;
    }
  };

  const renderFileList = () => (
    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1 }}>
      {files.map((file) => (
        <ListItem key={file.id}>
          <ListItemIcon>
            {React.createElement(getFileIcon(file.extension), { fontSize: 'small' })}
          </ListItemIcon>
          <ListItemText
            primary={file.name}
            secondary={
              <Box component="span">
                {file.isFolder ? 'Folder' : formatFileSize(file.size)}
                {file.lastModifiedBy && ` • Modified by ${String(file.lastModifiedBy.displayName || 'Unknown')}`}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderDeleteContent = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon />
          <Typography variant="body2">
            {isMultiple 
              ? `This will permanently delete ${files.length} items.`
              : 'This item will be permanently deleted.'
            }
          </Typography>
        </Box>
      </Alert>
      
      {renderFileList()}
      
      {totalSize > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Total size: {formatFileSize(totalSize)}
        </Typography>
      )}
    </Box>
  );

  const renderRenameContent = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Enter a new name for the file:
      </Typography>
      
      <TextField
        fullWidth
        label="New name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        error={!!error && error.includes('name')}
        helperText={error?.includes('name') ? error : `Extension will be preserved automatically`}
        autoFocus
        sx={{ mb: 2 }}
      />
      
      {renderFileList()}
    </Box>
  );

  const renderCopyMoveContent = () => (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Choose a destination for {isMultiple ? 'these items' : 'this item'}:
      </Typography>
      
      {availablePaths.length > 0 ? (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Destination</InputLabel>
          <Select
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            label="Destination"
          >
            {availablePaths.map((path) => (
              <MenuItem key={path.path} value={path.path}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FolderIcon fontSize="small" />
                  {path.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          label="Destination path"
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          placeholder="/path/to/destination"
          error={!!error && error.includes('destination')}
          helperText={error?.includes('destination') ? error : 'Enter the full path to the destination folder'}
          sx={{ mb: 2 }}
        />
      )}
      
      {renderFileList()}
      
      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          <strong>Note:</strong> {type === 'copy' ? 'Files will be copied to' : 'Files will be moved to'} the selected destination. 
          {type === 'move' && ' Original files will be removed from current location.'}
        </Typography>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (type) {
      case 'delete':
        return renderDeleteContent();
      case 'rename':
        return renderRenameContent();
      case 'copy':
      case 'move':
        return renderCopyMoveContent();
      default:
        return null;
    }
  };

  const getConfirmButtonText = () => {
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'rename':
        return 'Rename';
      case 'copy':
        return 'Copy';
      case 'move':
        return 'Move';
      default:
        return 'Confirm';
    }
  };

  const getConfirmButtonColor = () => {
    return type === 'delete' ? 'error' : 'primary';
  };

  if (!type) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 300 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getDialogIcon()}
          <Typography variant="h6" component="span">
            {getDialogTitle()}
          </Typography>
          <Box flexGrow={1} />
          <IconButton size="small" onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderContent()}
        
        {isMultiple && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={`${files.length} items`}
              variant="outlined"
            />
            {totalSize > 0 && (
              <Chip
                size="small"
                label={formatFileSize(totalSize)}
                variant="outlined"
              />
            )}
            <Chip
              size="small"
              label={`${files.filter(f => f.isFolder).length} folders, ${files.filter(f => !f.isFolder).length} files`}
              variant="outlined"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || (type === 'rename' && !newName.trim()) || ((type === 'copy' || type === 'move') && !targetPath)}
          variant="contained"
          color={getConfirmButtonColor() as any}
          startIcon={loading ? <CircularProgress size={16} /> : getDialogIcon()}
        >
          {loading ? 'Processing...' : getConfirmButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};