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
  Slider,
  Paper,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Accessibility as AccessibilityIcon,
  Visibility as VisibilityIcon,
  Hearing as HearingIcon,
  TouchApp as TouchIcon,
  Keyboard as KeyboardIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  TextFields as TextFieldsIcon,
  Speed as SpeedIcon,
  VolumeUp as VolumeIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Test as TestIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { AccessibilitySettings } from '../types';

interface AccessibilitySettingsProps {
  settings: AccessibilitySettings;
  onSave: (settings: AccessibilitySettings) => void;
  onTestScreenReader?: () => void;
  onTestKeyboardNavigation?: () => void;
  onPreview?: (settings: AccessibilitySettings) => void;
}

export const AccessibilitySettingsComponent: React.FC<AccessibilitySettingsProps> = ({
  settings,
  onSave,
  onTestScreenReader,
  onTestKeyboardNavigation,
  onPreview,
}) => {
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<{ key: string; action: string }>({ key: '', action: '' });

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

  const handleReset = () => {
    const defaultSettings: AccessibilitySettings = {
      screenReader: {
        enabled: false,
        announceNavigation: true,
        announceUpdates: true,
        verbosity: 'normal',
      },
      keyboard: {
        enabled: true,
        showFocusIndicator: true,
        customShortcuts: {
          'Ctrl+Shift+S': 'Open Settings',
          'Ctrl+/': 'Show Shortcuts Help',
          'Alt+1': 'Focus Main Content',
          'Alt+2': 'Focus Sidebar',
          'Escape': 'Close Dialog',
        },
        skipLinks: true,
      },
      visual: {
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        colorBlindFriendly: false,
        focusIndicatorSize: 'medium',
      },
      motor: {
        stickyKeys: false,
        clickHoldDelay: 500,
        doubleClickSpeed: 500,
        hoverDelay: 200,
      },
    };
    setLocalSettings(defaultSettings);
  };

  const handleAddShortcut = () => {
    setEditingShortcut({ key: '', action: '' });
    setShortcutDialogOpen(true);
  };

  const handleEditShortcut = (key: string) => {
    setEditingShortcut({ key, action: localSettings.keyboard.customShortcuts[key] });
    setShortcutDialogOpen(true);
  };

  const handleSaveShortcut = () => {
    if (editingShortcut.key && editingShortcut.action) {
      const newShortcuts = { ...localSettings.keyboard.customShortcuts };
      newShortcuts[editingShortcut.key] = editingShortcut.action;
      handleChange(['keyboard', 'customShortcuts'], newShortcuts);
      setShortcutDialogOpen(false);
    }
  };

  const handleDeleteShortcut = (key: string) => {
    const newShortcuts = { ...localSettings.keyboard.customShortcuts };
    delete newShortcuts[key];
    handleChange(['keyboard', 'customShortcuts'], newShortcuts);
  };

  const accessibilityScore = () => {
    let score = 0;
    let total = 0;

    // Screen reader support
    if (localSettings.screenReader.enabled) score += 25;
    total += 25;

    // Keyboard navigation
    if (localSettings.keyboard.enabled) score += 20;
    if (localSettings.keyboard.showFocusIndicator) score += 10;
    if (localSettings.keyboard.skipLinks) score += 10;
    total += 40;

    // Visual accessibility
    if (localSettings.visual.highContrast) score += 10;
    if (localSettings.visual.largeText) score += 10;
    if (localSettings.visual.colorBlindFriendly) score += 5;
    total += 25;

    // Motor accessibility
    if (localSettings.motor.stickyKeys) score += 5;
    if (localSettings.motor.clickHoldDelay > 300) score += 5;
    total += 10;

    return Math.round((score / total) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Accessibility Settings</Typography>
        <Box display="flex" gap={1}>
          {onPreview && (
            <Button
              variant="outlined"
              startIcon={<PlayIcon />}
              onClick={() => onPreview(localSettings)}
            >
              Preview
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Settings" to apply them.
        </Alert>
      )}

      {/* Accessibility Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justify="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <AccessibilityIcon color="primary" />
              <Box>
                <Typography variant="h6">Accessibility Score</Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on current configuration
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${accessibilityScore()}%`}
              color={getScoreColor(accessibilityScore())}
              size="large"
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Screen Reader Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HearingIcon />
                  <Typography variant="h6">Screen Reader</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.screenReader.enabled}
                    onChange={(e) => handleChange(['screenReader', 'enabled'], e.target.checked)}
                  />
                  {onTestScreenReader && (
                    <IconButton onClick={onTestScreenReader}>
                      <TestIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {localSettings.screenReader.enabled && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.screenReader.announceNavigation}
                        onChange={(e) => handleChange(['screenReader', 'announceNavigation'], e.target.checked)}
                      />
                    }
                    label="Announce Navigation"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.screenReader.announceUpdates}
                        onChange={(e) => handleChange(['screenReader', 'announceUpdates'], e.target.checked)}
                      />
                    }
                    label="Announce Updates"
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Verbosity Level</InputLabel>
                    <Select
                      value={localSettings.screenReader.verbosity}
                      onChange={(e) => handleChange(['screenReader', 'verbosity'], e.target.value)}
                    >
                      <MenuItem value="minimal">Minimal</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="verbose">Verbose</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Visual Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <VisibilityIcon />
                <Typography variant="h6">Visual Accessibility</Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.visual.highContrast}
                      onChange={(e) => handleChange(['visual', 'highContrast'], e.target.checked)}
                    />
                  }
                  label="High Contrast Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.visual.reducedMotion}
                      onChange={(e) => handleChange(['visual', 'reducedMotion'], e.target.checked)}
                    />
                  }
                  label="Reduce Motion"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.visual.largeText}
                      onChange={(e) => handleChange(['visual', 'largeText'], e.target.checked)}
                    />
                  }
                  label="Large Text"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.visual.colorBlindFriendly}
                      onChange={(e) => handleChange(['visual', 'colorBlindFriendly'], e.target.checked)}
                    />
                  }
                  label="Color Blind Friendly"
                />
              </Box>

              <Box mt={2}>
                <Typography gutterBottom>
                  Focus Indicator Size: {localSettings.visual.focusIndicatorSize}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={localSettings.visual.focusIndicatorSize}
                    onChange={(e) => handleChange(['visual', 'focusIndicatorSize'], e.target.value)}
                    size="small"
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Keyboard Navigation */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <KeyboardIcon />
                  <Typography variant="h6">Keyboard Navigation</Typography>
                </Box>
                <Box>
                  <Switch
                    checked={localSettings.keyboard.enabled}
                    onChange={(e) => handleChange(['keyboard', 'enabled'], e.target.checked)}
                  />
                  {onTestKeyboardNavigation && (
                    <IconButton onClick={onTestKeyboardNavigation}>
                      <TestIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {localSettings.keyboard.enabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.keyboard.showFocusIndicator}
                          onChange={(e) => handleChange(['keyboard', 'showFocusIndicator'], e.target.checked)}
                        />
                      }
                      label="Show Focus Indicator"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.keyboard.skipLinks}
                          onChange={(e) => handleChange(['keyboard', 'skipLinks'], e.target.checked)}
                        />
                      }
                      label="Skip Links"
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2">Custom Shortcuts</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddShortcut}
                      >
                        Add Shortcut
                      </Button>
                    </Box>
                    
                    <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {Object.entries(localSettings.keyboard.customShortcuts).map(([key, action]) => (
                        <ListItem
                          key={key}
                          secondaryAction={
                            <Box>
                              <IconButton onClick={() => handleEditShortcut(key)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteShortcut(key)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={key}
                            secondary={action}
                            primaryTypographyProps={{ fontFamily: 'monospace' }}
                          />
                        </ListItem>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Motor Accessibility */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TouchIcon />
                <Typography variant="h6">Motor Accessibility</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.motor.stickyKeys}
                        onChange={(e) => handleChange(['motor', 'stickyKeys'], e.target.checked)}
                      />
                    }
                    label="Sticky Keys"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>
                    Click Hold Delay: {localSettings.motor.clickHoldDelay}ms
                  </Typography>
                  <Slider
                    value={localSettings.motor.clickHoldDelay}
                    onChange={(_, value) => handleChange(['motor', 'clickHoldDelay'], value)}
                    min={100}
                    max={2000}
                    step={100}
                    marks={[
                      { value: 100, label: '100ms' },
                      { value: 500, label: '500ms' },
                      { value: 1000, label: '1s' },
                      { value: 2000, label: '2s' },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>
                    Double Click Speed: {localSettings.motor.doubleClickSpeed}ms
                  </Typography>
                  <Slider
                    value={localSettings.motor.doubleClickSpeed}
                    onChange={(_, value) => handleChange(['motor', 'doubleClickSpeed'], value)}
                    min={200}
                    max={1000}
                    step={50}
                    marks={[
                      { value: 200, label: '200ms' },
                      { value: 500, label: '500ms' },
                      { value: 1000, label: '1s' },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography gutterBottom>
                    Hover Delay: {localSettings.motor.hoverDelay}ms
                  </Typography>
                  <Slider
                    value={localSettings.motor.hoverDelay}
                    onChange={(_, value) => handleChange(['motor', 'hoverDelay'], value)}
                    min={0}
                    max={1000}
                    step={50}
                    marks={[
                      { value: 0, label: '0ms' },
                      { value: 200, label: '200ms' },
                      { value: 500, label: '500ms' },
                      { value: 1000, label: '1s' },
                    ]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Accessibility Guidelines */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessibility Guidelines
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary">WCAG 2.1 AA</Typography>
                    <Typography variant="body2">
                      Meets Web Content Accessibility Guidelines Level AA standards
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary">Section 508</Typography>
                    <Typography variant="body2">
                      Complies with Section 508 accessibility requirements
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary">ADA Compatible</Typography>
                    <Typography variant="body2">
                      Designed to meet Americans with Disabilities Act standards
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shortcut Edit Dialog */}
      <Dialog open={shortcutDialogOpen} onClose={() => setShortcutDialogOpen(false)}>
        <DialogTitle>
          {localSettings.keyboard.customShortcuts[editingShortcut.key] ? 'Edit Shortcut' : 'Add Shortcut'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Key Combination"
                value={editingShortcut.key}
                onChange={(e) => setEditingShortcut({ ...editingShortcut, key: e.target.value })}
                placeholder="Ctrl+Shift+K"
                helperText="Use combinations like Ctrl+Alt+K, Shift+F1, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Action Description"
                value={editingShortcut.action}
                onChange={(e) => setEditingShortcut({ ...editingShortcut, action: e.target.value })}
                placeholder="Open search dialog"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortcutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveShortcut}
            variant="contained"
            disabled={!editingShortcut.key || !editingShortcut.action}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};