import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  Api as ApiIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Monitor as MonitorIcon,
  NetworkCheck as NetworkIcon,
  CachedIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceMetricsDashboardProps {
  onAlert?: (alert: PerformanceAlert) => void;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  issues: string[];
  recommendations: string[];
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

export const PerformanceMetricsDashboard: React.FC<PerformanceMetricsDashboardProps> = ({
  onAlert,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsRes, currentRes, healthRes, alertsRes] = await Promise.all([
        fetch(`/api/analytics/performance/metrics?timeRange=${timeRange}`),
        fetch('/api/analytics/performance/current'),
        fetch('/api/analytics/performance/health'),
        fetch('/api/analytics/performance/alerts'),
      ]);

      const [metricsData, currentData, healthData, alertsData] = await Promise.all([
        metricsRes.json(),
        currentRes.json(),
        healthRes.json(),
        alertsRes.json(),
      ]);

      if (metricsData.success) setMetrics(metricsData.data);
      if (currentData.success) setCurrentMetrics(currentData.data);
      if (healthData.success) setSystemHealth(healthData.data);
      if (alertsData.success) setAlerts(alertsData.data);

      // Check for new alerts
      if (alertsData.success && onAlert) {
        const newAlerts = alertsData.data.filter(
          (alert: PerformanceAlert) => 
            Date.now() - new Date(alert.timestamp).getTime() < 60000 // Last minute
        );
        newAlerts.forEach(onAlert);
      }

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <SuccessIcon color="success" />;
      case 'good': return <SuccessIcon color="info" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <MonitorIcon />;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUpIcon color="error" />;
    if (current < previous) return <TrendingDownIcon color="success" />;
    return <></>;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getRecentTrend = (hours: number = 1) => {
    const recentMetrics = metrics.slice(-Math.ceil(hours * 2)); // Assuming 30-second intervals
    
    return recentMetrics.map((metric, index) => ({
      time: new Date(metric.timestamp).toLocaleTimeString('en', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      responseTime: metric.responseTime,
      cpuUsage: metric.cpuUsage,
      memoryUsage: metric.memoryUsage,
      errorRate: metric.errorRate,
      throughput: metric.throughput,
      activeUsers: metric.activeUsers,
    }));
  };

  const getResourceUsage = () => {
    if (!currentMetrics) return [];
    
    return [
      {
        name: 'CPU',
        usage: currentMetrics.cpuUsage,
        color: currentMetrics.cpuUsage > 80 ? '#f44336' : currentMetrics.cpuUsage > 60 ? '#ff9800' : '#4caf50',
      },
      {
        name: 'Memory',
        usage: currentMetrics.memoryUsage,
        color: currentMetrics.memoryUsage > 85 ? '#f44336' : currentMetrics.memoryUsage > 70 ? '#ff9800' : '#4caf50',
      },
      {
        name: 'Disk',
        usage: currentMetrics.diskUsage,
        color: currentMetrics.diskUsage > 90 ? '#f44336' : currentMetrics.diskUsage > 75 ? '#ff9800' : '#4caf50',
      },
    ];
  };

  const getPerformanceBenchmarks = () => {
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length || 0;
    const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length || 0;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length || 0;
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / metrics.length || 0;

    return [
      {
        metric: 'Response Time',
        current: currentMetrics?.responseTime || 0,
        average: avgResponseTime,
        target: 200, // 200ms target
        unit: 'ms',
        status: (currentMetrics?.responseTime || 0) <= 200 ? 'good' : 
                (currentMetrics?.responseTime || 0) <= 500 ? 'warning' : 'critical',
      },
      {
        metric: 'Throughput',
        current: currentMetrics?.throughput || 0,
        average: avgThroughput,
        target: 1000, // 1000 requests/min target
        unit: 'req/min',
        status: (currentMetrics?.throughput || 0) >= 1000 ? 'good' : 
                (currentMetrics?.throughput || 0) >= 500 ? 'warning' : 'critical',
      },
      {
        metric: 'Error Rate',
        current: currentMetrics?.errorRate || 0,
        average: avgErrorRate,
        target: 1, // 1% target
        unit: '%',
        status: (currentMetrics?.errorRate || 0) <= 1 ? 'good' : 
                (currentMetrics?.errorRate || 0) <= 5 ? 'warning' : 'critical',
      },
      {
        metric: 'Cache Hit Rate',
        current: currentMetrics?.cacheHitRate || 0,
        average: avgCacheHitRate,
        target: 90, // 90% target
        unit: '%',
        status: (currentMetrics?.cacheHitRate || 0) >= 90 ? 'good' : 
                (currentMetrics?.cacheHitRate || 0) >= 75 ? 'warning' : 'critical',
      },
    ];
  };

  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  };

  const trendData = getRecentTrend();
  const resourceData = getResourceUsage();
  const benchmarks = getPerformanceBenchmarks();

  if (isLoading && !currentMetrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton size="small" onClick={loadMetrics}>
          <RefreshIcon />
        </IconButton>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Performance Metrics Dashboard</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {systemHealth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getHealthIcon(systemHealth.overall)}
              <Chip
                label={`System Health: ${systemHealth.overall.toUpperCase()}`}
                color={getHealthColor(systemHealth.overall) as any}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Score: {systemHealth.score}/100
              </Typography>
            </Box>
          )}
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="15m">Last 15 Minutes</MenuItem>
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadMetrics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type as any}
              sx={{ mb: 1 }}
              action={
                <Typography variant="caption">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </Typography>
              }
            >
              <strong>{alert.metric}:</strong> {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Current Metrics Cards */}
      {currentMetrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {formatDuration(currentMetrics.responseTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Response Time
                </Typography>
                {metrics.length > 1 && getTrendIcon(
                  currentMetrics.responseTime,
                  metrics[metrics.length - 2]?.responseTime || 0
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ApiIcon sx={{ fontSize: 40, color: colors.info, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {Math.round(currentMetrics.throughput)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests/min
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 40, color: colors.error, mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {formatPercentage(currentMetrics.errorRate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: colors.success, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {currentMetrics.activeUsers}
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
                <CachedIcon sx={{ fontSize: 40, color: colors.warning, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {formatPercentage(currentMetrics.cacheHitRate || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cache Hit Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 40, color: colors.secondary, mb: 1 }} />
                <Typography variant="h4" color="secondary.main">
                  {formatPercentage(currentMetrics.uptime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Real-time Monitoring" />
          <Tab label="Resource Usage" />
          <Tab label="Performance Benchmarks" />
          <Tab label="System Health" />
        </Tabs>
      </Box>

      {/* Real-time Monitoring Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Response Time & Throughput */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Time & Throughput
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="responseTime"
                        stroke={colors.primary}
                        name="Response Time (ms)"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="throughput"
                        fill={colors.info}
                        name="Throughput (req/min)"
                        opacity={0.7}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Error Rate */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Rate Trend
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="errorRate"
                        stroke={colors.error}
                        fill={colors.error}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Users */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Users Over Time
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        stroke={colors.success}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Resource Usage Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* CPU, Memory, Disk Usage */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Resources
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
                        label={({ name, usage }) => `${name}: ${usage.toFixed(1)}%`}
                      >
                        {resourceData.map((entry, index) => (
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

          {/* Resource Details */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resource Details
                </Typography>
                
                <List>
                  {currentMetrics && (
                    <>
                      <ListItem>
                        <ListItemIcon>
                          <SpeedIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="CPU Usage"
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {formatPercentage(currentMetrics.cpuUsage)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={currentMetrics.cpuUsage}
                                color={currentMetrics.cpuUsage > 80 ? 'error' : 
                                       currentMetrics.cpuUsage > 60 ? 'warning' : 'success'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <MemoryIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Memory Usage"
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {formatPercentage(currentMetrics.memoryUsage)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={currentMetrics.memoryUsage}
                                color={currentMetrics.memoryUsage > 85 ? 'error' : 
                                       currentMetrics.memoryUsage > 70 ? 'warning' : 'success'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <StorageIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Disk Usage"
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {formatPercentage(currentMetrics.diskUsage)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={currentMetrics.diskUsage}
                                color={currentMetrics.diskUsage > 90 ? 'error' : 
                                       currentMetrics.diskUsage > 75 ? 'warning' : 'success'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Trends */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resource Usage Over Time
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cpuUsage"
                        stroke={colors.primary}
                        name="CPU Usage (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="memoryUsage"
                        stroke={colors.info}
                        name="Memory Usage (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Benchmarks Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Benchmarks
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Average</TableCell>
                        <TableCell align="right">Target</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {benchmarks.map((benchmark) => (
                        <TableRow key={benchmark.metric}>
                          <TableCell>{benchmark.metric}</TableCell>
                          <TableCell align="right">
                            {benchmark.unit === 'ms' 
                              ? formatDuration(benchmark.current)
                              : `${benchmark.current.toFixed(1)}${benchmark.unit}`
                            }
                          </TableCell>
                          <TableCell align="right">
                            {benchmark.unit === 'ms' 
                              ? formatDuration(benchmark.average)
                              : `${benchmark.average.toFixed(1)}${benchmark.unit}`
                            }
                          </TableCell>
                          <TableCell align="right">
                            {benchmark.unit === 'ms' 
                              ? formatDuration(benchmark.target)
                              : `${benchmark.target}${benchmark.unit}`
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={benchmark.status}
                              color={
                                benchmark.status === 'good' ? 'success' :
                                benchmark.status === 'warning' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (benchmark.current / benchmark.target) * 100)}
                              color={
                                benchmark.status === 'good' ? 'success' :
                                benchmark.status === 'warning' ? 'warning' : 'error'
                              }
                              sx={{ width: 100 }}
                            />
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

      {/* System Health Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {systemHealth && (
            <>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall System Health
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {getHealthIcon(systemHealth.overall)}
                      <Typography variant="h4" color={`${getHealthColor(systemHealth.overall)}.main`}>
                        {systemHealth.overall.toUpperCase()}
                      </Typography>
                      <Chip
                        label={`${systemHealth.score}/100`}
                        color={getHealthColor(systemHealth.overall) as any}
                        variant="outlined"
                      />
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={systemHealth.score}
                      color={getHealthColor(systemHealth.overall) as any}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Health Issues
                    </Typography>
                    
                    {systemHealth.issues.length > 0 ? (
                      <List dense>
                        {systemHealth.issues.map((issue, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Avatar sx={{ bgcolor: 'error.main', width: 24, height: 24 }}>
                                <WarningIcon fontSize="small" />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText primary={issue} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="success">
                        No health issues detected! 🎉
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommendations
                    </Typography>
                    
                    <List>
                      {systemHealth.recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText primary={recommendation} />
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
    </Box>
  );
};