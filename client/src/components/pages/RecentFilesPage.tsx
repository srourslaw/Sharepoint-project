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
  AccessTime as TimeIcon,
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
  const { recentFiles, loading, error, refreshRecentFiles } = useRecentFiles();
  const { currentTheme } = useDynamicTheme();
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const getFileIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
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
    <Grid container spacing={{ xs: 3, sm: 4, md: 4, lg: 5 }}>
      {filesToShow.map((file) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={file.id}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 200, sm: 220 },
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                transform: 'translateY(-6px)',
                borderColor: 'primary.light',
              },
            }}
          >
            <CardContent sx={{ pb: '16px !important', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* File Header with Icon and Type */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  border: `1px solid ${currentTheme.primary}20`
                }}>
                  {getFileIcon(file.extension)}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Chip
                    label={file.extension.toUpperCase()}
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
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
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

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{
                    color: currentTheme.primary,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>
                    Recent Activity
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download File">
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            boxShadow: 2,
                            bgcolor: currentTheme.primary + '08'
                          }
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share File">
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            boxShadow: 2,
                            bgcolor: currentTheme.secondary + '08'
                          }
                        }}
                      >
                        <ShareIcon fontSize="small" />
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
              '&:hover': {
                backgroundColor: `${currentTheme.primary}08`,
                borderColor: `${currentTheme.primary}20`,
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{
                bgcolor: `${currentTheme.primary}10`,
                border: `2px solid ${currentTheme.primary}20`,
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
                    label={file.extension.toUpperCase()}
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
                    <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
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
                  <Box sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: `${currentTheme.accent}15`,
                    border: `1px solid ${currentTheme.accent}25`
                  }}>
                    <Typography variant="caption" sx={{
                      color: currentTheme.accent,
                      fontWeight: 600,
                      fontSize: '0.65rem'
                    }}>
                      RECENT
                    </Typography>
                  </Box>
                </Box>
              }
            />

            <ListItemSecondaryAction>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Download File">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: currentTheme.primary + '08'
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share File">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: currentTheme.secondary + '08'
                      }
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More Options">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 2,
                        bgcolor: currentTheme.accent + '08'
                      }
                    }}
                  >
                    <MoreIcon fontSize="small" />
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
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3,
            boxShadow: `0 4px 12px ${currentTheme.primary}25`
          }}>
            <TimeIcon sx={{ color: 'white', fontSize: 28 }} />
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
        border: `1px solid ${currentTheme.primary}10`,
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
                background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`,
                borderBottom: `3px solid ${currentTheme.primary}`,
              },
              '&:hover': {
                backgroundColor: `${currentTheme.primary}08`,
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
                    bgcolor: currentTheme.primary + '20',
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
                    bgcolor: currentTheme.secondary + '20',
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
                    bgcolor: currentTheme.accent + '20',
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
                    bgcolor: currentTheme.primary + '20',
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
            border: `1px solid ${currentTheme.primary}05`,
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
            border: `1px solid ${currentTheme.primary}10`,
            background: `linear-gradient(135deg, ${currentTheme.primary}03 0%, ${currentTheme.secondary}03 100%)`
          }}>
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.secondary}15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              border: `2px solid ${currentTheme.primary}20`
            }}>
              <TimeIcon sx={{ fontSize: 60, color: currentTheme.primary, opacity: 0.7 }} />
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
                  boxShadow: `0 4px 12px ${currentTheme.primary}25`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${currentTheme.primary}35`,
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
                    backgroundColor: `${currentTheme.primary}08`,
                  }
                }}
              >
                View All Recent
              </Button>
            </Box>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
};