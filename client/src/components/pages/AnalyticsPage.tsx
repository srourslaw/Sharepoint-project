import React from 'react';
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

export const AnalyticsPage: React.FC = () => {
  const { analytics, loading, error, refreshAnalytics } = useSharePointAnalytics();

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
          <Card>
            <CardHeader title="Usage Trends" subheader="File activity over time" />
            <CardContent>
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 1,
                border: '2px dashed',
                borderColor: 'grey.300'
              }}>
                <Typography variant="h6" color="text.secondary">
                  📈 Interactive Usage Chart
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="File Types Distribution" subheader="By document count" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                {analytics.fileTypes.map((fileType, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{fileType.type}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fileType.count}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: 8, 
                      backgroundColor: 'grey.200', 
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${fileType.percentage}%`, 
                        height: '100%', 
                        backgroundColor: `hsl(${index * 72}, 70%, 50%)`,
                        transition: 'width 1s ease-in-out'
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
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
                  <Typography variant="body1">
                    <Chip label={activity.fileName} size="small" variant="outlined" sx={{ mr: 1 }} />
                    was {activity.action}
                  </Typography>
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