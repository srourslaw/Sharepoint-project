import React, { useState } from 'react';
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
import { MainContent } from './MainContent';
import { FileBrowser } from './FileBrowser';
import { AIPanel } from './AIPanel';
import { FilePreview } from './FilePreview';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const drawerWidth = getDrawerWidth(theme, isMobile);
  const aiPanelWidth = getAIPanelWidth(theme, isMobile);
  
  const [layout, setLayout] = useState<LayoutState>({
    sidebarOpen: !isMobile,
    sidebarWidth: drawerWidth,
    aiPanelOpen: !isMobile,
    aiPanelWidth: aiPanelWidth,
    previewOpen: false,
    previewHeight: isMobile ? 250 : 300,
  });

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [useFileBrowser, setUseFileBrowser] = useState(true);

  // Update layout when screen size changes
  React.useEffect(() => {
    setLayout(prev => ({
      ...prev,
      sidebarOpen: !isMobile,
      aiPanelOpen: !isMobile,
      sidebarWidth: drawerWidth,
      aiPanelWidth: aiPanelWidth,
      previewHeight: isMobile ? 250 : 300,
    }));
  }, [isMobile, drawerWidth, aiPanelWidth]);

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
            SharePoint AI Dashboard
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

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
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
        
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation currentPath={currentPath} onNavigate={setCurrentPath} />
        
        {/* File Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MainContent
            currentPath={currentPath}
            selectedFiles={selectedFiles}
            onFileSelect={setSelectedFiles}
            onNavigate={setCurrentPath}
            onPreviewToggle={handlePreviewToggle}
          />
          
          {/* File Preview Area */}
          {layout.previewOpen && (
            <>
              <Divider />
              <FilePreview
                selectedFiles={selectedFiles}
                height={layout.previewHeight}
                onClose={handlePreviewToggle}
              />
            </>
          )}
        </Box>
      </Box>

      {/* AI Interaction Panel */}
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
          onClose={handleAIPanelToggle}
        />
      </Drawer>
    </Box>
  );
};