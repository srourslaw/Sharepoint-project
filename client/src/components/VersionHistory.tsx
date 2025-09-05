import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { SharePointFile, FileVersion, User } from '../types';

interface VersionHistoryProps {
  file: SharePointFile;
  onRestoreVersion?: (version: FileVersion) => Promise<void>;
  onViewVersion?: (version: FileVersion) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  file,
  onRestoreVersion,
  onViewVersion,
}) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreDialog, setRestoreDialog] = useState<FileVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [compareDialog, setCompareDialog] = useState<{
    version1: FileVersion;
    version2: FileVersion;
  } | null>(null);

  // Load version history
  useEffect(() => {
    loadVersionHistory();
  }, [file.id]);

  const loadVersionHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock API call - replace with actual SharePoint API
      const response = await fetch(`/api/files/${file.id}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.data);
      } else {
        setError(data.error?.message || 'Failed to load version history');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: FileVersion) => {
    if (!onRestoreVersion) return;

    try {
      setIsRestoring(true);
      await onRestoreVersion(version);
      setRestoreDialog(null);
      // Reload version history to show the new version
      await loadVersionHistory();
    } catch (error: any) {
      setError(`Failed to restore version: ${error.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownload = (version: FileVersion) => {
    if (version.downloadUrl) {
      const link = document.createElement('a');
      link.href = version.downloadUrl;
      link.download = `${file.name}_v${version.versionNumber}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getVersionLabel = (version: FileVersion): string => {
    if (version.isCurrentVersion) return 'Current';
    const versionDate = new Date(version.created);
    const now = new Date();
    const diffHours = (now.getTime() - versionDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'Recent';
    if (diffHours < 168) return 'This week';
    if (diffHours < 720) return 'This month';
    return 'Older';
  };

  const getVersionColor = (version: FileVersion): 'default' | 'primary' | 'secondary' | 'success' => {
    if (version.isCurrentVersion) return 'primary';
    const label = getVersionLabel(version);
    if (label === 'Recent') return 'success';
    if (label === 'This week') return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button size="small" onClick={loadVersionHistory}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">Version History</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {versions.length} version{versions.length !== 1 ? 's' : ''} available
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {versions.map((version, index) => (
          <React.Fragment key={version.id}>
            <ListItem
              sx={{
                py: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2">
                      Version {version.versionNumber}
                    </Typography>
                    <Chip
                      label={getVersionLabel(version)}
                      size="small"
                      color={getVersionColor(version)}
                      variant={version.isCurrentVersion ? 'filled' : 'outlined'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {version.createdBy.displayName}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.created)} • {formatFileSize(version.size)}
                  </Typography>
                  
                  {version.comment && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      "{version.comment}"
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="View this version">
                    <IconButton
                      size="small"
                      onClick={() => onViewVersion?.(version)}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Download this version">
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(version)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  {!version.isCurrentVersion && (
                    <Tooltip title="Restore this version">
                      <IconButton
                        size="small"
                        onClick={() => setRestoreDialog(version)}
                      >
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </ListItem>
            {index < versions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {versions.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No version history available
          </Typography>
        </Box>
      )}

      {/* Restore Version Confirmation Dialog */}
      <Dialog
        open={restoreDialog !== null}
        onClose={() => setRestoreDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Restore Version {restoreDialog?.versionNumber}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will create a new version with the content from version {restoreDialog?.versionNumber}.
            Your current changes will be preserved as a separate version.
          </Typography>
          
          {restoreDialog && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Version Details:
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {formatDate(restoreDialog.created)}
              </Typography>
              <Typography variant="body2">
                <strong>Author:</strong> {restoreDialog.createdBy.displayName}
              </Typography>
              <Typography variant="body2">
                <strong>Size:</strong> {formatFileSize(restoreDialog.size)}
              </Typography>
              {restoreDialog.comment && (
                <Typography variant="body2">
                  <strong>Comment:</strong> {restoreDialog.comment}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRestoreDialog(null)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            onClick={() => restoreDialog && handleRestore(restoreDialog)}
            variant="contained"
            disabled={isRestoring}
            startIcon={isRestoring ? <CircularProgress size={16} /> : <RestoreIcon />}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};