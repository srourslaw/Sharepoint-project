import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
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
import { UserActivityLog, AnalyticsFilter } from '../types';

interface UserActivityLoggerProps {
  userId?: string;
  showRealTime?: boolean;
  maxEntries?: number;
  onSecurityAlert?: (alert: SecurityAlert) => void;
}

interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'failed_login' | 'unauthorized_access' | 'data_breach';
  userId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata: any;
}

interface ActivitySummary {
  totalActivities: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  topResources: { resource: string; count: number }[];
  successRate: number;
  avgSessionDuration: number;
  peakHours: { hour: number; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  locationStats: { location: string; count: number }[];
  suspiciousActivities: number;
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

export const UserActivityLogger: React.FC<UserActivityLoggerProps> = ({
  userId,
  showRealTime = true,
  maxEntries = 1000,
  onSecurityAlert,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<UserActivityLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'today',
    action: 'all',
    user: userId || 'all',
    success: 'all',
    searchTerm: '',
  });

  // Real-time updates
  const [realTimeEnabled, setRealTimeEnabled] = useState(showRealTime);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);

  useEffect(() => {
    loadActivities();
    loadSummary();
    loadSecurityAlerts();

    // Set up real-time updates if enabled
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        checkForNewActivities();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [filters, userId, realTimeEnabled]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      params.append('limit', maxEntries.toString());
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/analytics/user-activity?${params}`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.data);
      } else {
        setError(data.error?.message || 'Failed to load activity logs');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters?.dateRange) {
        params.append('dateRange', filters.dateRange);
      }
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/analytics/user-activity/summary?${params}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to load activity summary:', error);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const response = await fetch('/api/analytics/security-alerts');
      const data = await response.json();

      if (data.success) {
        setSecurityAlerts(data.data);
        
        // Trigger security alert callback for critical alerts
        data.data
          .filter((alert: SecurityAlert) => alert.severity === 'critical')
          .forEach(onSecurityAlert);
      }
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    }
  };

  const checkForNewActivities = async () => {
    if (activities.length === 0) return;

    try {
      const lastTimestamp = activities[0].timestamp;
      const response = await fetch(`/api/analytics/user-activity/new?since=${lastTimestamp}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setNewActivitiesCount(data.data.length);
        // Don't auto-update to avoid disrupting user's view
      }
    } catch (error) {
      console.error('Failed to check for new activities:', error);
    }
  };

  const refreshActivities = () => {
    setNewActivitiesCount(0);
    loadActivities();
    loadSummary();
    loadSecurityAlerts();
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'view':
      case 'read': return <ViewIcon />;
      case 'edit':
      case 'update': return <EditIcon />;
      case 'download': return <DownloadIcon />;
      case 'share': return <ShareIcon />;
      case 'delete': return <DeleteIcon />;
      case 'login':
      case 'authenticate': return <PersonIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'error';
    
    switch (action.toLowerCase()) {
      case 'delete': return 'warning';
      case 'login': return 'success';
      case 'share': return 'info';
      default: return 'primary';
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return <PhoneIcon />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <TabletIcon />;
    }
    return <ComputerIcon />;
  };

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A';
    if (duration < 60) return `${Math.round(duration)}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const getActivityTrend = () => {
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date().getHours() - (23 - i);
      return {
        hour: hour < 0 ? hour + 24 : hour,
        count: 0,
        success: 0,
        failed: 0,
      };
    });

    activities.forEach(activity => {
      const activityHour = new Date(activity.timestamp).getHours();
      const hourData = last24Hours.find(h => h.hour === activityHour);
      if (hourData) {
        hourData.count++;
        if (activity.success) {
          hourData.success++;
        } else {
          hourData.failed++;
        }
      }
    });

    return last24Hours.map(h => ({
      hour: `${h.hour}:00`,
      total: h.count,
      success: h.success,
      failed: h.failed,
    }));
  };

  const getUserEngagementData = () => {
    if (!summary) return [];
    
    return summary.topActions.map(action => ({
      name: action.action,
      value: action.count,
      fill: getActionColor(action.action, true),
    }));
  };

  const filteredActivities = activities.filter(activity => {
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        activity.action.toLowerCase().includes(searchTerm) ||
        activity.resource.toLowerCase().includes(searchTerm) ||
        activity.userName.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }
    
    if (filters.success !== 'all') {
      const shouldBeSuccess = filters.success === 'true';
      if (activity.success !== shouldBeSuccess) return false;
    }
    
    return true;
  });

  const activityTrendData = getActivityTrend();
  const userEngagementData = getUserEngagementData();

  if (isLoading && !activities.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button size="small" onClick={loadActivities}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with real-time indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Activity Logs</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {newActivitiesCount > 0 && (
            <Alert severity="info" sx={{ py: 0 }}>
              {newActivitiesCount} new activities available
            </Alert>
          )}
          
          {realTimeEnabled && (
            <Chip
              icon={<TimelineIcon />}
              label="Real-time"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          
          <Button
            onClick={refreshActivities}
            startIcon={<RefreshIcon />}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => setTabValue(3)}>
              View All
            </Button>
          }
        >
          <Typography variant="subtitle2">
            {securityAlerts.filter(a => a.severity === 'critical').length} critical security alerts detected
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {summary.totalActivities.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Activities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {summary.uniqueUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SuccessIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {summary.successRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {formatDuration(summary.avgSessionDuration)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Session
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {summary.suspiciousActivities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Suspicious
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" color="secondary.main">
                  {securityAlerts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Security Alerts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search activities..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="last90days">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  label="Action"
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="view">View</MenuItem>
                  <MenuItem value="edit">Edit</MenuItem>
                  <MenuItem value="download">Download</MenuItem>
                  <MenuItem value="share">Share</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.success}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, success: e.target.value }))}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="true">Success</MenuItem>
                  <MenuItem value="false">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={loadActivities}
                  disabled={isLoading}
                  startIcon={<FilterIcon />}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="text"
                  onClick={() => setFilters({
                    dateRange: 'today',
                    action: 'all',
                    user: userId || 'all',
                    success: 'all',
                    searchTerm: '',
                  })}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Activity Timeline" />
          <Tab label="Analytics" />
          <Tab label="Audit Trail" />
          <Tab label="Security Alerts" />
        </Tabs>
      </Box>

      {/* Activity Timeline Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Activity Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Trend (Last 24 Hours)
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="success"
                        stackId="1"
                        stroke="#4caf50"
                        fill="#4caf50"
                        name="Successful"
                      />
                      <Area
                        type="monotone"
                        dataKey="failed"
                        stackId="1"
                        stroke="#f44336"
                        fill="#f44336"
                        name="Failed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* User Engagement */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Actions
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userEngagementData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {userEngagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activities ({filteredActivities.length})
                </Typography>
                
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredActivities.slice(0, 50).map((activity) => (
                    <ListItem
                      key={activity.id}
                      button
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getActionColor(activity.action, activity.success)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getActionIcon(activity.action)}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {activity.userName} {activity.action} {activity.resource}
                            </Typography>
                            <Chip
                              label={activity.success ? 'Success' : 'Failed'}
                              size="small"
                              color={activity.success ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {getDeviceIcon(activity.userAgent)}
                              <Typography variant="caption" color="text.secondary">
                                {activity.ipAddress}
                              </Typography>
                              {activity.duration && (
                                <Typography variant="caption" color="text.secondary">
                                  • Duration: {formatDuration(activity.duration)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => setSelectedActivity(activity)}>
                          <InfoIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                {filteredActivities.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No activities found for the selected filters
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {summary && (
            <>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Resources Accessed
                    </Typography>
                    <List>
                      {summary.topResources.slice(0, 5).map((resource, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={resource.resource}
                            secondary={`${resource.count} accesses`}
                          />
                          <LinearProgress
                            variant="determinate"
                            value={(resource.count / summary.topResources[0].count) * 100}
                            sx={{ width: 100, ml: 2 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Device Usage
                    </Typography>
                    <List>
                      {summary.deviceBreakdown.map((device, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {getDeviceIcon(device.device)}
                          </ListItemIcon>
                          <ListItemText
                            primary={device.device}
                            secondary={`${device.count} sessions`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      {/* Audit Trail Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.slice(0, 100).map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {new Date(activity.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{activity.userName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActionIcon(activity.action)}
                      {activity.action}
                    </Box>
                  </TableCell>
                  <TableCell>{activity.resource}</TableCell>
                  <TableCell>{activity.ipAddress}</TableCell>
                  <TableCell>
                    <Chip
                      label={activity.success ? 'Success' : 'Failed'}
                      size="small"
                      color={activity.success ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{formatDuration(activity.duration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Security Alerts Tab */}
      <TabPanel value={tabValue} index={3}>
        <List>
          {securityAlerts.map((alert) => (
            <ListItem key={alert.id}>
              <ListItemIcon>
                <Avatar
                  sx={{
                    bgcolor: `${getSeverityColor(alert.severity)}.main`,
                    width: 32,
                    height: 32,
                  }}
                >
                  <WarningIcon />
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {alert.description}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      size="small"
                      color={getSeverityColor(alert.severity) as any}
                    />
                    <Chip
                      label={alert.type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    User: {alert.userId} • {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          
          {securityAlerts.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No security alerts"
                secondary="System is secure with no active alerts"
              />
            </ListItem>
          )}
        </List>
      </TabPanel>

      {/* Activity Detail Dialog */}
      <Dialog
        open={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Activity Details</DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>User:</strong> {selectedActivity.userName}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Action:</strong> {selectedActivity.action}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Resource:</strong> {selectedActivity.resource}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {selectedActivity.success ? 'Success' : 'Failed'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Timestamp:</strong> {new Date(selectedActivity.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Technical Details
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>IP Address:</strong> {selectedActivity.ipAddress}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Session ID:</strong> {selectedActivity.sessionId}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Duration:</strong> {formatDuration(selectedActivity.duration)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>User Agent:</strong> {selectedActivity.userAgent}
                  </Typography>
                  {selectedActivity.errorMessage && (
                    <Typography variant="body2" gutterBottom color="error">
                      <strong>Error:</strong> {selectedActivity.errorMessage}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Additional Metadata</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedActivity(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};