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
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
  InsertDriveFile as CsvIcon,
  Archive as ZipIcon,
  Email as EmailIcon,
  Cloud as CloudIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  DataObject as DataIcon,
  Assessment as ReportIcon,
  Analytics as AnalyticsIcon,
  Summarize as SummaryIcon,
  Translate as TranslateIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { 
  AIAnalysisResult, 
  SharePointFile, 
  SummarizationResult,
  SentimentAnalysisResult,
  ChatSession 
} from '../types';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'word' | 'html' | 'zip';
  includeMetadata: boolean;
  includeContent: boolean;
  includeAnalysis: boolean;
  includeComments: boolean;
  includeVersionHistory: boolean;
  compression: 'none' | 'low' | 'medium' | 'high';
  password?: string;
  watermark?: string;
  customTemplate?: string;
}

interface ExportJob {
  id: string;
  name: string;
  type: 'files' | 'analysis' | 'chat' | 'reports';
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
  options: ExportOptions;
}

interface AnalysisExportData {
  files: SharePointFile[];
  analysisResults: AIAnalysisResult[];
  summaries?: SummarizationResult[];
  sentimentAnalysis?: SentimentAnalysisResult[];
  chatSessions?: ChatSession[];
}

interface ExportManagerProps {
  data?: AnalysisExportData;
  files?: SharePointFile[];
  chatSessions?: ChatSession[];
  onClose?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const ExportManager: React.FC<ExportManagerProps> = ({
  data,
  files = [],
  chatSessions = [],
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeContent: true,
    includeAnalysis: true,
    includeComments: false,
    includeVersionHistory: false,
    compression: 'medium',
  });

