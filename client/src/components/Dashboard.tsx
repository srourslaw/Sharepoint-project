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
import { ErrorBoundary } from './ErrorBoundary';
import { ThakralFooter } from './ThakralFooter';
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
    previewHeight: window.innerHeight - 200, // Much taller preview
  });

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [useFileBrowser, setUseFileBrowser] = useState(true);

  // Update layout when screen size changes
  React.useEffect(() => {
    setLayout(prev => ({
      ...prev,
      sidebarOpen: !isMobile && !prev.previewOpen,
      aiPanelOpen: !isMobile && !prev.previewOpen,
      sidebarWidth: drawerWidth,
      aiPanelWidth: aiPanelWidth,
      previewHeight: window.innerHeight - 64,
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
    console.log('🔥 handlePreviewToggle called! Current state:', layout.previewOpen);
    console.log('🔥 Selected files:', selectedFiles);
    setLayout(prev => ({
      ...prev,
      previewOpen: !prev.previewOpen
    }));
    console.log('🔥 Setting previewOpen to:', !layout.previewOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar with Thakral One Branding */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: layout.sidebarOpen ? `calc(100% - ${layout.sidebarWidth}px)` : '100%' },
          ml: { sm: layout.sidebarOpen ? `${layout.sidebarWidth}px` : 0 },
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: '64px', py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Thakral One Logo and Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 2 }}>
            <img
              src="https://www.thakralone.com/wp-content/uploads/2020/08/Thakral-One-Logo.png"
              alt="Thakral One Logo"
              style={{
                height: '32px',
                marginRight: '12px',
                filter: 'brightness(0) invert(1)'
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'white',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.2
                }}
              >
                📊 SharePoint AI Dashboard
              </Typography>
              <Typography
                variant="caption"
                sx={{ 
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Prototype by Thakral One
              </Typography>
            </Box>
          </Box>

          {/* Copyright notice */}
          <Typography
            variant="caption"
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.7rem',
              fontWeight: 500,
              mr: 2,
              display: { xs: 'none', md: 'block' }
            }}
          >
            © 2025 Proprietary AI Solution
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
            sm: layout.previewOpen 
              ? '100vw'
              : (layout.aiPanelOpen 
                ? `calc(100% - ${layout.sidebarOpen ? layout.sidebarWidth : 0}px - ${layout.aiPanelWidth}px)`
                : `calc(100% - ${layout.sidebarOpen ? layout.sidebarWidth : 0}px)`)
          },
          position: layout.previewOpen ? 'fixed' : 'relative',
          top: layout.previewOpen ? 64 : 'auto',
          left: layout.previewOpen ? 0 : 'auto',
          zIndex: layout.previewOpen ? theme.zIndex.modal - 1 : 'auto',
          height: layout.previewOpen ? 'calc(100vh - 64px)' : 'auto',
          transition: theme.transitions.create(['width', 'position', 'height'], {
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
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary>
            <MainContent
              currentPath={currentPath}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onNavigate={setCurrentPath}
              onPreviewToggle={handlePreviewToggle}
            />
          </ErrorBoundary>
          
          {/* Thakral One Footer - only show when not in preview mode */}
          {!layout.previewOpen && <ThakralFooter />}
          
          {/* File Preview Area */}
          {layout.previewOpen && (
            <FilePreview
              selectedFiles={selectedFiles}
              height={layout.previewHeight}
              onClose={handlePreviewToggle}
            />
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