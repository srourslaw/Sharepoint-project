import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TimePicker,
  Paper,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsIcon,
  PhoneAndroid as MobileIcon,
  Webhook as WebhookIcon,
  Schedule as ScheduleIcon,
  Test as TestIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VolumeUp as SoundIcon,
  VolumeOff as SoundOffIcon,
} from '@mui/icons-material';
import { NotificationSettings } from '../types';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onTestNotification?: (type: 'email' | 'browser' | 'mobile' | 'slack') => Promise<boolean>;
}

export const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
  settings,
  onSave,
  onTestNotification,
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [testingNotification, setTestingNotification] = useState<string | null>(null);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
  }, [localSettings, settings]);

  const handleChange = (path: string[], value: any) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleTestNotification = async (type: 'email' | 'browser' | 'mobile' | 'slack') => {
    if (!onTestNotification) return;
    
    setTestingNotification(type);
    try {
      await onTestNotification(type);
    } finally {
      setTestingNotification(null);
    }
  };

  const notificationEvents = [
    { key: 'documentShared', label: 'Document Shared', description: 'When a document is shared with you' },
    { key: 'documentModified', label: 'Document Modified', description: 'When a document you\'re watching is modified' },
    { key: 'aiAnalysisComplete', label: 'AI Analysis Complete', description: 'When AI analysis finishes processing' },
    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
    { key: 'securityEvents', label: 'Security Events', description: 'Security-related notifications' },
    { key: 'storageWarnings', label: 'Storage Warnings', description: 'Storage quota and capacity warnings' },
  ];

  const browserEvents = [
    { key: 'chatMessages', label: 'Chat Messages', description: 'New chat messages and responses' },
    { key: 'documentUpdates', label: 'Document Updates', description: 'Real-time document changes' },
    { key: 'systemNotifications', label: 'System Notifications', description: 'General system notifications' },
    { key: 'errorAlerts', label: 'Error Alerts', description: 'Error and warning messages' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Notification Settings</Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Settings
        </Button>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Settings" to apply them.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Email Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon />
                  <Typography variant="h6">Email Notifications</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.email.enabled}
                    onChange={(e) => handleChange(['email', 'enabled'], e.target.checked)}
                  />
                  <IconButton
                    onClick={() => handleTestNotification('email')}
                    disabled={!localSettings.email.enabled || testingNotification === 'email'}
                  >
                    <TestIcon />
                  </IconButton>
                </Box>
              </Box>

              {localSettings.email.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={localSettings.email.address}
                    onChange={(e) => handleChange(['email', 'address'], e.target.value)}
                    sx={{ mb: 2 }}
                    type="email"
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={localSettings.email.frequency}
                      onChange={(e) => handleChange(['email', 'frequency'], e.target.value)}
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="hourly">Hourly Digest</MenuItem>
                      <MenuItem value="daily">Daily Digest</MenuItem>
                      <MenuItem value="weekly">Weekly Digest</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="subtitle2" gutterBottom>
                    Email Events
                  </Typography>
                  <Box display="flex" flexDirection="column">
                    {notificationEvents.map((event) => (
                      <FormControlLabel
                        key={event.key}
                        control={
                          <Switch
                            checked={localSettings.email.events[event.key as keyof typeof localSettings.email.events]}
                            onChange={(e) =>
                              handleChange(['email', 'events', event.key], e.target.checked)
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{event.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Browser Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <NotificationsIcon />
                  <Typography variant="h6">Browser Notifications</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.browser.enabled}
                    onChange={(e) => handleChange(['browser', 'enabled'], e.target.checked)}
                  />
                  <IconButton
                    onClick={() => handleTestNotification('browser')}
                    disabled={!localSettings.browser.enabled || testingNotification === 'browser'}
                  >
                    <TestIcon />
                  </IconButton>
                </Box>
              </Box>

              {localSettings.browser.enabled && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.browser.sound}
                        onChange={(e) => handleChange(['browser', 'sound'], e.target.checked)}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        {localSettings.browser.sound ? <SoundIcon /> : <SoundOffIcon />}
                        Sound Notifications
                      </Box>
                    }
                    sx={{ mb: 3 }}
                  />

                  <Typography variant="subtitle2" gutterBottom>
                    Browser Events
                  </Typography>
                  <Box display="flex" flexDirection="column">
                    {browserEvents.map((event) => (
                      <FormControlLabel
                        key={event.key}
                        control={
                          <Switch
                            checked={localSettings.browser.events[event.key as keyof typeof localSettings.browser.events]}
                            onChange={(e) =>
                              handleChange(['browser', 'events', event.key], e.target.checked)
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{event.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mobile Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MobileIcon />
                  <Typography variant="h6">Mobile Notifications</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.mobile.enabled}
                    onChange={(e) => handleChange(['mobile', 'enabled'], e.target.checked)}
                  />
                  <IconButton
                    onClick={() => handleTestNotification('mobile')}
                    disabled={!localSettings.mobile.enabled || testingNotification === 'mobile'}
                  >
                    <TestIcon />
                  </IconButton>
                </Box>
              </Box>

              {localSettings.mobile.enabled && (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Mobile notifications require a companion mobile app to be installed.
                  </Alert>

                  <TextField
                    fullWidth
                    label="Push Token"
                    value={localSettings.mobile.pushToken || ''}
                    onChange={(e) => handleChange(['mobile', 'pushToken'], e.target.value)}
                    sx={{ mb: 3 }}
                    helperText="Automatically provided by the mobile app"
                    disabled
                  />

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon />
                        <Typography>Quiet Hours</Typography>
                        <Switch
                          checked={localSettings.mobile.quiet_hours.enabled}
                          onChange={(e) => handleChange(['mobile', 'quiet_hours', 'enabled'], e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {localSettings.mobile.quiet_hours.enabled && (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Start Time"
                              type="time"
                              value={localSettings.mobile.quiet_hours.start}
                              onChange={(e) => handleChange(['mobile', 'quiet_hours', 'start'], e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="End Time"
                              type="time"
                              value={localSettings.mobile.quiet_hours.end}
                              onChange={(e) => handleChange(['mobile', 'quiet_hours', 'end'], e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Slack Integration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WebhookIcon />
                  <Typography variant="h6">Slack Integration</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.slack.enabled}
                    onChange={(e) => handleChange(['slack', 'enabled'], e.target.checked)}
                  />
                  <IconButton
                    onClick={() => handleTestNotification('slack')}
                    disabled={!localSettings.slack.enabled || testingNotification === 'slack'}
                  >
                    <TestIcon />
                  </IconButton>
                </Box>
              </Box>

              {localSettings.slack.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={localSettings.slack.webhookUrl || ''}
                    onChange={(e) => handleChange(['slack', 'webhookUrl'], e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="https://hooks.slack.com/services/..."
                  />

                  <TextField
                    fullWidth
                    label="Channel"
                    value={localSettings.slack.channel || ''}
                    onChange={(e) => handleChange(['slack', 'channel'], e.target.value)}
                    sx={{ mb: 3 }}
                    placeholder="#general"
                  />

                  <Typography variant="subtitle2" gutterBottom>
                    Slack Events
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {localSettings.slack.events.map((event, index) => (
                      <Chip
                        key={index}
                        label={event}
                        onDelete={() => {
                          const newEvents = localSettings.slack.events.filter((_, i) => i !== index);
                          handleChange(['slack', 'events'], newEvents);
                        }}
                      />
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setSlackDialogOpen(true)}
                    >
                      Add Event
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <EmailIcon color={localSettings.email.enabled ? 'primary' : 'disabled'} />
                    <Typography variant="body2">
                      Email: {localSettings.email.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    {localSettings.email.enabled && (
                      <Typography variant="caption" color="text.secondary">
                        {localSettings.email.frequency}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <NotificationsIcon color={localSettings.browser.enabled ? 'primary' : 'disabled'} />
                    <Typography variant="body2">
                      Browser: {localSettings.browser.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    {localSettings.browser.enabled && (
                      <Typography variant="caption" color="text.secondary">
                        Sound: {localSettings.browser.sound ? 'On' : 'Off'}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <MobileIcon color={localSettings.mobile.enabled ? 'primary' : 'disabled'} />
                    <Typography variant="body2">
                      Mobile: {localSettings.mobile.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    {localSettings.mobile.enabled && localSettings.mobile.quiet_hours.enabled && (
                      <Typography variant="caption" color="text.secondary">
                        Quiet: {localSettings.mobile.quiet_hours.start} - {localSettings.mobile.quiet_hours.end}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <WebhookIcon color={localSettings.slack.enabled ? 'primary' : 'disabled'} />
                    <Typography variant="body2">
                      Slack: {localSettings.slack.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    {localSettings.slack.enabled && localSettings.slack.channel && (
                      <Typography variant="caption" color="text.secondary">
                        {localSettings.slack.channel}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Slack Event Dialog */}
      <Dialog open={slackDialogOpen} onClose={() => setSlackDialogOpen(false)}>
        <DialogTitle>Add Slack Event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select events to send to Slack:
          </Typography>
          <Box display="flex" flexDirection="column" gap={1} mt={2}>
            {notificationEvents.map((event) => (
              <FormControlLabel
                key={event.key}
                control={
                  <Switch
                    checked={localSettings.slack.events.includes(event.key)}
                    onChange={(e) => {
                      const newEvents = e.target.checked
                        ? [...localSettings.slack.events, event.key]
                        : localSettings.slack.events.filter(ev => ev !== event.key);
                      handleChange(['slack', 'events'], newEvents);
                    }}
                  />
                }
                label={event.label}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlackDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};