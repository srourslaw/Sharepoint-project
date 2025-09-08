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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ☁️ OneDrive
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {loading ? 'Loading your OneDrive account...' : error ? 'Using sample data (OneDrive connection failed)' : 'Your personal OneDrive cloud storage'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Sync OneDrive">
            <span>
              <IconButton color="primary" onClick={handleSync} disabled={syncLoading || loading}>
                <SyncIcon className={syncLoading ? 'rotating' : ''} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="OneDrive Settings">
            <IconButton color="primary" onClick={() => handleQuickAction('settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Storage Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Storage Usage</Typography>
                {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {loading ? 'Loading...' : `${quota.used} GB of ${quota.total} GB used`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? '...' : `${quota.percentage}%`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={loading ? 'indeterminate' : 'determinate'}
                  value={loading ? 0 : quota.percentage}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title={loading ? "Loading..." : "Upload files to OneDrive"}>
                  <span>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<UploadIcon />}
                      onClick={handleUploadFiles}
                      disabled={loading}
                    >
                      Upload Files
                    </Button>
                  </span>
                </Tooltip>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadApp}
                >
                  Download App
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <FileIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {loading ? '...' : stats.files.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <FolderIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {loading ? '...' : stats.folders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Folders
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <OneDriveIcon sx={{ mr: 1 }} />
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={loading ? "Loading recent files..." : "View recently modified files"}>
            <span>
              <Chip
                label={`Recently Modified (${recentFiles.length})`}
                clickable
                variant="outlined"
                icon={<RefreshIcon />}
                onClick={() => handleQuickAction('recent')}
                disabled={loading}
              />
            </span>
          </Tooltip>
          <Tooltip title={loading ? "Loading shared files..." : "View shared files"}>
            <span>
              <Chip
                label={`Shared (${loading ? '...' : stats.shared})`}
                clickable
                variant="outlined"
                color="primary"
                icon={<ShareIcon />}
                onClick={() => handleQuickAction('shared')}
                disabled={loading}
              />
            </span>
          </Tooltip>
          <Tooltip title={loading ? "Loading photos..." : "View photos"}>
            <span>
              <Chip
                label={`Photos (${loading ? '...' : stats.photos})`}
                clickable
                variant="outlined"
                icon={<PhotoIcon />}
                onClick={() => handleQuickAction('photos')}
                disabled={loading}
              />
            </span>
          </Tooltip>
          <Tooltip title={loading ? "Loading documents..." : "View documents"}>
            <span>
              <Chip
                label={`Documents (${loading ? '...' : stats.documents})`}
                clickable
                variant="outlined"
                icon={<DocumentIcon />}
                onClick={() => handleQuickAction('documents')}
                disabled={loading}
              />
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* OneDrive File Browser */}
      <Paper sx={{ flexGrow: 1 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {showFiltered ? `OneDrive - ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}` : 'OneDrive Files'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showFiltered 
                  ? `Filtered view showing ${activeFilter === 'recent' ? recentFiles.length : activeFilter === 'shared' ? stats.shared : activeFilter === 'photos' ? stats.photos : stats.documents} ${activeFilter} files`
                  : 'Browse your personal OneDrive files and folders'
                }
              </Typography>
            </Box>
            {showFiltered && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleBackToAllFiles}
                sx={{ ml: 2 }}
              >
                Show All Files
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
              setSnackbarMessage('File preview functionality');
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
          .rotating {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};