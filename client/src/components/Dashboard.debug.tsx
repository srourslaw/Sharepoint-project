import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import { NavigationSidebar } from './NavigationSidebar';
import { MainContent } from './MainContent.step5';
// import { FileBrowser } from './FileBrowser';
import { AIPanel } from './AIPanel';
import { FilePreview } from './FilePreview';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PeoplePage } from './pages/PeoplePage';
import { SettingsPage } from './pages/SettingsPage';
import { RecentFilesPage } from './pages/RecentFilesPage';
import { OneDrivePage } from './pages/OneDrivePage';
import { LayoutState } from '../types';

const getDrawerWidth = (theme: any, isMobile: boolean) => {
  if (isMobile) return 280;
  return theme.breakpoints.up('lg') ? 320 : 300;
};

const getAIPanelWidth = (theme: any, isMobile: boolean) => {
  if (isMobile) return 320;
  return theme.breakpoints.up('lg') ? 380 : 350;
};

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const drawerWidth = getDrawerWidth(theme, isMobile);
  const aiPanelWidth = getAIPanelWidth(theme, isMobile);
  
  const [layout, setLayout] = useState<LayoutState>({
    sidebarOpen: !isMobile,
    sidebarWidth: drawerWidth,
    aiPanelOpen: !isMobile,
    aiPanelWidth: aiPanelWidth,
    previewOpen: false,
    previewHeight: 300,
  });

  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleDrawerToggle = () => {
    setLayout(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen
    }));
  };

  const handleAIPanelToggle = () => {
    setLayout(prev => ({
      ...prev,
      aiPanelOpen: !prev.aiPanelOpen
    }));
  };

  const handlePreviewToggle = () => {
    setLayout(prev => ({
      ...prev,
      previewOpen: !prev.previewOpen
    }));
  };

  // Render content based on current route
  const renderMainContent = () => {
    switch (location.pathname) {
      case '/analytics':
        return <AnalyticsPage />;
      case '/people':
        return <PeoplePage />;
      case '/settings':
        return <SettingsPage />;
      case '/recent':
        return <RecentFilesPage />;
      case '/onedrive':
        return <OneDrivePage />;
      default:
        // Home page - SharePoint sites and documents
        return (
          <>
            <Typography variant="h4" gutterBottom>
              🏠 SharePoint Home
            </Typography>
            <Typography variant="body1" gutterBottom>
              Browse your SharePoint sites, libraries, and documents
            </Typography>
            
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <MainContent
                currentPath={currentPath}
                selectedFiles={selectedFiles}
                onFileSelect={setSelectedFiles}
                onNavigate={setCurrentPath}
                onPreviewToggle={handlePreviewToggle}
              />
              
              {/* File Preview Panel */}
              {layout.previewOpen && selectedFiles.length > 0 && (
                <Box sx={{ 
                  height: layout.previewHeight, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  flexShrink: 0
                }}>
                  <FilePreview
                    selectedFiles={selectedFiles}
                    height={layout.previewHeight}
                    onClose={handlePreviewToggle}
                  />
                </Box>
              )}
            </Box>
          </>
        );
    }
  };

  console.log('Dashboard.debug rendering...');

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: layout.sidebarOpen ? `calc(100% - ${layout.sidebarWidth}px)` : '100%' },
          ml: { sm: layout.sidebarOpen ? `${layout.sidebarWidth}px` : 0 },
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SharePoint AI Dashboard - Complete with AI
          </Typography>
          
          <IconButton
            color="inherit"
            aria-label="toggle ai panel"
            onClick={handleAIPanelToggle}
          >
            {layout.aiPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: layout.sidebarOpen ? layout.sidebarWidth : 0 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={layout.sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: layout.sidebarWidth,
              mt: '64px',
              height: 'calc(100% - 64px)',
            },
          }}
        >
          <NavigationSidebar
            onNavigate={setCurrentPath}
            currentPath={currentPath}
          />
        </Drawer>
      </Box>

      {/* Main Content Area - SIMPLIFIED FOR TESTING */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            sm: layout.aiPanelOpen 
              ? `calc(100% - ${layout.sidebarOpen ? layout.sidebarWidth : 0}px - ${layout.aiPanelWidth}px)`
              : `calc(100% - ${layout.sidebarOpen ? layout.sidebarWidth : 0}px)`
          },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        
        {/* Conditional Breadcrumb Navigation - only for Home/SharePoint content */}
        {location.pathname === '/' && (
          <BreadcrumbNavigation currentPath={currentPath} onNavigate={setCurrentPath} />
        )}
        
        {/* Dynamic Content Based on Route */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderMainContent()}
        </Box>
      </Box>

      {/* AI Panel - RESTORED */}
      <Drawer
        sx={{
          width: layout.aiPanelOpen ? layout.aiPanelWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: layout.aiPanelWidth,
            boxSizing: 'border-box',
            mt: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
        variant="persistent"
        anchor="right"
        open={layout.aiPanelOpen}
      >
        <AIPanel 
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
          currentPath={currentPath}
        />
      </Drawer>
    </Box>
  );
};