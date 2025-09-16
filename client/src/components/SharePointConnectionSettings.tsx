import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TestTube as TestIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { SharePointConnectionConfig } from '../types';

interface SharePointConnectionSettingsProps {
  connections: SharePointConnectionConfig[];
  onSave: (connections: SharePointConnectionConfig[]) => void;
  onTestConnection: (connection: SharePointConnectionConfig) => Promise<boolean>;
}

export const SharePointConnectionSettings: React.FC<SharePointConnectionSettingsProps> = ({
  connections,
  onSave,
  onTestConnection,
}) => {
  const [localConnections, setLocalConnections] = useState<SharePointConnectionConfig[]>(connections);
  const [editingConnection, setEditingConnection] = useState<SharePointConnectionConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setLocalConnections(connections);
  }, [connections]);

  const defaultConnection: Omit<SharePointConnectionConfig, 'id' | 'createdAt'> = {
    name: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    certificateThumbprint: '',
    siteUrl: '',
    authenticationType: 'oauth',
    scopes: ['Sites.Read.All', 'Files.Read.All'],
    timeout: 30000,
    retryAttempts: 3,
    testConnection: false,
    isDefault: false,
    status: 'inactive',
  };

  const handleAddConnection = () => {
    setEditingConnection({
      ...defaultConnection,
      id: `conn_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const handleEditConnection = (connection: SharePointConnectionConfig) => {
    setEditingConnection({ ...connection });
    setIsDialogOpen(true);
  };

  const handleDeleteConnection = (connectionId: string) => {
    const updatedConnections = localConnections.filter(conn => conn.id !== connectionId);
    setLocalConnections(updatedConnections);
    onSave(updatedConnections);
  };

  const handleTestConnection = async (connection: SharePointConnectionConfig) => {
    setTestingConnections(prev => new Set(prev).add(connection.id));
    
    try {
      const success = await onTestConnection(connection);
      const updatedConnections = localConnections.map(conn =>
        conn.id === connection.id
          ? {
              ...conn,
              status: success ? 'active' : 'error',
              lastTested: new Date().toISOString(),
              errorMessage: success ? undefined : 'Connection test failed',
            }
          : conn
      );
      setLocalConnections(updatedConnections);
      onSave(updatedConnections);
    } catch (error) {
      const updatedConnections = localConnections.map(conn =>
        conn.id === connection.id
          ? {
              ...conn,
              status: 'error' as const,
              lastTested: new Date().toISOString(),
              errorMessage: error instanceof Error ? error.message : 'Connection test failed',
            }
          : conn
      );
      setLocalConnections(updatedConnections);
      onSave(updatedConnections);
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connection.id);
        return newSet;
      });
    }
  };

  const handleSaveConnection = () => {
    if (!editingConnection) return;

    const isNew = !localConnections.find(conn => conn.id === editingConnection.id);
    let updatedConnections: SharePointConnectionConfig[];

    if (isNew) {
      updatedConnections = [...localConnections, editingConnection];
    } else {
      updatedConnections = localConnections.map(conn =>
        conn.id === editingConnection.id ? editingConnection : conn
      );
    }

    if (editingConnection.isDefault) {
      updatedConnections = updatedConnections.map(conn =>
        conn.id === editingConnection.id
          ? conn
          : { ...conn, isDefault: false }
      );
    }

    setLocalConnections(updatedConnections);
    onSave(updatedConnections);
    setIsDialogOpen(false);
    setEditingConnection(null);
  };

  const toggleShowSecret = (connectionId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId],
    }));
  };

  const getStatusIcon = (status: SharePointConnectionConfig['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'inactive':
        return <WarningIcon color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SharePointConnectionConfig['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      case 'inactive':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">SharePoint Connections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddConnection}
        >
          Add Connection
        </Button>
      </Box>

      {localConnections.length === 0 ? (
        <Alert severity="info">
          No SharePoint connections configured. Add a connection to get started.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {localConnections.map((connection) => (
            <Grid item xs={12} key={connection.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{connection.name}</Typography>
                      {connection.isDefault && (
                        <Chip label="Default" color="primary" size="small" />
                      )}
                      <Chip
                        label={connection.status}
                        color={getStatusColor(connection.status)}
                        size="small"
                        icon={getStatusIcon(connection.status)}
                      />
                    </Box>
                    <Box>
                      <Tooltip title="Test Connection">
                        <span>
                          <IconButton
                            onClick={() => handleTestConnection(connection)}
                            disabled={testingConnections.has(connection.id)}
                          >
                            {testingConnections.has(connection.id) ? (
                              <CircularProgress size={20} />
                            ) : (
                              <TestIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <IconButton
                        onClick={() => handleEditConnection(connection)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteConnection(connection.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Site URL: {connection.siteUrl}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Auth Type: {connection.authenticationType}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tenant ID: {connection.tenantId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Tested: {connection.lastTested 
                          ? new Date(connection.lastTested).toLocaleString()
                          : 'Never'
                        }
                      </Typography>
                    </Grid>
                  </Grid>

                  {connection.errorMessage && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {connection.errorMessage}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingConnection?.id && localConnections.find(c => c.id === editingConnection.id)
            ? 'Edit Connection'
            : 'Add New Connection'
          }
        </DialogTitle>
        <DialogContent>
          {editingConnection && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Connection Name"
                    value={editingConnection.name}
                    onChange={(e) =>
                      setEditingConnection({ ...editingConnection, name: e.target.value })
                    }
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Tenant ID"
                    value={editingConnection.tenantId}
                    onChange={(e) =>
                      setEditingConnection({ ...editingConnection, tenantId: e.target.value })
                    }
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={editingConnection.clientId}
                    onChange={(e) =>
                      setEditingConnection({ ...editingConnection, clientId: e.target.value })
                    }
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site URL"
                    value={editingConnection.siteUrl}
                    onChange={(e) =>
                      setEditingConnection({ ...editingConnection, siteUrl: e.target.value })
                    }
                    required
                    placeholder="https://yourtenant.sharepoint.com/sites/yoursite"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Authentication Type</InputLabel>
                    <Select
                      value={editingConnection.authenticationType}
                      onChange={(e) =>
                        setEditingConnection({
                          ...editingConnection,
                          authenticationType: e.target.value as any,
                        })
                      }
                    >
                      <MenuItem value="oauth">OAuth 2.0</MenuItem>
                      <MenuItem value="certificate">Certificate</MenuItem>
                      <MenuItem value="app_only">App Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {editingConnection.authenticationType === 'oauth' && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <TextField
                        fullWidth
                        label="Client Secret"
                        type={showSecrets[editingConnection.id] ? 'text' : 'password'}
                        value={editingConnection.clientSecret || ''}
                        onChange={(e) =>
                          setEditingConnection({
                            ...editingConnection,
                            clientSecret: e.target.value,
                          })
                        }
                      />
                      <IconButton
                        onClick={() => toggleShowSecret(editingConnection.id)}
                        sx={{ ml: 1 }}
                      >
                        {showSecrets[editingConnection.id] ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </Box>
                  </Grid>
                )}

                {editingConnection.authenticationType === 'certificate' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Certificate Thumbprint"
                      value={editingConnection.certificateThumbprint || ''}
                      onChange={(e) =>
                        setEditingConnection({
                          ...editingConnection,
                          certificateThumbprint: e.target.value,
                        })
                      }
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Advanced Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Timeout (ms)"
                            type="number"
                            value={editingConnection.timeout}
                            onChange={(e) =>
                              setEditingConnection({
                                ...editingConnection,
                                timeout: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Retry Attempts"
                            type="number"
                            value={editingConnection.retryAttempts}
                            onChange={(e) =>
                              setEditingConnection({
                                ...editingConnection,
                                retryAttempts: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Scopes
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {editingConnection.scopes.map((scope, index) => (
                              <Chip
                                key={index}
                                label={scope}
                                onDelete={() => {
                                  const newScopes = editingConnection.scopes.filter((_, i) => i !== index);
                                  setEditingConnection({
                                    ...editingConnection,
                                    scopes: newScopes,
                                  });
                                }}
                              />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={editingConnection.isDefault}
                                onChange={(e) =>
                                  setEditingConnection({
                                    ...editingConnection,
                                    isDefault: e.target.checked,
                                  })
                                }
                              />
                            }
                            label="Set as Default Connection"
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveConnection}
            variant="contained"
            disabled={!editingConnection?.name || !editingConnection?.tenantId || !editingConnection?.clientId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};