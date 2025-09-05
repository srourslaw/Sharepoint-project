import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Schedule as TimeIcon,
  Computer as DesktopIcon,
  Phone as MobileIcon,
  Tablet as TabletIcon,
  Public as LocationIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DocumentUsageStats, AnalyticsFilter } from '../types';

interface DocumentUsageAnalyticsProps {
  onExport?: (data: any) => void;
}

export const DocumentUsageAnalytics: React.FC<DocumentUsageAnalyticsProps> = ({
  onExport,
}) => {
  const [usageStats, setUsageStats] = useState<DocumentUsageStats[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [sortBy, setSortBy] = useState<keyof DocumentUsageStats>('viewCount');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    loadUsageStats();
  }, [timeRange]);

  const loadUsageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/document-usage?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setUsageStats(data.data);
        if (data.data.length > 0 && !selectedDoc) {
          setSelectedDoc(data.data[0]);
        }
      } else {
        setError(data.error?.message || 'Failed to load usage statistics');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStats = usageStats
    .filter(stat => 
      stat.fileName.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy] as number;
      const bValue = b[sortBy] as number;
      return bValue - aValue;
    });

  const getTopDocuments = (count: number = 10) => {
    return filteredStats.slice(0, count);
  };

  const getTotalStats = () => {
    return filteredStats.reduce(
      (acc, stat) => ({
        totalViews: acc.totalViews + stat.viewCount,
        totalDownloads: acc.totalDownloads + stat.downloadCount,
        totalEdits: acc.totalEdits + stat.editCount,
        totalShares: acc.totalShares + stat.shareCount,
        totalComments: acc.totalComments + stat.commentCount,
        totalTimeSpent: acc.totalTimeSpent + stat.totalTimeSpent,
        totalUniqueUsers: acc.totalUniqueUsers + stat.uniqueUsers,
      }),
      {
        totalViews: 0,
        totalDownloads: 0,
        totalEdits: 0,
        totalShares: 0,
        totalComments: 0,
        totalTimeSpent: 0,
        totalUniqueUsers: 0,
      }
    );
  };

  const getActivityByHour = () => {
    if (!selectedDoc) return [];
    
    return selectedDoc.popularTimes.map(time => ({
      hour: `${time.hour}:00`,
      activity: time.count,
    }));
  };

  const getDeviceBreakdown = () => {
    if (!selectedDoc) return [];
    
    return [
      { name: 'Desktop', value: selectedDoc.deviceBreakdown.desktop, color: '#0088FE' },
      { name: 'Mobile', value: selectedDoc.deviceBreakdown.mobile, color: '#00C49F' },
      { name: 'Tablet', value: selectedDoc.deviceBreakdown.tablet, color: '#FFBB28' },
    ];
  };

  const getEngagementTrend = () => {
    return filteredStats.slice(0, 10).map(stat => ({
      name: stat.fileName.substring(0, 20) + (stat.fileName.length > 20 ? '...' : ''),
      views: stat.viewCount,
      downloads: stat.downloadCount,
      edits: stat.editCount,
      engagementScore: (stat.viewCount + stat.downloadCount * 2 + stat.editCount * 3 + stat.shareCount * 2) / stat.uniqueUsers || 0,
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return <ViewIcon />;
      case 'download': return <DownloadIcon />;
      case 'edit': return <EditIcon />;
      case 'share': return <ShareIcon />;
      case 'comment': return <CommentIcon />;
      default: return <ViewIcon />;
    }
  };

  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    info: '#0288d1',
  };

  const totalStats = getTotalStats();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button size="small" onClick={loadUsageStats}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Document Usage Analytics</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Filter documents..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            InputProps={{
              startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as keyof DocumentUsageStats)}
            >
              <MenuItem value="viewCount">Views</MenuItem>
              <MenuItem value="downloadCount">Downloads</MenuItem>
              <MenuItem value="editCount">Edits</MenuItem>
              <MenuItem value="shareCount">Shares</MenuItem>
              <MenuItem value="uniqueUsers">Unique Users</MenuItem>
              <MenuItem value="totalTimeSpent">Time Spent</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadUsageStats}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ViewIcon sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {totalStats.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DownloadIcon sx={{ fontSize: 40, color: colors.success, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {totalStats.totalDownloads.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Downloads
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EditIcon sx={{ fontSize: 40, color: colors.warning, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {totalStats.totalEdits.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Edits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShareIcon sx={{ fontSize: 40, color: colors.info, mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {totalStats.totalShares.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Shares
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: colors.secondary, mb: 1 }} />
              <Typography variant="h4" color="secondary.main">
                {totalStats.totalUniqueUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimeIcon sx={{ fontSize: 40, color: 'purple', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'purple' }}>
                {formatDuration(totalStats.totalTimeSpent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Document List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Documents
              </Typography>
              
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {getTopDocuments().map((doc, index) => (
                  <ListItem
                    key={doc.fileId}
                    button
                    onClick={() => setSelectedDoc(doc)}
                    selected={selectedDoc?.fileId === doc.fileId}
                    sx={{
                      border: selectedDoc?.fileId === doc.fileId ? 1 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography variant="body1" noWrap>
                          {doc.fileName}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            icon={<ViewIcon />}
                            label={doc.viewCount}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<DownloadIcon />}
                            label={doc.downloadCount}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                          <Chip
                            icon={<PeopleIcon />}
                            label={doc.uniqueUsers}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Details */}
        <Grid item xs={12} md={6}>
          {selectedDoc && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Document Details
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {selectedDoc.fileName}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="h5" color="primary.contrastText">
                        {selectedDoc.viewCount}
                      </Typography>
                      <Typography variant="body2" color="primary.contrastText">
                        Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="h5" color="success.contrastText">
                        {selectedDoc.downloadCount}
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        Downloads
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="h5" color="warning.contrastText">
                        {selectedDoc.editCount}
                      </Typography>
                      <Typography variant="body2" color="warning.contrastText">
                        Edits
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                      <Typography variant="h5" color="secondary.contrastText">
                        {selectedDoc.uniqueUsers}
                      </Typography>
                      <Typography variant="body2" color="secondary.contrastText">
                        Users
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last accessed: {new Date(selectedDoc.lastAccessed).toLocaleString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total time spent: {formatDuration(selectedDoc.totalTimeSpent)}
                </Typography>

                {/* Device Breakdown */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Device Usage
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<DesktopIcon />}
                      label={`${selectedDoc.deviceBreakdown.desktop}%`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MobileIcon />}
                      label={`${selectedDoc.deviceBreakdown.mobile}%`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<TabletIcon />}
                      label={`${selectedDoc.deviceBreakdown.tablet}%`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Activity Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity by Hour
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActivityByHour()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="activity"
                      stroke={colors.primary}
                      fill={colors.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Breakdown
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDeviceBreakdown()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getDeviceBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Engagement Overview
              </Typography>
              
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getEngagementTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="views" fill={colors.primary} name="Views" />
                    <Bar dataKey="downloads" fill={colors.success} name="Downloads" />
                    <Bar dataKey="edits" fill={colors.warning} name="Edits" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};