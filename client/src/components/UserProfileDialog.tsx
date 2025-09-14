import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  user?: {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  };
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  open,
  onClose,
  userName,
  userEmail,
  user
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userName);

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving profile changes:', { displayName: editedName });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(userName);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            User Profile
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                      fontWeight: 600,
                      backgroundColor: 'primary.main'
                    }}
                  >
                    {getInitials(userName)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{ flex: 1 }}
                        />
                        <IconButton onClick={handleSave} color="primary" size="small">
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={handleCancel} size="small">
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {userName}
                        </Typography>
                        <IconButton onClick={() => setIsEditing(true)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {userEmail}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip label="Active User" color="success" size="small" />
                      <Chip label="Microsoft Account" color="primary" size="small" />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Account Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="User ID"
                      secondary={user?.id || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Primary Email"
                      secondary={user?.mail || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BusinessIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="User Principal Name"
                      secondary={user?.userPrincipalName || 'N/A'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  System Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Login"
                      secondary={new Date().toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Session Status"
                      secondary="Active"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Access Level"
                      secondary="Standard User"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Accessed SharePoint dashboard"
                      secondary={`Today at ${new Date().toLocaleTimeString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Viewed document files"
                      secondary="2 hours ago"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Used AI analysis feature"
                      secondary="Yesterday at 3:45 PM"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};