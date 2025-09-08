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

export const AnalyticsPage: React.FC = () => {
  const mockAnalyticsData = {
    totalFiles: 1247,
    totalStorage: '15.6 GB',
    activeUsers: 28,
    recentActivity: 156,
    weeklyGrowth: '+12%',
    monthlyGrowth: '+34%',
  };

  const topFileTypes = [
    { type: 'Word Documents', count: 428, percentage: 34 },
    { type: 'Excel Sheets', count: 312, percentage: 25 },
    { type: 'PowerPoint', count: 203, percentage: 16 },
    { type: 'PDFs', count: 178, percentage: 14 },
    { type: 'Images', count: 126, percentage: 11 },
  ];

  const recentActivities = [
    { user: 'Sarah Johnson', action: 'uploaded', file: 'Q3 Budget Report.xlsx', time: '2 minutes ago' },
    { user: 'Mike Chen', action: 'shared', file: 'Project Timeline.pptx', time: '15 minutes ago' },
    { user: 'Emily Davis', action: 'modified', file: 'Meeting Notes.docx', time: '1 hour ago' },
    { user: 'Alex Wilson', action: 'downloaded', file: 'Technical Specs.pdf', time: '2 hours ago' },
    { user: 'Lisa Brown', action: 'created', file: 'Marketing Plan v2.docx', time: '3 hours ago' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📊 Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into your SharePoint usage and performance
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton>
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
                {mockAnalyticsData.totalFiles}
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
                {mockAnalyticsData.totalStorage}
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
                {mockAnalyticsData.activeUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {mockAnalyticsData.recentActivity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Activities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <PieChartIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {mockAnalyticsData.weeklyGrowth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weekly Growth
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <BarChartIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {mockAnalyticsData.monthlyGrowth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monthly Growth
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
                {topFileTypes.map((fileType, index) => (
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
            {recentActivities.map((activity, index) => (
              <Paper key={index} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    <strong>{activity.user}</strong> {activity.action}{' '}
                    <Chip label={activity.file} size="small" variant="outlined" sx={{ mx: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.time}
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