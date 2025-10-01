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
import { MainContent } from './MainContent';
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
  if (isMobile) return 400;
  return theme.breakpoints.up('lg') ? 600 : 500;
};

// AI Panel width constraints - Enhanced for better chat experience
const AI_PANEL_MIN_WIDTH = 400;
const AI_PANEL_MAX_WIDTH = 1200;
const AI_PANEL_DEFAULT_WIDTH = 600;

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
  const [createDocumentMode, setCreateDocumentMode] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // AI Panel resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Horizontal resizer state for preview
  const [isHorizontalResizing, setIsHorizontalResizing] = useState(false);
  const horizontalResizeRef = useRef<number>(0);


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
    // Reset create document mode when toggling preview
    if (createDocumentMode) {
      setCreateDocumentMode(false);
    }
  };

  const handleCreateDocument = () => {
    setCreateDocumentMode(true);
    setLayout(prev => ({
      ...prev,
      previewOpen: true
    }));
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Reset create document mode when files are selected for preview
  React.useEffect(() => {
    if (selectedFiles.length > 0 && createDocumentMode) {
      setCreateDocumentMode(false);
    }
  }, [selectedFiles.length, createDocumentMode]);

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

  // Horizontal resizer handlers for preview
  const handleHorizontalMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ Horizontal resizer started:', { clientY: e.clientY, currentHeight: layout.previewHeight });
    e.preventDefault();
    setIsHorizontalResizing(true);
    horizontalResizeRef.current = e.clientY;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [layout.previewHeight]);

  const handleHorizontalMouseMove = useCallback((e: MouseEvent) => {
    if (!isHorizontalResizing) return;

    e.preventDefault();
    const deltaY = horizontalResizeRef.current - e.clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 200, layout.previewHeight + deltaY));

    // Use requestAnimationFrame for smoother resizing
    requestAnimationFrame(() => {
      setLayout(prev => ({
        ...prev,
        previewHeight: newHeight
      }));
    });

    horizontalResizeRef.current = e.clientY;
  }, [isHorizontalResizing, layout.previewHeight]);

  const handleHorizontalMouseUp = useCallback(() => {
    console.log('🖱️ Horizontal resizer ended');
    setIsHorizontalResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

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

  // Add horizontal resizer event listeners
  useEffect(() => {
    if (isHorizontalResizing) {
      document.addEventListener('mousemove', handleHorizontalMouseMove);
      document.addEventListener('mouseup', handleHorizontalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleHorizontalMouseMove);
        document.removeEventListener('mouseup', handleHorizontalMouseUp);
      };
    }
  }, [isHorizontalResizing, handleHorizontalMouseMove, handleHorizontalMouseUp]);

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
            {/* Beautiful Home Header */}
            <Box sx={{
              background: `linear-gradient(135deg, ${currentTheme.primary}08 0%, ${currentTheme.secondary}08 50%, ${currentTheme.accent}08 100%)`,
              borderRadius: 3,
              p: 4,
              mb: 3,
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
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${currentTheme.primary}40`,
                }}>
                  <Typography variant="h3" sx={{ color: 'white' }}>🏢</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{
                    fontWeight: 700,
                    color: currentTheme.text.primary,
                    mb: 0.5,
                    background: `linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Your SharePoint Hub
                  </Typography>
                  <Typography variant="body1" sx={{
                    color: currentTheme.text.secondary,
                    fontSize: '1.1rem'
                  }}>
                    Access your sites, libraries, and documents in one place
                  </Typography>
                </Box>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: currentTheme.primary,
                  }} />
                  <Typography variant="body2" sx={{ color: currentTheme.text.secondary }}>
                    2 Active Sites
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: currentTheme.secondary,
                  }} />
                  <Typography variant="body2" sx={{ color: currentTheme.text.secondary }}>
                    4 Document Libraries
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: currentTheme.accent,
                  }} />
                  <Typography variant="body2" sx={{ color: currentTheme.text.secondary }}>
                    Recent Activity
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%'
            }}>
              {/* Main Content Area - dynamic height based on preview state */}
              <Box sx={{
                height: layout.previewOpen
                  ? `calc(100vh - 120px - ${layout.previewHeight}px - 12px)`
                  : 'calc(100vh - 120px)',
                overflow: 'auto',
                flexShrink: 0
              }}>
                <MainContent
                  currentPath={currentPath}
                  selectedFiles={selectedFiles}
                  onFileSelect={setSelectedFiles}
                  onNavigate={setCurrentPath}
                  onPreviewToggle={handlePreviewToggle}
                  onCreateDocument={handleCreateDocument}
                  refreshTrigger={refreshTrigger}
                />
              </Box>

              {/* Horizontal Resizer Bar */}
              {layout.previewOpen && (selectedFiles.length > 0 || createDocumentMode) && (
                <Box
                  onMouseDown={handleHorizontalMouseDown}
                  sx={{
                    height: '12px',
                    backgroundColor: '#f0f0f0',
                    cursor: 'row-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1200,
                    borderRadius: '0 0 4px 4px',
                    border: '1px solid #ddd',
                    transition: 'all 0.1s ease-out',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '50%',
                      top: '4px',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '4px',
                      backgroundColor: currentTheme.primary,
                      opacity: 0.7,
                      borderRadius: '2px',
                      transition: 'all 0.1s ease-out',
                    },
                    '&:hover': {
                      backgroundColor: `${currentTheme.primary}25`,
                      transform: 'scaleY(1.2)',
                      '&::before': {
                        opacity: 1,
                        height: '6px',
                        width: '80px',
                        backgroundColor: currentTheme.primary,
                      }
                    },
                    '&:active': {
                      backgroundColor: `${currentTheme.primary}35`,
                      '&::before': {
                        backgroundColor: currentTheme.primary,
                        opacity: 1,
                        height: '8px',
                        width: '100px',
                      }
                    }
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '10px',
                      color: '#666',
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0.8,
                      fontWeight: 500,
                      transition: 'opacity 0.1s ease'
                    }}
                  >
                    ↕ DRAG TO RESIZE
                  </Typography>
                </Box>
              )}

              {/* File Preview Panel */}
              {layout.previewOpen && (selectedFiles.length > 0 || createDocumentMode) && (
                <Box sx={{
                  height: `${layout.previewHeight}px`,
                  borderTop: layout.previewOpen ? 0 : 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  flexShrink: 0,
                  willChange: 'height',
                  transition: isHorizontalResizing ? 'none' : 'height 0.1s ease-out'
                }}>
                  <FilePreview
                    selectedFiles={selectedFiles}
                    height={layout.previewHeight}
                    onClose={handlePreviewToggle}
                    createDocumentMode={createDocumentMode}
                    currentPath={currentPath}
                    onRefresh={handleRefresh}
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

      {/* Main Content Area - Updated for Fixed Sidebar and Resizable AI Panel */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2, // Reduced padding for better space utilization
          ml: `calc(${actualSidebarWidth}px + 12px)`, // Reduced margin for more content space
          mr: layout.aiPanelOpen ? `${layout.aiPanelWidth}px` : 0,
          transition: theme.transitions.create(['margin-right'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar />

        {/* Conditional Breadcrumb Navigation - only when navigating within folders */}
        {location.pathname === '/' && currentPath && currentPath !== '/' && (
          <BreadcrumbNavigation currentPath={currentPath} onNavigate={setCurrentPath} />
        )}
        
        {/* Dynamic Content Based on Route */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
          {renderMainContent()}
        </Box>
      </Box>

      {/* Subtle Brand Watermark */}
      <BrandWatermark />

      {/* AI Panel - FIXED RESIZABLE PANEL */}
      {layout.aiPanelOpen && (
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: '64px',
            width: `${layout.aiPanelWidth}px`,
            height: 'calc(100vh - 64px)',
            backgroundColor: (theme) => theme.palette.background.paper,
            borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.drawer,
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {/* Enhanced Resize Handle - More Prominent */}
          <Box
            ref={resizeRef}
            onMouseDown={handleResizeStart}
            sx={{
              position: 'absolute',
              left: '-8px',
              top: 0,
              width: '16px',
              height: '100%',
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              zIndex: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px 0 0 8px',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '60px',
                backgroundColor: currentTheme.primary,
                opacity: 0.8,
                borderRadius: '2px',
                transition: 'all 0.3s ease',
              },
              '&:hover': {
                backgroundColor: `${currentTheme.primary}20`,
                '&::before': {
                  opacity: 1,
                  height: '100px',
                  width: '6px',
                  backgroundColor: currentTheme.primary,
                  boxShadow: `0 0 12px ${currentTheme.primary}`,
                },
                '& .resize-indicator': {
                  opacity: 1,
                  transform: 'rotate(90deg) scale(1.2)',
                },
              },
              '&:active': {
                backgroundColor: `${currentTheme.primary}30`,
                '&::before': {
                  opacity: 1,
                  height: '120px',
                  width: '6px',
                  backgroundColor: currentTheme.accent,
                  boxShadow: `0 0 16px ${currentTheme.accent}`,
                },
              },
              transition: 'all 0.3s ease',
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
        </Box>
      )}
    </Box>
  );
};