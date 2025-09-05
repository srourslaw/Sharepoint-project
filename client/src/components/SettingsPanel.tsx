import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Storage as StorageIcon,
  SmartToy as AIIcon,
  Palette as UIIcon,
  Notifications as NotificationsIcon,
  Policy as PolicyIcon,
  ImportExport as ImportExportIcon,
  Accessibility as AccessibilityIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  NavigateNext as NavigateNextIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { SharePointConnectionSettings } from './SharePointConnectionSettings';
import { AIModelSettings } from './AIModelSettings';
import { UICustomizationSettingsComponent } from './UICustomizationSettings';
import { NotificationSettingsComponent } from './NotificationSettings';
import { DataRetentionSettings } from './DataRetentionSettings';
import { ExportImportSettingsComponent } from './ExportImportSettings';
import { AccessibilitySettingsComponent } from './AccessibilitySettings';
import { 
  AppSettings, 
  SharePointConnectionConfig, 
  AIModelConfig,
  UICustomizationSettings,
  NotificationSettings,
  DataRetentionPolicy,
  ExportImportSettings,
  AccessibilitySettings,
  SettingsValidationResult,
  SettingsBackup
} from '../types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onExportSettings?: () => Promise<Blob>;
  onImportSettings?: (settings: Partial<AppSettings>) => Promise<boolean>;
  onValidateSettings?: (settings: AppSettings) => Promise<SettingsValidationResult>;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
  description: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onClose,
  settings,
  onSave,
  onExportSettings,
  onImportSettings,
  onValidateSettings,
}) => {
  const [currentSection, setCurrentSection] = useState('sharepoint');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [validationResult, setValidationResult] = useState<SettingsValidationResult | null>(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const settingsSections: SettingsSection[] = [
    {
      id: 'sharepoint',
      label: 'SharePoint Connections',
      icon: StorageIcon,
      component: SharePointConnectionSettings,
      description: 'Configure SharePoint site connections and authentication',
    },
    {
      id: 'ai',
      label: 'AI Models',
      icon: AIIcon,
      component: AIModelSettings,
      description: 'Manage AI model configurations and parameters',
    },
    {
      id: 'ui',
      label: 'Interface',
      icon: UIIcon,
      component: UICustomizationSettingsComponent,
      description: 'Customize the user interface appearance and behavior',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: NotificationsIcon,
      component: NotificationSettingsComponent,
      description: 'Configure notification preferences and delivery methods',
    },
    {
      id: 'retention',
      label: 'Data Retention',
      icon: PolicyIcon,
      component: DataRetentionSettings,
      description: 'Manage data retention policies and compliance settings',
    },
    {
      id: 'export',
      label: 'Export/Import',
      icon: ImportExportIcon,
      component: ExportImportSettingsComponent,
      description: 'Configure data export and import settings',
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: AccessibilityIcon,
      component: AccessibilitySettingsComponent,
      description: 'Configure accessibility features and assistive technologies',
    },
  ];

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  const handleSettingsChange = (section: keyof AppSettings, newValue: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: newValue,
      lastModified: new Date().toISOString(),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate settings if validator is provided
      if (onValidateSettings) {
        const validation = await onValidateSettings(localSettings);
        setValidationResult(validation);
        
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: 'Settings validation failed. Please fix the errors and try again.',
            severity: 'error',
          });
          return;
        }
      }

      await onSave(localSettings);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSettings = async () => {
    if (!onExportSettings) return;
    
    setLoading(true);
    try {
      const blob = await onExportSettings();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: 'Settings exported successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSettings = async (file: File) => {
    if (!onImportSettings) return;
    
    setLoading(true);
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      const success = await onImportSettings(importedSettings);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Settings imported successfully! Please review and save changes.',
          severity: 'success',
        });
        setImportDialogOpen(false);
      } else {
        throw new Error('Import validation failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to import settings. Please check the file format.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentSectionData = settingsSections.find(s => s.id === currentSection);
  const CurrentComponent = currentSectionData?.component;

  const getComponentProps = () => {
    switch (currentSection) {
      case 'sharepoint':
        return {
          connections: localSettings.sharepoint,
          onSave: (connections: SharePointConnectionConfig[]) => 
            handleSettingsChange('sharepoint', connections),
          onTestConnection: async (connection: SharePointConnectionConfig) => {
            // Mock test implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
          },
        };
      case 'ai':
        return {
          models: localSettings.aiModels,
          onSave: (models: AIModelConfig[]) => 
            handleSettingsChange('aiModels', models),
          onTestModel: async (model: AIModelConfig) => {
            // Mock test implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
          },
        };
      case 'ui':
        return {
          settings: localSettings.ui,
          onSave: (ui: UICustomizationSettings) => 
            handleSettingsChange('ui', ui),
          onPreview: (ui: UICustomizationSettings) => {
            // Preview implementation
            console.log('Previewing UI settings:', ui);
          },
          onReset: () => {
            // Reset to defaults
            const defaultUI: UICustomizationSettings = {
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
            handleSettingsChange('ui', defaultUI);
          },
        };
      case 'notifications':
        return {
          settings: localSettings.notifications,
          onSave: (notifications: NotificationSettings) => 
            handleSettingsChange('notifications', notifications),
          onTestNotification: async (type: 'email' | 'browser' | 'mobile' | 'slack') => {
            // Mock test implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
          },
        };
      case 'retention':
        return {
          policies: localSettings.dataRetention,
          onSave: (policies: DataRetentionPolicy[]) => 
            handleSettingsChange('dataRetention', policies),
        };
      case 'export':
        return {
          settings: localSettings.exportImport,
          onSave: (exportImport: ExportImportSettings) => 
            handleSettingsChange('exportImport', exportImport),
          onTestExport: async () => {
            // Mock test implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
          },
          onTestImport: async () => {
            // Mock test implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
          },
        };
      case 'accessibility':
        return {
          settings: localSettings.accessibility,
          onSave: (accessibility: AccessibilitySettings) => 
            handleSettingsChange('accessibility', accessibility),
          onTestScreenReader: () => {
            // Test screen reader functionality
            console.log('Testing screen reader...');
          },
          onTestKeyboardNavigation: () => {
            // Test keyboard navigation
            console.log('Testing keyboard navigation...');
          },
          onPreview: (accessibility: AccessibilitySettings) => {
            // Preview accessibility settings
            console.log('Previewing accessibility settings:', accessibility);
          },
        };
      default:
        return {};
    }
  };

  const hasUnsavedChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80vw',
            maxWidth: 1200,
            height: '100vh',
          },
        }}
      >
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Navigation Sidebar */}
          <Paper
            sx={{
              width: 280,
              borderRadius: 0,
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <SettingsIcon />
                  <Typography variant="h6">Settings</Typography>
                </Box>
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <List sx={{ p: 1 }}>
              {settingsSections.map((section) => (
                <ListItem
                  key={section.id}
                  button
                  selected={currentSection === section.id}
                  onClick={() => handleSectionChange(section.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <section.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    secondary={currentSection === section.id ? section.description : ''}
                    secondaryTypographyProps={{
                      color: currentSection === section.id ? 'inherit' : 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider />

            {/* Settings Actions */}
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Settings Management
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportSettings}
                  disabled={!onExportSettings}
                >
                  Export Settings
                </Button>
                <Button
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  disabled={!onImportSettings}
                >
                  Import Settings
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Main Content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                <Link color="inherit" onClick={() => setCurrentSection('sharepoint')}>
                  Settings
                </Link>
                <Typography color="text.primary">
                  {currentSectionData?.label}
                </Typography>
              </Breadcrumbs>
              <Typography variant="body2" color="text.secondary">
                {currentSectionData?.description}
              </Typography>
            </Box>

            {/* Validation Alerts */}
            {validationResult && !validationResult.isValid && (
              <Alert severity="error" sx={{ m: 2 }}>
                <Typography variant="subtitle2">Settings Validation Errors:</Typography>
                <ul>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>
                      <strong>{error.field}:</strong> {error.message}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {validationResult?.warnings && validationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ m: 2 }}>
                <Typography variant="subtitle2">Warnings:</Typography>
                <ul>
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>
                      <strong>{warning.field}:</strong> {warning.message}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Settings Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {CurrentComponent && <CurrentComponent {...getComponentProps()} />}
            </Box>

            {/* Footer Actions */}
            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  {hasUnsavedChanges && (
                    <Typography variant="body2" color="warning.main">
                      You have unsaved changes
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={1}>
                  <Button onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={loading || !hasUnsavedChanges}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select a settings backup file to import:
          </Typography>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportSettings(file);
              }
            }}
            style={{ marginTop: 16 }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Importing settings will overwrite your current configuration. Make sure to export your current settings first.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};