import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  alpha,
  Snackbar,
} from '@mui/material';
import { useDynamicTheme } from '../../contexts/DynamicThemeContext';
import {
  Schedule as RecentIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  CalendarToday as MonthIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { useRecentFiles } from '../../hooks/useRecentFiles';
import { formatFileSize, formatDate } from '../../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const RecentFilesPage: React.FC = () => {
  console.log('🔵 RecentFilesPage component mounted');
  const { recentFiles, loading, error, refreshRecentFiles } = useRecentFiles();
  console.log('🔵 Recent Files hook data:', { count: recentFiles.length, loading, error });
  const { currentTheme } = useDynamicTheme();
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const getFileIcon = (extension: string) => {
    // Add safety check for undefined/null extension
    const safeExtension = extension || '';
    switch (safeExtension.toLowerCase()) {
      case 'docx':
      case 'doc':
        return <DocIcon sx={{ color: '#2b579a' }} />;
      case 'xlsx':
      case 'xls':
        return <ExcelIcon sx={{ color: '#217346' }} />;
      case 'pptx':
      case 'ppt':
        return <PowerPointIcon sx={{ color: '#d24726' }} />;
      case 'pdf':
        return <PdfIcon sx={{ color: '#d32f2f' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon sx={{ color: '#ff9800' }} />;
      default:
        return <FileIcon sx={{ color: '#666' }} />;
    }
  };

  const filterFilesByTime = (files: typeof recentFiles, days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return files.filter(file => new Date(file.lastModifiedDateTime) >= cutoffDate);
  };

  const todayFiles = filterFilesByTime(recentFiles, 1);
  const weekFiles = filterFilesByTime(recentFiles, 7);
  const monthFiles = filterFilesByTime(recentFiles, 30);

  const getFilesToShow = () => {
    switch (tabValue) {
      case 0: return recentFiles; // All recent
      case 1: return todayFiles; // Today
      case 2: return weekFiles; // This week
      case 3: return monthFiles; // This month
      default: return recentFiles;
    }
  };

  const filesToShow = getFilesToShow();

  const handleShare = async (file: any) => {
    try {
      await navigator.clipboard.writeText(file.webUrl);
      const fileName = file.displayName || file.name || 'Unknown file';
      setSnackbarMessage(`File "${fileName}" link copied to clipboard!`);
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Failed to copy link to clipboard');
      setSnackbarOpen(true);
    }
  };

  const handleDownload = (file: any) => {
    // Open the file in a new tab which allows for download or editing
    window.open(file.webUrl, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Recent Files...
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
          Unable to load recent files from SharePoint. Please check your connection and try again.
        </Typography>
      </Box>
    );
  }

  const renderGridView = () => (
    <Grid container spacing={3}>
      {filesToShow.map((file) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(currentTheme.primary, 0.15)}`,
            transition: 'all 0.3s ease',
            minHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{
              pb: '16px !important',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper'
            }}>
              {/* File Header with Icon and Type */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(currentTheme.primary, 0.15)}, ${alpha(currentTheme.secondary, 0.15)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  border: `1px solid ${alpha(currentTheme.primary, 0.2)}`
                }}>
                  {getFileIcon(file.extension)}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Chip
                    label={(file.extension || '').toUpperCase()}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: 'white',
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {file.displayName}
                  </Typography>
                </Box>
              </Box>

              {/* File Details */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Box sx={{
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: 1.5,
                  p: 1.5,
                  mb: 2,
                  border: `1px solid rgba(0,0,0,0.05)`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {formatDate(file.lastModifiedDateTime)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{
                    fontSize: '0.7rem',
                    opacity: 0.8
                  }}>
                    Size: {formatFileSize(file.size)}
                  </Typography>
                </Box>

                {/* Action Buttons - Analytics Style */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Typography variant="caption" sx={{
                    color: currentTheme.primary,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>
                    Recent
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download File">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        sx={{
                          color: currentTheme.primary,
                          bgcolor: alpha(currentTheme.primary, 0.1),
                          '&:hover': {
                            bgcolor: alpha(currentTheme.primary, 0.2),
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share File">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShare(file);
                        }}
                        sx={{
                          color: currentTheme.secondary,
                          bgcolor: alpha(currentTheme.secondary, 0.1),
                          '&:hover': {
                            bgcolor: alpha(currentTheme.secondary, 0.2),
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Options">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fileName = file.displayName || file.name || 'Unknown file';
                          console.log('More options for:', fileName);
                          alert(`More options for: ${fileName}`);
                        }}
                        sx={{
                          color: currentTheme.accent,
                          bgcolor: alpha(currentTheme.accent, 0.1),
                          '&:hover': {
                            bgcolor: alpha(currentTheme.accent, 0.2),
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <List sx={{ py: 0 }}>
      {filesToShow.map((file, index) => (
        <React.Fragment key={file.id}>
          <ListItem
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              mb: 1,
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              backgroundColor: '#ffffff !important',
              background: '#ffffff !important',
              '&:hover': {
                backgroundColor: '#f5f5f5 !important',
                background: '#f5f5f5 !important',
                borderColor: alpha(currentTheme.primary, 0.2),
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{
                bgcolor: alpha(currentTheme.primary, 0.1),
                border: `2px solid ${alpha(currentTheme.primary, 0.2)}`,
                width: 48,
                height: 48
              }}>
                {getFileIcon(file.extension)}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                    {file.displayName}
                  </Typography>
                  <Chip
                    label={(file.extension || '').toUpperCase()}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      color: 'white'
                    }}
                  />
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HistoryIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {formatDate(file.lastModifiedDateTime)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              }
            />

            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Download File">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      color: `${currentTheme.primary} !important`,
                      zIndex: 10,
                      position: 'relative',
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: alpha(currentTheme.primary, 0.08),
                        transform: 'translateY(-1px)',
                        color: `${currentTheme.primary} !important`,
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" sx={{ color: 'inherit' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share File">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(file);
                    }}
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      color: `${currentTheme.secondary} !important`,
                      zIndex: 10,
                      position: 'relative',
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: alpha(currentTheme.secondary, 0.08),
                        transform: 'translateY(-1px)',
                        color: `${currentTheme.secondary} !important`,
                      }
                    }}
                  >
                    <ShareIcon fontSize="small" sx={{ color: 'inherit' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More Options">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const fileName = file.displayName || file.name || 'Unknown file';
                      console.log('More options for:', fileName);
                      // Add visual feedback
                      alert(`More options for: ${fileName}`);
                    }}
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      color: `${currentTheme.accent} !important`,
                      zIndex: 10,
                      position: 'relative',
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: alpha(currentTheme.accent, 0.08),
                        transform: 'translateY(-1px)',
                        color: `${currentTheme.accent} !important`,
                      }
                    }}
                  >
                    <MoreIcon fontSize="small" sx={{ color: 'inherit' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
          {index < filesToShow.length - 1 && <Divider sx={{ my: 1, opacity: 0.3 }} />}
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh', maxHeight: '100vh', overflow: 'auto' }}>

      {/* Beautiful Recent Files Header */}
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
            <Typography sx={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>📊</Typography>
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
              Recent Activity Hub
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Track your SharePoint journey across time
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Files">
              <IconButton
                color="primary"
                onClick={refreshRecentFiles}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
              <IconButton
                color="primary"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: currentTheme.primary,
                mb: 0.5
              }}>
                {recentFiles.length}
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
                {todayFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
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
                {weekFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
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
                {monthFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Month
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Time Filter Tabs */}
      <Paper sx={{
        mb: 4,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
        overflow: 'hidden'
      }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                background: `linear-gradient(135deg, ${alpha(currentTheme.primary, 0.15)}, ${alpha(currentTheme.secondary, 0.15)})`,
                borderBottom: `3px solid ${currentTheme.primary}`,
              },
              '&:hover': {
                backgroundColor: alpha(currentTheme.primary, 0.08),
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            }
          }}
        >
          <Tab
            icon={<RecentIcon sx={{ fontSize: 24 }} />}
            label={
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All Recent
                </Typography>
                <Chip
                  label={recentFiles.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    mt: 0.5,
                    bgcolor: alpha(currentTheme.primary, 0.2),
                    color: currentTheme.primary,
                    fontWeight: 600
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<TodayIcon sx={{ fontSize: 24 }} />}
            label={
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Today
                </Typography>
                <Chip
                  label={todayFiles.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    mt: 0.5,
                    bgcolor: alpha(currentTheme.secondary, 0.2),
                    color: currentTheme.secondary,
                    fontWeight: 600
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<WeekIcon sx={{ fontSize: 24 }} />}
            label={
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  This Week
                </Typography>
                <Chip
                  label={weekFiles.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    mt: 0.5,
                    bgcolor: alpha(currentTheme.accent, 0.2),
                    color: currentTheme.accent,
                    fontWeight: 600
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<MonthIcon sx={{ fontSize: 24 }} />}
            label={
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  This Month
                </Typography>
                <Chip
                  label={monthFiles.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    mt: 0.5,
                    bgcolor: alpha(currentTheme.primary, 0.2),
                    color: currentTheme.primary,
                    fontWeight: 600
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Enhanced Content */}
      <TabPanel value={tabValue} index={tabValue}>
        {filesToShow.length > 0 ? (
          <Paper sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(currentTheme.primary, 0.05)}`,
            bgcolor: 'background.paper'
          }}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </Paper>
        ) : (
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
            bgcolor: 'background.paper'
          }}>
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(currentTheme.primary, 0.15)}, ${alpha(currentTheme.secondary, 0.15)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              border: `2px solid ${alpha(currentTheme.primary, 0.2)}`
            }}>
              <HistoryIcon sx={{ fontSize: 60, color: currentTheme.primary, opacity: 0.7 }} />
            </Box>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              No Recent Activity
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              {tabValue === 1 && "No files were accessed today. Your daily activity will appear here."}
              {tabValue === 2 && "No files were accessed this week. Your weekly activity will show up here."}
              {tabValue === 3 && "No files were accessed this month. Your monthly activity will be displayed here."}
              {tabValue === 0 && "No recent files available. Your SharePoint activity timeline will appear here."}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={refreshRecentFiles}
                startIcon={<RefreshIcon />}
                sx={{
                  background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  boxShadow: `0 4px 12px ${alpha(currentTheme.primary, 0.25)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(currentTheme.primary, 0.35)}`,
                  }
                }}
              >
                Refresh Files
              </Button>
              <Button
                variant="outlined"
                onClick={() => setTabValue(0)}
                sx={{
                  borderColor: currentTheme.primary,
                  color: currentTheme.primary,
                  '&:hover': {
                    borderColor: currentTheme.secondary,
                    backgroundColor: alpha(currentTheme.primary, 0.08),
                  }
                }}
              >
                View All Recent
              </Button>
            </Box>
          </Paper>
        )}
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: '#2e7d32 !important',
            background: '#2e7d32 !important',
            color: '#ffffff !important',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            minWidth: '300px'
          },
          '& .MuiSnackbarContent-message': {
            color: '#ffffff !important',
            fontWeight: 600,
            fontSize: '0.95rem'
          }
        }}
      />
    </Box>
  );
};