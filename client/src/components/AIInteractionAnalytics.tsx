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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Speed as SpeedIcon,
  CheckCircle as SuccessIcon,
  AttachMoney as CostIcon,
  Star as RatingIcon,
  Summarize as SummaryIcon,
  Translate as TranslateIcon,
  Mood as SentimentIcon,
  Compare as CompareIcon,
  Label as ExtractIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
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
  ComposedChart,
  ScatterChart,
  Scatter,
} from 'recharts';
import { AIInteractionStats, AIAnalysisType, AnalyticsFilter } from '../types';

interface AIInteractionAnalyticsProps {
  onExport?: (data: any) => void;
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

export const AIInteractionAnalytics: React.FC<AIInteractionAnalyticsProps> = ({
  onExport,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [interactions, setInteractions] = useState<AIInteractionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [aiTypeFilter, setAiTypeFilter] = useState<AIAnalysisType | 'all'>('all');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    loadInteractionStats();
  }, [timeRange, aiTypeFilter, userFilter]);

  const loadInteractionStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (timeRange) {
        params.append('timeRange', timeRange);
      }
      if (aiTypeFilter && aiTypeFilter !== 'all') {
        params.append('aiType', aiTypeFilter);
      }
      if (userFilter && userFilter !== 'all') {
        params.append('userId', userFilter);
      }

