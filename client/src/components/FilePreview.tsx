import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateIcon,
  Print as PrintIcon,
  MoreVert as MoreIcon,
  Visibility as PreviewIcon,
  Info as InfoIcon,
  History as VersionsIcon,
} from '@mui/icons-material';

import { SharePointFile } from '../types';
import { useFilePreview } from '../hooks/useFilePreview';
import { formatFileSize, formatDate, getFileTypeLabel } from '../utils/formatters';

interface FilePreviewProps {
  selectedFiles: string[];
  height: number;
  onClose: () => void;
}

type PreviewTab = 'preview' | 'details' | 'versions';

export const FilePreview: React.FC<FilePreviewProps> = ({
  selectedFiles,
  height,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentFileId = selectedFiles[currentFileIndex];
  const { file, content, loading, error, downloadFile } = useFilePreview(currentFileId);

  useEffect(() => {
    setCurrentFileIndex(0);
    setZoom(100);
    setRotation(0);
  }, [selectedFiles]);

  const handleFileNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    } else if (direction === 'next' && currentFileIndex < selectedFiles.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev + 25 : prev - 25;
      return Math.max(25, Math.min(200, newZoom));
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!file) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Typography variant="body2" color="text.secondary">
            No file selected
          </Typography>
        </Box>
      );
    }

    const isImage = file.mimeType.startsWith('image/');
    const isPdf = file.mimeType === 'application/pdf';
    const isVideo = file.mimeType.startsWith('video/');
    const isAudio = file.mimeType.startsWith('audio/');
    const isText = file.mimeType.startsWith('text/') || 
                  ['application/json', 'application/javascript'].includes(file.mimeType);

    if (isImage && (content || file.thumbnail)) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}
        >
          <img
            src={content || file.thumbnail || ''}
            alt={file.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s',
              objectFit: 'contain',
            }}
          />
        </Box>
      );
    }

    if (isPdf && content) {
      return (
        <Box sx={{ height: '100%' }}>
          <iframe
            src={content}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={`Preview of ${file.name}`}
          />
        </Box>
      );
    }

    if (isVideo && content) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
          }}
        >
          <video
            src={content}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        </Box>
      );
    }

    if (isAudio && content) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <audio src={content} controls />
        </Box>
      );
    }

    if (isText && content) {
      return (
        <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
          <pre
            style={{
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {content}
          </pre>
        </Box>
      );
    }

    // Handle Office documents and other content types
    if (content && (file.extension === 'docx' || file.extension === 'xlsx' || file.extension === 'pptx')) {
      return (
        <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {content}
          </Typography>
        </Box>
      );
    }

    // Default preview for unsupported file types
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <PreviewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Preview not available
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          This file type cannot be previewed in the browser.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => downloadFile()}
          sx={{ mt: 2 }}
        >
          Download to View
        </Button>
      </Box>
    );
  };

  const renderFileDetails = () => {
    if (!file) return null;

    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          File Details
        </Typography>
        
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {file.displayName}
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'auto 1fr' }}>
              <Typography variant="body2" color="text.secondary">Type:</Typography>
              <Typography variant="body2">{getFileTypeLabel(file.extension, file.mimeType)}</Typography>
              
              <Typography variant="body2" color="text.secondary">Size:</Typography>
              <Typography variant="body2">{formatFileSize(file.size)}</Typography>
              
              <Typography variant="body2" color="text.secondary">Created:</Typography>
              <Typography variant="body2">{formatDate(file.createdDateTime)}</Typography>
              
              <Typography variant="body2" color="text.secondary">Modified:</Typography>
              <Typography variant="body2">{formatDate(file.lastModifiedDateTime)}</Typography>
              
              {file.createdBy && (
                <>
                  <Typography variant="body2" color="text.secondary">Created by:</Typography>
                  <Typography variant="body2">{file.createdBy.displayName}</Typography>
                </>
              )}
              
              {file.lastModifiedBy && (
                <>
                  <Typography variant="body2" color="text.secondary">Modified by:</Typography>
                  <Typography variant="body2">{file.lastModifiedBy.displayName}</Typography>
                </>
              )}
              
              <Typography variant="body2" color="text.secondary">Path:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {file.parentPath}
              </Typography>
              
              {file.webUrl && (
                <>
                  <Typography variant="body2" color="text.secondary">SharePoint URL:</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    <a href={file.webUrl} target="_blank" rel="noopener noreferrer">
                      Open in SharePoint
                    </a>
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderVersionHistory = () => (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Version History
      </Typography>
      <Alert severity="info">
        Version history feature coming soon.
      </Alert>
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preview':
        return renderPreviewContent();
      case 'details':
        return renderFileDetails();
      case 'versions':
        return renderVersionHistory();
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ height }} elevation={2}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" noWrap sx={{ maxWidth: 200 }}>
            {file?.displayName || 'Loading...'}
          </Typography>
          
          {selectedFiles.length > 1 && (
            <Chip
              label={`${currentFileIndex + 1} / ${selectedFiles.length}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          {/* Navigation buttons for multiple files */}
          {selectedFiles.length > 1 && (
            <>
              <IconButton
                size="small"
                onClick={() => handleFileNavigation('prev')}
                disabled={currentFileIndex === 0}
              >
                ←
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleFileNavigation('next')}
                disabled={currentFileIndex === selectedFiles.length - 1}
              >
                →
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {/* Preview controls */}
          {file?.mimeType.startsWith('image/') && (
            <>
              <IconButton size="small" onClick={() => handleZoom('out')} disabled={zoom <= 25}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
                {zoom}%
              </Typography>
              <IconButton size="small" onClick={() => handleZoom('in')} disabled={zoom >= 200}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleRotate}>
                <RotateIcon fontSize="small" />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {/* Action buttons */}
          <IconButton size="small" onClick={() => downloadFile()}>
            <DownloadIcon fontSize="small" />
          </IconButton>
          
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreIcon fontSize="small" />
          </IconButton>
          
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="Preview"
            value="preview"
            icon={<PreviewIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.875rem' }}
          />
          <Tab
            label="Details"
            value="details"
            icon={<InfoIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.875rem' }}
          />
          <Tab
            label="Versions"
            value="versions"
            icon={<VersionsIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.875rem' }}
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ height: 'calc(100% - 80px)', overflow: 'hidden' }}>
        {renderTabContent()}
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print" />
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><FullscreenIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Open in new tab" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};