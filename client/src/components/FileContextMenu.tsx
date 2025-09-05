import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ContentCut as CutIcon,
  FileCopy as DuplicateIcon,
  DriveFileRenameOutline as RenameIcon,
  Info as InfoIcon,
  OpenInNew as OpenIcon,
  Folder as FolderIcon,
  Link as LinkIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Security as PermissionsIcon,
  History as HistoryIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';

import { SharePointFile } from '../types';

interface FileContextMenuProps {
  anchorPosition?: {
    top: number;
    left: number;
  };
  open: boolean;
  onClose: () => void;
  file?: SharePointFile;
  selectedCount: number;
  onAction: (action: string, file?: SharePointFile) => void;
  allowDelete?: boolean;
  readOnly?: boolean;
  customActions?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    handler: (files: SharePointFile[]) => void;
    requiresSelection?: boolean;
  }>;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  anchorPosition,
  open,
  onClose,
  file,
  selectedCount,
  onAction,
  allowDelete = true,
  readOnly = false,
  customActions = [],
}) => {
  const isMultiSelect = selectedCount > 1;
  const hasSelection = selectedCount > 0;
  const isFolder = file?.isFolder || false;

  const handleAction = (action: string) => {
    onAction(action, file);
    onClose();
  };

  const menuItems = [
    // Open/Preview actions
    {
      id: 'open',
      label: isFolder ? 'Open' : 'Preview',
      icon: isFolder ? <FolderIcon /> : <PreviewIcon />,
      show: !!file,
      disabled: false,
    },
    {
      id: 'open-new-tab',
      label: 'Open in new tab',
      icon: <OpenIcon />,
      show: !!file && !isFolder && !!file.webUrl,
      disabled: false,
    },
    
    // Separator
    { separator: true, show: !!file },
    
    // Download actions
    {
      id: 'download',
      label: isMultiSelect ? `Download ${selectedCount} items` : 'Download',
      icon: <DownloadIcon />,
      show: hasSelection,
      disabled: false,
    },
    
    // Share actions
    {
      id: 'share',
      label: 'Share',
      icon: <ShareIcon />,
      show: !!file,
      disabled: readOnly,
    },
    {
      id: 'copy-link',
      label: 'Copy link',
      icon: <LinkIcon />,
      show: !!file && !!file.webUrl,
      disabled: false,
    },
    
    // Separator
    { separator: true, show: hasSelection },
    
    // Edit actions
    {
      id: 'rename',
      label: 'Rename',
      icon: <RenameIcon />,
      show: !!file && !isMultiSelect,
      disabled: readOnly,
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <DuplicateIcon />,
      show: !!file && !isFolder && !isMultiSelect,
      disabled: readOnly,
    },
    
    // Separator
    { separator: true, show: !readOnly && hasSelection },
    
    // Clipboard actions
    {
      id: 'copy',
      label: isMultiSelect ? `Copy ${selectedCount} items` : 'Copy',
      icon: <CopyIcon />,
      show: hasSelection,
      disabled: readOnly,
    },
    {
      id: 'cut',
      label: isMultiSelect ? `Cut ${selectedCount} items` : 'Cut',
      icon: <CutIcon />,
      show: hasSelection,
      disabled: readOnly,
    },
    
    // Separator
    { separator: true, show: !readOnly && hasSelection },
    
    // Delete action
    {
      id: 'delete',
      label: isMultiSelect ? `Delete ${selectedCount} items` : 'Delete',
      icon: <DeleteIcon />,
      show: hasSelection && allowDelete,
      disabled: readOnly,
      danger: true,
    },
    
    // Separator
    { separator: true, show: !!file },
    
    // Properties and info
    {
      id: 'properties',
      label: 'Properties',
      icon: <InfoIcon />,
      show: !!file && !isMultiSelect,
      disabled: false,
    },
    {
      id: 'permissions',
      label: 'Manage permissions',
      icon: <PermissionsIcon />,
      show: !!file && !isMultiSelect,
      disabled: readOnly,
    },
    {
      id: 'version-history',
      label: 'Version history',
      icon: <HistoryIcon />,
      show: !!file && !isFolder && !isMultiSelect,
      disabled: false,
    },
  ];

  // Add custom actions
  if (customActions.length > 0) {
    menuItems.push({ separator: true, show: true });
    customActions.forEach(action => {
      if (!action.requiresSelection || hasSelection) {
        menuItems.push({
          id: action.id,
          label: action.label,
          icon: action.icon,
          show: true,
          disabled: false,
        });
      }
    });
  }

  const visibleItems = menuItems.filter(item => item.show);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      MenuListProps={{
        dense: true,
        sx: { minWidth: 200 },
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      {/* Context header */}
      {file && (
        <>
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" noWrap>
              {file.displayName}
            </Typography>
            {isMultiSelect && (
              <Typography variant="caption" color="text.secondary">
                +{selectedCount - 1} more selected
              </Typography>
            )}
          </Box>
        </>
      )}

      {visibleItems.map((item, index) => {
        if ('separator' in item && item.separator) {
          return <Divider key={`separator-${index}`} />;
        }

        const menuItem = item as any;
        
        return (
          <MenuItem
            key={menuItem.id}
            onClick={() => handleAction(menuItem.id)}
            disabled={menuItem.disabled}
            sx={{
              color: menuItem.danger ? 'error.main' : 'inherit',
              '&:hover': {
                bgcolor: menuItem.danger ? 'error.50' : 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: menuItem.danger ? 'error.main' : 'inherit',
                minWidth: 36,
              }}
            >
              {menuItem.icon}
            </ListItemIcon>
            <ListItemText
              primary={menuItem.label}
              primaryTypographyProps={{
                variant: 'body2',
              }}
            />
          </MenuItem>
        );
      })}

      {/* Quick info footer for single file */}
      {file && !isMultiSelect && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {isFolder ? 'Folder' : `${file.extension.toUpperCase()} file`}
            </Typography>
            {!isFolder && (
              <Typography variant="caption" color="text.secondary" display="block">
                Size: {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown'}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block">
              Modified: {new Date(file.lastModifiedDateTime).toLocaleDateString()}
            </Typography>
          </Box>
        </>
      )}
    </Menu>
  );
};