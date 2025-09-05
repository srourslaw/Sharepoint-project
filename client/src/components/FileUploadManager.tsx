import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  url?: string;
  sharePointId?: string;
}

interface FileUploadManagerProps {
  targetPath: string;
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadProgress?: (files: UploadFile[]) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  enableVersioning?: boolean;
  enableOverwrite?: boolean;
}

interface UploadSettings {
  createFolder: boolean;
  folderName: string;
  enableVersioning: boolean;
  overwriteExisting: boolean;
  notifyUsers: boolean;
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  targetPath,
  onUploadComplete,
  onUploadProgress,
  maxFileSize = 100, // 100MB default
  allowedTypes = [],
  enableVersioning = true,
  enableOverwrite = false,
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UploadSettings>({
    createFolder: false,
    folderName: '',
    enableVersioning: enableVersioning,
    overwriteExisting: enableOverwrite,
    notifyUsers: false,
  });
  
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Size check
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Type check
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      const isValidType = allowedTypes.some(type => 
        type.toLowerCase() === fileExtension ||
        type.toLowerCase() === mimeType ||
        mimeType.includes(type.toLowerCase())
      );

      if (!isValidType) {
        return `File type not allowed. Supported types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newUploadFiles: UploadFile[] = [];

    // Process accepted files
    acceptedFiles.forEach(file => {
      const validationError = validateFile(file);
      newUploadFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined,
      });
    });

    // Process rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      newUploadFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: 'error',
        error: errors.map((e: any) => e.message).join(', '),
      });
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [validateFile]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: isUploading,
  });

  // Upload individual file
  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const controller = new AbortController();
    abortControllers.current.set(uploadFile.id, controller);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('path', targetPath);
      formData.append('settings', JSON.stringify(settings));

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'completed' as const,
              progress: 100,
              url: result.data?.url,
              sharePointId: result.data?.id,
            }
          : f
      ));

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'error' as const,
                error: error.message,
              }
            : f
        ));
      }
    } finally {
      abortControllers.current.delete(uploadFile.id);
    }
  };

  // Upload all files
  const handleUploadAll = async () => {
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    // Mark files as uploading
    setUploadFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ));

    // Upload files in parallel (limited concurrency)
    const concurrency = 3;
    const chunks = [];
    for (let i = 0; i < filesToUpload.length; i += concurrency) {
      chunks.push(filesToUpload.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(uploadFile));
    }

    setIsUploading(false);
    
    const completedFiles = uploadFiles.filter(f => f.status === 'completed');
    onUploadComplete?.(completedFiles);
  };

  // Cancel upload
  const cancelUpload = (fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
    }

    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'cancelled' as const } : f
    ));
  };

  // Remove file from list
  const removeFile = (fileId: string) => {
    cancelUpload(fileId);
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Clear all files
  const clearAll = () => {
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    setUploadFiles([]);
  };

  // Retry failed upload
  const retryUpload = (fileId: string) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending' as const, error: undefined, progress: 0 }
        : f
    ));
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      uploading: 0,
      completed: 0,
      error: 0,
      cancelled: 0,
    };

    uploadFiles.forEach(file => {
      counts[file.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();
  const hasFiles = uploadFiles.length > 0;
  const canUpload = statusCounts.pending > 0 && !isUploading;

  return (
    <Box>
      {/* Upload Drop Zone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to browse files
        </Typography>
        
        {allowedTypes.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Supported types: {allowedTypes.join(', ')}
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary" display="block">
          Max file size: {maxFileSize}MB
        </Typography>
      </Box>

      {/* File List */}
      {hasFiles && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Upload Queue ({uploadFiles.length} files)
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => setShowSettings(true)}
                disabled={isUploading}
              >
                Settings
              </Button>
              <Button
                size="small"
                onClick={clearAll}
                disabled={isUploading}
                startIcon={<DeleteIcon />}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          {/* Status Summary */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {statusCounts.pending > 0 && (
              <Chip label={`${statusCounts.pending} Pending`} color="default" size="small" />
            )}
            {statusCounts.uploading > 0 && (
              <Chip label={`${statusCounts.uploading} Uploading`} color="info" size="small" />
            )}
            {statusCounts.completed > 0 && (
              <Chip label={`${statusCounts.completed} Completed`} color="success" size="small" />
            )}
            {statusCounts.error > 0 && (
              <Chip label={`${statusCounts.error} Failed`} color="error" size="small" />
            )}
            {statusCounts.cancelled > 0 && (
              <Chip label={`${statusCounts.cancelled} Cancelled`} color="warning" size="small" />
            )}
          </Box>

          {/* Upload Button */}
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadAll}
              sx={{ mb: 2 }}
            >
              Upload {statusCounts.pending} Files
            </Button>
          )}

          {/* File List */}
          <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {uploadFiles.map((uploadFile, index) => (
              <React.Fragment key={uploadFile.id}>
                <ListItem>
                  <ListItemIcon>
                    {uploadFile.status === 'completed' && <CheckIcon color="success" />}
                    {uploadFile.status === 'error' && <ErrorIcon color="error" />}
                    {(uploadFile.status === 'pending' || uploadFile.status === 'uploading') && <FileIcon />}
                    {uploadFile.status === 'cancelled' && <CancelIcon color="disabled" />}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {uploadFile.file.name}
                        </Typography>
                        <Chip
                          label={uploadFile.status}
                          size="small"
                          color={
                            uploadFile.status === 'completed' ? 'success' :
                            uploadFile.status === 'error' ? 'error' :
                            uploadFile.status === 'uploading' ? 'info' :
                            'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        
                        {uploadFile.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadFile.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        
                        {uploadFile.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {uploadFile.error}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {uploadFile.status === 'error' && (
                        <IconButton
                          size="small"
                          onClick={() => retryUpload(uploadFile.id)}
                          title="Retry upload"
                        >
                          <RefreshIcon />
                        </IconButton>
                      )}
                      
                      {uploadFile.status === 'uploading' && (
                        <IconButton
                          size="small"
                          onClick={() => cancelUpload(uploadFile.id)}
                          title="Cancel upload"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                      
                      {uploadFile.status !== 'uploading' && (
                        <IconButton
                          size="small"
                          onClick={() => removeFile(uploadFile.id)}
                          title="Remove file"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < uploadFiles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Upload Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.createFolder}
                  onChange={(e) => setSettings(prev => ({ ...prev, createFolder: e.target.checked }))}
                />
              }
              label="Create new folder"
            />
            
            {settings.createFolder && (
              <TextField
                label="Folder name"
                value={settings.folderName}
                onChange={(e) => setSettings(prev => ({ ...prev, folderName: e.target.value }))}
                placeholder="Enter folder name"
                fullWidth
              />
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.enableVersioning}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableVersioning: e.target.checked }))}
                />
              }
              label="Enable version control"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.overwriteExisting}
                  onChange={(e) => setSettings(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                />
              }
              label="Overwrite existing files"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.notifyUsers}
                  onChange={(e) => setSettings(prev => ({ ...prev, notifyUsers: e.target.checked }))}
                />
              }
              label="Notify team members"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setShowSettings(false)}>
            Apply Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};