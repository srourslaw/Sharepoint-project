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
    <Grid container spacing={3}>
      {filesToShow.map((file) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'background.paper' }}>
                  {getFileIcon(file.extension)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {file.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(file.lastModifiedDateTime)}
                </Typography>
                <Box>
                  <Tooltip title="Download">
                    <IconButton size="small">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton size="small">
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <List>
      {filesToShow.map((file, index) => (
        <React.Fragment key={file.id}>
          <ListItem
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'background.paper' }}>
                {getFileIcon(file.extension)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={file.displayName}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modified {formatDate(file.lastModifiedDateTime)}
                  </Typography>
                  <Chip
                    label={file.extension.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Download">
                <IconButton size="small" sx={{ mr: 1 }}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton size="small" sx={{ mr: 1 }}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton size="small">
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
          {index < filesToShow.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📅 Recent Files
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your recently accessed SharePoint files ({recentFiles.length} files)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton color="primary" onClick={refreshRecentFiles}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={viewMode === 'grid' ? 'List View' : 'Grid View'}>
            <IconButton
              color="primary"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Time Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab
            icon={<RecentIcon />}
            label={`All Recent (${recentFiles.length})`}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<TodayIcon />}
            label={`Today (${todayFiles.length})`}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<WeekIcon />}
            label={`This Week (${weekFiles.length})`}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<MonthIcon />}
            label={`This Month (${monthFiles.length})`}
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <TabPanel value={tabValue} index={tabValue}>
        {filesToShow.length > 0 ? (
          <Paper sx={{ p: 2 }}>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </Paper>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <TimeIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No files found for this time period
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 1 && "No files were accessed today"}
              {tabValue === 2 && "No files were accessed this week"}
              {tabValue === 3 && "No files were accessed this month"}
              {tabValue === 0 && "No recent files available"}
            </Typography>
            <Button
              variant="outlined"
              onClick={refreshRecentFiles}
              sx={{ mt: 2 }}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
};