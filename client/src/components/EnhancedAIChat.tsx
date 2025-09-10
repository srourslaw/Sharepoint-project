import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  CircularProgress,
  LinearProgress,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  AutoAwesome as AIIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ScrollUpIcon,
  Close as CloseIcon,
  GetApp as ExportIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';

import {
  ChatSession,
  ChatMessage,
  QuickAction,
  ChatAttachment,
  SourceReference,
  ChatExportOptions,
} from '../types';
import { useEnhancedAIChat } from '../hooks/useEnhancedAIChat';
import { MessageRenderer } from './MessageRenderer';
import { QuickActionBar } from './QuickActionBar';
import { FileUploadDialog } from './FileUploadDialog';
import { ChatExportDialog } from './ChatExportDialog';
import { TypingIndicator } from './TypingIndicator';
import { formatDate, formatDuration } from '../utils/formatters';

interface EnhancedAIChatProps {
  selectedFiles: string[];
  sessionId?: string;
  onSessionChange?: (session: ChatSession) => void;
  height?: number | string;
  onClose?: () => void;
}

export const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({
  selectedFiles,
  sessionId: initialSessionId,
  onSessionChange,
  height = '100%',
  onClose,
}) => {
  const {
    session,
    messages,
    sendMessage,
    uploadFile,
    exportChat,
    clearChat,
    loading,
    typing,
    error,
    quickActions,
  } = useEnhancedAIChat(initialSessionId);

  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Detect if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setShowScrollToBottom(!isAtBottom);
      setAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Notify parent of session changes
  useEffect(() => {
    if (session && onSessionChange) {
      onSessionChange(session);
    }
  }, [session, onSessionChange]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const messageContent = inputValue.trim();
    if (!messageContent) return;
    
    setInputValue('');

    try {
      await sendMessage({
        content: messageContent,
        documentIds: selectedFiles,
        attachments,
        includeContext: true,
      });
      setAttachments([]);
      setShowQuickActions(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputValue, attachments, selectedFiles, sendMessage]);

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    if (action.requiresDocuments && selectedFiles.length === 0) {
      // Show alert or open file selector
      return;
    }

    try {
      const messageContent = action.prompt || action.label || 'Please analyze the selected documents';
      await sendMessage({
        content: messageContent,
        documentIds: selectedFiles,
        actionType: action.type,
        parameters: action.parameters,
      });
      setShowQuickActions(false);
    } catch (error) {
      console.error('Failed to execute quick action:', error);
    }
  }, [selectedFiles, sendMessage]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    const newAttachments: ChatAttachment[] = files.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);

    try {
      const uploadedAttachments = await Promise.all(
        files.map(async (file, index) => {
          const uploaded = await uploadFile(file);
          return {
            ...newAttachments[index],
            ...uploaded,
            status: 'ready' as const,
          };
        })
      );

      setAttachments(prev =>
        prev.map((att, index) => {
          const uploadedIndex = newAttachments.findIndex(na => na.id === att.id);
          return uploadedIndex !== -1 ? uploadedAttachments[uploadedIndex] : att;
        })
      );
    } catch (error) {
      console.error('File upload failed:', error);
      setAttachments(prev =>
        prev.map(att =>
          newAttachments.some(na => na.id === att.id)
            ? { ...att, status: 'error' as const }
            : att
        )
      );
    }
  }, [uploadFile]);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  const handleExport = useCallback(async (options: ChatExportOptions) => {
    try {
      await exportChat(options);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Chat Header */}
      <Paper elevation={1} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AIIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {session?.title || 'AI Assistant'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session?.messages.length || 0} messages
                {session?.metadata?.documentsAnalyzed && (
                  <> • {session.metadata.documentsAnalyzed} docs analyzed</>
                )}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {selectedFiles.length > 0 && (
              <Chip
                label={`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            
            <IconButton size="small" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
              <MoreIcon />
            </IconButton>
            
            {onClose && (
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mx: 2, mt: 1 }}
          action={
            <IconButton size="small" color="inherit" onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 1,
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-thumb': { 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            borderRadius: 4 
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            textAlign="center"
            p={4}
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 2 }}>
              <BotIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Welcome to AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Ask questions about your documents, request summaries, translations, and more.
            </Typography>
            {showQuickActions && (
              <QuickActionBar
                actions={quickActions}
                onActionClick={handleQuickAction}
                selectedFilesCount={selectedFiles.length}
              />
            )}
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <MessageRenderer
                key={message.id}
                message={message}
                onCopy={copyMessageToClipboard}
                onActionClick={handleQuickAction}
              />
            ))}
            
            {typing && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Attachments ({attachments.length})
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {attachments.map((attachment) => (
              <Chip
                key={attachment.id}
                label={attachment.name}
                size="small"
                variant="outlined"
                onDelete={() => handleRemoveAttachment(attachment.id)}
                color={attachment.status === 'error' ? 'error' : 'default'}
                icon={
                  attachment.status === 'uploading' ? (
                    <CircularProgress size={14} />
                  ) : undefined
                }
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input Area */}
      <Paper elevation={2} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {loading && <LinearProgress sx={{ mb: 1 }} />}
        
        <Box display="flex" alignItems="flex-end" gap={1}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask a question about your documents..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                '& input': {
                  color: 'text.primary',
                },
                '& textarea': {
                  color: 'text.primary',
                },
              },
            }}
          />
          
          <IconButton
            color="primary"
            onClick={() => setUploadDialogOpen(true)}
            disabled={loading}
          >
            <AttachIcon />
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={loading || (!inputValue.trim() && attachments.length === 0)}
            sx={{ p: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Quick Actions Toggle */}
        {messages.length > 0 && (
          <Box mt={1} display="flex" justifyContent="center">
            <Button
              size="small"
              variant="text"
              onClick={() => setShowQuickActions(!showQuickActions)}
              startIcon={<AIIcon />}
            >
              {showQuickActions ? 'Hide' : 'Show'} Quick Actions
            </Button>
          </Box>
        )}

        {/* Quick Actions */}
        <Collapse in={showQuickActions && messages.length > 0}>
          <Box mt={2}>
            <QuickActionBar
              actions={quickActions}
              onActionClick={handleQuickAction}
              selectedFilesCount={selectedFiles.length}
              compact
            />
          </Box>
        </Collapse>
      </Paper>

      {/* Scroll to Bottom FAB */}
      {showScrollToBottom && (
        <Fab
          size="small"
          color="primary"
          onClick={scrollToBottom}
          sx={{
            position: 'absolute',
            bottom: 120,
            right: 16,
            zIndex: 1,
          }}
        >
          <ScrollUpIcon />
        </Fab>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => setExportDialogOpen(true)}>
          <ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Export Chat" />
        </MenuItem>
        <MenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Share Session" />
        </MenuItem>
        <MenuItem onClick={() => console.log('Bookmark session')}>
          <ListItemIcon><BookmarkIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Bookmark Session" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={clearChat} sx={{ color: 'error.main' }}>
          <ListItemIcon><ClearIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Clear Chat" />
        </MenuItem>
      </Menu>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
        acceptedTypes={['image/*', 'application/pdf', 'text/*', '.docx', '.xlsx', '.pptx']}
        maxSize={10 * 1024 * 1024} // 10MB
      />

      {/* Export Dialog */}
      <ChatExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        session={session}
      />
    </Box>
  );
};