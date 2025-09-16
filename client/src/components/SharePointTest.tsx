import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Folder as FolderIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

import { useMSALAuth } from '../contexts/MSALAuthContext';
import { useSharePointSites, useSharePointDrives, useSharePointFiles } from '../hooks/useRealSharePointData';

// SharePoint Test Component - demonstrating real SharePoint integration
export const SharePointTest: React.FC = () => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    logout,
    accounts,
    getAccessToken
  } = useMSALAuth();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');

  // Use real SharePoint hooks
  const { sites, loading: sitesLoading, error: sitesError, refetch: refetchSites } = useSharePointSites();
  const { drives, loading: drivesLoading, error: drivesError, refetch: refetchDrives } = useSharePointDrives(selectedSiteId);
  const { files, loading: filesLoading, error: filesError, refetch: refetchFiles } = useSharePointFiles(selectedSiteId, selectedDriveId);

  const handleGetToken = async () => {
    try {
      const token = await getAccessToken();
      setAccessToken(token ? token.substring(0, 50) + '...' : 'No token');
    } catch (error) {
      console.error('Failed to get token:', error);
      setAccessToken('Failed to get token');
    }
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading MSAL...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🚀 Real SharePoint Integration Test
      </Typography>

      <Typography variant="body1" color="textSecondary" mb={3}>
        This page demonstrates real SharePoint integration using MSAL and Microsoft Graph API,
        following the patterns from the successful DMS project.
      </Typography>

      {/* Authentication Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔐 Authentication Status
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: isAuthenticated ? 'success.light' : 'error.light' }}>
                <Typography variant="body1">
                  Status: <Chip
                    label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    color={isAuthenticated ? 'success' : 'error'}
                    size="small"
                  />
                </Typography>

                {isAuthenticated && accounts.length > 0 && (
                  <Box mt={1}>
                    <Typography variant="body2">
                      User: {accounts[0].username}
                    </Typography>
                    <Typography variant="body2">
                      Name: {accounts[0].name}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" gap={1}>
                {!isAuthenticated ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={login}
                    startIcon={<LoginIcon />}
                  >
                    Login with Microsoft
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={logout}
                    startIcon={<LogoutIcon />}
                  >
                    Logout
                  </Button>
                )}

                {isAuthenticated && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleGetToken}
                    startIcon={<RefreshIcon />}
                  >
                    Get Access Token
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {accessToken && (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Access Token: <code>{accessToken}</code>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* SharePoint Data */}
      {isAuthenticated && (
        <Grid container spacing={3}>
          {/* Sites */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <CloudIcon sx={{ mr: 1 }} />
                    SharePoint Sites
                  </Typography>
                  <Button size="small" onClick={refetchSites} disabled={sitesLoading}>
                    <RefreshIcon />
                  </Button>
                </Box>

                {sitesError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {sitesError}
                  </Alert>
                )}

                {sitesLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <List dense>
                    {sites.map((site) => (
                      <ListItem
                        key={site.id}
                        button
                        selected={selectedSiteId === site.id}
                        onClick={() => {
                          setSelectedSiteId(site.id);
                          setSelectedDriveId(''); // Reset drive selection
                        }}
                      >
                        <ListItemText
                          primary={site.displayName}
                          secondary={site.description}
                        />
                      </ListItem>
                    ))}
                    {sites.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        No sites found
                      </Typography>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Document Libraries */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <FolderIcon sx={{ mr: 1 }} />
                    Document Libraries
                  </Typography>
                  <Button size="small" onClick={refetchDrives} disabled={drivesLoading || !selectedSiteId}>
                    <RefreshIcon />
                  </Button>
                </Box>

                {!selectedSiteId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Select a site to see document libraries
                  </Alert>
                )}

                {drivesError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {drivesError}
                  </Alert>
                )}

                {drivesLoading ? (
                  <CircularProgress size={24} />
                ) : selectedSiteId ? (
                  <List dense>
                    {drives.map((drive) => (
                      <ListItem
                        key={drive.id}
                        button
                        selected={selectedDriveId === drive.id}
                        onClick={() => setSelectedDriveId(drive.id)}
                      >
                        <ListItemText
                          primary={drive.name}
                          secondary={drive.driveType}
                        />
                      </ListItem>
                    ))}
                    {drives.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        No libraries found
                      </Typography>
                    )}
                  </List>
                ) : null}
              </CardContent>
            </Card>
          </Grid>

          {/* Files */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    <InsertDriveFileIcon sx={{ mr: 1 }} />
                    Files
                  </Typography>
                  <Button size="small" onClick={refetchFiles} disabled={filesLoading || !selectedDriveId}>
                    <RefreshIcon />
                  </Button>
                </Box>

                {!selectedDriveId && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Select a document library to see files
                  </Alert>
                )}

                {filesError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {filesError}
                  </Alert>
                )}

                {filesLoading ? (
                  <CircularProgress size={24} />
                ) : selectedDriveId ? (
                  <List dense>
                    {files.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemText
                          primary={file.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Size: {Math.round(file.size / 1024)} KB
                              </Typography>
                              <Typography variant="caption" display="block">
                                Modified: {new Date(file.lastModifiedDateTime).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    {files.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        No files found
                      </Typography>
                    )}
                  </List>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};