import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Alert,
  CircularProgress,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Backup as BackupIcon,
  Schedule as ScheduleIcon,
  CloudDownload as ExportIcon,
} from '@mui/icons-material';
import { SharePointFile, User, FileVersion } from '../types';

interface VersionControlManagerProps {
  files: SharePointFile[];
  onClose?: () => void;
  onVersionRestore?: (fileId: string, versionId: string) => Promise<void>;
  onVersionDelete?: (fileId: string, versionId: string) => Promise<void>;
}

interface ExtendedFileVersion extends FileVersion {
  changes?: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  tags?: string[];
  checkInComment?: string;
  isMinorVersion: boolean;
  versionLabel?: string;
}

interface VersionComparison {
  fileId: string;
  version1: ExtendedFileVersion;
  version2: ExtendedFileVersion;
  differences: {
    additions: string[];
    deletions: string[];
    modifications: Array<{
      line: number;
      before: string;
      after: string;
    }>;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

export const VersionControlManager: React.FC<VersionControlManagerProps> = ({
  files,
  onClose,
  onVersionRestore,
  onVersionDelete,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFile, setSelectedFile] = useState<SharePointFile>(files[0]);
  const [versions, setVersions] = useState<ExtendedFileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [restoreDialog, setRestoreDialog] = useState<ExtendedFileVersion | null>(null);
  const [compareDialog, setCompareDialog] = useState<{
    version1: ExtendedFileVersion;
    version2: ExtendedFileVersion;
  } | null>(null);
  const [tagDialog, setTagDialog] = useState<ExtendedFileVersion | null>(null);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);

  // Form states
  const [newTag, setNewTag] = useState('');
  const [checkInComment, setCheckInComment] = useState('');
  const [isMinorVersion, setIsMinorVersion] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; version: ExtendedFileVersion } | null>(null);

  useEffect(() => {
    if (selectedFile) {
      loadVersionHistory(selectedFile.id);
    }
  }, [selectedFile]);

