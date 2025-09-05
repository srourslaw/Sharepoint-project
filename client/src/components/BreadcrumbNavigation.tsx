import React from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Business as SiteIcon,
  LibraryBooks as LibraryIcon,
  Folder as FolderIcon,
  CloudQueue as OneDriveIcon,
  MoreHoriz as MoreIcon,
  Schedule as RecentIcon,
} from '@mui/icons-material';

import { BreadcrumbItem } from '../types';

interface BreadcrumbNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentPath,
  onNavigate,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [collapsedItems, setCollapsedItems] = React.useState<BreadcrumbItem[]>([]);

  const parsePath = (path: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Home',
        href: '/',
        icon: 'home',
      },
    ];

    if (!path || path === '/') {
      return items;
    }

    const pathParts = path.split('/').filter(Boolean);

    if (pathParts[0] === 'sites' && pathParts.length >= 2) {
      const siteId = pathParts[1];
      const siteName = getSiteName(siteId); // You'd implement this function
      
      items.push({
        label: siteName,
        href: `/sites/${siteId}`,
        icon: 'site',
      });

      if (pathParts.length >= 4 && pathParts[2] === 'libraries') {
        const libraryId = pathParts[3];
        const libraryName = getLibraryName(libraryId); // You'd implement this function
        
        items.push({
          label: libraryName,
          href: `/sites/${siteId}/libraries/${libraryId}`,
          icon: 'library',
        });

        // Add folder path items
        if (pathParts.length > 4) {
          let currentPath = `/sites/${siteId}/libraries/${libraryId}`;
          
          for (let i = 4; i < pathParts.length; i++) {
            currentPath += `/${pathParts[i]}`;
            items.push({
              label: decodeURIComponent(pathParts[i]),
              href: currentPath,
              icon: 'folder',
            });
          }
        }
      }
    } else if (pathParts[0] === 'onedrive') {
      items.push({
        label: 'OneDrive',
        href: '/onedrive',
        icon: 'onedrive',
      });

      // Add folder path items for OneDrive
      if (pathParts.length > 1) {
        let currentPath = '/onedrive';
        
        for (let i = 1; i < pathParts.length; i++) {
          currentPath += `/${pathParts[i]}`;
          items.push({
            label: decodeURIComponent(pathParts[i]),
            href: currentPath,
            icon: 'folder',
          });
        }
      }
    } else if (pathParts[0] === 'recent') {
      items.push({
        label: 'Recent Files',
        href: '/recent',
        icon: 'recent',
      });
    }

    return items;
  };

  const getSiteName = (siteId: string): string => {
    // In a real implementation, you'd look this up from your sites data
    // For now, return a placeholder
    return `Site ${siteId.substring(0, 8)}...`;
  };

  const getLibraryName = (libraryId: string): string => {
    // In a real implementation, you'd look this up from your libraries data
    // For now, return a placeholder
    return `Library ${libraryId.substring(0, 8)}...`;
  };

  const renderIcon = (iconName: string, size: 'small' | 'medium' = 'small') => {
    const iconProps = { fontSize: size };
    
    switch (iconName) {
      case 'home': return <HomeIcon {...iconProps} />;
      case 'site': return <SiteIcon {...iconProps} />;
      case 'library': return <LibraryIcon {...iconProps} />;
      case 'folder': return <FolderIcon {...iconProps} />;
      case 'onedrive': return <OneDriveIcon {...iconProps} />;
      case 'recent': return <RecentIcon {...iconProps} />;
      default: return <FolderIcon {...iconProps} />;
    }
  };

  const breadcrumbItems = parsePath(currentPath);

  // Handle collapsing breadcrumbs if there are too many
  const maxVisibleItems = 5;
  const shouldCollapse = breadcrumbItems.length > maxVisibleItems;
  
  let visibleItems = breadcrumbItems;
  let collapsedItemsToShow: BreadcrumbItem[] = [];

  if (shouldCollapse) {
    // Show first item, collapsed items indicator, and last 3 items
    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-3);
    collapsedItemsToShow = breadcrumbItems.slice(1, -3);
    visibleItems = [firstItem, ...lastItems];
  }

  const handleCollapsedItemClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setCollapsedItems(collapsedItemsToShow);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCollapsedItems([]);
  };

  const handleMenuItemClick = (path: string) => {
    onNavigate(path);
    handleMenuClose();
  };

  return (
    <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ flexGrow: 1 }}
        >
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const isFirst = index === 0;
            
            if (shouldCollapse && index === 1) {
              return (
                <React.Fragment key="collapsed">
                  <IconButton
                    size="small"
                    onClick={handleCollapsedItemClick}
                    sx={{ p: 0.5 }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </React.Fragment>
              );
            }

            if (isLast) {
              return (
                <Box key={item.href} display="flex" alignItems="center">
                  {renderIcon(item.icon)}
                  <Typography
                    color="text.primary"
                    sx={{ ml: 0.5, fontWeight: 500 }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            }

            return (
              <Link
                key={item.href}
                underline="hover"
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (item.href) {
                    onNavigate(item.href);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {renderIcon(item.icon)}
                <Typography sx={{ ml: 0.5 }}>{item.label}</Typography>
              </Link>
            );
          })}
        </Breadcrumbs>

        {/* Path info */}
        <Box display="flex" alignItems="center" ml={2}>
          <Chip
            label={`${breadcrumbItems.length - 1} level${breadcrumbItems.length !== 2 ? 's' : ''} deep`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Collapsed items menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        {collapsedItems.map((item) => (
          <MenuItem
            key={item.href}
            onClick={() => item.href && handleMenuItemClick(item.href)}
            dense
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {renderIcon(item.icon)}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};