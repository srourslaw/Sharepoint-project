import React, { useState } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  Typography,
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSharePointFiles } from './hooks/useSharePointFiles';

// Create a basic theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0078d4',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Component that tests SharePoint data fetching
const SharePointDataTest: React.FC = () => {
  const { files, loading, error, totalCount } = useSharePointFiles({
    path: '',
    filters: {
      fileType: [],
      dateRange: {},
      sizeRange: {},
      author: [],
    },
    viewMode: {
      type: 'grid',
      itemsPerPage: 50,
      sortBy: 'name',
      sortOrder: 'asc',
    }
  });
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        SharePoint Data Test - Step 4
      </Typography>
      
      {loading && (
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress size={20} />
          <Typography>Loading SharePoint data...</Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          Total files: {totalCount}
        </Typography>
        <Typography variant="body2">
          Files loaded: {files.length}
        </Typography>
        <Typography variant="body2">
          Loading: {String(loading)}
        </Typography>
      </Box>
      
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Files (Safe Display):
          </Typography>
          {files.slice(0, 3).map((file, index) => (
            <Card key={index} sx={{ mb: 1 }}>
              <CardContent>
                <Typography variant="body1">
                  Name: {String(file.displayName || file.name || 'Unknown')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {typeof file.size === 'number' ? file.size : 0} bytes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {String(file.extension || 'unknown')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Is Folder: {String(Boolean(file.isFolder))}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      <Typography variant="body2" sx={{ mt: 3, color: 'success.main' }}>
        If this works without errors, SharePoint data fetching is fine.
      </Typography>
    </Box>
  );
};

// Dashboard with SharePoint data testing
const SharePointDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const drawerWidth = 280;
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: sidebarOpen ? `${drawerWidth}px` : 0 },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard Step 4 - SharePoint Data
          </Typography>
          <Typography variant="body2">
            User: {user?.displayName || 'Unknown'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: sidebarOpen ? drawerWidth : 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            mt: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Navigation
          </Typography>
          <Typography variant="body2">
            SharePoint sites will be listed here
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
        }}
      >
        <Toolbar />
        <SharePointDataTest />
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="*" element={<SharePointDashboard />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;