import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
  Code as CodeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { formatFileSize } from '../utils/formatters';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  maxFiles?: number;
  title?: string;
  description?: string;
}

interface UploadFile extends File {
  id: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  acceptedTypes = ['*'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  title = 'Upload Files',
  description = 'Select files to analyze with AI',
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    const extension = (file?.name || '').split('.').pop()?.toLowerCase();

    if (type.startsWith('image/')) return <ImageIcon color="primary" />;
    if (type === 'application/pdf') return <PdfIcon color="error" />;
    if (type.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension || '')) return <ExcelIcon color="success" />;
    if (type.includes('presentation') || ['ppt', 'pptx'].includes(extension || '')) return <PowerPointIcon color="warning" />;
    if (type.startsWith('text/') || ['js', 'ts', 'json', 'xml', 'html', 'css'].includes(extension || '')) return <CodeIcon color="info" />;
    return <DocumentIcon color="action" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit`;
    }

    if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('/*')) {
          return file.type.startsWith(type.split('/*')[0]);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    fileArray.forEach((file, index) => {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        errors.push(`${file.name} is already added`);
        return;
      }

      const uploadFile: UploadFile = {
        ...file,
        id: `${Date.now()}-${index}`,
        status: 'pending',
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          ));
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(uploadFile);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }

    if (errors.length > 0) {
      console.warn('File upload errors:', errors);
      // Could show a toast or error message here
    }
  }, [files, maxFiles, maxSize, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = () => {
    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length > 0) {
      onUpload(filesToUpload);
    }
    handleClose();
  };

  const handleClose = () => {
    setFiles([]);
    setDragOver(false);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'uploading': return <LinearProgress />;
      default: return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <UploadIcon color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {description}
        </Typography>

        {/* Upload Area */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: dragOver ? 2 : 1,
            borderColor: dragOver ? 'primary.main' : 'divider',
            bgcolor: dragOver ? 'primary.50' : 'transparent',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {acceptedTypes.includes('*') 
              ? 'All file types accepted'
              : `Accepted: ${acceptedTypes.join(', ')}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max size: {formatFileSize(maxSize)} • Max files: {maxFiles}
          </Typography>
        </Paper>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* File List */}
        {files.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Files ({files.length}/{maxFiles})
            </Typography>
            
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {files.map((file) => (
                <React.Fragment key={file.id}>
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {file.preview ? (
                        <Box
                          component="img"
                          src={file.preview}
                          sx={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={file.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                          {file.error && (
                            <Typography variant="caption" color="error" display="block">
                              {file.error}
                            </Typography>
                          )}
                          {file.progress !== undefined && file.status === 'uploading' && (
                            <LinearProgress
                              variant="determinate"
                              value={file.progress}
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={file.status}
                          size="small"
                          color={getStatusColor(file.status) as any}
                          variant="outlined"
                        />
                        {getStatusIcon(file.status)}
                        <IconButton
                          size="small"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === 'uploading'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            {/* File Type Summary */}
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                File types: {[...new Set(files.map(f => f.type))].slice(0, 3).join(', ')}
                {files.map(f => f.type).filter((type, index, arr) => arr.indexOf(type) === index).length > 3 && '...'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Upload Guidelines */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            AI Analysis Guidelines:
          </Typography>
          <Typography variant="body2" component="div">
            • Text documents work best for content analysis
            <br />• Images will be processed for text extraction (OCR)
            <br />• Large files may take longer to process
            <br />• Your files are processed securely and not stored permanently
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={files.length === 0 || files.every(f => f.status !== 'pending')}
          startIcon={<UploadIcon />}
        >
          Upload {files.filter(f => f.status === 'pending').length} Files
        </Button>
      </DialogActions>
    </Dialog>
  );
};