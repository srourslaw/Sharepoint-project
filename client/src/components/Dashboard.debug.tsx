import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DragIndicator as DragIndicatorIcon,
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
import { BrandWatermark } from './BrandWatermark';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';
import { LayoutState } from '../types';

const getDrawerWidth = (theme: any, isMobile: boolean) => {
  if (isMobile) return 280;
  return theme.breakpoints.up('lg') ? 320 : 300;
};

const getAIPanelWidth = (theme: any, isMobile: boolean) => {
  if (isMobile) return 320;
  return theme.breakpoints.up('lg') ? 380 : 350;
};

// AI Panel width constraints
const AI_PANEL_MIN_WIDTH = 300;
const AI_PANEL_MAX_WIDTH = 600;
const AI_PANEL_DEFAULT_WIDTH = 380;

// Get saved AI panel width from localStorage
const getSavedAIPanelWidth = (): number => {
  try {
    const saved = localStorage.getItem('ai-panel-width');
    if (saved) {
      const width = parseInt(saved, 10);
      if (width >= AI_PANEL_MIN_WIDTH && width <= AI_PANEL_MAX_WIDTH) {
        return width;
      }
    }
  } catch (error) {
    console.warn('Failed to load AI panel width from localStorage:', error);
  }
  return AI_PANEL_DEFAULT_WIDTH;
};

