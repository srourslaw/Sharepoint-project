import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Grid,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Backup as BackupIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSharePointSettings } from '../../hooks/useSharePointSettings';

export const SettingsPage: React.FC = () => {
  const { settingsData, loading, error, updateSettings, refreshSettings, hasUnsavedChanges } = useSharePointSettings();
  const [localSettings, setLocalSettings] = useState(settingsData.settings);

  // Sync local settings when data loads
  React.useEffect(() => {
    setLocalSettings(settingsData.settings);
  }, [settingsData.settings]);

  const handleSettingChange = (category: string, setting: string, value: boolean | string) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleReset = () => {
    setLocalSettings(settingsData.settings);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Settings...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Unable to load settings from SharePoint. Please check your connection and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ⚙️ Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your SharePoint environment preferences
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            sx={{ mr: 2 }}
            disabled={!hasUnsavedChanges}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Alert for unsaved changes */}
      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your settings!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications Settings */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Notifications"
              avatar={<NotificationsIcon color="primary" />}
              subheader="Manage how you receive updates and alerts"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Updates"
                    secondary="Receive important updates via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.notifications.emailUpdates}
                      onChange={(e) => handleSettingChange('notifications', 'emailUpdates', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Desktop Notifications"
                    secondary="Show browser notifications for real-time updates"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.notifications.desktopNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'desktopNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Weekly Digest"
                    secondary="Get a summary of activity every week"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.notifications.weeklyDigest}
                      onChange={(e) => handleSettingChange('notifications', 'weeklyDigest', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Share Notifications"
                    secondary="Get notified when files are shared with you"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.notifications.shareNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'shareNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Appearance Settings */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Appearance"
              avatar={<PaletteIcon color="secondary" />}
              subheader="Customize the look and feel of your dashboard"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Dark Mode"
                    secondary="Use dark theme for better night viewing"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.appearance.darkMode}
                      onChange={(e) => handleSettingChange('appearance', 'darkMode', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Compact View"
                    secondary="Show more items in lists with smaller spacing"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.appearance.compactView}
                      onChange={(e) => handleSettingChange('appearance', 'compactView', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Show Thumbnails"
                    secondary="Display file preview thumbnails"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.appearance.showThumbnails}
                      onChange={(e) => handleSettingChange('appearance', 'showThumbnails', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Security */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Privacy & Security"
              avatar={<SecurityIcon color="error" />}
              subheader="Control your data privacy and account security"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Share Usage Analytics"
                    secondary="Help improve the dashboard by sharing anonymous usage data"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.privacy.shareAnalytics}
                      onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Allow External Sharing"
                    secondary="Permit sharing files with users outside your organization"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={localSettings.privacy.allowExternalSharing}
                      onChange={(e) => handleSettingChange('privacy', 'allowExternalSharing', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Require additional verification for sensitive actions"
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip label="Required" size="small" color="success" sx={{ mr: 1 }} />
                      <Switch
                        checked={localSettings.privacy.requireTwoFactor}
                        onChange={(e) => handleSettingChange('privacy', 'requireTwoFactor', e.target.checked)}
                      />
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="General"
              avatar={<LanguageIcon color="info" />}
              subheader="Basic preferences and regional settings"
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  select
                  label="Language"
                  value={localSettings.general.language}
                  onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Timezone"
                  value={localSettings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="UTC-8">Pacific Time (UTC-8)</MenuItem>
                  <MenuItem value="UTC-5">Eastern Time (UTC-5)</MenuItem>
                  <MenuItem value="UTC+0">Greenwich Mean Time (UTC+0)</MenuItem>
                  <MenuItem value="UTC+10">Australian Eastern Time (UTC+10)</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Default View"
                  value={localSettings.general.defaultView}
                  onChange={(e) => handleSettingChange('general', 'defaultView', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="list">List View</MenuItem>
                  <MenuItem value="grid">Grid View</MenuItem>
                  <MenuItem value="tiles">Tiles View</MenuItem>
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage & Backup */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Storage & Backup"
              avatar={<StorageIcon color="warning" />}
              subheader="Manage your storage usage and backup settings"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">15.6 GB</Typography>
                    <Typography variant="body2" color="text.secondary">Used</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">84.4 GB</Typography>
                    <Typography variant="body2" color="text.secondary">Available</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<BackupIcon />}
                      fullWidth
                    >
                      Create Backup
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Alert severity="info" icon={<InfoIcon />}>
                Automatic backups are enabled and run weekly. Your last backup was created 3 days ago.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};