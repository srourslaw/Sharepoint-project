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
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onNavigate,
  currentPath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['sites', 'main-navigation']));
  const [searchQuery, setSearchQuery] = useState('');
  const { sites, libraries, loading, error, refreshData } = useSharePointData();
  const { recentCount, loading: recentLoading } = useRecentFiles();

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

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return <HomeIcon />;
      case 'star': return <StarIcon />;
      case 'recent': return <RecentIcon />;
      case 'onedrive': return <OneDriveIcon />;
      case 'analytics': return <AnalyticsIcon />;
      case 'settings': return <SettingsIcon />;
      case 'people': return <PeopleIcon />;
      case 'dashboard': return <DashboardIcon />;
      case 'site': return <SiteIcon />;
      case 'library': return <LibraryIcon />;
      case 'folder': return <FolderIcon />;
      case 'folder-open': return <FolderOpenIcon />;
      case 'separator': return null;
      default: return <FolderIcon />;
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
            <ListItemIcon sx={{ minWidth: 40 }}>
              {renderIcon(item.icon)}
            </ListItemIcon>
            
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                variant: 'body2',
                noWrap: true,
              }}
            />
            
            {item.badge && (
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
            
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search sites and libraries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />

      {/* Navigation Tree */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            Failed to load SharePoint data
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(6)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={40}
                sx={{ mb: 1, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : (
          <List component="nav" sx={{ pt: 1 }}>
            {filteredTree.map(item => renderNavigationItem(item))}
          </List>
        )}
        
        {!loading && sites.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No SharePoint sites found
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {sites.length} sites • {libraries.length} libraries • {recentCount} recent files
        </Typography>
      </Box>
    </Box>
  );
};