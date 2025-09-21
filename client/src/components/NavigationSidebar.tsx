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
  alpha,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
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

import { NavigationItem } from '../types';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';
import { useAIModel, AI_MODELS } from '../contexts/AIModelContext';

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['main-navigation']));
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { recentCount, loading: recentLoading } = useRecentFiles();
  const { currentTheme, isDarkMode } = useDynamicTheme();
  const { selectedModel, setSelectedModel, modelConfig } = useAIModel();

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

  const toggleSidebar = () => {
    if (isCollapsed) {
      setSidebarWidth(280);
    } else {
      setSidebarWidth(60);
    }
  };

  const handleAIModelChange = (event: SelectChangeEvent) => {
    const newModel = event.target.value as 'gemini' | 'openai' | 'claude';
    setSelectedModel(newModel);
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
    const iconColor = isActive ? '#ffffff' : currentTheme.primary;
    
    switch (iconName) {
      case 'home': return <HomeIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'star': return <StarIcon sx={{ color: '#f59e0b', fontSize: '20px' }} />;
      case 'recent': return <RecentIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'onedrive': return <OneDriveIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'analytics': return <AnalyticsIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'settings': return <SettingsIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'people': return <PeopleIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'dashboard': return <DashboardIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'site': return <SiteIcon sx={{ color: iconColor, fontSize: '20px' }} />;
      case 'library': return <LibraryIcon sx={{ color: iconColor, fontSize: '20px' }} />;
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
                  borderColor: isActive ? 'white' : currentTheme.primary,
                  color: isActive ? 'white' : currentTheme.primary,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
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
        backgroundColor: isDarkMode ? '#1e1b4b' : '#fafafa',
        borderRight: isDarkMode ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #e0e0e0',
        borderRadius: '0 0 0 0', // Remove top-right radius to eliminate gap
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        transition: 'width 0.2s ease-in-out',
        zIndex: 1200, // Below app bar but above content
      }}
    >
      {/* Search - Show full field when expanded, icon when collapsed */}
      <Box sx={{ p: isCollapsed ? 1 : 1.5, pb: 1 }}>
        {isCollapsed ? (
          // Compact search icon when collapsed
          <Box
            onClick={() => setSidebarWidth(280)} // Expand on click
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha(currentTheme.primary, 0.1),
              }
            }}
          >
            <SearchIcon sx={{ color: currentTheme.primary, fontSize: '20px' }} />
          </Box>
        ) : (
          // Full search field when expanded
          <TextField
            fullWidth
            size="small"
            placeholder="Search sites and libraries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                color: isDarkMode ? '#f8fafc' : 'inherit',
                '& input': {
                  color: isDarkMode ? '#f8fafc' : 'inherit',
                  '&::placeholder': {
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    opacity: 1,
                  },
                },
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover': {
                  '& > fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '&.Mui-focused': {
                  '& > fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(148, 163, 184, 0.7)' : '#666' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      {/* AI Model Selector */}
      {!isCollapsed && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: isDarkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(0, 0, 0, 0.6)',
              mb: 0.5,
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            AI Model
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedModel}
              onChange={handleAIModelChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                  color: isDarkMode ? '#f8fafc' : 'inherit',
                  fontSize: '0.875rem',
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '& .MuiSelect-select': {
                  color: isDarkMode ? '#f8fafc' : 'inherit',
                  py: 1,
                },
                '& .MuiSelect-icon': {
                  color: isDarkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(0, 0, 0, 0.54)',
                },
              }}
            >
              {Object.entries(AI_MODELS).map(([key, model]) => (
                <MenuItem
                  key={key}
                  value={key}
                  disabled={!model.available}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: model.available ? 1 : 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: model.color,
                      }}
                    />
                    <Box>
                      <Typography variant="body2">{model.displayName}</Typography>
                      {!model.available && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          Coming Soon
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Navigation Tree */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: isCollapsed ? 0.5 : 0 }}>
        {recentLoading ? (
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
                  backgroundColor: alpha(currentTheme.primary, 0.08),
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  backgroundColor: currentTheme.primary,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: currentTheme.secondary,
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

      {/* Elegant Clickable Edge */}
      <Box
        onClick={toggleSidebar}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 12,
          height: '100%',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          '&:hover': {
            backgroundColor: alpha(currentTheme.primary, 0.05),
            '& .edge-dots': {
              opacity: 1,
              transform: 'scale(1.2)',
              backgroundColor: currentTheme.primary,
            }
          },
          zIndex: 10,
        }}
      >
        {/* Elegant dot indicators */}
        {[...Array(5)].map((_, index) => (
          <Box
            key={index}
            className="edge-dots"
            sx={{
              width: 4,
              height: 4,
              backgroundColor: alpha(currentTheme.primary, 0.3),
              borderRadius: '50%',
              opacity: 0.4,
              transition: 'all 0.3s ease-in-out',
              transform: 'scale(1)',
            }}
          />
        ))}
      </Box>

    </Box>
  );
};