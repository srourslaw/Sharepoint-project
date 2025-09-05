import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Button,
  Typography,
  Divider,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Slider,
  ButtonGroup,
  Popover,
  Card,
  CardContent,
  ListItemAvatar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatAlignJustify as AlignJustifyIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatSize as FontSizeIcon,
  Palette as ColorIcon,
  History as HistoryIcon,
  Group as CollabIcon,
  AutoMode as AutoSaveIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  RestorePage as RestoreIcon,
  Compare as CompareIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import {
  FileEditorProps,
  EditorState,
  FileVersion,
  FileChange,
  TextFormatting,
  User,
  CollaborativeSession,
} from '../types';
import { useFileEditor } from '../hooks/useFileEditor';
import { RichTextEditor } from './RichTextEditor';
import { VersionHistory } from './VersionHistory';
import { ChangeTracker } from './ChangeTracker';
import { CollaborationPanel } from './CollaborationPanel';
import { formatDate, formatFileSize } from '../utils/formatters';

export const FileEditor: React.FC<FileEditorProps> = ({
  file,
  readOnly = false,
  autoSave = { enabled: true, interval: 30000, maxRetries: 3, retryDelay: 1000 },
  collaborative = true,
  onSave,
  onClose,
  onError,
}) => {
  const {
    editorState,
    versions,
    changes,
    collaborativeSession,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    saveFile,
    loadVersion,
    undo,
    redo,
    applyFormatting,
    insertText,
    deleteText,
    replaceText,
    acceptChange,
    rejectChange,
    startCollaboration,
    stopCollaboration,
    updateCursor,
  } = useFileEditor({
    file,
    autoSave,
    collaborative,
    onSave,
    onError,
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'versions' | 'changes' | 'collaboration'>('editor');
  const [formatMenuAnchor, setFormatMenuAnchor] = useState<HTMLElement | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionComment, setVersionComment] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const editorRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Ctrl/Cmd + B for bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        applyFormatting({ bold: true });
      }

      // Ctrl/Cmd + I for italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        applyFormatting({ italic: true });
      }

      // Ctrl/Cmd + U for underline
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        applyFormatting({ underline: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, undo, redo, applyFormatting]);

  // Show notifications
  const showNotificationMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setShowNotification(true);
  };

  // Handle save
  const handleSave = useCallback(async () => {
    if (readOnly || !hasUnsavedChanges) return;

    try {
      await saveFile(versionComment);
      setVersionComment('');
      setSaveDialogOpen(false);
      showNotificationMessage('File saved successfully', 'success');
    } catch (error: any) {
      showNotificationMessage(error.message || 'Failed to save file', 'error');
    }
  }, [readOnly, hasUnsavedChanges, saveFile, versionComment]);

  // Handle version restore
  const handleRestoreVersion = async (version: FileVersion) => {
    if (readOnly) return;

    try {
      await loadVersion(version.id);
      showNotificationMessage(`Restored to version ${version.versionNumber}`, 'success');
      setActiveTab('editor');
    } catch (error: any) {
      showNotificationMessage(error.message || 'Failed to restore version', 'error');
    }
  };

  // Handle change acceptance/rejection
  const handleChangeAction = async (changeId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await acceptChange(changeId);
      } else {
        await rejectChange(changeId);
      }
      showNotificationMessage(`Change ${action}ed`, 'success');
    } catch (error: any) {
      showNotificationMessage(error.message || `Failed to ${action} change`, 'error');
    }
  };

  // Handle collaboration
  const handleToggleCollaboration = async () => {
    try {
      if (collaborativeSession) {
        await stopCollaboration();
        showNotificationMessage('Left collaborative session', 'info');
      } else {
        await startCollaboration();
        showNotificationMessage('Started collaborative session', 'success');
      }
    } catch (error: any) {
      showNotificationMessage(error.message || 'Failed to toggle collaboration', 'error');
    }
  };

  // Get file type for editor mode
  const getEditorMode = () => {
    const ext = file.extension.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'html':
      case 'htm':
        return 'html';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'py':
        return 'python';
      default:
        return 'text';
    }
  };

  const isRichTextFile = () => {
    const ext = file.extension.toLowerCase();
    return ['txt', 'md', 'markdown', 'html', 'htm'].includes(ext);
  };

  // Render toolbar
  const renderToolbar = () => (
    <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '48px !important' }}>
      <Box display="flex" alignItems="center" gap={1} width="100%">
        {/* File info */}
        <Box display="flex" alignItems="center" gap={1} minWidth={0} flex={1}>
          <Typography variant="subtitle1" noWrap fontWeight={600}>
            {file.displayName}
          </Typography>
          {hasUnsavedChanges && (
            <Chip label="Unsaved" size="small" color="warning" variant="outlined" />
          )}
          {readOnly && (
            <Chip label="Read Only" size="small" color="default" variant="outlined" />
          )}
        </Box>

        {/* Save controls */}
        {!readOnly && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Save (Ctrl+S)">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!hasUnsavedChanges || saving}
                  color="primary"
                >
                  {saving ? <LinearProgress sx={{ width: 20 }} /> : <SaveIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>

            {autoSave.enabled && (
              <Tooltip title={`Auto-save enabled (${autoSave.interval / 1000}s)`}>
                <AutoSaveIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        )}

        <Divider orientation="vertical" flexItem />

        {/* Undo/Redo */}
        {!readOnly && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  onClick={undo}
                  disabled={editorState.undoStack.length === 0}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton
                  size="small"
                  onClick={redo}
                  disabled={editorState.redoStack.length === 0}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Formatting tools for rich text */}
        {!readOnly && isRichTextFile() && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton
                size="small"
                onClick={() => applyFormatting({ bold: true })}
              >
                <BoldIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting({ italic: true })}
              >
                <ItalicIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting({ underline: true })}
              >
                <UnderlineIcon fontSize="small" />
              </IconButton>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              
              <IconButton
                size="small"
                onClick={() => applyFormatting({ alignment: 'left' })}
              >
                <AlignLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting({ alignment: 'center' })}
              >
                <AlignCenterIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => applyFormatting({ alignment: 'right' })}
              >
                <AlignRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}

        {/* Collaboration indicator */}
        {collaborative && (
          <>
            <Divider orientation="vertical" flexItem />
            <Tooltip title={collaborativeSession ? 'Active collaboration session' : 'Start collaboration'}>
              <IconButton
                size="small"
                onClick={handleToggleCollaboration}
                color={collaborativeSession ? 'primary' : 'default'}
              >
                <Badge
                  badgeContent={collaborativeSession?.participants.filter(p => p.isActive).length || 0}
                  color="secondary"
                  invisible={!collaborativeSession}
                >
                  <CollabIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Active collaborators */}
        {collaborativeSession && (
          <AvatarGroup max={4} sx={{ ml: 1 }}>
            {collaborativeSession.participants
              .filter(p => p.isActive)
              .map((participant, index) => (
                <Tooltip key={participant.user.id} title={participant.user.displayName}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {participant.user.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))
            }
          </AvatarGroup>
        )}

        <Box flexGrow={1} />

        {/* Close button */}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Toolbar>
  );

  // Render tabs
  const renderTabs = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          label="Editor"
          value="editor"
          icon={<EditIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 40, textTransform: 'none' }}
        />
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Versions
              <Chip label={versions.length} size="small" />
            </Box>
          }
          value="versions"
          icon={<HistoryIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 40, textTransform: 'none' }}
        />
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              Changes
              <Chip label={changes.filter(c => !c.accepted).length} size="small" color="primary" />
            </Box>
          }
          value="changes"
          icon={<CommentIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 40, textTransform: 'none' }}
        />
        {collaborative && (
          <Tab
            label="Collaboration"
            value="collaboration"
            icon={<CollabIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 40, textTransform: 'none' }}
          />
        )}
      </Tabs>
    </Box>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return (
          <RichTextEditor
            ref={editorRef}
            content={editorState.content}
            mode={getEditorMode()}
            readOnly={readOnly}
            collaborative={!!collaborativeSession}
            collaborators={collaborativeSession?.participants || []}
            changes={changes}
            onContentChange={(content) => {
              if (!readOnly) {
                // This will be handled by the RichTextEditor component
                // which will call the appropriate editor state methods
              }
            }}
            onCursorChange={updateCursor}
            onSelectionChange={(selection) => {
              // Handle selection changes for collaboration
            }}
            height="100%"
          />
        );

      case 'versions':
        return (
          <VersionHistory
            versions={versions}
            currentVersion={editorState.version}
            onRestoreVersion={handleRestoreVersion}
            onCompareVersions={(v1, v2) => {
              // Handle version comparison
              console.log('Compare versions:', v1, v2);
            }}
            readOnly={readOnly}
          />
        );

      case 'changes':
        return (
          <ChangeTracker
            changes={changes}
            onAcceptChange={(id) => handleChangeAction(id, 'accept')}
            onRejectChange={(id) => handleChangeAction(id, 'reject')}
            onNavigateToChange={(change) => {
              setActiveTab('editor');
              // Navigate to change position in editor
            }}
            readOnly={readOnly}
          />
        );

      case 'collaboration':
        return collaborative ? (
          <CollaborationPanel
            session={collaborativeSession}
            onStartSession={() => handleToggleCollaboration()}
            onLeaveSession={() => handleToggleCollaboration()}
            onInviteUsers={(users) => {
              // Handle user invitations
              console.log('Invite users:', users);
            }}
          />
        ) : null;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading file...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
        sx={{ m: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={1} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {renderToolbar()}
        {renderTabs()}
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {renderContent()}
        </Box>
      </Paper>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save File</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Version comment (optional)"
            multiline
            rows={3}
            value={versionComment}
            onChange={(e) => setVersionComment(e.target.value)}
            placeholder="Describe the changes made in this version..."
            margin="normal"
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>File:</strong> {file.displayName}
              <br />
              <strong>Size:</strong> {formatFileSize(file.size)}
              <br />
              <strong>Last saved:</strong> {editorState.lastSaved ? formatDate(editorState.lastSaved) : 'Never'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={notificationSeverity}
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};