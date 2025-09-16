import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { UserProfileDialog } from './UserProfileDialog';
import { HelpSupportDialog } from './HelpSupportDialog';

interface UserProfileMenuProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  onLogout?: () => void;
  onSettings?: () => void;
  user?: {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  };
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  onSettings,
  user
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout?.();
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  const handleProfile = () => {
    handleClose();
    setProfileDialogOpen(true);
  };

  const handleHelp = () => {
    handleClose();
    setHelpDialogOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Notifications */}
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{
          color: 'rgba(255,255,255,0.9)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
        }}
      >
        <Badge badgeContent={3} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* User Profile */}
      <IconButton
        onClick={handleProfileClick}
        sx={{
          p: 0.5,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
        }}
      >
        <Avatar
          src={avatarUrl}
          sx={{
            width: 32,
            height: 32,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          {userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
        </Avatar>
      </IconButton>

      {/* User Name (desktop only) */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 500,
          display: { xs: 'none', md: 'block' },
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {userName}
      </Typography>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3 new notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleClose}>
          <Typography variant="body2">
            📄 New document shared: "Q3 Report.pdf"
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Typography variant="body2">
            🤖 AI analysis completed for 5 files
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Typography variant="body2">
            No new notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
          }
        }}
      >
        {/* User Info */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userEmail}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleProfile}>
          <AccountIcon sx={{ mr: 2, fontSize: 20 }} />
          Profile
        </MenuItem>

        <MenuItem onClick={handleSettings}>
          <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
          Settings
        </MenuItem>

        <MenuItem onClick={handleHelp}>
          <HelpIcon sx={{ mr: 2, fontSize: 20 }} />
          Help & Support
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        userName={userName}
        userEmail={userEmail}
        user={user}
      />

      {/* Help Support Dialog */}
      <HelpSupportDialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
      />
    </Box>
  );
};