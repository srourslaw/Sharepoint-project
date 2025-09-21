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
import { useDynamicTheme } from '../../contexts/DynamicThemeContext';
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
  const { currentTheme } = useDynamicTheme();
  const { analytics, loading, error, refreshAnalytics } = useSharePointAnalytics();

  // Generate chart data with actual dates in dd/mm/yyyy format
  const usageTrendsData = useMemo((): ChartSeries[] => {
    // Generate last 7 days with actual dates
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

      // Sample data - in real app this would come from analytics API
      const sampleValues = [1, 0, 0, 6, 4, 5, 1];

      last7Days.push({
        x: formattedDate,
        y: sampleValues[6 - i]
      });
    }

    return [{
      name: 'File Activity',
      data: last7Days,
      color: currentTheme.primary,
      type: 'line' as const
    }];
  }, [currentTheme.primary]);

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
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh', maxHeight: '100vh', overflow: 'auto' }}>
      {/* Beautiful Analytics Dashboard Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${currentTheme.primary}08 0%, ${currentTheme.secondary}08 50%, ${currentTheme.accent}08 100%)`,
        borderRadius: 3,
        p: 4,
        mb: 4,
        border: `1px solid ${currentTheme.primary}15`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.accent})`,
        },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3,
            boxShadow: `0 6px 16px rgba(0, 200, 83, 0.3)`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              borderRadius: '16px',
              zIndex: -1,
              opacity: 0.3
            }
          }}>
            <AssessmentIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}>
              Analytics Intelligence Hub
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {loading ? 'Computing insights from your SharePoint data...' : error ? 'Demo analytics - Live data integration ready' : 'Real-time insights and performance metrics'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh Analytics Data">
              <IconButton
                onClick={refreshAnalytics}
                disabled={loading}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 5,
                    bgcolor: currentTheme.primary + '08'
                  },
                  '& .MuiSvgIcon-root': {
                    color: loading ? currentTheme.secondary : currentTheme.primary,
                    animation: loading ? 'spin 1s linear infinite' : 'none'
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Analytics Report">
              <IconButton
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 5,
                    bgcolor: currentTheme.secondary + '08'
                  }
                }}
              >
                <DownloadIcon sx={{ color: currentTheme.secondary }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Real-time Analytics Overview */}
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.primary,
                mb: 0.5
              }}>
                {loading ? '...' : analytics.totalFiles.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.secondary,
                mb: 0.5
              }}>
                {loading ? '...' : analytics.totalSites}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Sites
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.accent,
                mb: 0.5
              }}>
                {loading ? '...' : analytics.recentActivity.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Actions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.primary,
                mb: 0.5
              }}>
                {loading ? '...' : analytics.totalStorage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced KPI Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${currentTheme.primary}15`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.secondary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <ChartIcon sx={{ fontSize: 24, color: currentTheme.primary }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: currentTheme.primary }}>
                {loading ? '...' : analytics.totalFiles.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${currentTheme.primary}15`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.secondary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <AssessmentIcon sx={{ fontSize: 24, color: currentTheme.primary }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: currentTheme.primary }}>
                {loading ? '...' : analytics.totalStorage}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Storage Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${currentTheme.secondary}15`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.secondary}20, ${currentTheme.accent}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <TimelineIcon sx={{ fontSize: 24, color: currentTheme.secondary }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: currentTheme.secondary }}>
                {loading ? '...' : analytics.totalSites}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Active Sites
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${currentTheme.accent}15`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.primary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUpIcon sx={{ fontSize: 24, color: currentTheme.accent }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: currentTheme.accent }}>
                {loading ? '...' : analytics.recentActivity.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Recent Activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid #FF6F0015`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, #FF6F0020, #F5720220)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <PieChartIcon sx={{ fontSize: 24, color: '#FF6F00' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#FF6F00' }}>
                {loading ? '...' : analytics.fileTypes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                File Types
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid #9C27B015`,
            transition: 'all 0.3s ease',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, #9C27B020, #7B1FA220)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <BarChartIcon sx={{ fontSize: 24, color: '#9C27B0' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#9C27B0' }}>
                {loading ? '...' : analytics.totalLibraries || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Libraries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Analytics Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            borderRadius: 3,
            boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
            border: `1px solid ${currentTheme.primary}05`,
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(135deg, ${currentTheme.primary}02 0%, ${currentTheme.secondary}02 100%)`,
              borderBottom: `1px solid ${currentTheme.primary}15`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.secondary}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <TimelineIcon sx={{ color: currentTheme.primary, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Usage Trends Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily activity patterns over the last 7 days
                  </Typography>
                </Box>
              </Box>
            </Box>
            <DocumentUsageChart
              data={usageTrendsData}
              timeframe="Last 7 days"
              onRefresh={refreshAnalytics}
              onExport={() => {
                console.log('📊 Exporting Usage Trends Analysis...');
                const exportData = {
                  title: 'Usage Trends Analysis',
                  timeframe: 'Last 7 days',
                  data: usageTrendsData,
                  exportDate: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `usage-trends-analysis-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{
            borderRadius: 3,
            boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
            border: `1px solid ${currentTheme.accent}05`,
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(135deg, ${currentTheme.accent}02 0%, ${currentTheme.primary}02 100%)`,
              borderBottom: `1px solid ${currentTheme.accent}15`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.primary}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <PieChartIcon sx={{ color: currentTheme.accent, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Storage Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    File types breakdown
                  </Typography>
                </Box>
              </Box>
            </Box>
            <StorageUsageChart
              data={storageData}
              type="pie"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced Recent Activity Feed */}
      <Paper sx={{
        borderRadius: 3,
        boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
        border: `1px solid ${currentTheme.secondary}05`,
        overflow: 'hidden'
      }}>
        <CardHeader
          sx={{
            background: `linear-gradient(135deg, ${currentTheme.secondary}02 0%, ${currentTheme.accent}02 100%)`,
            borderBottom: `1px solid ${currentTheme.secondary}15`
          }}
          avatar={
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUpIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Live Activity Stream
            </Typography>
          }
          subheader="Real-time user actions across your SharePoint environment"
        />
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {analytics.recentActivity.map((activity, index) => (
              <Paper key={index} sx={{
                p: 2.5,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 2,
                border: `1px solid ${currentTheme.primary}08`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${currentTheme.primary}03`,
                  borderColor: `${currentTheme.primary}15`,
                  transform: 'translateX(4px)'
                }
              }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      label={activity.fileName}
                      size="small"
                      sx={{
                        mr: 1.5,
                        background: `linear-gradient(45deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`,
                        border: `1px solid ${currentTheme.primary}20`,
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      was {activity.action}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {activity.timestamp} • {activity.site}
                  </Typography>
                </Box>
                <Chip
                  label={activity.action.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    background: activity.action === 'uploaded' ?
                      `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})` :
                      activity.action === 'shared' ?
                      `linear-gradient(45deg, ${currentTheme.secondary}, ${currentTheme.accent})` :
                      activity.action === 'modified' ?
                      'linear-gradient(45deg, #FF6F00, #F57202)' :
                      `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                />
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Paper>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};