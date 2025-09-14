import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Snackbar,
} from '@mui/material';
import { useDynamicTheme } from '../../contexts/DynamicThemeContext';
import {
  CloudQueue as OneDriveIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Photo as PhotoIcon,
  Description as DocumentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { MainContent } from '../MainContent.step5';
import { useOneDriveData } from '../../hooks/useOneDriveData';

interface OneDrivePageProps {}

export const OneDrivePage: React.FC<OneDrivePageProps> = () => {
  const { currentTheme } = useDynamicTheme();
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('/onedrive');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFiltered, setShowFiltered] = useState(false);

  const { quota, stats, recentFiles, loading, error, refreshOneDriveData } = useOneDriveData();

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      await refreshOneDriveData();
      setSnackbarMessage('OneDrive data refreshed successfully!');
      setShowSnackbar(true);
    } catch (err) {
      setSnackbarMessage('Failed to refresh OneDrive data');
      setShowSnackbar(true);
    } finally {
      setSyncLoading(false);
    }
  };
  
  const handleUploadFiles = () => {
    setSnackbarMessage('Upload functionality would open file picker or redirect to OneDrive web interface');
    setShowSnackbar(true);
  };
  
  const handleDownloadApp = () => {
    window.open('https://www.microsoft.com/en-us/microsoft-365/onedrive/download', '_blank');
  };
  
  const handleQuickAction = (actionType: string) => {
    setActiveFilter(actionType);
    setShowFiltered(true);
    
    switch (actionType) {
      case 'recent':
        setSelectedPath('/onedrive-recent');
        setSnackbarMessage(`Showing ${recentFiles.length} recently modified files`);
        break;
      case 'shared':
        setSelectedPath('/onedrive-shared');
        setSnackbarMessage(`Showing ${stats.shared} shared files`);
        break;
      case 'photos':
        setSelectedPath('/onedrive-photos');
        setSnackbarMessage(`Showing ${stats.photos} photos`);
        break;
      case 'documents':
        setSelectedPath('/onedrive-documents');
        setSnackbarMessage(`Showing ${stats.documents} documents`);
        break;
      default:
        setSnackbarMessage('Quick action clicked');
    }
    setShowSnackbar(true);
  };
  
  const handleBackToAllFiles = () => {
    setActiveFilter('all');
    setShowFiltered(false);
    setSelectedPath('/onedrive');
    setSnackbarMessage('Showing all OneDrive files');
    setShowSnackbar(true);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Beautiful OneDrive Cloud Storage Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${currentTheme.primary}08 0%, ${currentTheme.secondary}08 50%, ${currentTheme.accent}08 100%)`,
        borderRadius: 3,
        p: 4,
        mb: 4,
        border: `1px solid ${currentTheme.primary}15`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.accent})`,
        },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3,
            boxShadow: `0 6px 16px rgba(0, 120, 212, 0.3)`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              borderRadius: '16px',
              zIndex: -1,
              opacity: 0.3
            }
          }}>
            <OneDriveIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}>
              OneDrive Cloud Hub
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {loading ? 'Connecting to your cloud storage...' : error ? 'Demo mode - OneDrive integration ready' : 'Your personal Microsoft cloud storage'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title={syncLoading ? "Syncing..." : "Sync OneDrive Data"}>
              <span>
                <IconButton
                  onClick={handleSync}
                  disabled={syncLoading || loading}
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 3,
                    '&:hover': { boxShadow: 5 },
                    '& .MuiSvgIcon-root': {
                      color: syncLoading ? currentTheme.secondary : currentTheme.primary,
                      animation: syncLoading ? 'spin 1s linear infinite' : 'none'
                    }
                  }}
                >
                  <SyncIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="OneDrive Settings">
              <IconButton
                onClick={() => handleQuickAction('settings')}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 5,
                    bgcolor: currentTheme.primary + '08'
                  }
                }}
              >
                <SettingsIcon sx={{ color: currentTheme.primary }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Cloud Storage Stats */}
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.primary,
                mb: 0.5
              }}>
                {loading ? '...' : `${quota.used}GB`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used Storage
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.secondary,
                mb: 0.5
              }}>
                {loading ? '...' : stats.files.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Files
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.accent,
                mb: 0.5
              }}>
                {loading ? '...' : stats.folders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Folders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.primary,
                mb: 0.5
              }}>
                {loading ? '...' : `${quota.percentage}%`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usage
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${currentTheme.secondary}30`
          }}
        >
          {error}
        </Alert>
      )}

      {/* Enhanced Storage Overview */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{
          borderRadius: 3,
          boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
          border: `1px solid ${currentTheme.primary}10`,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.secondary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <StorageIcon sx={{ color: currentTheme.primary, fontSize: 28 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Cloud Storage Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {loading ? 'Calculating storage usage...' : `${quota.used} GB of ${quota.total} GB used (${quota.percentage}% full)`}
                </Typography>
              </Box>
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ color: currentTheme.primary }} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Syncing...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Enhanced Storage Progress Bar */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{
                height: 16,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.05)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Box sx={{
                  height: '100%',
                  width: loading ? '100%' : `${quota.percentage}%`,
                  background: loading
                    ? `linear-gradient(90deg, ${currentTheme.primary}40, ${currentTheme.secondary}40, ${currentTheme.primary}40)`
                    : `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                  animation: loading ? 'shimmer 2s infinite' : 'none',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '20px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                    animation: loading ? 'slide 2s infinite' : 'none'
                  }
                }} />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleUploadFiles}
                disabled={loading}
                sx={{
                  background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  boxShadow: `0 4px 12px ${currentTheme.primary}40`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${currentTheme.primary}58`,
                  }
                }}
              >
                Upload to Cloud
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadApp}
                sx={{
                  borderColor: currentTheme.primary,
                  color: currentTheme.primary,
                  '&:hover': {
                    borderColor: currentTheme.secondary,
                    backgroundColor: `${currentTheme.primary}08`,
                  }
                }}
              >
                Get OneDrive App
              </Button>
            </Box>
          </CardContent>
        </Paper>
      </Box>

      {/* Enhanced Cloud Quick Actions */}
      <Paper sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${currentTheme.primary}10`,
        background: `linear-gradient(135deg, ${currentTheme.primary}02 0%, ${currentTheme.secondary}02 100%)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            boxShadow: `0 3px 8px rgba(0, 120, 212, 0.2)`
          }}>
            <OneDriveIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cloud Quick Actions
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Tooltip title={loading ? "Loading recent files..." : "View recently modified files"}>
              <span>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <RefreshIcon sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Recent
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                          {recentFiles.length} files
                        </Typography>
                      </Box>
                    </Box>
                  }
                  clickable
                  onClick={() => handleQuickAction('recent')}
                  disabled={loading}
                  sx={{
                    width: '100%',
                    height: 56,
                    borderRadius: 2,
                    background: activeFilter === 'recent'
                      ? `linear-gradient(45deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`
                      : 'background.paper',
                    border: `2px solid ${activeFilter === 'recent' ? currentTheme.primary : 'transparent'}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${currentTheme.primary}08, ${currentTheme.secondary}08)`,
                      borderColor: currentTheme.primary
                    }
                  }}
                />
              </span>
            </Tooltip>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Tooltip title={loading ? "Loading shared files..." : "View shared files"}>
              <span>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ShareIcon sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Shared
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                          {loading ? '...' : stats.shared} files
                        </Typography>
                      </Box>
                    </Box>
                  }
                  clickable
                  onClick={() => handleQuickAction('shared')}
                  disabled={loading}
                  sx={{
                    width: '100%',
                    height: 56,
                    borderRadius: 2,
                    background: activeFilter === 'shared'
                      ? `linear-gradient(45deg, ${currentTheme.secondary}15, ${currentTheme.accent}15)`
                      : 'background.paper',
                    border: `2px solid ${activeFilter === 'shared' ? currentTheme.secondary : 'transparent'}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${currentTheme.secondary}08, ${currentTheme.accent}08)`,
                      borderColor: currentTheme.secondary
                    }
                  }}
                />
              </span>
            </Tooltip>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Tooltip title={loading ? "Loading photos..." : "View photos"}>
              <span>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhotoIcon sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Photos
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                          {loading ? '...' : stats.photos} files
                        </Typography>
                      </Box>
                    </Box>
                  }
                  clickable
                  onClick={() => handleQuickAction('photos')}
                  disabled={loading}
                  sx={{
                    width: '100%',
                    height: 56,
                    borderRadius: 2,
                    background: activeFilter === 'photos'
                      ? `linear-gradient(45deg, ${currentTheme.accent}15, ${currentTheme.primary}15)`
                      : 'background.paper',
                    border: `2px solid ${activeFilter === 'photos' ? currentTheme.accent : 'transparent'}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${currentTheme.accent}08, ${currentTheme.primary}08)`,
                      borderColor: currentTheme.accent
                    }
                  }}
                />
              </span>
            </Tooltip>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Tooltip title={loading ? "Loading documents..." : "View documents"}>
              <span>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DocumentIcon sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Documents
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                          {loading ? '...' : stats.documents} files
                        </Typography>
                      </Box>
                    </Box>
                  }
                  clickable
                  onClick={() => handleQuickAction('documents')}
                  disabled={loading}
                  sx={{
                    width: '100%',
                    height: 56,
                    borderRadius: 2,
                    background: activeFilter === 'documents'
                      ? `linear-gradient(45deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`
                      : 'background.paper',
                    border: `2px solid ${activeFilter === 'documents' ? currentTheme.primary : 'transparent'}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${currentTheme.primary}08, ${currentTheme.secondary}08)`,
                      borderColor: currentTheme.primary
                    }
                  }}
                />
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced OneDrive File Browser */}
      <Paper sx={{
        flexGrow: 1,
        borderRadius: 3,
        boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
        border: `1px solid ${currentTheme.primary}05`,
        overflow: 'hidden'
      }}>
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${currentTheme.primary}15`,
          background: `linear-gradient(135deg, ${currentTheme.primary}02 0%, ${currentTheme.secondary}02 100%)`
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: `0 2px 6px rgba(0, 120, 212, 0.2)`
              }}>
                <OneDriveIcon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {showFiltered ? `OneDrive - ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}` : 'OneDrive File Explorer'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showFiltered
                    ? `Filtered view • ${activeFilter === 'recent' ? recentFiles.length : activeFilter === 'shared' ? stats.shared : activeFilter === 'photos' ? stats.photos : stats.documents} ${activeFilter} files`
                    : 'Browse your personal cloud storage files and folders'
                  }
                </Typography>
              </Box>
            </Box>
            {showFiltered && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleBackToAllFiles}
                sx={{
                  borderColor: currentTheme.primary,
                  color: currentTheme.primary,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: currentTheme.secondary,
                    backgroundColor: `${currentTheme.primary}08`,
                  }
                }}
                startIcon={<OneDriveIcon sx={{ fontSize: 16 }} />}
              >
                All Files
              </Button>
            )}
          </Box>
        </Box>

        {/* Use MainContent component but with OneDrive-specific path */}
        <Box sx={{ minHeight: 400 }}>
          <MainContent
            currentPath={selectedPath}
            selectedFiles={selectedFiles}
            onFileSelect={setSelectedFiles}
            onNavigate={(path) => {
              // If navigating away from filtered view, reset filter
              if (showFiltered && !path.includes(activeFilter)) {
                setShowFiltered(false);
                setActiveFilter('all');
              }
              setSelectedPath(path);
            }}
            onPreviewToggle={() => {
              setSnackbarMessage('OneDrive file preview ready');
              setShowSnackbar(true);
            }}
          />
        </Box>
      </Paper>

      {/* Snackbar for user feedback */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          @keyframes slide {
            0% { right: -20px; }
            100% { right: 100%; }
          }
          .rotating {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};