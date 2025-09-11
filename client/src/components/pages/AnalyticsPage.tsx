import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  InsertChart as ChartIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useSharePointAnalytics } from '../../hooks/useSharePointAnalytics';
import { DocumentUsageChart, StorageUsageChart } from '../AnalyticsCharts';
import { ChartSeries } from '../../types';

export const AnalyticsPage: React.FC = () => {
  const { analytics, loading, error, refreshAnalytics } = useSharePointAnalytics();

  // Generate chart data from analytics
  const usageTrendsData = useMemo((): ChartSeries[] => {
    if (!analytics.recentActivity.length) return [];
    
    // Create a time-based usage trend chart from actual recent activity
    const last7Days = [];
    const now = new Date();
    
    // Group activities by day using date objects for proper sorting
    const activityByDay = new Map<string, number>();
    
    // Count actual activities from SharePoint data
    analytics.recentActivity.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      // Use ISO date string (YYYY-MM-DD) as key for accurate grouping
      const dayKey = activityDate.toISOString().split('T')[0];
      activityByDay.set(dayKey, (activityByDay.get(dayKey) || 0) + 1);
    });
    
    // Create the last 7 days with real data in proper chronological order
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Use ISO date for lookup
      const isoDateKey = date.toISOString().split('T')[0];
      // Use formatted date for display
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Use actual activity count, or 0 if no activity on that day
      const dayActivity = activityByDay.get(isoDateKey) || 0;
      
      last7Days.push({
        x: displayDate,
        y: dayActivity,
        label: displayDate
      });
    }
    
    return [{
      name: 'File Activity',
      data: last7Days,
      color: '#1976d2',
      type: 'line' as const
    }];
  }, [analytics.recentActivity]);

  const storageData = useMemo((): ChartSeries[] => {
    if (!analytics.fileTypes.length) return [];
    
    return [{
      name: 'Storage by Type',
      data: analytics.fileTypes.map(fileType => ({
        x: fileType.type,
        y: fileType.count,
        label: fileType.type,
        color: undefined
      })),
      type: 'pie' as const
    }];
  }, [analytics.fileTypes]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading SharePoint Analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Unable to load analytics data from SharePoint. Please check your connection and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📊 SharePoint Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights from your SharePoint environment
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh Analytics">
            <IconButton color="primary" onClick={refreshAnalytics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <ChartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {analytics.totalFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <AssessmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {analytics.totalStorage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <TimelineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {analytics.totalSites}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SharePoint Sites
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {analytics.recentActivity.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Changes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <PieChartIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {analytics.fileTypes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                File Types
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <BarChartIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {analytics.totalLibraries || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Libraries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <DocumentUsageChart 
            data={usageTrendsData}
            timeframe="Last 7 days"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <StorageUsageChart 
            data={storageData}
            type="pie"
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardHeader title="Recent Activity" subheader="Latest user actions across your SharePoint" />
        <CardContent>
          <Box>
            {analytics.recentActivity.map((activity, index) => (
              <Paper key={index} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box component="div" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip label={activity.fileName} size="small" variant="outlined" sx={{ mr: 1 }} />
                    <Typography component="span" variant="body1">
                      was {activity.action}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activity.timestamp} • {activity.site}
                  </Typography>
                </Box>
                <Chip 
                  label={activity.action} 
                  size="small" 
                  color={
                    activity.action === 'uploaded' ? 'success' :
                    activity.action === 'shared' ? 'info' :
                    activity.action === 'modified' ? 'warning' : 'default'
                  }
                />
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};