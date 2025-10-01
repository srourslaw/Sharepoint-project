import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Collapse,
  Fade,
  Zoom,
  Menu,
  MenuItem,
  Button,
  Drawer,
  Divider,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Chat as ChatIcon,
  AutoAwesome as SparkleIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  KeyboardArrowLeft as LeftArrowIcon,
  KeyboardArrowRight as RightArrowIcon,
  Circle as CircleIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

import { useEnhancedAIChat } from '../hooks/useEnhancedAIChat';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';
import { useStatePersistenceContext } from '../contexts/StatePersistenceContext';
import { ChatMessage } from '../utils/statePersistence';

interface StunningAIChatProps {
  selectedFiles: string[];
  onClose?: () => void;
  height?: number | string;
}

interface ConversationThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: Date;
  preview: string;
  emoji: string;
}

const SIDEBAR_WIDTH = 320;

export const StunningAIChat: React.FC<StunningAIChatProps> = ({
  selectedFiles,
  onClose,
  height = '100%',
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTheme, isDarkMode } = useDynamicTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<string>('main');
  const [threads, setThreads] = useState<Record<string, ConversationThread>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, clearChat } = useEnhancedAIChat();
  const { getChatHistory, addChatMessage, clearChatHistory, exportUserData } = useStatePersistenceContext();

  // Initialize threads and restore chat history
  useEffect(() => {
    const savedMessages = getChatHistory();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);

      const mainThread: ConversationThread = {
        id: 'main',
        title: 'Main Conversation',
        emoji: '💬',
        messages: savedMessages,
        lastActivity: savedMessages[savedMessages.length - 1]?.timestamp || new Date(),
        preview: savedMessages[savedMessages.length - 1]?.content.substring(0, 50) + '...' || 'No messages yet'
      };

      setThreads({ main: mainThread });
      console.log('💬 Restored', savedMessages.length, 'messages from persistent storage');
    } else {
      const mainThread: ConversationThread = {
        id: 'main',
        title: 'Main Conversation',
        emoji: '💬',
        messages: [],
        lastActivity: new Date(),
        preview: 'Start a new conversation...'
      };
      setThreads({ main: mainThread });
    }
  }, [getChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Responsive sidebar behavior
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        // Auto-hide sidebar on smaller widths
        if (width < 800) {
          setShowHistory(false);
        } else if (width > 1000) {
          setShowHistory(true);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const updateCurrentThread = useCallback((newMessages: ChatMessage[]) => {
    setThreads(prev => ({
      ...prev,
      [currentThread]: {
        ...prev[currentThread],
        messages: newMessages,
        lastActivity: new Date(),
        preview: newMessages[newMessages.length - 1]?.content.substring(0, 50) + '...' || 'No messages yet'
      }
    }));
  }, [currentThread]);

  const generateThreadTitle = (messages: ChatMessage[]): string => {
    if (messages.length === 0) return 'New Chat';
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'Chat ' + new Date().toLocaleDateString();
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    addChatMessage({
      role: 'user',
      content: inputValue.trim(),
      fileContext: selectedFiles.length > 0 ? selectedFiles : undefined,
    });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      fileContext: selectedFiles.length > 0 ? selectedFiles : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentThread(newMessages);

    // Auto-generate thread title for new conversations
    if (newMessages.length === 1) {
      const title = generateThreadTitle(newMessages);
      setThreads(prev => ({
        ...prev,
        [currentThread]: {
          ...prev[currentThread],
          title
        }
      }));
    }

    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage({
        content: userMessage.content,
        documentIds: selectedFiles,
        includeContext: true,
      });

      addChatMessage({
        role: 'assistant',
        content: response || 'I received your message but couldn\'t generate a response.',
        fileContext: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
        fileContext: selectedFiles.length > 0 ? selectedFiles : undefined,
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      updateCurrentThread(finalMessages);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');

      addChatMessage({
        role: 'assistant',
        content: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
      });

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      updateCurrentThread(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, selectedFiles, sendMessage, isLoading, addChatMessage, messages, updateCurrentThread]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    clearChatHistory();
    clearChat();

    setThreads(prev => ({
      ...prev,
      [currentThread]: {
        ...prev[currentThread],
        messages: [],
        preview: 'Start a new conversation...'
      }
    }));

    console.log('🗑️ Chat history cleared from both local and persistent storage');
  };

  const createNewThread = () => {
    const newThreadId = `thread-${Date.now()}`;
    const emojis = ['💬', '🤖', '📝', '💡', '🎯', '🔍', '⚡', '🚀', '💎', '🌟'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const newThread: ConversationThread = {
      id: newThreadId,
      title: 'New Chat',
      emoji: randomEmoji,
      messages: [],
      lastActivity: new Date(),
      preview: 'Start a new conversation...'
    };

    setThreads(prev => ({ ...prev, [newThreadId]: newThread }));
    setCurrentThread(newThreadId);
    setMessages([]);
  };

  const switchToThread = (threadId: string) => {
    setCurrentThread(threadId);
    setMessages(threads[threadId]?.messages || []);
  };

  const deleteThread = (threadId: string) => {
    const newThreads = { ...threads };
    delete newThreads[threadId];
    setThreads(newThreads);

    if (currentThread === threadId) {
      const remainingThreads = Object.keys(newThreads);
      if (remainingThreads.length > 0) {
        const nextThread = remainingThreads[0];
        setCurrentThread(nextThread);
        setMessages(newThreads[nextThread].messages);
      } else {
        createNewThread();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isCopied = copiedMessageId === message.id;

    return (
      <Fade
        in={true}
        timeout={400}
        style={{ transitionDelay: `${index * 50}ms` }}
        key={message.id}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            mb: 3,
            px: 2,
            py: 1,
            '&:hover .message-actions': {
              opacity: 1,
            }
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: isUser ? currentTheme.primary : currentTheme.accent,
              flexShrink: 0,
            }}
          >
            {isUser ?
              <UserIcon sx={{ fontSize: '18px' }} /> :
              <BotIcon sx={{ fontSize: '18px' }} />
            }
          </Avatar>

          {/* Message Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                  fontSize: '14px'
                }}
              >
                {isUser ? 'You' : 'AI Assistant'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: currentTheme.text.secondary,
                  fontSize: '12px'
                }}
              >
                {formatTime(message.timestamp)}
              </Typography>
            </Box>

            {/* Message Body */}
            <Box
              sx={{
                position: 'relative',
                p: 2,
                backgroundColor: isUser
                  ? alpha(currentTheme.primary, 0.08)
                  : alpha(currentTheme.accent, 0.08),
                borderRadius: '12px',
                border: `1px solid ${alpha(isUser ? currentTheme.primary : currentTheme.accent, 0.2)}`,
                '&:hover': {
                  backgroundColor: isUser
                    ? alpha(currentTheme.primary, 0.12)
                    : alpha(currentTheme.accent, 0.12),
                  borderColor: alpha(isUser ? currentTheme.primary : currentTheme.accent, 0.3),
                }
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: currentTheme.text.primary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  mb: message.fileContext?.length ? 1 : 0,
                }}
              >
                {message.content}
              </Typography>

              {/* File Context */}
              {message.fileContext && message.fileContext.length > 0 && (
                <Chip
                  label={`📎 ${message.fileContext.length} file${message.fileContext.length > 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '10px',
                    mt: 1,
                  }}
                />
              )}

              {/* Action Icons */}
              {!isUser && (
                <Box
                  className="message-actions"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleCopyMessage(message.content, message.id)}
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }}
                  >
                    {isCopied ?
                      <CheckIcon sx={{ fontSize: '14px', color: 'green' }} /> :
                      <CopyIcon sx={{ fontSize: '14px' }} />
                    }
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Fade>
    );
  };

  const renderHistorySidebar = () => (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        background: `linear-gradient(180deg, ${isDarkMode ? '#0f172a' : '#fafbfc'} 0%, ${isDarkMode ? '#1e293b' : '#f1f5f9'} 100%)`,
        borderRight: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '3px',
          height: '100%',
          background: `linear-gradient(180deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          opacity: 0.6,
        }
      }}
    >
      {/* Sidebar Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(currentTheme.primary, 0.1)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
              width: 40,
              height: 40,
              boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)'
            }}
          >
            <HistoryIcon sx={{ color: '#ffffff' }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: currentTheme.text.primary }}>
            Chat History
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={createNewThread}
          sx={{
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
            borderRadius: '12px',
            py: 1.5,
            fontWeight: 600,
            boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(124, 58, 237, 0.4)',
            }
          }}
        >
          New Chat
        </Button>
      </Box>

      {/* Conversation List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {Object.values(threads)
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
          .map((thread) => (
            <Card
              key={thread.id}
              sx={{
                mb: 2,
                cursor: 'pointer',
                background: currentThread === thread.id
                  ? `linear-gradient(135deg, ${currentTheme.primary}20 0%, ${currentTheme.accent}15 100%)`
                  : `linear-gradient(135deg, ${isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)'} 0%, ${isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)'} 100%)`,
                border: `2px solid ${currentThread === thread.id ? currentTheme.primary : 'transparent'}`,
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: `0 12px 30px ${alpha(currentTheme.primary, 0.2)}`,
                  border: `2px solid ${currentTheme.primary}`,
                },
              }}
              onClick={() => switchToThread(thread.id)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Typography variant="h5" sx={{ fontSize: '24px' }}>
                    {thread.emoji}
                  </Typography>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: currentTheme.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {thread.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: currentTheme.text.secondary,
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      {formatRelativeTime(thread.lastActivity)}
                    </Typography>
                  </Box>

                  {thread.id !== 'main' && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      sx={{
                        opacity: 0.6,
                        '&:hover': {
                          opacity: 1,
                          color: 'error.main',
                          backgroundColor: alpha('#ef4444', 0.1)
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: currentTheme.text.secondary,
                    fontSize: '12px',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {thread.preview}
                </Typography>

                {thread.messages.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Chip
                      label={`${thread.messages.length} messages`}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '10px',
                        borderColor: alpha(currentTheme.primary, 0.3),
                        color: currentTheme.primary,
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
      </Box>
    </Box>
  );

  return (
    <Box ref={containerRef} sx={{ height, display: 'flex', flexDirection: 'row', position: 'relative' }}>
      {/* History Sidebar */}
      <Collapse in={showHistory} orientation="horizontal">
        {renderHistorySidebar()}
      </Collapse>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Clean Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton
                onClick={() => setShowHistory(!showHistory)}
                size="small"
                sx={{
                  backgroundColor: alpha(currentTheme.primary, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(currentTheme.primary, 0.2),
                  }
                }}
              >
                {showHistory ? <LeftArrowIcon /> : <RightArrowIcon />}
              </IconButton>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text.primary }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ color: currentTheme.text.secondary }}>
                  {messages.length} messages
                  {selectedFiles.length > 0 && (
                    <> • {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</>
                  )}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {selectedFiles.length > 0 && (
                <Chip
                  label={`📎 ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}

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
            sx={{ m: 2, borderRadius: 2 }}
            action={
              <IconButton size="small" color="inherit" onClick={() => setError(null)}>
                <CloseIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: isDarkMode ? '#0f172a' : '#fafbfc',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(currentTheme.primary, 0.3),
              borderRadius: 3,
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
              gap={3}
              p={4}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: currentTheme.primary,
                  mb: 2
                }}
              >
                <BotIcon sx={{ fontSize: '32px' }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, color: currentTheme.text.primary }}>
                AI Assistant
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.text.secondary, maxWidth: 400 }}>
                {selectedFiles.length > 0
                  ? `Ask questions about your ${selectedFiles.length} selected document${selectedFiles.length > 1 ? 's' : ''}`
                  : 'Start a conversation or select documents to analyze'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', zIndex: 1, py: 3 }}>
              {messages.map((message, index) => renderMessage(message, index))}
              {isLoading && (
                <Fade in={true}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 3,
                      px: 2,
                      py: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: currentTheme.accent,
                        flexShrink: 0,
                      }}
                    >
                      <BotIcon sx={{ fontSize: '18px' }} />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: currentTheme.text.primary,
                            fontSize: '14px'
                          }}
                        >
                          AI Assistant
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: alpha(currentTheme.accent, 0.08),
                          borderRadius: '12px',
                          border: `1px solid ${alpha(currentTheme.accent, 0.2)}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={16} sx={{ color: currentTheme.accent }} />
                        <Typography variant="body2" sx={{ color: currentTheme.text.secondary, fontSize: '14px' }}>
                          AI is thinking...
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          }}
        >
          <Box display="flex" alignItems="flex-end" gap={2}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={
                selectedFiles.length > 0
                  ? "Ask a question about your documents..."
                  : "Ask me anything..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                  borderRadius: '12px',
                  '& input, & textarea': {
                    color: currentTheme.text.primary,
                    fontSize: '14px',
                    padding: '12px 16px',
                  },
                  '& fieldset': {
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
              }}
            />

            <IconButton
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              sx={{
                backgroundColor: currentTheme.primary,
                color: 'white',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: currentTheme.secondary,
                },
                '&:disabled': {
                  backgroundColor: '#e5e7eb',
                  color: '#9ca3af',
                },
              }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>

          {selectedFiles.length === 0 && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                💡 Select documents from the file browser to ask specific questions about them,
                or ask general questions without selecting any files.
              </Typography>
            </Alert>
          )}
        </Paper>
      </Box>

    </Box>
  );
};