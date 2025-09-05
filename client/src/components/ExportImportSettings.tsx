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
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TimePicker,
  FormGroup,
  Checkbox,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { ExportImportSettings } from '../types';

interface ExportImportSettingsProps {
  settings: ExportImportSettings;
  onSave: (settings: ExportImportSettings) => void;
  onTestExport?: () => Promise<boolean>;
  onTestImport?: () => Promise<boolean>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const ExportImportSettingsComponent: React.FC<ExportImportSettingsProps> = ({
  settings,
  onSave,
  onTestExport,
  onTestImport,
}) => {
  const [localSettings, setLocalSettings] = useState<ExportImportSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);

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

  const handleAddSchedule = () => {
    setEditingSchedule({
      id: `schedule_${Date.now()}`,
      name: '',
      frequency: 'daily',
      time: '00:00',
      enabled: true,
      recipients: [],
      format: 'json',
      filters: {},
    });
    setActiveStep(0);
    setScheduleDialogOpen(true);
  };

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule({ ...schedule });
    setActiveStep(0);
    setScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updatedSchedules = localSettings.scheduling.exportSchedules.filter(s => s.id !== scheduleId);
    handleChange(['scheduling', 'exportSchedules'], updatedSchedules);
  };

  const handleSaveSchedule = () => {
    if (!editingSchedule) return;

    const isNew = !localSettings.scheduling.exportSchedules.find(s => s.id === editingSchedule.id);
    let updatedSchedules;

    if (isNew) {
      updatedSchedules = [...localSettings.scheduling.exportSchedules, editingSchedule];
    } else {
      updatedSchedules = localSettings.scheduling.exportSchedules.map(s =>
        s.id === editingSchedule.id ? editingSchedule : s
      );
    }

    handleChange(['scheduling', 'exportSchedules'], updatedSchedules);
    setScheduleDialogOpen(false);
    setEditingSchedule(null);
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'csv', label: 'CSV', description: 'Comma-Separated Values' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
  ];

  const encryptionAlgorithms = [
    { value: 'AES-256', label: 'AES-256', description: 'Advanced Encryption Standard 256-bit' },
    { value: 'AES-128', label: 'AES-128', description: 'Advanced Encryption Standard 128-bit' },
  ];

  const scheduleSteps = ['Basic Info', 'Content & Format', 'Recipients', 'Review'];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Export/Import Settings</Typography>
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

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Export Settings" icon={<ExportIcon />} />
        <Tab label="Import Settings" icon={<ImportIcon />} />
        <Tab label="Scheduled Exports" icon={<ScheduleIcon />} />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Basic Export Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ExportIcon />
                  <Typography variant="h6">Export Configuration</Typography>
                  {onTestExport && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onTestExport}
                      sx={{ ml: 'auto' }}
                    >
                      Test Export
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Default Format</InputLabel>
                      <Select
                        value={localSettings.export.defaultFormat}
                        onChange={(e) => handleChange(['export', 'defaultFormat'], e.target.value)}
                      >
                        {formatOptions.map((format) => (
                          <MenuItem key={format.value} value={format.value}>
                            <Box>
                              <Typography variant="body2">{format.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format.description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max File Size (MB)"
                      type="number"
                      value={localSettings.export.maxFileSize}
                      onChange={(e) => handleChange(['export', 'maxFileSize'], parseInt(e.target.value, 10))}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch Size"
                      type="number"
                      value={localSettings.export.batchSize}
                      onChange={(e) => handleChange(['export', 'batchSize'], parseInt(e.target.value, 10))}
                      helperText="Records per batch"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Parallel Jobs"
                      type="number"
                      value={localSettings.export.parallelJobs}
                      onChange={(e) => handleChange(['export', 'parallelJobs'], parseInt(e.target.value, 10))}
                      helperText="Concurrent export jobs"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.export.compression}
                          onChange={(e) => handleChange(['export', 'compression'], e.target.checked)}
                        />
                      }
                      label="Enable Compression"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.export.includeMetadata}
                          onChange={(e) => handleChange(['export', 'includeMetadata'], e.target.checked)}
                        />
                      }
                      label="Include Metadata"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SecurityIcon />
                  <Typography variant="h6">Security & Encryption</Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.export.encryption.enabled}
                      onChange={(e) => handleChange(['export', 'encryption', 'enabled'], e.target.checked)}
                    />
                  }
                  label="Enable Encryption"
                  sx={{ mb: 2 }}
                />

                {localSettings.export.encryption.enabled && (
                  <FormControl fullWidth>
                    <InputLabel>Encryption Algorithm</InputLabel>
                    <Select
                      value={localSettings.export.encryption.algorithm || 'AES-256'}
                      onChange={(e) => handleChange(['export', 'encryption', 'algorithm'], e.target.value)}
                    >
                      {encryptionAlgorithms.map((algo) => (
                        <MenuItem key={algo.value} value={algo.value}>
                          <Box>
                            <Typography variant="body2">{algo.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {algo.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  Encrypted exports will require a password to access. Make sure to store passwords securely.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Import Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ImportIcon />
                  <Typography variant="h6">Import Configuration</Typography>
                  {onTestImport && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onTestImport}
                      sx={{ ml: 'auto' }}
                    >
                      Test Import
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Allowed Formats
                    </Typography>
                    <FormGroup row>
                      {formatOptions.map((format) => (
                        <FormControlLabel
                          key={format.value}
                          control={
                            <Checkbox
                              checked={localSettings.import.allowedFormats.includes(format.value)}
                              onChange={(e) => {
                                const currentFormats = localSettings.import.allowedFormats;
                                const newFormats = e.target.checked
                                  ? [...currentFormats, format.value]
                                  : currentFormats.filter(f => f !== format.value);
                                handleChange(['import', 'allowedFormats'], newFormats);
                              }}
                            />
                          }
                          label={format.label}
                        />
                      ))}
                    </FormGroup>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max File Size (MB)"
                      type="number"
                      value={localSettings.import.maxFileSize}
                      onChange={(e) => handleChange(['import', 'maxFileSize'], parseInt(e.target.value, 10))}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch Size"
                      type="number"
                      value={localSettings.import.batchSize}
                      onChange={(e) => handleChange(['import', 'batchSize'], parseInt(e.target.value, 10))}
                      helperText="Records per batch"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Duplicate Handling</InputLabel>
                      <Select
                        value={localSettings.import.duplicateHandling}
                        onChange={(e) => handleChange(['import', 'duplicateHandling'], e.target.value)}
                      >
                        <MenuItem value="skip">Skip Duplicates</MenuItem>
                        <MenuItem value="overwrite">Overwrite Existing</MenuItem>
                        <MenuItem value="append">Append Data</MenuItem>
                        <MenuItem value="prompt">Prompt User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Validation Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SettingsIcon />
                  <Typography variant="h6">Validation Settings</Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.import.validation.strictMode}
                        onChange={(e) => handleChange(['import', 'validation', 'strictMode'], e.target.checked)}
                      />
                    }
                    label="Strict Mode"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.import.validation.skipInvalidRows}
                        onChange={(e) => handleChange(['import', 'validation', 'skipInvalidRows'], e.target.checked)}
                      />
                    }
                    label="Skip Invalid Rows"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.import.validation.requireHeaders}
                        onChange={(e) => handleChange(['import', 'validation', 'requireHeaders'], e.target.checked)}
                      />
                    }
                    label="Require Headers"
                  />
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  Strict mode will reject imports with any validation errors. Disable for more lenient imports.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6">Scheduled Exports</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.scheduling.enabled}
                  onChange={(e) => handleChange(['scheduling', 'enabled'], e.target.checked)}
                />
              }
              label="Enable Scheduled Exports"
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSchedule}
            disabled={!localSettings.scheduling.enabled}
          >
            Add Schedule
          </Button>
        </Box>

        {localSettings.scheduling.enabled ? (
          <Grid container spacing={2}>
            {localSettings.scheduling.exportSchedules.map((schedule) => (
              <Grid item xs={12} key={schedule.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{schedule.name}</Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Chip
                            label={schedule.frequency}
                            size="small"
                            icon={<EventIcon />}
                          />
                          <Chip
                            label={schedule.time}
                            size="small"
                            icon={<ScheduleIcon />}
                          />
                          <Chip
                            label={schedule.format.toUpperCase()}
                            size="small"
                          />
                          <Chip
                            label={schedule.enabled ? 'Active' : 'Paused'}
                            size="small"
                            color={schedule.enabled ? 'success' : 'default'}
                            icon={schedule.enabled ? <PlayIcon /> : <PauseIcon />}
                          />
                        </Box>
                        {schedule.recipients.length > 0 && (
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <PeopleIcon fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {schedule.recipients.length} recipient(s)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          onClick={() =>
                            handleChange(
                              ['scheduling', 'exportSchedules'],
                              localSettings.scheduling.exportSchedules.map(s =>
                                s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
                              )
                            )
                          }
                        >
                          {schedule.enabled ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                        <IconButton onClick={() => handleEditSchedule(schedule)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {localSettings.scheduling.exportSchedules.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No scheduled exports configured. Click "Add Schedule" to create your first automated export.
                </Alert>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="info">
            Enable scheduled exports to automatically generate and send reports on a regular basis.
          </Alert>
        )}
      </TabPanel>

      {/* Schedule Creation Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSchedule?.name && localSettings.scheduling.exportSchedules.find(s => s.id === editingSchedule.id)
            ? 'Edit Export Schedule'
            : 'Create New Export Schedule'
          }
        </DialogTitle>
        <DialogContent>
          {editingSchedule && (
            <Box sx={{ mt: 2 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {scheduleSteps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                    <StepContent>
                      {index === 0 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Schedule Name"
                              value={editingSchedule.name}
                              onChange={(e) =>
                                setEditingSchedule({ ...editingSchedule, name: e.target.value })
                              }
                              required
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel>Frequency</InputLabel>
                              <Select
                                value={editingSchedule.frequency}
                                onChange={(e) =>
                                  setEditingSchedule({ ...editingSchedule, frequency: e.target.value })
                                }
                              >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Time"
                              type="time"
                              value={editingSchedule.time}
                              onChange={(e) =>
                                setEditingSchedule({ ...editingSchedule, time: e.target.value })
                              }
                            />
                          </Grid>
                        </Grid>
                      )}

                      {index === 1 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Export Format</InputLabel>
                              <Select
                                value={editingSchedule.format}
                                onChange={(e) =>
                                  setEditingSchedule({ ...editingSchedule, format: e.target.value })
                                }
                              >
                                {formatOptions.map((format) => (
                                  <MenuItem key={format.value} value={format.value}>
                                    {format.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      )}

                      {index === 2 && (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Recipients (comma-separated emails)"
                              value={editingSchedule.recipients.join(', ')}
                              onChange={(e) =>
                                setEditingSchedule({
                                  ...editingSchedule,
                                  recipients: e.target.value.split(',').map(email => email.trim()),
                                })
                              }
                              placeholder="user1@example.com, user2@example.com"
                            />
                          </Grid>
                        </Grid>
                      )}

                      {index === 3 && (
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>Review Schedule</Typography>
                          <Typography variant="body2">Name: {editingSchedule.name}</Typography>
                          <Typography variant="body2">Frequency: {editingSchedule.frequency}</Typography>
                          <Typography variant="body2">Time: {editingSchedule.time}</Typography>
                          <Typography variant="body2">Format: {editingSchedule.format}</Typography>
                          <Typography variant="body2">Recipients: {editingSchedule.recipients.length}</Typography>
                        </Paper>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <div>
                          <Button
                            variant="contained"
                            onClick={() => {
                              if (activeStep === scheduleSteps.length - 1) {
                                handleSaveSchedule();
                              } else {
                                setActiveStep(activeStep + 1);
                              }
                            }}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {activeStep === scheduleSteps.length - 1 ? 'Create Schedule' : 'Continue'}
                          </Button>
                          <Button
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep(activeStep - 1)}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Back
                          </Button>
                        </div>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};