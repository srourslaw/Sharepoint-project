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
  alpha,
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
  TrendingUp,
  ConnectWithoutContact,
} from '@mui/icons-material';
import { useSharePointPeople } from '../../hooks/useSharePointPeople';
import { useDynamicTheme } from '../../contexts/DynamicThemeContext';

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
  const { currentTheme } = useDynamicTheme();

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

  // Use real data from SharePoint People API
  const teamMembers = peopleData.recentContacts || [];
  const sharedFiles = peopleData.sharedFiles || [];

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
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh', maxHeight: '100vh', overflow: 'auto' }}>
      {/* Beautiful People & Sharing Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${alpha(currentTheme.primary, 0.08)} 0%, ${alpha(currentTheme.secondary, 0.08)} 50%, ${alpha(currentTheme.accent, 0.08)} 100%)`,
        borderRadius: 3,
        p: 4,
        mb: 3,
        border: `1px solid ${alpha(currentTheme.primary, 0.15)}`,
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
            boxShadow: `0 8px 24px ${alpha(currentTheme.primary, 0.4)}`,
          }}>
            <PeopleIcon sx={{ color: 'white', fontSize: 32 }} />
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
              People & Collaboration Hub
            </Typography>
            <Typography variant="body1" sx={{
              color: currentTheme.text.secondary,
              fontSize: '1.1rem'
            }}>
              Connect, share, and collaborate across your organization
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
              {peopleData.recentContacts.length} Active Members
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
              {peopleData.totalSharedItems} Shared Resources
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
              {pendingInvitations.length} Pending Invitations
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          <Tooltip title="Refresh People Data">
            <IconButton
              onClick={refreshPeopleData}
              sx={{
                color: currentTheme.primary,
                bgcolor: `${currentTheme.primary}10`,
                border: `1px solid ${currentTheme.primary}30`,
                '&:hover': {
                  bgcolor: `${currentTheme.primary}20`,
                  transform: 'translateY(-1px)',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleInvitePeople}
            sx={{
              bgcolor: currentTheme.primary,
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: currentTheme.secondary,
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 20px ${currentTheme.primary}40`,
              }
            }}
          >
            Invite Collaborators
          </Button>
        </Box>
      </Box>

      {/* Enhanced Collaboration Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card  sx={{
            textAlign: 'center',
            p: 3,
            background: `linear-gradient(135deg, ${currentTheme.primary}1A, ${currentTheme.primary}0D)`,
            border: `1px solid ${currentTheme.primary}33`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: `0 12px 40px ${currentTheme.primary}26`,
              background: `linear-gradient(135deg, ${currentTheme.primary}26, ${currentTheme.primary}14)`
            }
          }}>
            <Box sx={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              borderRadius: '50%',
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: `0 8px 25px ${currentTheme.primary}4D`
            }}>
              <PeopleIcon sx={{ fontSize: 35, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: currentTheme.primary, mb: 1 }}>
              {peopleData.recentContacts.length}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
              Active Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Connected & Collaborating
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card  sx={{
            textAlign: 'center',
            p: 3,
            background: `linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))`,
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            animationDelay: '0.1s',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 40px rgba(16, 185, 129, 0.15)',
              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08))`
            }
          }}>
            <Box sx={{
              background: `linear-gradient(135deg, #10B981, #059669)`,
              borderRadius: '50%',
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
            }}>
              <ShareIcon sx={{ fontSize: 35, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981', mb: 1 }}>
              {peopleData.totalSharedItems}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
              Shared Resources
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Files & Documents
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card  sx={{
            textAlign: 'center',
            p: 3,
            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))`,
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            animationDelay: '0.2s',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 40px rgba(59, 130, 246, 0.15)',
              background: `linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))`
            }
          }}>
            <Box sx={{
              background: `linear-gradient(135deg, #3B82F6, #1D4ED8)`,
              borderRadius: '50%',
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
            }}>
              <SecurityIcon sx={{ fontSize: 35, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#3B82F6', mb: 1 }}>
              3
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
              Permission Levels
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Secure Access Control
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card  sx={{
            textAlign: 'center',
            p: 3,
            background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))`,
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            animationDelay: '0.3s',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 40px rgba(245, 158, 11, 0.15)',
              background: `linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))`
            }
          }}>
            <Badge
              badgeContent={pendingInvitations.length}
              color="warning"
              sx={{ '& .MuiBadge-badge': { fontSize: 12, fontWeight: 600 } }}
            >
              <Box sx={{
                background: `linear-gradient(135deg, #F59E0B, #D97706)`,
                borderRadius: '50%',
                width: 70,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
              }}>
                <EmailIcon sx={{ fontSize: 35, color: 'white' }} />
              </Box>
            </Badge>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B', mb: 1 }}>
              {pendingInvitations.length}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
              Pending Invitations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Awaiting Response
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Collaboration Navigation */}
      <Paper  sx={{
        mb: 4,
        background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))`,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        animationDelay: '0.4s'
      }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: currentTheme.primary,
                transform: 'translateY(-2px)',
              },
              '&.Mui-selected': {
                color: currentTheme.primary,
                background: `linear-gradient(135deg, ${currentTheme.primary}1A, ${currentTheme.primary}0D)`,
              }
            },
            '& .MuiTabs-indicator': {
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab icon={<PeopleIcon sx={{ fontSize: 24 }} />} label="Team Members" />
          <Tab icon={<ShareIcon sx={{ fontSize: 24 }} />} label="Shared Content" />
          <Tab icon={<SecurityIcon sx={{ fontSize: 24 }} />} label="Permissions" />
          <Tab icon={<EmailIcon sx={{ fontSize: 24 }} />} label="Invitations" />
        </Tabs>
      </Paper>

      {/* Enhanced Search Interface */}
      <Box  sx={{ mb: 4, animationDelay: '0.5s' }}>
        <TextField
          fullWidth
          placeholder="Search people, files, permissions, or collaboration activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))`,
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${currentTheme.primary}26`,
              },
              '&.Mui-focused': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${currentTheme.primary}33`,
                '& fieldset': {
                  borderColor: currentTheme.primary,
                  borderWidth: 2
                }
              },
              '& fieldset': {
                borderColor: `${currentTheme.primary}4D`,
                transition: 'all 0.3s ease'
              }
            },
            '& .MuiInputBase-input': {
              padding: '16px 14px',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  borderRadius: '50%',
                  width: 35,
                  height: 35,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  boxShadow: `0 4px 15px ${currentTheme.primary}4D`
                }}>
                  <SearchIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Enhanced Tab Panels with Proper Scrolling */}
      <Box sx={{ flexGrow: 1, overflow: 'visible' }}>
        <TabPanel value={tabValue} index={0}>
          <Card  sx={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))`,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            animationDelay: '0.6s'
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: `0 4px 15px ${currentTheme.primary}4D`
                  }}>
                    <PeopleIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937' }}>
                    Team Members
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, ml: 7 }}>
                  {`${peopleData.recentContacts.length} active team members collaborating`}
                </Typography>
              }
            />
            <CardContent sx={{ maxHeight: 600, overflow: 'auto' }}>
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
                      <React.Fragment>
                        <span style={{ display: 'block' }}>
                          {member.jobTitle || 'Team Member'} • {member.department || 'SharePoint'}
                        </span>
                        <span style={{ display: 'block' }}>
                          {member.email}
                        </span>
                      </React.Fragment>
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
                      <React.Fragment>
                        <span style={{ display: 'block' }}>
                          Shared with {file.sharedWith.length} people • {file.sharedBy}
                        </span>
                        <span style={{ display: 'block' }}>
                          {new Date(file.sharedDate).toLocaleDateString()}
                        </span>
                      </React.Fragment>
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
                        <React.Fragment>
                          <span style={{ display: 'block' }}>
                            {invitation.role} • Invited by {invitation.invitedBy}
                          </span>
                          <span style={{ display: 'block' }}>
                            {invitation.date}
                          </span>
                        </React.Fragment>
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

    </Box>
  );
};