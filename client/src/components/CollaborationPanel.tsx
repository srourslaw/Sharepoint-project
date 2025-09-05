import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Badge,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Remove as RemoveIcon,
  Message as MessageIcon,
  VideoCall as VideoCallIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Circle as CircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { CollaborativeSession, User } from '../types';

interface CollaborationPanelProps {
  session: CollaborativeSession | null;
  currentUser: User;
  onInviteUser?: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  onRemoveUser?: (userId: string) => Promise<void>;
  onStartVideoCall?: () => void;
  onSendMessage?: (message: string) => void;
  onChangeUserRole?: (userId: string, role: 'viewer' | 'editor') => Promise<void>;
}

interface ChatMessage {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  session,
  currentUser,
  onInviteUser,
  onRemoveUser,
  onStartVideoCall,
  onSendMessage,
  onChangeUserRole,
}) => {
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Mock chat messages - in real app, these would come from WebSocket/API
  useEffect(() => {
    if (session) {
      setChatMessages([
        {
          id: '1',
          author: session.participants[0]?.user,
          content: 'Started editing the document',
          timestamp: new Date().toISOString(),
          type: 'system',
        },
      ]);
    }
  }, [session]);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !onInviteUser) return;

    try {
      setIsInviting(true);
      await onInviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setInviteDialog(false);
    } catch (error) {
      // Error handling would be done by parent component
    } finally {
      setIsInviting(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !onSendMessage) return;

    onSendMessage(newMessage.trim());
    
    // Add to local messages (would normally come from WebSocket)
    const message: ChatMessage = {
      id: Date.now().toString(),
      author: currentUser,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityStatus = (participant: CollaborativeSession['participants'][0]) => {
    if (!participant.isActive) return { color: 'default', label: 'Offline' };
    if (participant.cursor) return { color: 'success', label: 'Editing' };
    return { color: 'primary', label: 'Online' };
  };

  const activeParticipants = session?.participants.filter(p => p.isActive) || [];
  const inactiveParticipants = session?.participants.filter(p => !p.isActive) || [];

  if (!session) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <EditIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No active collaboration session
        </Typography>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteDialog(true)}
          sx={{ mt: 2 }}
        >
          Start Collaboration
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Collaboration</Typography>
          <Box>
            <Tooltip title="Start video call">
              <IconButton size="small" onClick={onStartVideoCall}>
                <VideoCallIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share document">
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {activeParticipants.length} active • {session.participants.length} total
        </Typography>
      </Box>

      {/* Participants */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Active Participants */}
        {activeParticipants.length > 0 && (
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ p: 1, color: 'success.main' }}>
              Active ({activeParticipants.length})
            </Typography>
            <List dense sx={{ p: 0 }}>
              {activeParticipants.map((participant) => {
                const status = getActivityStatus(participant);
                return (
                  <ListItem
                    key={participant.user.id}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <CircleIcon
                            sx={{
                              fontSize: 12,
                              color: `${status.color}.main`,
                              bgcolor: 'background.paper',
                              borderRadius: '50%',
                            }}
                          />
                        }
                      >
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {participant.user.displayName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {participant.user.displayName}
                            {participant.user.id === currentUser.id && ' (You)'}
                          </Typography>
                          <Chip
                            label={status.label}
                            size="small"
                            color={status.color as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {participant.cursor 
                            ? `Line ${Math.floor(participant.cursor.position / 50) + 1}`
                            : formatDate(participant.joinedAt)
                          }
                        </Typography>
                      }
                    />
                    
                    {participant.user.id !== currentUser.id && (
                      <Tooltip title="Remove user">
                        <IconButton
                          size="small"
                          onClick={() => onRemoveUser?.(participant.user.id)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {/* Inactive Participants */}
        {inactiveParticipants.length > 0 && (
          <Box sx={{ p: 1 }}>
            {activeParticipants.length > 0 && <Divider sx={{ my: 1 }} />}
            <Typography variant="subtitle2" sx={{ p: 1, color: 'text.secondary' }}>
              Offline ({inactiveParticipants.length})
            </Typography>
            <List dense sx={{ p: 0 }}>
              {inactiveParticipants.map((participant) => (
                <ListItem
                  key={participant.user.id}
                  sx={{ opacity: 0.6 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {participant.user.displayName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={participant.user.displayName}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Last seen {formatDate(participant.joinedAt)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Chat Messages */}
        {showChat && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ p: 1 }}>
              Chat
            </Typography>
            <Box sx={{ height: 200, overflow: 'auto', mb: 1 }}>
              {chatMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    p: 1,
                    mb: 0.5,
                    bgcolor: message.author.id === currentUser.id ? 'primary.light' : 'grey.100',
                    borderRadius: 1,
                    opacity: message.type === 'system' ? 0.7 : 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {message.author.displayName} • {formatDate(message.timestamp)}
                  </Typography>
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                fullWidth
              />
              <Button
                size="small"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteDialog(true)}
          sx={{ mb: 1 }}
        >
          Invite People
        </Button>
        
        <Button
          fullWidth
          variant="text"
          startIcon={<MessageIcon />}
          onClick={() => setShowChat(!showChat)}
          size="small"
        >
          {showChat ? 'Hide' : 'Show'} Chat
        </Button>
      </Box>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialog}
        onClose={() => setInviteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite People to Collaborate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            sx={{ mb: 2 }}
          />
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Permission Level
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="Editor"
                clickable
                color={inviteRole === 'editor' ? 'primary' : 'default'}
                onClick={() => setInviteRole('editor')}
              />
              <Chip
                label="Viewer"
                clickable
                color={inviteRole === 'viewer' ? 'primary' : 'default'}
                onClick={() => setInviteRole('viewer')}
              />
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            {inviteRole === 'editor' 
              ? 'Editors can modify the document and see real-time changes.'
              : 'Viewers can only read the document and see changes made by others.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)} disabled={isInviting}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteUser}
            variant="contained"
            disabled={!inviteEmail.trim() || isInviting}
          >
            {isInviting ? 'Inviting...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};