      const response = await fetch(`/api/analytics/ai-interactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setInteractions(data.data);
      } else {
        setError(data.error?.message || 'Failed to load AI interaction statistics');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAITypeIcon = (type: AIAnalysisType) => {
    switch (type) {
      case AIAnalysisType.SUMMARIZATION: return <SummaryIcon />;
      case AIAnalysisType.SENTIMENT: return <SentimentIcon />;
      case AIAnalysisType.TRANSLATION: return <TranslateIcon />;
      case AIAnalysisType.COMPARISON: return <CompareIcon />;
      case AIAnalysisType.KEYWORD_EXTRACTION: return <ExtractIcon />;
      case AIAnalysisType.ENTITY_EXTRACTION: return <ExtractIcon />;
      default: return <AIIcon />;
    }
  };

  const getAITypeColor = (type: AIAnalysisType) => {
    switch (type) {
      case AIAnalysisType.SUMMARIZATION: return '#1976d2';
      case AIAnalysisType.SENTIMENT: return '#388e3c';
      case AIAnalysisType.TRANSLATION: return '#f57c00';
      case AIAnalysisType.COMPARISON: return '#7b1fa2';
      case AIAnalysisType.KEYWORD_EXTRACTION: return '#d32f2f';
      case AIAnalysisType.ENTITY_EXTRACTION: return '#303f9f';
      default: return '#424242';
    }
  };

  const getOverviewStats = () => {
    const total = interactions.length;
    const successful = interactions.filter(i => i.success).length;
    const avgProcessingTime = interactions.reduce((sum, i) => sum + i.processingTime, 0) / total || 0;
    const avgAccuracy = interactions
      .filter(i => i.accuracy !== undefined)
      .reduce((sum, i) => sum + (i.accuracy || 0), 0) / interactions.filter(i => i.accuracy !== undefined).length || 0;
    const totalTokens = interactions.reduce((sum, i) => sum + i.tokenUsage, 0);
    const totalCost = interactions.reduce((sum, i) => sum + (i.cost || 0), 0);
    const avgRating = interactions
      .filter(i => i.userRating !== undefined)
      .reduce((sum, i) => sum + (i.userRating || 0), 0) / interactions.filter(i => i.userRating !== undefined).length || 0;

    return {
      total,
      successful,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgProcessingTime,
      avgAccuracy: avgAccuracy * 100,
      totalTokens,
      totalCost,
      avgRating,
    };
  };

  const getInteractionsByType = () => {
    const typeStats = interactions.reduce((acc, interaction) => {
      const type = interaction.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          successCount: 0,
          avgProcessingTime: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      
      acc[type].count++;
      if (interaction.success) acc[type].successCount++;
      acc[type].avgProcessingTime += interaction.processingTime;
      acc[type].totalTokens += interaction.tokenUsage;
      acc[type].totalCost += interaction.cost || 0;
      
      return acc;
    }, {} as Record<AIAnalysisType, any>);

    return Object.entries(typeStats).map(([type, stats]) => ({
      type: type as AIAnalysisType,
      count: stats.count,
      successRate: (stats.successCount / stats.count) * 100,
      avgProcessingTime: stats.avgProcessingTime / stats.count,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
    }));
  };

  const getInteractionsTrend = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayInteractions = interactions.filter(i => 
        i.timestamp.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        total: dayInteractions.length,
        successful: dayInteractions.filter(i => i.success).length,
        failed: dayInteractions.filter(i => !i.success).length,
        avgProcessingTime: dayInteractions.length > 0 
          ? dayInteractions.reduce((sum, i) => sum + i.processingTime, 0) / dayInteractions.length 
          : 0,
      };
    });
  };

  const getPerformanceMetrics = () => {
    return interactions.map(interaction => ({
      processingTime: interaction.processingTime,
      tokenUsage: interaction.tokenUsage,
      type: interaction.type,
      success: interaction.success,
      accuracy: interaction.accuracy || 0,
      rating: interaction.userRating || 0,
    }));
  };

  const getErrorAnalysis = () => {
    const errors = interactions.filter(i => !i.success);
    const errorTypes = errors.reduce((acc, error) => {
      const type = error.errorType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorTypes).map(([type, count]) => ({
      type,
      count,
      percentage: (count / errors.length) * 100,
    }));
  };

  const getUserEngagement = () => {
    const userStats = interactions.reduce((acc, interaction) => {
      const userId = interaction.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          interactionCount: 0,
          avgRating: 0,
          ratingCount: 0,
          totalTokens: 0,
          lastInteraction: interaction.timestamp,
        };
      }
      
      acc[userId].interactionCount++;
      acc[userId].totalTokens += interaction.tokenUsage;
      
      if (interaction.userRating) {
        acc[userId].avgRating = (acc[userId].avgRating * acc[userId].ratingCount + interaction.userRating) / (acc[userId].ratingCount + 1);
        acc[userId].ratingCount++;
      }
      
      if (interaction.timestamp > acc[userId].lastInteraction) {
        acc[userId].lastInteraction = interaction.timestamp;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(userStats)
      .sort((a: any, b: any) => b.interactionCount - a.interactionCount)
      .slice(0, 10);
  };

  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    const seconds = milliseconds / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const overviewStats = getOverviewStats();
  const typeStats = getInteractionsByType();
  const trendData = getInteractionsTrend();
  const performanceData = getPerformanceMetrics();
  const errorData = getErrorAnalysis();
  const userEngagement = getUserEngagement();

  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  };

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
        <Button size="small" onClick={loadInteractionStats}>
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
        <Typography variant="h4">AI Interaction Analytics</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>AI Type</InputLabel>
            <Select
              value={aiTypeFilter}
              label="AI Type"
              onChange={(e) => setAiTypeFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value={AIAnalysisType.SUMMARIZATION}>Summarization</MenuItem>
              <MenuItem value={AIAnalysisType.SENTIMENT}>Sentiment</MenuItem>
              <MenuItem value={AIAnalysisType.TRANSLATION}>Translation</MenuItem>
              <MenuItem value={AIAnalysisType.COMPARISON}>Comparison</MenuItem>
              <MenuItem value={AIAnalysisType.KEYWORD_EXTRACTION}>Keywords</MenuItem>
              <MenuItem value={AIAnalysisType.ENTITY_EXTRACTION}>Entities</MenuItem>
            </Select>
          </FormControl>
          
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
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadInteractionStats}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AIIcon sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {overviewStats.total.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Interactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SuccessIcon sx={{ fontSize: 40, color: colors.success, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {overviewStats.successRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: colors.warning, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {formatDuration(overviewStats.avgProcessingTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Processing Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CostIcon sx={{ fontSize: 40, color: colors.secondary, mb: 1 }} />
              <Typography variant="h4" color="secondary.main">
                {formatCurrency(overviewStats.totalCost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Cost
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Error Analysis" />
          <Tab label="User Engagement" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Interactions Trend */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Interactions Trend (Last 30 Days)
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="successful" fill={colors.success} name="Successful" />
                      <Bar yAxisId="left" dataKey="failed" fill={colors.error} name="Failed" />
                      <Line yAxisId="right" type="monotone" dataKey="avgProcessingTime" stroke={colors.warning} name="Avg Processing Time (ms)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Types Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Types Distribution
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeStats.map(stat => ({
                          name: stat.type,
                          value: stat.count,
                          fill: getAITypeColor(stat.type),
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {typeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getAITypeColor(entry.type)} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Types Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance by AI Type
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>AI Type</TableCell>
                        <TableCell align="right">Total Interactions</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Avg Processing Time</TableCell>
                        <TableCell align="right">Total Tokens</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {typeStats.map((stat) => (
                        <TableRow key={stat.type}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getAITypeIcon(stat.type)}
                              {stat.type}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{stat.count.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                              {stat.successRate.toFixed(1)}%
                              <LinearProgress
                                variant="determinate"
                                value={stat.successRate}
                                sx={{ width: 50, height: 4 }}
                                color={stat.successRate >= 90 ? 'success' : stat.successRate >= 70 ? 'warning' : 'error'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatDuration(stat.avgProcessingTime)}</TableCell>
                          <TableCell align="right">{stat.totalTokens.toLocaleString()}</TableCell>
                          <TableCell align="right">{formatCurrency(stat.totalCost)}</TableCell>
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

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Performance Scatter Plot */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Time vs Token Usage
                </Typography>
                
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tokenUsage" name="Token Usage" />
                      <YAxis dataKey="processingTime" name="Processing Time (ms)" />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [
                          name === 'processingTime' ? formatDuration(value as number) : value,
                          name
                        ]}
                      />
                      <Scatter
                        name="Successful"
                        data={performanceData.filter(d => d.success)}
                        fill={colors.success}
                      />
                      <Scatter
                        name="Failed"
                        data={performanceData.filter(d => !d.success)}
                        fill={colors.error}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Accuracy
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {overviewStats.avgAccuracy.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={overviewStats.avgAccuracy}
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average User Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color="warning.main">
                        {overviewStats.avgRating.toFixed(1)}
                      </Typography>
                      <RatingIcon color="warning" />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Tokens Used
                    </Typography>
                    <Typography variant="h5" color="info.main">
                      {overviewStats.totalTokens.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cost per Token
                    </Typography>
                    <Typography variant="h5" color="secondary.main">
                      {overviewStats.totalTokens > 0 
                        ? formatCurrency(overviewStats.totalCost / overviewStats.totalTokens)
                        : '$0.0000'
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Error Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Error Types Chart */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Types Distribution
                </Typography>
                
                {errorData.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={errorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill={colors.error} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Alert severity="success">
                    No errors found in the selected time range! 🎉
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Error Details Table */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Analysis
                </Typography>
                
                {errorData.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Error Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {errorData.map((error) => (
                          <TableRow key={error.type}>
                            <TableCell>{error.type}</TableCell>
                            <TableCell align="right">{error.count}</TableCell>
                            <TableCell align="right">{error.percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No error data available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* User Engagement Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Users by Engagement
                </Typography>
                
                <List>
                  {userEngagement.map((user, index) => (
                    <ListItem key={user.userId}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={`User ${user.userId}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {user.interactionCount} interactions • {user.totalTokens.toLocaleString()} tokens
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Last active: {new Date(user.lastInteraction).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<AIIcon />}
                          label={user.interactionCount}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {user.avgRating > 0 && (
                          <Chip
                            icon={<RatingIcon />}
                            label={user.avgRating.toFixed(1)}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};