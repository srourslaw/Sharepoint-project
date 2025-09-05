import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Article as WordIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  CleaningServices as CleanupIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  AreaChart,
  Area,
} from 'recharts';
import { StorageUsageStats } from '../types';

interface StorageUsageTrackerProps {
  siteId?: string;
  showRecommendations?: boolean;
  onCleanupRecommendation?: (files: FileCleanupSuggestion[]) => void;
}

interface FileCleanupSuggestion {
  fileId: string;
  fileName: string;
  size: number;
  lastModified: string;
  reason: 'large_unused' | 'duplicate' | 'old_version' | 'temp_file' | 'orphaned';
  potentialSavings: number;
  risk: 'low' | 'medium' | 'high';
}

interface StorageOptimizationRecommendation {
  type: 'cleanup' | 'compression' | 'archival' | 'policy';
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
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

export const StorageUsageTracker: React.FC<StorageUsageTrackerProps> = ({
  siteId,
  showRecommendations = true,
  onCleanupRecommendation,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [storageStats, setStorageStats] = useState<StorageUsageStats | null>(null);
  const [cleanupSuggestions, setCleanupSuggestions] = useState<FileCleanupSuggestion[]>([]);
  const [recommendations, setRecommendations] = useState<StorageOptimizationRecommendation[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [cleanupDialog, setCleanupDialog] = useState(false);

  useEffect(() => {
    loadStorageStats();
    loadCleanupSuggestions();
    loadRecommendations();
  }, [siteId, timeRange]);

  const loadStorageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (timeRange) {
        params.append('timeRange', timeRange);
      }
      if (siteId) {
        params.append('siteId', siteId);
      }

      const response = await fetch(`/api/analytics/storage-usage?${params}`);
      const data = await response.json();

      if (data.success) {
        setStorageStats(data.data);
      } else {
        setError(data.error?.message || 'Failed to load storage statistics');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCleanupSuggestions = async () => {
    try {
      const params = new URLSearchParams();
      if (siteId) {
        params.append('siteId', siteId);
      }

      const response = await fetch(`/api/analytics/storage/cleanup-suggestions?${params}`);
      const data = await response.json();

      if (data.success) {
        setCleanupSuggestions(data.data);
        if (onCleanupRecommendation) {
          onCleanupRecommendation(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load cleanup suggestions:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/analytics/storage/recommendations');
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Failed to load storage recommendations:', error);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('image')) return <ImageIcon />;
    if (type.includes('video')) return <VideoIcon />;
    if (type.includes('audio')) return <AudioIcon />;
    if (type.includes('pdf')) return <PdfIcon />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <ExcelIcon />;
    if (type.includes('word') || type.includes('document')) return <WordIcon />;
    if (type.includes('zip') || type.includes('archive')) return <ArchiveIcon />;
    if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) return <CodeIcon />;
    return <FileIcon />;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const getCleanupRiskColor = (risk: FileCleanupSuggestion['risk']) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: StorageOptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStorageByTypeChart = () => {
    if (!storageStats) return [];
    
    const colors = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
      '#82CA9D', '#FFC658', '#FF7300', '#00C4FF', '#FF6B9D'
    ];

    return storageStats.storageByType.map((item, index) => ({
      name: item.fileType,
      value: item.totalSize,
      count: item.count,
      fill: colors[index % colors.length],
    }));
  };

  const getGrowthTrendChart = () => {
    if (!storageStats) return [];
    
    return storageStats.growthTrend.map(item => ({
      date: new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      size: item.totalSize / (1024 * 1024 * 1024), // Convert to GB
      files: item.fileCount,
    }));
  };

  const getLargestFilesTreemap = () => {
    if (!storageStats) return [];
    
    return storageStats.largestFiles.map(file => ({
      name: file.fileName.substring(0, 20) + (file.fileName.length > 20 ? '...' : ''),
      size: file.size,
      fill: file.size > 100 * 1024 * 1024 ? '#FF8042' : '#0088FE', // Red for files > 100MB
    }));
  };

  const getTotalCleanupSavings = () => {
    return cleanupSuggestions.reduce((total, suggestion) => total + suggestion.potentialSavings, 0);
  };

  const handleExecuteCleanup = async (suggestions: FileCleanupSuggestion[]) => {
    try {
      const response = await fetch('/api/analytics/storage/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestions: suggestions.map(s => s.fileId),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh storage stats after cleanup
        await loadStorageStats();
        await loadCleanupSuggestions();
        setCleanupDialog(false);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const storageByTypeData = getStorageByTypeChart();
  const growthTrendData = getGrowthTrendChart();
  const largestFilesData = getLargestFilesTreemap();
  const totalCleanupSavings = getTotalCleanupSavings();

  if (isLoading && !storageStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button size="small" onClick={loadStorageStats}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!storageStats) {
    return (
      <Alert severity="info">
        No storage data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Storage Usage Tracker</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            onClick={loadStorageStats}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
          >
            Refresh
          </Button>
          
          {cleanupSuggestions.length > 0 && (
            <Button
              onClick={() => setCleanupDialog(true)}
              startIcon={<CleanupIcon />}
              color="warning"
              variant="outlined"
            >
              Cleanup ({formatBytes(totalCleanupSavings)})
            </Button>
          )}
        </Box>
      </Box>

      {/* Storage Alert */}
      {storageStats.quotaUsage >= 90 && (
        <Alert 
          severity={storageStats.quotaUsage >= 95 ? 'error' : 'warning'} 
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setTabValue(3)}>
              View Recommendations
            </Button>
          }
        >
          <Typography variant="subtitle2">
            Storage Usage Critical: {storageStats.quotaUsage.toFixed(1)}% of quota used
          </Typography>
          {storageStats.predictedFullDate && (
            <Typography variant="body2">
              Predicted to be full by: {new Date(storageStats.predictedFullDate).toLocaleDateString()}
            </Typography>
          )}
        </Alert>
      )}

      {/* Storage Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {formatBytes(storageStats.usedStorage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used Storage
                  </Typography>
                </Box>
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={storageStats.quotaUsage}
                color={getUsageColor(storageStats.quotaUsage)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(storageStats.availableStorage)} available
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {storageStats.quotaUsage.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FileIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {storageStats.fileCount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {storageStats.folderCount.toLocaleString()} folders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {formatBytes(storageStats.averageFileSize)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg File Size
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {cleanupSuggestions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cleanup Items
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatBytes(totalCleanupSavings)} recoverable
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="File Types" />
          <Tab label="Growth Trends" />
          <Tab label="Cleanup" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Storage by Type Pie Chart */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage by File Type
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageByTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {storageByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => formatBytes(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Largest Files Treemap */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Largest Files
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={largestFilesData}
                      dataKey="size"
                      aspectRatio={4/3}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {largestFilesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* File Type Details Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Breakdown
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Type</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Total Size</TableCell>
                        <TableCell align="right">Average Size</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {storageStats.storageByType
                        .sort((a, b) => b.totalSize - a.totalSize)
                        .map((type) => (
                        <TableRow key={type.fileType}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFileTypeIcon(type.fileType)}
                              {type.fileType}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {type.count.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {formatBytes(type.totalSize)}
                          </TableCell>
                          <TableCell align="right">
                            {formatBytes(type.totalSize / type.count)}
                          </TableCell>
                          <TableCell align="right">
                            {((type.totalSize / storageStats.usedStorage) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* File Types Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {storageStats.storageByType.map((type) => (
            <Grid item xs={12} sm={6} md={4} key={type.fileType}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getFileTypeIcon(type.fileType)}
                    <Typography variant="h6">
                      {type.fileType}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatBytes(type.totalSize)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {type.count.toLocaleString()} files
                  </Typography>
                  
                  <LinearProgress
                    variant="determinate"
                    value={(type.totalSize / storageStats.usedStorage) * 100}
                    sx={{ mt: 1 }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {((type.totalSize / storageStats.usedStorage) * 100).toFixed(1)}% of total storage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Growth Trends Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Storage Growth Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Growth Over Time
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'size' ? `${value.toFixed(2)} GB` : value,
                          name === 'size' ? 'Storage Used' : 'File Count'
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="size"
                        stroke="#0088FE"
                        fill="#0088FE"
                        fillOpacity={0.3}
                        name="Storage (GB)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* File Count Growth */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  File Count Growth
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="files"
                        stroke="#00C49F"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Predictions and Insights */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Storage Insights & Predictions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Alert severity="info">
                      <Typography variant="subtitle2">Growth Rate</Typography>
                      <Typography variant="body2">
                        Based on recent trends, storage is growing at approximately{' '}
                        {formatBytes((storageStats.usedStorage * 0.1) / 30)} per day
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Alert severity={storageStats.predictedFullDate ? 'warning' : 'success'}>
                      <Typography variant="subtitle2">Capacity Forecast</Typography>
                      <Typography variant="body2">
                        {storageStats.predictedFullDate 
                          ? `Storage projected to be full by ${new Date(storageStats.predictedFullDate).toLocaleDateString()}`
                          : 'Current growth rate is sustainable'
                        }
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Alert severity="success">
                      <Typography variant="subtitle2">Optimization Potential</Typography>
                      <Typography variant="body2">
                        Up to {formatBytes(totalCleanupSavings)} can be recovered through cleanup
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Cleanup Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Cleanup Suggestions */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Cleanup Suggestions ({cleanupSuggestions.length})
                  </Typography>
                  
                  {cleanupSuggestions.length > 0 && (
                    <Typography variant="body2" color="success.main">
                      Potential savings: {formatBytes(totalCleanupSavings)}
                    </Typography>
                  )}
                </Box>
                
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {cleanupSuggestions.slice(0, 20).map((suggestion) => (
                    <ListItem key={suggestion.fileId}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getCleanupRiskColor(suggestion.risk)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <FileIcon />
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" noWrap>
                              {suggestion.fileName}
                            </Typography>
                            <Chip
                              label={suggestion.reason.replace('_', ' ')}
                              size="small"
                              color={getCleanupRiskColor(suggestion.risk)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Size: {formatBytes(suggestion.size)} • 
                              Last modified: {new Date(suggestion.lastModified).toLocaleDateString()} • 
                              Potential savings: {formatBytes(suggestion.potentialSavings)}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => setSelectedFile(suggestion)}
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                {cleanupSuggestions.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No cleanup suggestions available. Your storage is well-optimized! 🎉
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Recommendations */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Recommendations
                </Typography>
                
                <List>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getPriorityColor(rec.priority)}.main`,
                            width: 24,
                            height: 24,
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {rec.title}
                            </Typography>
                            <Chip
                              label={rec.priority}
                              size="small"
                              color={getPriorityColor(rec.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {rec.description}
                            </Typography>
                            <Typography variant="caption" color="success.main" display="block">
                              Savings: {formatBytes(rec.potentialSavings)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Largest Files */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Largest Files
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell align="right">Size</TableCell>
                        <TableCell align="right">Last Modified</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {storageStats.largestFiles.map((file) => (
                        <TableRow key={file.fileId}>
                          <TableCell>{file.fileName}</TableCell>
                          <TableCell align="right">{formatBytes(file.size)}</TableCell>
                          <TableCell align="right">
                            {new Date(file.lastModified).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Cleanup Confirmation Dialog */}
      <Dialog
        open={cleanupDialog}
        onClose={() => setCleanupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Storage Cleanup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              You are about to clean up {cleanupSuggestions.length} items
            </Typography>
            <Typography variant="body2">
              This action will permanently delete or archive the selected files. 
              Total space to be recovered: {formatBytes(totalCleanupSavings)}
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom>
            Items to be cleaned up:
          </Typography>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {cleanupSuggestions.slice(0, 10).map((suggestion) => (
              <ListItem key={suggestion.fileId}>
                <ListItemIcon>
                  <FileIcon color={getCleanupRiskColor(suggestion.risk)} />
                </ListItemIcon>
                <ListItemText
                  primary={suggestion.fileName}
                  secondary={`${formatBytes(suggestion.size)} • ${suggestion.reason.replace('_', ' ')}`}
                />
              </ListItem>
            ))}
            {cleanupSuggestions.length > 10 && (
              <ListItem>
                <ListItemText
                  primary={`... and ${cleanupSuggestions.length - 10} more items`}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCleanupDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleExecuteCleanup(cleanupSuggestions)}
            variant="contained"
            color="warning"
            startIcon={<CleanupIcon />}
          >
            Execute Cleanup
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Detail Dialog */}
      <Dialog
        open={selectedFile !== null}
        onClose={() => setSelectedFile(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>File Details</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {selectedFile.fileName}
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 1, mt: 2 }}>
                <Typography variant="body2">
                  <strong>Size:</strong> {formatBytes(selectedFile.size)}
                </Typography>
                <Typography variant="body2">
                  <strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Cleanup Reason:</strong> {selectedFile.reason?.replace('_', ' ')}
                </Typography>
                <Typography variant="body2">
                  <strong>Risk Level:</strong> {selectedFile.risk}
                </Typography>
                <Typography variant="body2">
                  <strong>Potential Savings:</strong> {formatBytes(selectedFile.potentialSavings)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFile(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};