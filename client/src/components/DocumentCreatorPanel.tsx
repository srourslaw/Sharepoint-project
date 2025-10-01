import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  AutoAwesome as AIIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatSize as FontSizeIcon,
  Palette as ColorIcon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface DocumentCreatorPanelProps {
  selectedFiles?: string[];
  currentPath?: string;
  siteId?: string;
  driveId?: string;
  parentId?: string;
  onDocumentCreated?: (file: any) => void;
  onClose?: () => void;
  onRefreshFolder?: () => void;
  height?: number | string;
}

export const DocumentCreatorPanel: React.FC<DocumentCreatorPanelProps> = ({
  selectedFiles = [],
  currentPath = '',
  siteId,
  driveId,
  parentId,
  onDocumentCreated,
  onClose,
  onRefreshFolder,
  height = '100%',
}) => {
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [saveToSharePoint, setSaveToSharePoint] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastCreatedFile, setLastCreatedFile] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'uploading';
    message: string;
    details?: any;
  }>({ show: false, type: 'success', message: '' });
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>('none');
  const [textColor, setTextColor] = useState<string>('#000000');

  const handleCopyFromAI = () => {
    // This will be enhanced to get the latest AI response
    const aiContent = `# AI Generated Content

This document was created using the SharePoint AI Dashboard.

## Context:
- Created on: ${new Date().toLocaleDateString()}
- Based on selected files: ${selectedFiles.length > 0 ? selectedFiles.join(', ') : 'None'}
- Current location: ${currentPath}

## Instructions:
1. Ask the AI questions about your selected documents
2. Copy the AI responses using the copy button in the chat
3. Paste the content here using Ctrl+V or the "Paste from Clipboard" button
4. Edit and organize the content as needed
5. Save to SharePoint or download when ready

## Content:
Replace this placeholder content with your actual document content from AI responses.`;

    setContent(aiContent);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(prev => prev + (prev ? '\n\n' : '') + text);
        setError(null);
      }
    } catch (err) {
      setError('Failed to read from clipboard. Please paste manually using Ctrl+V.');
    }
  };

  const handleClearContent = () => {
    setContent('');
    setError(null);
    setSuccess(null);
  };

  const handleCreateDocument = async () => {
    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content for the document');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    // Show uploading status
    setUploadStatus({
      show: true,
      type: 'uploading',
      message: 'Creating and uploading document...'
    });

    try {
      const requestBody = {
        fileName: fileName.endsWith('.docx') ? fileName : `${fileName}.docx`,
        content,
        siteId,
        // Include SharePoint save information if available and enabled
        ...(saveToSharePoint && driveId && {
          driveId,
          parentId: parentId || 'root'
        }),
      };

      console.log('🚀 Creating document with context:', {
        saveToSharePoint,
        siteId,
        driveId,
        parentId,
        currentPath,
        requestBody
      });
      console.log('🎯 DOCUMENT CREATOR: Received props:', { siteId, driveId, parentId, currentPath });
      console.log('🎯 DOCUMENT CREATOR: Final request body being sent to backend:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('/api/sharepoint-advanced/create-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Hide uploading status
        setUploadStatus({ show: false, type: 'success', message: '' });

        if (result.data.downloadMode) {
          // File couldn't be uploaded to SharePoint, offering download
          setUploadStatus({
            show: true,
            type: 'error',
            message: 'Failed to save to SharePoint - file downloaded instead',
            details: result.data.error
          });

          // Convert base64 to blob and download
          const byteCharacters = atob(result.data.buffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.data.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

        } else {
          // Successfully uploaded to SharePoint
          setUploadStatus({
            show: true,
            type: 'success',
            message: `✅ Document successfully saved to SharePoint! (Status: ${result.data.status})`,
            details: {
              method: result.data.uploadMethod,
              fileName: result.data.fileName,
              size: result.data.size
            }
          });

          setSuccess(result.data.message || 'Document created successfully!');
          setLastCreatedFile(result.data.file);

          if (onDocumentCreated) {
            onDocumentCreated(result.data.file);
          }

          // Automatically refresh the folder to show the new document
          if (onRefreshFolder) {
            setTimeout(() => {
              onRefreshFolder();
            }, 500); // Small delay to ensure SharePoint has processed the file
          }

          // Clear the form for next document
          setFileName('');
          // Keep content for potential reuse
        }

        // Auto-hide success status after 5 seconds
        setTimeout(() => {
          setUploadStatus({ show: false, type: 'success', message: '' });
        }, 5000);

      } else {
        setUploadStatus({
          show: true,
          type: 'error',
          message: 'Failed to create document',
          details: result.error?.message
        });
        setError(result.error?.message || 'Failed to create document');
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      setUploadStatus({
        show: true,
        type: 'error',
        message: 'Network error - failed to create document',
        details: error.message
      });
      setError('Failed to create document. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Paper
      sx={{
        height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            Create New Document
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={3}>
          {/* File Name Input */}
          <TextField
            label="Document Name"
            placeholder="Enter document name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            fullWidth
            size="small"
            helperText="Extension .docx will be added automatically"
          />

          {/* Quick Actions */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<AIIcon />}
                label="Template"
                clickable
                onClick={handleCopyFromAI}
                variant="outlined"
                color="primary"
                size="small"
              />
              <Chip
                icon={<CopyIcon />}
                label="Paste"
                clickable
                onClick={handlePasteFromClipboard}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<ClearIcon />}
                label="Clear"
                clickable
                onClick={handleClearContent}
                variant="outlined"
                color="secondary"
                size="small"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Formatting Toolbar */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Formatting Tools
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              {/* Font Size */}
              <TextField
                select
                size="small"
                label="Size"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                sx={{ minWidth: 80 }}
              >
                {[10, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}px
                  </MenuItem>
                ))}
              </TextField>

              {/* Bold */}
              <Tooltip title="Bold">
                <IconButton
                  size="small"
                  onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                  color={fontWeight === 'bold' ? 'primary' : 'default'}
                >
                  <BoldIcon />
                </IconButton>
              </Tooltip>

              {/* Italic */}
              <Tooltip title="Italic">
                <IconButton
                  size="small"
                  onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                  color={fontStyle === 'italic' ? 'primary' : 'default'}
                >
                  <ItalicIcon />
                </IconButton>
              </Tooltip>

              {/* Underline */}
              <Tooltip title="Underline">
                <IconButton
                  size="small"
                  onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
                  color={textDecoration === 'underline' ? 'primary' : 'default'}
                >
                  <UnderlineIcon />
                </IconButton>
              </Tooltip>

              {/* Color Picker */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ColorIcon fontSize="small" />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              </Box>

              {/* Reset Formatting */}
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setFontSize(14);
                  setFontWeight('normal');
                  setFontStyle('normal');
                  setTextDecoration('none');
                  setTextColor('#000000');
                }}
              >
                Reset Format
              </Button>
            </Box>
          </Box>

          {/* Content Input */}
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              label="Document Content"
              placeholder="1. Select a document from the file list to read it
2. Ask AI questions about the document
3. Copy AI responses and paste them here
4. Edit and organize your content
5. Save to SharePoint or download"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={Math.max(8, Math.floor((typeof height === 'number' ? height : 400) / 40))}
              fullWidth
              helperText={`${content.length} characters`}
              sx={{
                '& .MuiInputBase-root': {
                  alignItems: 'flex-start',
                  fontSize: `${fontSize}px`,
                  fontWeight: fontWeight,
                  fontStyle: fontStyle,
                  textDecoration: textDecoration,
                  color: textColor,
                },
                '& .MuiInputBase-input': {
                  fontSize: `${fontSize}px`,
                  fontWeight: fontWeight,
                  fontStyle: fontStyle,
                  textDecoration: textDecoration,
                  color: textColor,
                }
              }}
            />
          </Box>

          {/* Save Options */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={saveToSharePoint}
                  onChange={(e) => setSaveToSharePoint(e.target.checked)}
                  size="small"
                />
              }
              label="Save to SharePoint (when available)"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              If disabled or unavailable, document will be downloaded to your device
            </Typography>
          </Box>

          {/* Upload Status Notification */}
          {uploadStatus.show && (
            <Alert
              severity={uploadStatus.type === 'uploading' ? 'info' : uploadStatus.type}
              onClose={() => setUploadStatus({ show: false, type: 'success', message: '' })}
              sx={{
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {uploadStatus.type === 'uploading' && <CircularProgress size={16} />}
                {uploadStatus.type === 'success' && <SuccessIcon />}
                {uploadStatus.type === 'error' && <ErrorIcon />}
                <Box>
                  <Typography variant="body2" component="div">
                    {uploadStatus.message}
                  </Typography>
                  {uploadStatus.details && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      {typeof uploadStatus.details === 'string'
                        ? uploadStatus.details
                        : `Method: ${uploadStatus.details.method || 'Unknown'}, Size: ${uploadStatus.details.size || 0} bytes`
                      }
                    </Typography>
                  )}
                </Box>
              </Box>
            </Alert>
          )}

          {/* Success/Error Messages */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {lastCreatedFile && (
            <Alert severity="info">
              Last created: {lastCreatedFile.name || fileName}
            </Alert>
          )}
        </Stack>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack spacing={1}>
          <Button
            onClick={handleCreateDocument}
            variant="contained"
            startIcon={isCreating ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isCreating || !fileName.trim() || !content.trim()}
            fullWidth
          >
            {isCreating ? 'Creating Document...' : 'Create & Save Document'}
          </Button>

          {/* Refresh Button - shown after successful document creation */}
          {(success || uploadStatus.show && uploadStatus.type === 'success') && onRefreshFolder && (
            <Button
              onClick={() => {
                if (onRefreshFolder) {
                  onRefreshFolder();
                  setSuccess('Document saved! Folder refreshed.');
                  // Auto-hide after 3 seconds
                  setTimeout(() => setSuccess(null), 3000);
                }
              }}
              variant="outlined"
              startIcon={<RefreshIcon />}
              fullWidth
              size="small"
            >
              Refresh Current Folder
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};