// Save AI panel width to localStorage
const saveAIPanelWidth = (width: number) => {
  try {
    localStorage.setItem('ai-panel-width', width.toString());
  } catch (error) {
    console.warn('Failed to save AI panel width to localStorage:', error);
  }
};

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { currentTheme } = useDynamicTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const drawerWidth = getDrawerWidth(theme, isMobile);
  const defaultAIPanelWidth = getAIPanelWidth(theme, isMobile);
  const savedAIPanelWidth = getSavedAIPanelWidth();

  const [layout, setLayout] = useState<LayoutState>({
    sidebarOpen: !isMobile,
    sidebarWidth: drawerWidth,
    aiPanelOpen: !isMobile,
    aiPanelWidth: isMobile ? defaultAIPanelWidth : savedAIPanelWidth,
    previewOpen: false,
    previewHeight: 500,
  });

  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [actualSidebarWidth, setActualSidebarWidth] = useState<number>(drawerWidth);

  // AI Panel resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const resizeRef = useRef<HTMLDivElement>(null);


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

  const handleSidebarWidthChange = (width: number) => {
    setActualSidebarWidth(width);
  };

  // AI Panel resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ AI Sidebar resize started:', { clientX: e.clientX, currentWidth: layout.aiPanelWidth });
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(layout.aiPanelWidth);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
    e.stopPropagation();
  }, [layout.aiPanelWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = startX - e.clientX; // Reverse direction for right-side panel
    const newWidth = Math.max(
      AI_PANEL_MIN_WIDTH,
      Math.min(AI_PANEL_MAX_WIDTH, startWidth + deltaX)
    );

    setLayout(prev => ({
      ...prev,
      aiPanelWidth: newWidth
    }));
  }, [isResizing, startX, startWidth]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      saveAIPanelWidth(layout.aiPanelWidth);
    }
  }, [isResizing, layout.aiPanelWidth]);

  // Mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

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
            
            <Box sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              gap: layout.previewOpen ? 2 : 0,
              height: '100%'
            }}>
              <Box sx={{
                flexShrink: 0,
                height: layout.previewOpen ? '400px' : 'auto',
                maxHeight: layout.previewOpen ? '400px' : 'none',
                overflow: 'auto'
              }}>
                <MainContent
                  currentPath={currentPath}
                  selectedFiles={selectedFiles}
                  onFileSelect={setSelectedFiles}
                  onNavigate={setCurrentPath}
                  onPreviewToggle={handlePreviewToggle}
                />
              </Box>

              {/* File Preview Panel */}
              {layout.previewOpen && selectedFiles.length > 0 && (
                <Box sx={{
                  flex: 1,
                  borderTop: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  minHeight: '400px'
                }}>
                  <FilePreview
                    selectedFiles={selectedFiles}
                    height="100%"
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
      
      {/* App Bar with Thakral One Branding */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${actualSidebarWidth}px)`,
          ml: `${actualSidebarWidth}px`,
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 30%, ${currentTheme.accent} 70%, ${currentTheme.primary} 100%)`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: '64px', py: 1 }}>
          
          {/* Compact Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 2 }}>
            <img
              src="https://www.thakralone.com/wp-content/uploads/2020/08/Thakral-One-Logo.png"
              alt="Thakral One Logo"
              style={{
                height: '28px',
                marginRight: '10px',
                filter: 'brightness(0) invert(1)'
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.3px',
                color: 'white',
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                lineHeight: 1.1
              }}
            >
              SharePoint AI Dashboard
            </Typography>
          </Box>

          {/* Right side - User Profile and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserProfileMenu
              userName={user?.displayName || 'Unknown User'}
              userEmail={user?.mail || user?.userPrincipalName || 'unknown@email.com'}
              user={user}
              onLogout={logout}
              onSettings={() => console.log('Settings clicked')}
            />

            <IconButton
              color="inherit"
              aria-label="toggle ai panel"
              onClick={handleAIPanelToggle}
              sx={{
                ml: 1,
                color: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              {layout.aiPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Sidebar - New Fixed Position */}
      <NavigationSidebar
        onNavigate={setCurrentPath}
        currentPath={currentPath}
        onWidthChange={handleSidebarWidthChange}
      />

      {/* Main Content Area - Updated for Fixed Sidebar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2, // Reduced padding for better space utilization
          ml: `calc(${actualSidebarWidth}px + 12px)`, // Reduced margin for more content space
          mr: layout.aiPanelOpen ? `${layout.aiPanelWidth}px` : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        
        {/* Conditional Breadcrumb Navigation - only for Home/SharePoint content */}
        {location.pathname === '/' && (
          <BreadcrumbNavigation currentPath={currentPath} onNavigate={setCurrentPath} />
        )}
        
        {/* Dynamic Content Based on Route */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', paddingBottom: '60px', height: 'calc(100vh - 120px)' }}>
          {renderMainContent()}
        </Box>
      </Box>

      {/* Subtle Brand Watermark */}
      <BrandWatermark />

      {/* AI Panel - RESIZABLE */}
      <Drawer
        sx={{
          width: layout.aiPanelOpen ? layout.aiPanelWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: layout.aiPanelWidth,
            boxSizing: 'border-box',
            mt: '64px',
            height: 'calc(100% - 64px)',
            position: 'relative',
          },
        }}
        variant="persistent"
        anchor="right"
        open={layout.aiPanelOpen}
      >
        {/* Enhanced Resize Handle */}
        <Box
          ref={resizeRef}
          onMouseDown={handleResizeStart}
          sx={{
            position: 'absolute',
            left: '-4px',
            top: 0,
            width: '12px',
            height: '100%',
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0 4px 4px 0',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '4px',
              height: '40px',
              backgroundColor: currentTheme.primary,
              opacity: 0.7,
              borderRadius: '2px',
              transition: 'all 0.2s ease',
            },
            '&:hover': {
              backgroundColor: `${currentTheme.primary}15`,
              '&::before': {
                opacity: 0.8,
                height: '60px',
                backgroundColor: currentTheme.primary,
              },
              '& .resize-indicator': {
                opacity: 1,
                transform: 'rotate(90deg) scale(1.1)',
              },
            },
            '&:active': {
              backgroundColor: `${currentTheme.primary}25`,
              '&::before': {
                opacity: 1,
                height: '80px',
              },
            },
            transition: 'background-color 0.2s ease',
          }}
        >
          <Box
            className="resize-indicator"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
              transition: 'all 0.2s ease',
              transform: 'rotate(90deg)',
              pointerEvents: 'none',
              '& .MuiSvgIcon-root': {
                fontSize: '14px',
                color: currentTheme.primary,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              },
            }}
          >
            <DragIndicatorIcon />
          </Box>
        </Box>

        {/* AI Panel Content */}
        <AIPanel
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
          currentPath={currentPath}
        />
      </Drawer>
    </Box>
  );
};