  const loadVersionHistory = async (fileId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/files/${fileId}/versions/detailed`);
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

  const handleVersionRestore = async (version: ExtendedFileVersion) => {
    try {
      if (onVersionRestore) {
        await onVersionRestore(selectedFile.id, version.id);
        await loadVersionHistory(selectedFile.id);
        setRestoreDialog(null);
      }
    } catch (error: any) {
      setError(`Failed to restore version: ${error.message}`);
    }
  };

  const handleVersionDelete = async (version: ExtendedFileVersion) => {
    try {
      if (onVersionDelete) {
        await onVersionDelete(selectedFile.id, version.id);
        await loadVersionHistory(selectedFile.id);
      }
    } catch (error: any) {
      setError(`Failed to delete version: ${error.message}`);
    }
  };

  const handleAddTag = async () => {
    if (!tagDialog || !newTag.trim()) return;

    try {
      const response = await fetch(`/api/files/${selectedFile.id}/versions/${tagDialog.id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag: newTag.trim() }),
      });

      if (response.ok) {
        await loadVersionHistory(selectedFile.id);
        setTagDialog(null);
        setNewTag('');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: checkInComment,
          isMinorVersion,
        }),
      });

      if (response.ok) {
        await loadVersionHistory(selectedFile.id);
        setCheckInDialog(false);
        setCheckInComment('');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCompareVersions = async (version1: ExtendedFileVersion, version2: ExtendedFileVersion) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/files/${selectedFile.id}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version1Id: version1.id,
          version2Id: version2.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setComparison({
          fileId: selectedFile.id,
          version1,
          version2,
          differences: data.data,
        });
        setCompareDialog({ version1, version2 });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelection = (versionId: string, selected: boolean) => {
    setSelectedVersions(prev => 
      selected 
        ? [...prev, versionId]
        : prev.filter(id => id !== versionId)
    );
  };

  const handleBulkCompare = () => {
    if (selectedVersions.length === 2) {
      const version1 = versions.find(v => v.id === selectedVersions[0])!;
      const version2 = versions.find(v => v.id === selectedVersions[1])!;
      handleCompareVersions(version1, version2);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeVersionHistory: true,
          description: `Backup created on ${new Date().toISOString()}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBackupDialog(false);
        // Show success message
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getVersionIcon = (version: ExtendedFileVersion) => {
    if (version.isCurrentVersion) return <EditIcon color="primary" />;
    if (version.tags && version.tags.length > 0) return <LabelIcon color="secondary" />;
    return <HistoryIcon />;
  };

  const getVersionColor = (version: ExtendedFileVersion) => {
    if (version.isCurrentVersion) return 'primary';
    if (version.tags && version.tags.length > 0) return 'secondary';
    return 'default';
  };

  const calculateVersionAge = (version: ExtendedFileVersion): string => {
    const age = Date.now() - new Date(version.created).getTime();
    const days = Math.floor(age / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">Version Control</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        {/* File Selector for Multiple Files */}
        {files.length > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select file to manage versions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {files.map(file => (
                <Chip
                  key={file.id}
                  label={file.name}
                  onClick={() => setSelectedFile(file)}
                  color={selectedFile.id === file.id ? 'primary' : 'default'}
                  variant={selectedFile.id === file.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Version History" />
          <Tab label="Compare Versions" />
          <Tab label="Backup & Archive" />
        </Tabs>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Version History Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Version History for {selectedFile.name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => setCheckInDialog(true)}
                size="small"
              >
                Check In
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<BackupIcon />}
                onClick={() => setBackupDialog(true)}
                size="small"
              >
                Create Backup
              </Button>
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {versions.map((version, index) => (
                <React.Fragment key={version.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: `${getVersionColor(version)}.main` }}>
                        {getVersionIcon(version)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            Version {version.versionNumber}
                            {version.versionLabel && ` (${version.versionLabel})`}
                          </Typography>
                          
                          {version.isCurrentVersion && (
                            <Chip label="Current" size="small" color="primary" />
                          )}
                          
                          {!version.isMinorVersion && (
                            <Chip label="Major" size="small" color="warning" variant="outlined" />
                          )}
                          
                          {version.tags?.map(tag => (
                            <Chip key={tag} label={tag} size="small" color="secondary" variant="outlined" />
                          ))}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {version.createdBy.displayName} • {formatDate(version.created)}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            {(version.size / 1024 / 1024).toFixed(2)} MB • {calculateVersionAge(version)}
                          </Typography>
                          
                          {version.checkInComment && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                              "{version.checkInComment}"
                            </Typography>
                          )}
                          
                          {version.changes && (
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="success.main">
                                +{version.changes.additions}
                              </Typography>
                              <Typography variant="caption" color="error.main">
                                -{version.changes.deletions}
                              </Typography>
                              <Typography variant="caption" color="warning.main">
                                ~{version.changes.modifications}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Checkbox
                          checked={selectedVersions.includes(version.id)}
                          onChange={(e) => handleVersionSelection(version.id, e.target.checked)}
                          disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                        />
                        
                        <Tooltip title="View version">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Download version">
                          <IconButton size="small" href={version.downloadUrl}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {!version.isCurrentVersion && (
                          <Tooltip title="Restore version">
                            <IconButton
                              size="small"
                              onClick={() => setRestoreDialog(version)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <IconButton
                          size="small"
                          onClick={(e) => setMenuAnchor({ element: e.currentTarget, version })}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < versions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Bulk Actions */}
          {selectedVersions.length > 0 && (
            <Paper sx={{ position: 'fixed', bottom: 20, right: 20, p: 2, zIndex: 1000 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedVersions.length} selected
                </Typography>
                
                {selectedVersions.length === 2 && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CompareIcon />}
                    onClick={handleBulkCompare}
                  >
                    Compare
                  </Button>
                )}
                
                <Button
                  size="small"
                  onClick={() => setSelectedVersions([])}
                >
                  Clear
                </Button>
              </Box>
            </Paper>
          )}
        </TabPanel>

        {/* Compare Versions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Version Comparison
            </Typography>
            
            {selectedVersions.length === 2 ? (
              <Box>
                <Button
                  variant="contained"
                  startIcon={<CompareIcon />}
                  onClick={handleBulkCompare}
                  sx={{ mb: 2 }}
                >
                  Compare Selected Versions
                </Button>
                
                {comparison && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Comparing Version {comparison.version1.versionNumber} vs Version {comparison.version2.versionNumber}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="success.main">
                          Additions ({comparison.differences.additions.length})
                        </Typography>
                        <List dense>
                          {comparison.differences.additions.slice(0, 10).map((addition, index) => (
                            <ListItem key={index}>
                              <Typography variant="body2" color="success.main">
                                + {addition}
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                      
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="error.main">
                          Deletions ({comparison.differences.deletions.length})
                        </Typography>
                        <List dense>
                          {comparison.differences.deletions.slice(0, 10).map((deletion, index) => (
                            <ListItem key={index}>
                              <Typography variant="body2" color="error.main">
                                - {deletion}
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="info">
                Select exactly 2 versions from the Version History tab to compare them.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Backup & Archive Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Backup & Archive Management
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<BackupIcon />}
                onClick={() => setBackupDialog(true)}
              >
                Create Backup
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
              >
                Export Version History
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
              >
                Schedule Backup
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Backups preserve complete version history and can be restored at any time.
              Automatic backups can be scheduled for critical documents.
            </Alert>

            {/* Backup History would go here */}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setTagDialog(menuAnchor!.version);
          setMenuAnchor(null);
        }}>
          <LabelIcon sx={{ mr: 1 }} />
          Add Tag
        </MenuItem>
        
        <MenuItem onClick={() => {
          // Handle version properties
          setMenuAnchor(null);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Properties
        </MenuItem>
        
        <Divider />
        
        <MenuItem
          onClick={() => {
            handleVersionDelete(menuAnchor!.version);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Version
        </MenuItem>
      </Menu>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialog !== null}
        onClose={() => setRestoreDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to restore to version {restoreDialog?.versionNumber}?
            This will create a new version with the content from the selected version.
          </Alert>
          
          {restoreDialog && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Version:</strong> {restoreDialog.versionNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Created:</strong> {formatDate(restoreDialog.created)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Author:</strong> {restoreDialog.createdBy.displayName}
              </Typography>
              {restoreDialog.checkInComment && (
                <Typography variant="body2" gutterBottom>
                  <strong>Comment:</strong> {restoreDialog.checkInComment}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(null)}>Cancel</Button>
          <Button
            onClick={() => restoreDialog && handleVersionRestore(restoreDialog)}
            variant="contained"
            color="warning"
          >
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog
        open={tagDialog !== null}
        onClose={() => setTagDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Tag to Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g., Release 1.0, Stable, Review"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialog(null)}>Cancel</Button>
          <Button onClick={handleAddTag} variant="contained" disabled={!newTag.trim()}>
            Add Tag
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check In Dialog */}
      <Dialog
        open={checkInDialog}
        onClose={() => setCheckInDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Check In New Version</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Check-in Comment"
            multiline
            rows={3}
            fullWidth
            value={checkInComment}
            onChange={(e) => setCheckInComment(e.target.value)}
            placeholder="Describe the changes made..."
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={isMinorVersion}
                onChange={(e) => setIsMinorVersion(e.target.checked)}
              />
            }
            label="Minor version (1.1, 1.2, etc.)"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckIn} variant="contained">
            Check In
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};