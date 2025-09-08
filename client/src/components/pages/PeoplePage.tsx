import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const PeoplePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const teamMembers = [
    { 
      id: 1, 
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@company.com', 
      role: 'Project Manager', 
      department: 'Operations',
      avatar: 'SJ',
      status: 'online',
      permissions: 'Full Control',
      lastActive: '2 minutes ago'
    },
    { 
      id: 2, 
      name: 'Mike Chen', 
      email: 'mike.chen@company.com', 
      role: 'Developer', 
      department: 'Engineering',
      avatar: 'MC',
      status: 'online',
      permissions: 'Contribute',
      lastActive: '15 minutes ago'
    },
    { 
      id: 3, 
      name: 'Emily Davis', 
      email: 'emily.davis@company.com', 
      role: 'Designer', 
      department: 'Creative',
      avatar: 'ED',
      status: 'away',
      permissions: 'Read',
      lastActive: '1 hour ago'
    },
    { 
      id: 4, 
      name: 'Alex Wilson', 
      email: 'alex.wilson@company.com', 
      role: 'Analyst', 
      department: 'Finance',
      avatar: 'AW',
      status: 'offline',
      permissions: 'Contribute',
      lastActive: '2 hours ago'
    },
    { 
      id: 5, 
      name: 'Lisa Brown', 
      email: 'lisa.brown@company.com', 
      role: 'Marketing Lead', 
      department: 'Marketing',
      avatar: 'LB',
      status: 'online',
      permissions: 'Full Control',
      lastActive: 'Active now'
    },
  ];

  const sharedFiles = [
    { name: 'Q3 Budget Report.xlsx', sharedWith: 8, permissions: 'View Only', sharedBy: 'Sarah Johnson', date: '2 days ago' },
    { name: 'Project Timeline.pptx', sharedWith: 12, permissions: 'Can Edit', sharedBy: 'Mike Chen', date: '1 week ago' },
    { name: 'Design Guidelines.pdf', sharedWith: 25, permissions: 'View Only', sharedBy: 'Emily Davis', date: '2 weeks ago' },
    { name: 'Meeting Notes.docx', sharedWith: 6, permissions: 'Can Edit', sharedBy: 'Alex Wilson', date: '3 days ago' },
  ];

  const pendingInvitations = [
    { email: 'john.doe@partner.com', role: 'External Collaborator', invitedBy: 'Sarah Johnson', date: '1 day ago' },
    { email: 'jane.smith@client.com', role: 'Guest Reader', invitedBy: 'Lisa Brown', date: '3 days ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'away': return 'warning';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'Full Control': return 'error';
      case 'Contribute': return 'primary';
      case 'Read': return 'default';
      case 'Can Edit': return 'primary';
      case 'View Only': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            👥 People & Sharing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage team members, permissions, and shared content
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          sx={{ ml: 2 }}
        >
          Invite People
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {teamMembers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <ShareIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {sharedFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shared Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <SecurityIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permission Levels
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Badge badgeContent={pendingInvitations.length} color="warning">
                <EmailIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              </Badge>
              <Typography variant="h5" fontWeight="bold">
                {pendingInvitations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Invites
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<PeopleIcon />} label="Team Members" />
          <Tab icon={<ShareIcon />} label="Shared Content" />
          <Tab icon={<SecurityIcon />} label="Permissions" />
          <Tab icon={<EmailIcon />} label="Invitations" />
        </Tabs>
      </Paper>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search people, files, or permissions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader title="Team Members" subheader={`${teamMembers.length} active members`} />
          <CardContent>
            <List>
              {teamMembers.map((member) => (
                <ListItem key={member.id} sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Badge
                      badgeContent=""
                      color={getStatusColor(member.status) as any}
                      variant="dot"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {member.avatar}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {member.role} • {member.department}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.email} • {member.lastActive}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ mr: 2 }}>
                    <Chip 
                      label={member.permissions} 
                      size="small" 
                      color={getPermissionColor(member.permissions) as any}
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <Tooltip title="Contact">
                      <IconButton>
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader title="Shared Files" subheader="Recently shared content" />
          <CardContent>
            <List>
              {sharedFiles.map((file, index) => (
                <ListItem key={index} sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <ShareIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Shared with {file.sharedWith} people • {file.sharedBy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {file.date}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ mr: 2 }}>
                    <Chip 
                      label={file.permissions} 
                      size="small" 
                      color={getPermissionColor(file.permissions) as any}
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Full Control" avatar={<LockIcon color="error" />} />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Complete access to manage content, permissions, and site settings.
                </Typography>
                <Typography variant="h6">2 Users</Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="Sarah Johnson" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Lisa Brown" size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Contribute" avatar={<GroupIcon color="primary" />} />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Can add, edit, and delete files and folders.
                </Typography>
                <Typography variant="h6">2 Users</Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="Mike Chen" size="small" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="Alex Wilson" size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Read Only" avatar={<PublicIcon color="disabled" />} />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Can view and download files but cannot make changes.
                </Typography>
                <Typography variant="h6">1 User</Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="Emily Davis" size="small" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardHeader 
            title="Pending Invitations" 
            subheader={`${pendingInvitations.length} people waiting to join`}
          />
          <CardContent>
            {pendingInvitations.length > 0 ? (
              <List>
                {pendingInvitations.map((invitation, index) => (
                  <ListItem key={index} sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <EmailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={invitation.email}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.role} • Invited by {invitation.invitedBy}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.date}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ mr: 2 }}>
                      <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                        Resend
                      </Button>
                      <Button variant="outlined" color="error" size="small">
                        Cancel
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No pending invitations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All invited users have joined the team
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};