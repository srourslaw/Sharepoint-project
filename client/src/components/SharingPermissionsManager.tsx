import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Link,
  CircularProgress,
  Tooltip,
  Paper,
  Grid,
} from '@mui/material';
import {
  Share as ShareIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Create as EditPermissionIcon,
  AdminPanelSettings as AdminIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Schedule as ScheduleIcon,
  Notifications as NotifyIcon,
} from '@mui/icons-material';
import { SharePointFile, User } from '../types';

interface SharePermission {
  id: string;
  grantedTo: {
    user?: User;
    group?: {
      id: string;
      displayName: string;
      email?: string;
    };
  };
  roles: ('read' | 'write' | 'owner')[];
  inheritedFrom?: string;
  expirationDateTime?: string;
  createdDateTime: string;
  createdBy: User;
}

interface ShareLink {
  id: string;
  type: 'view' | 'edit' | 'embed';
  scope: 'anonymous' | 'organization' | 'existingAccess';
  link: string;
  expirationDateTime?: string;
  password?: boolean;
  createdDateTime: string;
  createdBy: User;
  usageCount: number;
}

interface SharingPermissionsManagerProps {
  items: SharePointFile[];
  onClose?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && <Box sx={{ py: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
};

export const SharingPermissionsManager: React.FC<SharingPermissionsManagerProps> = ({
  items,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [permissions, setPermissions] = useState<SharePermission[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Share dialog states
  const [shareDialog, setShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'read' | 'write' | 'owner'>('read');
  const [shareMessage, setShareMessage] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [requireSignIn, setRequireSignIn] = useState(true);
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  // Link dialog states
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<'view' | 'edit'>('view');
  const [linkScope, setLinkScope] = useState<'anonymous' | 'organization' | 'existingAccess'>('organization');
  const [linkExpiration, setLinkExpiration] = useState<string>('');
  const [linkPassword, setLinkPassword] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);

  const isSingleItem = items.length === 1;
  const itemNames = items.map(item => item.name).join(', ');

  useEffect(() => {
    if (items.length > 0) {
      loadPermissions();
      loadShareLinks();
    }
  }, [items]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const itemIds = items.map(item => item.id);
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      });

      const data = await response.json();
      if (data.success) {
        setPermissions(data.data);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShareLinks = async () => {
    try {
      const itemIds = items.map(item => item.id);
      const response = await fetch('/api/sharing-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      });

      const data = await response.json();
      if (data.success) {
        setShareLinks(data.data);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleShareWithPeople = async () => {
    if (!shareEmail.trim()) return;

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: items.map(item => item.id),
          recipients: shareEmail.split(',').map(email => email.trim()),
          role: shareRole,
          message: shareMessage,
          notify: notifyUsers,
          requireSignIn,
          expirationDateTime: expirationEnabled ? expirationDate : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadPermissions();
        setShareDialog(false);
        setShareEmail('');
        setShareMessage('');
      } else {
        setError(data.error?.message || 'Failed to share');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCreateShareLink = async () => {
    try {
      const response = await fetch('/api/create-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: items.map(item => item.id),
          type: linkType,
          scope: linkScope,
          expirationDateTime: linkExpiration || undefined,
          password: enablePassword ? linkPassword : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadShareLinks();
        setLinkDialog(false);
        setLinkPassword('');
        setLinkExpiration('');
      } else {
        setError(data.error?.message || 'Failed to create share link');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPermissions(prev => prev.filter(p => p.id !== permissionId));
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/sharing-links/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShareLinks(prev => prev.filter(l => l.id !== linkId));
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const copyLinkToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    // You might want to show a toast notification here
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('owner')) return 'error';
    if (roles.includes('write')) return 'warning';
    return 'primary';
  };

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes('owner')) return 'Owner';
    if (roles.includes('write')) return 'Can Edit';
    return 'Can View';
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'edit': return <EditPermissionIcon />;
      case 'embed': return <LinkIcon />;
      default: return <ViewIcon />;
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'anonymous': return <PublicIcon />;
      case 'organization': return <GroupIcon />;
      default: return <PrivateIcon />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'anonymous': return 'Anyone with the link';
      case 'organization': return 'People in organization';
      case 'existingAccess': return 'People with existing access';
      default: return scope;
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShareIcon />
          <Typography variant="h6">
            Share {isSingleItem ? items[0].name : `${items.length} items`}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Share" icon={<ShareIcon />} />
            <Tab label="Manage Access" icon={<SecurityIcon />} />
            <Tab label="Links" icon={<LinkIcon />} />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Share Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Share with people
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter names, email addresses, or 'Everyone'"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Permission</InputLabel>
                  <Select
                    value={shareRole}
                    label="Permission"
                    onChange={(e) => setShareRole(e.target.value as any)}
                  >
                    <MenuItem value="read">Can view</MenuItem>
                    <MenuItem value="write">Can edit</MenuItem>
                    <MenuItem value="owner">Owner</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  onClick={handleShareWithPeople}
                  disabled={!shareEmail.trim()}
                  startIcon={<EmailIcon />}
                >
                  Share
                </Button>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Add a message (optional)"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifyUsers}
                      onChange={(e) => setNotifyUsers(e.target.checked)}
                    />
                  }
                  label="Notify people"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={requireSignIn}
                      onChange={(e) => setRequireSignIn(e.target.checked)}
                    />
                  }
                  label="Require sign-in"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={expirationEnabled}
                      onChange={(e) => setExpirationEnabled(e.target.checked)}
                    />
                  }
                  label="Set expiration"
                />
                
                {expirationEnabled && (
                  <TextField
                    type="datetime-local"
                    size="small"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    sx={{ ml: 4, maxWidth: 250 }}
                  />
                )}
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Get a link
            </Typography>
            
            <Paper sx={{ p: 2 }}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => setLinkDialog(true)}
                fullWidth
              >
                Create a sharing link
              </Button>
            </Paper>
          </Box>
        </TabPanel>

        {/* Manage Access Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              People with access
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {permissions.map((permission) => (
                  <ListItem key={permission.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {permission.grantedTo.user ? (
                          <PersonIcon />
                        ) : (
                          <GroupIcon />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {permission.grantedTo.user?.displayName || 
                             permission.grantedTo.group?.displayName}
                          </Typography>
                          <Chip
                            label={getRoleLabel(permission.roles)}
                            size="small"
                            color={getRoleColor(permission.roles) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {permission.grantedTo.user?.email || 
                             permission.grantedTo.group?.email}
                          </Typography>
                          {permission.expirationDateTime && (
                            <Typography variant="caption" display="block" color="warning.main">
                              Expires: {formatDate(permission.expirationDateTime)}
                            </Typography>
                          )}
                          {permission.inheritedFrom && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Inherited from: {permission.inheritedFrom}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit permissions">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Remove access">
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePermission(permission.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        {/* Links Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Sharing links
              </Typography>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => setLinkDialog(true)}
              >
                Create Link
              </Button>
            </Box>

            <List>
              {shareLinks.map((link) => (
                <ListItem key={link.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getLinkIcon(link.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {link.type === 'edit' ? 'Can edit' : 'Can view'} link
                        </Typography>
                        <Chip
                          icon={getScopeIcon(link.scope)}
                          label={getScopeLabel(link.scope)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(link.createdDateTime)} • Used {link.usageCount} times
                        </Typography>
                        {link.expirationDateTime && (
                          <Typography variant="caption" display="block" color="warning.main">
                            Expires: {formatDate(link.expirationDateTime)}
                          </Typography>
                        )}
                        <Link
                          href={link.link}
                          target="_blank"
                          variant="caption"
                          sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {link.link}
                        </Link>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Copy link">
                        <IconButton
                          size="small"
                          onClick={() => copyLinkToClipboard(link.link)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Revoke link">
                        <IconButton
                          size="small"
                          onClick={() => handleRevokeLink(link.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              {shareLinks.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No sharing links"
                    secondary="Create a link to share with others"
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Create Link Dialog */}
      <Dialog
        open={linkDialog}
        onClose={() => setLinkDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create sharing link</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Link type</InputLabel>
              <Select
                value={linkType}
                label="Link type"
                onChange={(e) => setLinkType(e.target.value as any)}
              >
                <MenuItem value="view">View only</MenuItem>
                <MenuItem value="edit">View and edit</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Who can access</InputLabel>
              <Select
                value={linkScope}
                label="Who can access"
                onChange={(e) => setLinkScope(e.target.value as any)}
              >
                <MenuItem value="organization">People in my organization</MenuItem>
                <MenuItem value="anonymous">Anyone with the link</MenuItem>
                <MenuItem value="existingAccess">People with existing access</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              type="datetime-local"
              label="Expiration (optional)"
              value={linkExpiration}
              onChange={(e) => setLinkExpiration(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                />
              }
              label="Require password"
            />
            
            {enablePassword && (
              <TextField
                type="password"
                label="Password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                placeholder="Enter password"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateShareLink} variant="contained">
            Create Link
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};