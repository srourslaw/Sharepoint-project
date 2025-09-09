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
  CircularProgress,
  Alert,
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
  Refresh as RefreshIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useSharePointPeople } from '../../hooks/useSharePointPeople';

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
  const { peopleData, loading, error, refreshPeopleData } = useSharePointPeople();

  // Handler functions
  const handleInvitePeople = () => {
    const email = prompt('Enter email address to invite:');
    if (email && email.includes('@')) {
      alert(`Invitation will be sent to ${email}. This feature requires SharePoint admin permissions.`);
    } else if (email) {
      alert('Please enter a valid email address.');
    }
  };

  const handleEmailContact = (email: string, name: string) => {
    window.open(`mailto:${email}?subject=SharePoint Collaboration&body=Hi ${name},%0D%0A%0D%0AI would like to collaborate with you on SharePoint.%0D%0A%0D%0ABest regards`);
  };

  const handleMoreActions = (person: any) => {
    const actions = [
      'View Profile',
      'Send Message',
      'View Shared Files',
      'Manage Permissions'
    ];
    const choice = prompt(`Choose action for ${person.displayName}:\n${actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}\n\nEnter number (1-4):`);
    
    if (choice && parseInt(choice) >= 1 && parseInt(choice) <= 4) {
      alert(`${actions[parseInt(choice) - 1]} selected for ${person.displayName}. This would open the corresponding SharePoint dialog.`);
    }
  };

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

  // Use real invitations data from the hook
  const pendingInvitations = peopleData.pendingInvitations.map(invitation => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    invitedBy: invitation.invitedBy,
    date: new Date(invitation.invitedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }));

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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading People & Sharing Data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Unable to load people and sharing data from SharePoint. Please check your connection and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            👥 People & Sharing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time data from your SharePoint environment
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton color="primary" onClick={refreshPeopleData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{ ml: 1 }}
            onClick={() => handleInvitePeople()}
          >
          Invite People
        </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {peopleData.recentContacts.length}
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
                {peopleData.totalSharedItems}
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
          <CardHeader title="Team Members" subheader={`${peopleData.recentContacts.length} team members`} />
          <CardContent>
            <List>
              {peopleData.recentContacts.map((member) => (
                <ListItem key={member.id} sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Badge
                      badgeContent=""
                      color="success"
                      variant="dot"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.displayName}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {member.jobTitle || 'Team Member'} • {member.department || 'SharePoint'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
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
                      <IconButton onClick={() => handleEmailContact(member.email, member.displayName)}>
                        <EmailIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton onClick={() => handleMoreActions(member)}>
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
              {peopleData.recentShares.map((file, index) => (
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
                          Shared with {file.sharedWith.length} people • {file.sharedBy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(file.sharedDate).toLocaleDateString()}
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
                <Typography variant="h6">
                  {peopleData.recentContacts.filter(person => person.permissions === 'Full Control').length} Users
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {peopleData.recentContacts
                    .filter(person => person.permissions === 'Full Control')
                    .map(person => (
                      <Chip key={person.id} label={person.displayName} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
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
                <Typography variant="h6">
                  {peopleData.recentContacts.filter(person => person.permissions === 'Contribute').length} Users
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {peopleData.recentContacts
                    .filter(person => person.permissions === 'Contribute')
                    .map(person => (
                      <Chip key={person.id} label={person.displayName} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
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
                <Typography variant="h6">
                  {peopleData.recentContacts.filter(person => person.permissions === 'Read').length} Users
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {peopleData.recentContacts
                    .filter(person => person.permissions === 'Read')
                    .map(person => (
                      <Chip key={person.id} label={person.displayName} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
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
                {pendingInvitations.map((invitation) => (
                  <ListItem key={invitation.id} sx={{ py: 2 }}>
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