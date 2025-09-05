import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Alert,
  Avatar,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  FormatBold as FormatIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { FileChange, User } from '../types';

interface ChangeTrackerProps {
  changes: FileChange[];
  currentUser?: User;
  readOnly?: boolean;
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onAddComment?: (changeId: string, comment: string) => void;
  onNavigateToChange?: (changeId: string) => void;
}

interface ChangeComment {
  id: string;
  changeId: string;
  author: User;
  content: string;
  timestamp: string;
}

export const ChangeTracker: React.FC<ChangeTrackerProps> = ({
  changes,
  currentUser,
  readOnly = false,
  onAcceptChange,
  onRejectChange,
  onAddComment,
  onNavigateToChange,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; changeId: string } | null>(null);
  const [commentDialog, setCommentDialog] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments] = useState<ChangeComment[]>([]); // Mock data - would come from API

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'insert':
        return <AddIcon color="success" />;
      case 'delete':
        return <RemoveIcon color="error" />;
      case 'format':
        return <FormatIcon color="info" />;
      case 'replace':
        return <EditIcon color="warning" />;
      default:
        return <EditIcon />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'insert':
        return 'success';
      case 'delete':
        return 'error';
      case 'format':
        return 'info';
      case 'replace':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getChangeDescription = (change: FileChange): string => {
    const contentPreview = change.content.length > 50 
      ? change.content.substring(0, 50) + '...'
      : change.content;

    switch (change.changeType) {
      case 'insert':
        return `Added: "${contentPreview}"`;
      case 'delete':
        return `Deleted: "${change.originalContent?.substring(0, 50) || ''}${(change.originalContent?.length || 0) > 50 ? '...' : ''}"`;
      case 'replace':
        return `Changed: "${change.originalContent?.substring(0, 25) || ''}..." → "${contentPreview}"`;
      case 'format':
        return `Applied formatting to: "${contentPreview}"`;
      default:
        return `Modified: "${contentPreview}"`;
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, changeId: string) => {
    setMenuAnchor({ element: event.currentTarget, changeId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAccept = (changeId: string) => {
    onAcceptChange?.(changeId);
    handleMenuClose();
  };

  const handleReject = (changeId: string) => {
    onRejectChange?.(changeId);
    handleMenuClose();
  };

  const handleNavigateToChange = (changeId: string) => {
    onNavigateToChange?.(changeId);
    handleMenuClose();
  };

  const handleAddComment = () => {
    if (commentDialog && commentText.trim()) {
      onAddComment?.(commentDialog, commentText.trim());
      setCommentText('');
      setCommentDialog(null);
    }
  };

  const getChangeComments = (changeId: string) => {
    return comments.filter(comment => comment.changeId === changeId);
  };

  const pendingChanges = changes.filter(change => !change.accepted);
  const acceptedChanges = changes.filter(change => change.accepted);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Track Changes</Typography>
        <Typography variant="body2" color="text.secondary">
          {pendingChanges.length} pending • {acceptedChanges.length} accepted
        </Typography>
      </Box>

      {changes.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <EditIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No changes to track
          </Typography>
        </Box>
      ) : (
        <>
          {/* Pending Changes */}
          {pendingChanges.length > 0 && (
            <Box>
              <Box sx={{ p: 2, bgcolor: 'warning.light', bgcolor: 'rgba(255, 193, 7, 0.1)' }}>
                <Typography variant="subtitle2" color="warning.dark">
                  Pending Changes ({pendingChanges.length})
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {pendingChanges.map((change, index) => (
                  <React.Fragment key={change.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${getChangeColor(change.changeType)}.main` }}>
                          {getChangeIcon(change.changeType)}
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                              {change.user.displayName}
                            </Typography>
                            <Chip
                              label={change.changeType}
                              size="small"
                              color={getChangeColor(change.changeType) as any}
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {getChangeDescription(change)}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(change.timestamp)} • Position {change.position.start}
                            {change.position.end && change.position.end !== change.position.start && 
                              `-${change.position.end}`
                            }
                          </Typography>

                          {/* Comments */}
                          {getChangeComments(change.id).map(comment => (
                            <Box
                              key={comment.id}
                              sx={{
                                mt: 1,
                                p: 1,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                borderLeft: 3,
                                borderColor: 'info.main',
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                <CommentIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                {comment.author.displayName}: {comment.content}
                              </Typography>
                            </Box>
                          ))}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!readOnly && (
                            <>
                              <Tooltip title="Accept change">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleAccept(change.id)}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject change">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(change.id)}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          <Tooltip title="More options">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, change.id)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < pendingChanges.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {/* Accepted Changes */}
          {acceptedChanges.length > 0 && (
            <Box>
              {pendingChanges.length > 0 && <Divider sx={{ my: 1 }} />}
              
              <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                <Typography variant="subtitle2" color="success.dark">
                  Accepted Changes ({acceptedChanges.length})
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {acceptedChanges.slice(0, 10).map((change, index) => (
                  <React.Fragment key={change.id}>
                    <ListItem sx={{ py: 1.5, opacity: 0.7 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                          <CheckIcon fontSize="small" />
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {getChangeDescription(change)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {change.user.displayName} • {formatDate(change.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < Math.min(acceptedChanges.length - 1, 9) && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              {acceptedChanges.length > 10 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    And {acceptedChanges.length - 10} more accepted changes...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleNavigateToChange(menuAnchor?.changeId || '')}>
          Go to change
        </MenuItem>
        <MenuItem onClick={() => {
          setCommentDialog(menuAnchor?.changeId || '');
          handleMenuClose();
        }}>
          Add comment
        </MenuItem>
      </Menu>

      {/* Add Comment Dialog */}
      <Dialog
        open={commentDialog !== null}
        onClose={() => setCommentDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            multiline
            rows={3}
            fullWidth
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment about this change..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            disabled={!commentText.trim()}
          >
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};