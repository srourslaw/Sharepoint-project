import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Business as SiteIcon,
  LibraryBooks as LibraryIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Star as StarIcon,
  Schedule as RecentIcon,
  CloudQueue as OneDriveIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

import { SharePointSite, SharePointLibrary, NavigationItem } from '../types';
import { useSharePointData } from '../hooks/useSharePointData';
import { useRecentFiles } from '../hooks/useRecentFiles';

interface NavigationSidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
  onWidthChange?: (width: number) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onNavigate,
  currentPath,
  onWidthChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['sites', 'main-navigation']));
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { sites, libraries, loading, error, refreshData } = useSharePointData();
  const { recentCount, loading: recentLoading } = useRecentFiles();

  // Handle sidebar resize
  useEffect(() => {
    if (sidebarWidth < 150) {
      setIsCollapsed(true);
    } else if (sidebarWidth > 200) {
      setIsCollapsed(false);
    }
    // Notify parent of width change
    onWidthChange?.(sidebarWidth);
  }, [sidebarWidth, onWidthChange]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + (e.clientX - startX), 60), 400);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.path) {
      // Use React Router navigation for main pages and dedicated pages
      if (item.path === '/' || item.path === '/recent' || item.path === '/onedrive' || 
          item.path === '/analytics' || item.path === '/people' || item.path === '/settings') {
        navigate(item.path);
      } else {
        // Use internal navigation for SharePoint content (sites, libraries, folders)
        onNavigate(item.path);
      }
    }
    
    if (item.children) {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id);
      } else {
        newExpanded.add(item.id);
      }
      setExpandedItems(newExpanded);
    }
  };

  const buildNavigationTree = (): NavigationItem[] => {
    const tree: NavigationItem[] = [
      // Main Navigation (no parent container)
      {
        id: 'home',
        label: 'Home',
        icon: 'home',
        path: '/',
      },
      {
        id: 'recent',
        label: 'Recent Files',
        icon: 'recent',
        path: '/recent',
        badge: recentLoading ? '...' : recentCount.toString(),
      },
      {
        id: 'onedrive',
        label: 'OneDrive',
        icon: 'onedrive',
        path: '/onedrive',
      },
    ];

    // Add a separator and secondary navigation
    tree.push({
      id: 'separator-1',
      label: '',
      icon: 'separator',
    });

    // Add Analytics and Tools section
    tree.push(
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'analytics',
        path: '/analytics',
      },
      {
        id: 'people',
        label: 'People & Sharing',
        icon: 'people',
        path: '/people',
      }
    );

    if (sites.length > 0) {
      const sitesNode: NavigationItem = {
        id: 'sites',
        label: 'SharePoint Sites',
        icon: 'site',
        children: [],
      };

      sites.forEach((site: SharePointSite) => {
        const siteLibraries = libraries.filter(
          (lib: SharePointLibrary) => lib.parentSite?.id === site.id
        );

        const siteNode: NavigationItem = {
          id: `site-${site.id}`,
          label: site.displayName,
          icon: 'site',
          path: `/sites/${site.id}`,
          children: siteLibraries.map((library: SharePointLibrary) => ({
            id: `library-${library.id}`,
            label: library.displayName,
            icon: 'library',
            path: `/sites/${site.id}/libraries/${library.id}`,
            badge: library.itemCount > 0 ? library.itemCount.toString() : undefined,
          })),
        };

        sitesNode.children!.push(siteNode);
      });

      tree.push(sitesNode);
    }

    // Add another separator and settings at the bottom
    tree.push({
      id: 'separator-2',
      label: '',
      icon: 'separator',
    });

    tree.push({
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      path: '/settings',
    });

    return tree;
  };

  const filterNavigationTree = (items: NavigationItem[], query: string): NavigationItem[] => {
    if (!query) return items;

    const filtered: NavigationItem[] = [];
    
    items.forEach(item => {
      const matchesQuery = item.label.toLowerCase().includes(query.toLowerCase());
      let filteredChildren: NavigationItem[] = [];
      
      if (item.children) {
        filteredChildren = filterNavigationTree(item.children, query);
      }
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
        });
      }
    });
    
    return filtered;
  };

  const renderIcon = (iconName: string, isActive: boolean = false) => {
    const iconColor = isActive ? '#ffffff' : '#7c3aed';
    
    switch (iconName) {
      case 'home': return <HomeIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'star': return <StarIcon sx={{ color: '#f59e0b', fontSize: '20px' }} />;
      case 'recent': return <RecentIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'onedrive': return <OneDriveIcon sx={{ color: '#06b6d4', fontSize: '20px' }} />;
      case 'analytics': return <AnalyticsIcon sx={{ color: '#10b981', fontSize: '20px' }} />;
      case 'settings': return <SettingsIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'people': return <PeopleIcon sx={{ color: '#a855f7', fontSize: '20px' }} />;
      case 'dashboard': return <DashboardIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'site': return <SiteIcon sx={{ color: '#3b82f6', fontSize: '20px' }} />;
      case 'library': return <LibraryIcon sx={{ color: '#8b5cf6', fontSize: '20px' }} />;
      case 'folder': return <FolderIcon sx={{ color: '#f59e0b', fontSize: '20px' }} />;
      case 'folder-open': return <FolderOpenIcon sx={{ color: '#f59e0b', fontSize: '20px' }} />;
      case 'separator': return null;
      default: return <FolderIcon sx={{ color: iconColor, fontSize: '20px' }} />;
    }
  };

  const renderNavigationItem = (item: NavigationItem, level = 0): React.ReactNode => {
    // Handle separator items
    if (item.icon === 'separator') {
      return <Divider key={item.id} sx={{ my: 1 }} />;
    }

    const isExpanded = expandedItems.has(item.id);
    // Use React Router location for active state of main and dedicated pages
    const isActive = (item.path === '/' || item.path === '/recent' || item.path === '/onedrive' || 
                     item.path === '/analytics' || item.path === '/people' || item.path === '/settings') 
      ? location.pathname === item.path 
      : currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            selected={isActive}
            onClick={() => handleItemClick(item)}
            sx={{
              pl: 2,
              pr: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: isCollapsed ? 'auto' : 40, justifyContent: 'center' }}>
              {renderIcon(item.icon, isActive)}
            </ListItemIcon>

            {!isCollapsed && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                }}
              />
            )}
            
            {!isCollapsed && item.badge && (
              <Chip
                label={item.badge}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  ml: 1,
                }}
              />
            )}

            {!isCollapsed && hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {!isCollapsed && hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const navigationTree = buildNavigationTree();
  const filteredTree = filterNavigationTree(navigationTree, searchQuery);

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 64, // Account for app bar height
        width: sidebarWidth,
        minWidth: isCollapsed ? 60 : 200,
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        borderRadius: '0 12px 0 0',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        transition: 'width 0.2s ease-in-out',
        zIndex: 1200, // Below app bar but above content
      }}
    >
      {/* Search */}
      {!isCollapsed && (
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search sites and libraries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
                '&:hover': {
                  '& > fieldset': {
                    borderColor: '#7c3aed',
                  },
                },
                '&.Mui-focused': {
                  '& > fieldset': {
                    borderColor: '#7c3aed',
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#666' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {/* Navigation Tree */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: isCollapsed ? 0.5 : 0 }}>
        {error && !isCollapsed && (
          <Alert severity="error" sx={{ m: 1.5, borderRadius: '8px' }}>
            Failed to load SharePoint data
          </Alert>
        )}

        {loading ? (
          <Box sx={{ p: isCollapsed ? 0.5 : 1.5 }}>
            {[...Array(6)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={isCollapsed ? 32 : 40}
                sx={{
                  mb: 1,
                  borderRadius: '8px',
                  mx: isCollapsed ? 'auto' : 0,
                  width: isCollapsed ? 32 : '100%'
                }}
              />
            ))}
          </Box>
        ) : (
          <List
            component="nav"
            sx={{
              pt: 1,
              pb: 1,
              '& .MuiListItemButton-root': {
                borderRadius: '8px',
                mx: isCollapsed ? 0.5 : 1,
                mb: 0.5,
                minHeight: 40,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#6d28d9',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              },
            }}
          >
            {filteredTree.map(item => renderNavigationItem(item))}
          </List>
        )}
      </Box>

      {/* Resize Handle */}
      <Box
        onMouseDown={startResize}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 4,
          height: '100%',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#7c3aed' : 'transparent',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#7c3aed',
            opacity: 0.7,
          },
          zIndex: 10,
        }}
      >
        {/* Resize indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 2,
            height: 20,
            backgroundColor: isResizing ? 'white' : '#7c3aed',
            borderRadius: 1,
            opacity: isResizing ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      </Box>

      {/* Collapse Toggle Button */}
      <Box
        onClick={() => {
          if (isCollapsed) {
            setSidebarWidth(280);
          } else {
            setSidebarWidth(60);
          }
        }}
        sx={{
          position: 'absolute',
          top: 12,
          right: isCollapsed ? -16 : -12,
          width: 28,
          height: 28,
          backgroundColor: '#7c3aed',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
          transition: 'all 0.2s ease-in-out',
          zIndex: 1300, // Higher than sidebar
          '&:hover': {
            backgroundColor: '#6d28d9',
            transform: 'scale(1.15)',
          },
        }}
      >
        {isCollapsed ? '▶' : '◀'}
      </Box>
    </Box>
  );
};