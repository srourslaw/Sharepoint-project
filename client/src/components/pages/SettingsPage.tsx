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

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailUpdates: true,
      desktopNotifications: false,
      weeklyDigest: true,
      shareNotifications: true,
    },
    appearance: {
      darkMode: false,
      compactView: false,
      showThumbnails: true,
    },
    privacy: {
      shareAnalytics: true,
      allowExternalSharing: false,
      requireTwoFactor: true,
    },
    general: {
      language: 'en',
      timezone: 'UTC+10',
      defaultView: 'list',
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (category: string, setting: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ⚙️ Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customize your SharePoint AI Dashboard experience
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            sx={{ mr: 2 }}
            disabled={!hasChanges}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Alert for unsaved changes */}
      {hasChanges && (
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
                      checked={settings.notifications.emailUpdates}
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
                      checked={settings.notifications.desktopNotifications}
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
                      checked={settings.notifications.weeklyDigest}
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
                      checked={settings.notifications.shareNotifications}
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
                      checked={settings.appearance.darkMode}
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
                      checked={settings.appearance.compactView}
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
                      checked={settings.appearance.showThumbnails}
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
                      checked={settings.privacy.shareAnalytics}
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
                      checked={settings.privacy.allowExternalSharing}
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
                        checked={settings.privacy.requireTwoFactor}
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
                  value={settings.general.language}
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
                  value={settings.general.timezone}
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
                  value={settings.general.defaultView}
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