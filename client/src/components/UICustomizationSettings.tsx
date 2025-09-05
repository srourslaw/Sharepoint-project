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
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  ColorInput,
  Paper,
  Divider,
  RadioGroup,
  Radio,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  Layout as LayoutIcon,
  Speed as SpeedIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  RestoreOutlined as RestoreIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { UICustomizationSettings } from '../types';

interface UICustomizationSettingsProps {
  settings: UICustomizationSettings;
  onSave: (settings: UICustomizationSettings) => void;
  onPreview?: (settings: UICustomizationSettings) => void;
  onReset?: () => void;
}

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, value, onChange }) => {
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="body2" sx={{ minWidth: 100 }}>
        {label}:
      </Typography>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 40,
          height: 40,
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
  );
};

export const UICustomizationSettingsComponent: React.FC<UICustomizationSettingsProps> = ({
  settings,
  onSave,
  onPreview,
  onReset,
}) => {
  const [localSettings, setLocalSettings] = useState<UICustomizationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handlePreview = () => {
    if (onPreview) {
      onPreview(localSettings);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const defaultSettings: UICustomizationSettings = {
    theme: 'light',
    primaryColor: '#1976d2',
    accentColor: '#dc004e',
    fontFamily: 'Roboto',
    fontSize: 'medium',
    density: 'comfortable',
    layout: {
      sidebarPosition: 'left',
      panelLayout: 'horizontal',
      showBreadcrumbs: true,
      showQuickActions: true,
      compactMode: false,
    },
    dashboard: {
      defaultView: 'grid',
      itemsPerPage: 20,
      showThumbnails: true,
      showMetadata: true,
      autoRefresh: false,
      refreshInterval: 30,
    },
    animations: {
      enabled: true,
      speed: 'normal',
      transitions: true,
    },
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Interface Customization</Typography>
        <Box display="flex" gap={1}>
          {onPreview && (
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={!hasChanges}
            >
              Preview
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Changes" to apply them.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Theme & Colors */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PaletteIcon />
                <Typography variant="h6">Theme & Colors</Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={localSettings.theme}
                  onChange={(e) => handleChange(['theme'], e.target.value)}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto (System)</MenuItem>
                  <MenuItem value="high_contrast">High Contrast</MenuItem>
                </Select>
              </FormControl>

              <Box display="flex" flexDirection="column" gap={2}>
                <ColorPicker
                  label="Primary Color"
                  value={localSettings.primaryColor}
                  onChange={(color) => handleChange(['primaryColor'], color)}
                />
                <ColorPicker
                  label="Accent Color"
                  value={localSettings.accentColor}
                  onChange={(color) => handleChange(['accentColor'], color)}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={localSettings.fontFamily}
                  onChange={(e) => handleChange(['fontFamily'], e.target.value)}
                >
                  <MenuItem value="Roboto">Roboto</MenuItem>
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Helvetica">Helvetica</MenuItem>
                  <MenuItem value="Georgia">Georgia</MenuItem>
                  <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                  <MenuItem value="Courier New">Courier New</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Font Size</InputLabel>
                <Select
                  value={localSettings.fontSize}
                  onChange={(e) => handleChange(['fontSize'], e.target.value)}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                  <MenuItem value="extra_large">Extra Large</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Layout & Navigation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LayoutIcon />
                <Typography variant="h6">Layout & Navigation</Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Interface Density</InputLabel>
                <Select
                  value={localSettings.density}
                  onChange={(e) => handleChange(['density'], e.target.value)}
                >
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="comfortable">Comfortable</MenuItem>
                  <MenuItem value="spacious">Spacious</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Sidebar Position
              </Typography>
              <RadioGroup
                value={localSettings.layout.sidebarPosition}
                onChange={(e) => handleChange(['layout', 'sidebarPosition'], e.target.value)}
                row
                sx={{ mb: 2 }}
              >
                <FormControlLabel value="left" control={<Radio />} label="Left" />
                <FormControlLabel value="right" control={<Radio />} label="Right" />
              </RadioGroup>

              <Typography variant="subtitle2" gutterBottom>
                Panel Layout
              </Typography>
              <RadioGroup
                value={localSettings.layout.panelLayout}
                onChange={(e) => handleChange(['layout', 'panelLayout'], e.target.value)}
                row
                sx={{ mb: 2 }}
              >
                <FormControlLabel value="horizontal" control={<Radio />} label="Horizontal" />
                <FormControlLabel value="vertical" control={<Radio />} label="Vertical" />
                <FormControlLabel value="tabs" control={<Radio />} label="Tabs" />
              </RadioGroup>

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.layout.showBreadcrumbs}
                    onChange={(e) => handleChange(['layout', 'showBreadcrumbs'], e.target.checked)}
                  />
                }
                label="Show Breadcrumbs"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.layout.showQuickActions}
                    onChange={(e) => handleChange(['layout', 'showQuickActions'], e.target.checked)}
                  />
                }
                label="Show Quick Actions"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.layout.compactMode}
                    onChange={(e) => handleChange(['layout', 'compactMode'], e.target.checked)}
                  />
                }
                label="Compact Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ViewModuleIcon />
                <Typography variant="h6">Dashboard Settings</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Default View</InputLabel>
                    <Select
                      value={localSettings.dashboard.defaultView}
                      onChange={(e) => handleChange(['dashboard', 'defaultView'], e.target.value)}
                    >
                      <MenuItem value="grid">Grid</MenuItem>
                      <MenuItem value="list">List</MenuItem>
                      <MenuItem value="table">Table</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Items per Page</InputLabel>
                    <Select
                      value={localSettings.dashboard.itemsPerPage}
                      onChange={(e) => handleChange(['dashboard', 'itemsPerPage'], e.target.value)}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.dashboard.showThumbnails}
                          onChange={(e) => handleChange(['dashboard', 'showThumbnails'], e.target.checked)}
                        />
                      }
                      label="Show Thumbnails"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.dashboard.showMetadata}
                          onChange={(e) => handleChange(['dashboard', 'showMetadata'], e.target.checked)}
                        />
                      }
                      label="Show Metadata"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.dashboard.autoRefresh}
                        onChange={(e) => handleChange(['dashboard', 'autoRefresh'], e.target.checked)}
                      />
                    }
                    label="Auto Refresh"
                  />
                  {localSettings.dashboard.autoRefresh && (
                    <Box sx={{ mt: 2 }}>
                      <Typography gutterBottom>
                        Refresh Interval: {localSettings.dashboard.refreshInterval} seconds
                      </Typography>
                      <Slider
                        value={localSettings.dashboard.refreshInterval}
                        onChange={(_, value) => handleChange(['dashboard', 'refreshInterval'], value)}
                        min={5}
                        max={300}
                        step={5}
                        marks={[
                          { value: 5, label: '5s' },
                          { value: 30, label: '30s' },
                          { value: 60, label: '1m' },
                          { value: 300, label: '5m' },
                        ]}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Animation Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SpeedIcon />
                <Typography variant="h6">Animation Settings</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.animations.enabled}
                    onChange={(e) => handleChange(['animations', 'enabled'], e.target.checked)}
                  />
                }
                label="Enable Animations"
                sx={{ mb: 2 }}
              />

              {localSettings.animations.enabled && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Animation Speed</InputLabel>
                    <Select
                      value={localSettings.animations.speed}
                      onChange={(e) => handleChange(['animations', 'speed'], e.target.value)}
                    >
                      <MenuItem value="slow">Slow</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="fast">Fast</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.animations.transitions}
                        onChange={(e) => handleChange(['animations', 'transitions'], e.target.checked)}
                      />
                    }
                    label="Page Transitions"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: localSettings.theme === 'dark' ? 'grey.900' : 'background.paper',
                  color: localSettings.theme === 'dark' ? 'common.white' : 'text.primary',
                  fontFamily: localSettings.fontFamily,
                  fontSize: {
                    small: '0.875rem',
                    medium: '1rem',
                    large: '1.125rem',
                    extra_large: '1.25rem',
                  }[localSettings.fontSize],
                  border: `2px solid ${localSettings.primaryColor}`,
                }}
              >
                <Typography variant="h6" sx={{ color: localSettings.primaryColor, mb: 1 }}>
                  SharePoint AI Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: localSettings.accentColor, mb: 2 }}>
                  This is how your interface will look with the current settings.
                </Typography>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: localSettings.primaryColor,
                    color: 'white',
                    borderRadius: 1,
                    display: 'inline-block',
                  }}
                >
                  Sample Button
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};