import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
  InsertDriveFile as CsvIcon,
  Description as WordIcon,
  Image as ImageIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as ReportIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Speed as PerformanceIcon,
  Psychology as AIIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { 
  AnalyticsReport, 
  AnalyticsFilter,
  DocumentUsageStats,
  AIInteractionStats,
  PerformanceMetrics,
  UserActivityLog,
  StorageUsageStats,
} from '../types';

interface AnalyticsReportExporterProps {
  onClose?: () => void;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: AnalyticsReport['type'];
  sections: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'word';
  predefinedFilters?: AnalyticsFilter;
}

interface ExportJob {
  id: string;
  name: string;
  type: AnalyticsReport['type'];
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: string;
  endTime?: string;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
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

export const AnalyticsReportExporter: React.FC<AnalyticsReportExporterProps> = ({
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [savedReports, setSavedReports] = useState<AnalyticsReport[]>([]);

  // Export configuration
  const [reportType, setReportType] = useState<AnalyticsReport['type']>('document_usage');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'json' | 'word'>('pdf');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Report sections
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    charts: true,
    tables: true,
    insights: true,
    rawData: false,
    appendices: false,
  });

  // Formatting options
  const [formatOptions, setFormatOptions] = useState({
    includeHeaders: true,
    includeBranding: true,
    includeTimestamp: true,
    includeFilters: true,
    colorCharts: true,
    highResolution: true,
  });