  // Form states
  const [exportName, setExportName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [scheduleExport, setScheduleExport] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [customTemplate, setCustomTemplate] = useState('');

  useEffect(() => {
    loadExportHistory();
    generateDefaultName();
  }, [data, files, chatSessions]);

  const loadExportHistory = async () => {
    try {
      const response = await fetch('/api/exports/history');
      const result = await response.json();
      if (result.success) {
        setExportJobs(result.data);
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const generateDefaultName = () => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    
    if (data?.analysisResults) {
      setExportName(`Analysis Results - ${timestamp}`);
    } else if (chatSessions.length > 0) {
      setExportName(`Chat Sessions - ${timestamp}`);
    } else if (files.length > 0) {
      setExportName(`Files Export - ${timestamp}`);
    } else {
      setExportName(`Export - ${timestamp}`);
    }
  };

  const handleStartExport = async () => {
    try {
      const exportPayload = {
        name: exportName,
        description: exportDescription,
        type: getExportType(),
        options: exportOptions,
        items: selectedItems.length > 0 ? selectedItems : getAllItemIds(),
        data: data,
        files: files,
        chatSessions: chatSessions,
        scheduled: scheduleExport ? scheduledDate : undefined,
        emailRecipients: emailRecipients.split(',').map(email => email.trim()).filter(Boolean),
        customTemplate,
      };

      const response = await fetch('/api/exports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportPayload),
      });

      const result = await response.json();
      
      if (result.success) {
        const newJob: ExportJob = {
          ...result.data,
          status: 'pending',
          progress: 0,
          startTime: new Date().toISOString(),
        };
        
        setExportJobs(prev => [newJob, ...prev]);
        setCurrentStep(2); // Move to progress step
        
        // Start polling for job status
        pollJobStatus(newJob.id);
      } else {
        throw new Error(result.error?.message || 'Export failed');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      // Handle error
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/exports/${jobId}/status`);
        const result = await response.json();
        
        if (result.success) {
          setExportJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, ...result.data } : job
          ));
          
          if (result.data.status === 'completed' || result.data.status === 'error') {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Clear polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  const handleDownloadExport = (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = `${job.name}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCancelExport = async (jobId: string) => {
    try {
      const response = await fetch(`/api/exports/${jobId}/cancel`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'cancelled' as const } : job
        ));
      }
    } catch (error) {
      console.error('Failed to cancel export:', error);
    }
  };

  const getExportType = (): ExportJob['type'] => {
    if (data?.analysisResults) return 'analysis';
    if (chatSessions.length > 0) return 'chat';
    if (files.length > 0) return 'files';
    return 'reports';
  };

  const getAllItemIds = (): string[] => {
    const ids: string[] = [];
    
    if (data?.files) {
      ids.push(...data.files.map(f => f.id));
    }
    if (files.length > 0) {
      ids.push(...files.map(f => f.id));
    }
    if (chatSessions.length > 0) {
      ids.push(...chatSessions.map(c => c.id));
    }
    
    return ids;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'csv': return <CsvIcon />;
      case 'json': return <JsonIcon />;
      case 'zip': return <ZipIcon />;
      default: return <FileIcon />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'processing': return 'info';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (start: string, end?: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = (endTime - startTime) / 1000;
    
    if (duration < 60) return `${Math.round(duration)}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0: // Select Items and Format
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Export Format and Items
            </Typography>
            
            {/* Format Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportOptions.format}
                label="Export Format"
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  format: e.target.value as ExportOptions['format']
                }))}
              >
                <MenuItem value="pdf">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon /> PDF Document
                  </Box>
                </MenuItem>
                <MenuItem value="excel">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExcelIcon /> Excel Spreadsheet
                  </Box>
                </MenuItem>
                <MenuItem value="csv">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CsvIcon /> CSV File
                  </Box>
                </MenuItem>
                <MenuItem value="json">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <JsonIcon /> JSON Data
                  </Box>
                </MenuItem>
                <MenuItem value="zip">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ZipIcon /> ZIP Archive
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Content Selection */}
            <Typography variant="subtitle1" gutterBottom>
              What to Include
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeMetadata: e.target.checked 
                    }))}
                  />
                }
                label="Include Metadata (file properties, dates, authors)"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeContent}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeContent: e.target.checked 
                    }))}
                  />
                }
                label="Include File Content"
              />
              
              {data?.analysisResults && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeAnalysis}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeAnalysis: e.target.checked 
                      }))}
                    />
                  }
                  label="Include AI Analysis Results"
                />
              )}
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeComments}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeComments: e.target.checked 
                    }))}
                  />
                }
                label="Include Comments and Annotations"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeVersionHistory}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeVersionHistory: e.target.checked 
                    }))}
                  />
                }
                label="Include Version History"
              />
            </Box>

            {/* Item Selection */}
            {(data?.files || files.length > 0) && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Select Items to Export
                </Typography>
                
                <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                  {(data?.files || files).map(file => (
                    <ListItem key={file.id}>
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedItems.includes(file.id) || selectedItems.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(prev => [...prev, file.id]);
                            } else {
                              setSelectedItems(prev => prev.filter(id => id !== file.id));
                            }
                          }}
                        />
                      </ListItemIcon>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${formatFileSize(file.size)} • ${new Date(file.lastModifiedDateTime).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setSelectedItems(getAllItemIds())}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear Selection
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 1: // Configure Options
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Export Options
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Export Name"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                fullWidth
              />
              
              <TextField
                label="Description (Optional)"
                value={exportDescription}
                onChange={(e) => setExportDescription(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Advanced Options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl>
                      <InputLabel>Compression Level</InputLabel>
                      <Select
                        value={exportOptions.compression}
                        label="Compression Level"
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          compression: e.target.value as ExportOptions['compression']
                        }))}
                      >
                        <MenuItem value="none">None (Fastest)</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium (Recommended)</MenuItem>
                        <MenuItem value="high">High (Smallest size)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Password Protection (Optional)"
                      type="password"
                      value={exportOptions.password || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        password: e.target.value || undefined 
                      }))}
                      placeholder="Enter password to protect export"
                    />
                    
                    <TextField
                      label="Watermark Text (Optional)"
                      value={exportOptions.watermark || ''}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        watermark: e.target.value || undefined 
                      }))}
                      placeholder="e.g., CONFIDENTIAL"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Delivery Options</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={scheduleExport}
                          onChange={(e) => setScheduleExport(e.target.checked)}
                        />
                      }
                      label="Schedule Export"
                    />
                    
                    {scheduleExport && (
                      <TextField
                        type="datetime-local"
                        label="Schedule Date & Time"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                    
                    <TextField
                      label="Email Recipients (Optional)"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      helperText="Comma-separated email addresses to notify when export is ready"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>
        );

      case 2: // Export Progress
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Export Progress
            </Typography>
            
            {exportJobs.length > 0 && (
              <List>
                {exportJobs.slice(0, 3).map(job => (
                  <ListItem key={job.id}>
                    <ListItemIcon>
                      {getFormatIcon(job.options.format)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{job.name}</Typography>
                          <Chip
                            label={job.status}
                            size="small"
                            color={getStatusColor(job.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Started: {new Date(job.startTime).toLocaleString()}
                            {job.endTime && ` • Duration: ${formatDuration(job.startTime, job.endTime)}`}
                            {job.fileSize && ` • Size: ${formatFileSize(job.fileSize)}`}
                          </Typography>
                          
                          {job.status === 'processing' && (
                            <LinearProgress
                              variant="determinate"
                              value={job.progress}
                              sx={{ mt: 1 }}
                            />
                          )}
                          
                          {job.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {job.error}
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      {job.status === 'completed' && (
                        <Tooltip title="Download">
                          <IconButton onClick={() => handleDownloadExport(job)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {job.status === 'processing' && (
                        <Tooltip title="Cancel">
                          <IconButton onClick={() => handleCancelExport(job.id)}>
                            <ExpandMoreIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );

      default:
        return null;
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
          <DownloadIcon />
          <Typography variant="h6">Export Manager</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Export Wizard" />
          <Tab label="Export History" />
          <Tab label="Templates" />
        </Tabs>

        {/* Export Wizard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stepper activeStep={currentStep} orientation="vertical">
            <Step>
              <StepLabel>Select Format & Items</StepLabel>
              <StepContent>
                {getStepContent(0)}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setCurrentStep(1)}
                    disabled={exportOptions.format === '' || 
                      (selectedItems.length === 0 && getAllItemIds().length > 0)}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Configure Options</StepLabel>
              <StepContent>
                {getStepContent(1)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setCurrentStep(0)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleStartExport}
                    disabled={!exportName.trim()}
                  >
                    Start Export
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Export Progress</StepLabel>
              <StepContent>
                {getStepContent(2)}
                <Box sx={{ mt: 2 }}>
                  <Button onClick={() => setCurrentStep(0)}>
                    New Export
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </TabPanel>

        {/* Export History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export History
            </Typography>
            
            <List>
              {exportJobs.map(job => (
                <ListItem key={job.id}>
                  <ListItemIcon>
                    {getFormatIcon(job.options.format)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{job.name}</Typography>
                        <Chip
                          label={job.status}
                          size="small"
                          color={getStatusColor(job.status) as any}
                        />
                        <Chip
                          label={job.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(job.startTime).toLocaleString()}
                          {job.fileSize && ` • ${formatFileSize(job.fileSize)}`}
                        </Typography>
                        
                        {job.description && (
                          <Typography variant="caption" color="text.secondary">
                            {job.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    {job.status === 'completed' && job.downloadUrl && (
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadExport(job)}
                      >
                        Download
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              {exportJobs.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No export history"
                    secondary="Your completed exports will appear here"
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export Templates
            </Typography>
            
            <Alert severity="info">
              Export templates allow you to save commonly used export configurations for quick reuse.
              This feature will be available in a future update.
            </Alert>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};