  // Delivery options
  const [deliveryOptions, setDeliveryOptions] = useState({
    emailRecipients: '',
    scheduleExport: false,
    scheduledTime: '',
    autoRefresh: false,
    refreshInterval: '24h',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);

  useEffect(() => {
    loadExportHistory();
    loadSavedReports();
    generateDefaultName();
  }, [reportType]);

  const loadExportHistory = async () => {
    try {
      const response = await fetch('/api/analytics/reports/export-history');
      const data = await response.json();
      if (data.success) {
        setExportJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const loadSavedReports = async () => {
    try {
      const response = await fetch('/api/analytics/reports/saved');
      const data = await response.json();
      if (data.success) {
        setSavedReports(data.data);
      }
    } catch (error) {
      console.error('Failed to load saved reports:', error);
    }
  };

  const generateDefaultName = () => {
    const date = new Date().toISOString().split('T')[0];
    const typeMap = {
      document_usage: 'Document Usage Report',
      ai_analytics: 'AI Analytics Report',
      performance: 'Performance Metrics Report',
      user_activity: 'User Activity Report',
      storage: 'Storage Usage Report',
      custom: 'Custom Analytics Report',
    };
    setReportName(`${typeMap[reportType]} - ${date}`);
  };

  const getExportTemplates = (): ExportTemplate[] => {
    return [
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level overview for leadership',
        type: 'document_usage',
        sections: ['summary', 'charts', 'insights'],
        format: 'pdf',
        predefinedFilters: {
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
      },
      {
        id: 'detailed-analytics',
        name: 'Detailed Analytics',
        description: 'Comprehensive analysis with all data',
        type: 'ai_analytics',
        sections: ['summary', 'charts', 'tables', 'insights', 'rawData'],
        format: 'excel',
      },
      {
        id: 'performance-dashboard',
        name: 'Performance Dashboard',
        description: 'System performance and health metrics',
        type: 'performance',
        sections: ['summary', 'charts', 'tables'],
        format: 'pdf',
      },
      {
        id: 'storage-audit',
        name: 'Storage Audit Report',
        description: 'Storage usage and optimization recommendations',
        type: 'storage',
        sections: ['summary', 'charts', 'insights', 'appendices'],
        format: 'pdf',
      },
      {
        id: 'user-activity-log',
        name: 'User Activity Log',
        description: 'Detailed user activity and audit trail',
        type: 'user_activity',
        sections: ['tables', 'rawData'],
        format: 'csv',
      },
    ];
  };

  const handleStartExport = async () => {
    try {
      const exportConfig = {
        name: reportName,
        description: reportDescription,
        type: reportType,
        format: exportFormat,
        dateRange,
        includeSections,
        formatOptions,
        deliveryOptions,
        template: selectedTemplate?.id,
      };

      const response = await fetch('/api/analytics/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportConfig),
      });

      const data = await response.json();
      
      if (data.success) {
        const newJob: ExportJob = {
          ...data.data,
          status: 'pending',
          progress: 0,
          startTime: new Date().toISOString(),
        };
        
        setExportJobs(prev => [newJob, ...prev]);
        setCurrentStep(3); // Move to progress step
        
        // Start polling for job status
        pollJobStatus(newJob.id);
      } else {
        throw new Error(data.error?.message || 'Export failed');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analytics/reports/export/${jobId}/status`);
        const data = await response.json();
        
        if (data.success) {
          setExportJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, ...data.data } : job
          ));
          
          if (data.data.status === 'completed' || data.data.status === 'error') {
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

  const handleDownloadReport = (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = `${job.name}.${job.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUseTemplate = (template: ExportTemplate) => {
    setSelectedTemplate(template);
    setReportType(template.type);
    setExportFormat(template.format);
    setReportName(template.name);
    setReportDescription(template.description);
    
    // Apply predefined sections
    const newSections = { ...includeSections };
    template.sections.forEach(section => {
      if (section in newSections) {
        newSections[section as keyof typeof newSections] = true;
      }
    });
    setIncludeSections(newSections);
    
    // Apply predefined filters if available
    if (template.predefinedFilters) {
      if (template.predefinedFilters.dateRange) {
        setDateRange({
          start: template.predefinedFilters.dateRange.start.toISOString().split('T')[0],
          end: template.predefinedFilters.dateRange.end.toISOString().split('T')[0],
        });
      }
    }
    
    setCurrentStep(1);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PdfIcon />;
      case 'excel': return <ExcelIcon />;
      case 'csv': return <CsvIcon />;
      case 'json': return <JsonIcon />;
      case 'word': return <WordIcon />;
      default: return <ExportIcon />;
    }
  };

  const getReportTypeIcon = (type: AnalyticsReport['type']) => {
    switch (type) {
      case 'document_usage': return <ViewIcon />;
      case 'ai_analytics': return <AIIcon />;
      case 'performance': return <PerformanceIcon />;
      case 'user_activity': return <AnalyticsIcon />;
      case 'storage': return <StorageIcon />;
      default: return <ReportIcon />;
    }
  };

  const getJobStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'processing': return 'info';
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
      case 0: // Report Type & Template Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Report Type and Template
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value as AnalyticsReport['type'])}
              >
                <MenuItem value="document_usage">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewIcon />
                    Document Usage Analytics
                  </Box>
                </MenuItem>
                <MenuItem value="ai_analytics">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AIIcon />
                    AI Interaction Analytics
                  </Box>
                </MenuItem>
                <MenuItem value="performance">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PerformanceIcon />
                    Performance Metrics
                  </Box>
                </MenuItem>
                <MenuItem value="user_activity">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AnalyticsIcon />
                    User Activity Logs
                  </Box>
                </MenuItem>
                <MenuItem value="storage">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    Storage Usage
                  </Box>
                </MenuItem>
                <MenuItem value="custom">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon />
                    Custom Report
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>
              Quick Start Templates
            </Typography>
            
            <Grid container spacing={2}>
              {getExportTemplates()
                .filter(template => template.type === reportType || reportType === 'custom')
                .map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { elevation: 4 },
                      border: selectedTemplate?.id === template.id ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getReportTypeIcon(template.type)}
                        <Typography variant="h6">
                          {template.name}
                        </Typography>
                        {getFormatIcon(template.format)}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {template.sections.map(section => (
                          <Chip key={section} label={section} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={() => setCurrentStep(1)}
                disabled={!reportType}
              >
                Continue
              </Button>
            </Box>
          </Box>
        );

      case 1: // Configuration
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Export Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Report Name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    label="Export Format"
                    onChange={(e) => setExportFormat(e.target.value as any)}
                  >
                    <MenuItem value="pdf">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PdfIcon /> PDF Document
                      </Box>
                    </MenuItem>
                    <MenuItem value="excel">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ExcelIcon /> Excel Workbook
                      </Box>
                    </MenuItem>
                    <MenuItem value="csv">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CsvIcon /> CSV Data
                      </Box>
                    </MenuItem>
                    <MenuItem value="json">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <JsonIcon /> JSON Data
                      </Box>
                    </MenuItem>
                    <MenuItem value="word">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WordIcon /> Word Document
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Include Sections
                </Typography>
                
                <FormGroup>
                  {Object.entries(includeSections).map(([key, value]) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox
                          checked={value}
                          onChange={(e) => setIncludeSections(prev => ({ 
                            ...prev, 
                            [key]: e.target.checked 
                          }))}
                        />
                      }
                      label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Advanced Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Formatting Options
                    </Typography>
                    <FormGroup>
                      {Object.entries(formatOptions).map(([key, value]) => (
                        <FormControlLabel
                          key={key}
                          control={
                            <Checkbox
                              checked={value}
                              onChange={(e) => setFormatOptions(prev => ({ 
                                ...prev, 
                                [key]: e.target.checked 
                              }))}
                            />
                          }
                          label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Delivery Options
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Email Recipients (comma-separated)"
                      value={deliveryOptions.emailRecipients}
                      onChange={(e) => setDeliveryOptions(prev => ({ 
                        ...prev, 
                        emailRecipients: e.target.value 
                      }))}
                      placeholder="user1@example.com, user2@example.com"
                      sx={{ mb: 2 }}
                    />
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={deliveryOptions.scheduleExport}
                          onChange={(e) => setDeliveryOptions(prev => ({ 
                            ...prev, 
                            scheduleExport: e.target.checked 
                          }))}
                        />
                      }
                      label="Schedule Export"
                    />
                    
                    {deliveryOptions.scheduleExport && (
                      <TextField
                        type="datetime-local"
                        label="Scheduled Time"
                        value={deliveryOptions.scheduledTime}
                        onChange={(e) => setDeliveryOptions(prev => ({ 
                          ...prev, 
                          scheduledTime: e.target.value 
                        }))}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setCurrentStep(2)}
                disabled={!reportName.trim()}
              >
                Review & Export
              </Button>
            </Box>
          </Box>
        );

      case 2: // Review & Confirmation
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Export Configuration
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Report Details</Typography>
                  <Typography variant="body2"><strong>Name:</strong> {reportName}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {reportType}</Typography>
                  <Typography variant="body2"><strong>Format:</strong> {exportFormat}</Typography>
                  <Typography variant="body2"><strong>Date Range:</strong> {dateRange.start} to {dateRange.end}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Included Sections</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Object.entries(includeSections)
                      .filter(([_, included]) => included)
                      .map(([section]) => (
                        <Chip key={section} label={section} size="small" color="primary" />
                      ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleStartExport}
                startIcon={<ExportIcon />}
              >
                Start Export
              </Button>
            </Box>
          </Box>
        );

      case 3: // Export Progress
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
                      {getFormatIcon(job.format)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{job.name}</Typography>
                          <Chip
                            label={job.status}
                            size="small"
                            color={getJobStatusColor(job.status) as any}
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
                        <IconButton onClick={() => handleDownloadReport(job)}>
                          <DownloadIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button onClick={() => setCurrentStep(0)} variant="outlined">
                Create New Export
              </Button>
            </Box>
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
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExportIcon />
          <Typography variant="h6">Analytics Report Exporter</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Create Export" />
          <Tab label="Export History" />
          <Tab label="Saved Reports" />
        </Tabs>

        {/* Create Export Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stepper activeStep={currentStep} orientation="vertical">
            <Step>
              <StepLabel>Select Report Type & Template</StepLabel>
              <StepContent>
                {getStepContent(0)}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Configure Export Settings</StepLabel>
              <StepContent>
                {getStepContent(1)}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Review & Export</StepLabel>
              <StepContent>
                {getStepContent(2)}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Export Progress</StepLabel>
              <StepContent>
                {getStepContent(3)}
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
                    {getFormatIcon(job.format)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{job.name}</Typography>
                        <Chip
                          label={job.status}
                          size="small"
                          color={getJobStatusColor(job.status) as any}
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
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadReport(job)}
                        >
                          Download
                        </Button>
                      )}
                      
                      <IconButton size="small">
                        <ShareIcon />
                      </IconButton>
                      
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              {exportJobs.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No export history"
                    secondary="Your exported reports will appear here"
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </TabPanel>

        {/* Saved Reports Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Saved Reports
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Saved reports allow you to reuse export configurations and schedule automatic generation.
            </Alert>
            
            {savedReports.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No saved reports yet. Create and save export configurations from the export wizard.
              </Typography>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};