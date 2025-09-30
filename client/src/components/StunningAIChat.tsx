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

const SIDEBAR_WIDTH = 280;

export const StunningAIChat: React.FC<StunningAIChatProps> = ({
  selectedFiles,
  onClose,
  height = '100%',
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const { currentTheme, isDarkMode } = useDynamicTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<string>('main');
  const [threads, setThreads] = useState<Record<string, ConversationThread>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const delay = index * 100;

    return (
      <Zoom
        in={true}
        timeout={800}
        style={{ transitionDelay: `${delay}ms` }}
        key={message.id}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 4,
            px: 3,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              maxWidth: '75%',
              animation: 'messageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animationDelay: `${delay}ms`,
              animationFillMode: 'both',
            }}
          >
            {/* Floating Message Bubble */}
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                background: isUser
                  ? `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}20 100%)`
                  : `linear-gradient(135deg, ${isDarkMode ? '#1a202c' : '#ffffff'} 0%, ${isDarkMode ? '#2d3748' : '#f7fafc'} 100%)`,
                border: `2px solid ${isUser ? currentTheme.primary : currentTheme.accent}`,
                borderRadius: '24px',
                p: 3,
                boxShadow: isUser
                  ? `0 12px 40px -8px ${alpha(currentTheme.primary, 0.3)}`
                  : `0 12px 40px -8px ${alpha(currentTheme.accent, 0.3)}`,
                backdropFilter: 'blur(20px)',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: isUser
                    ? `0 20px 60px -8px ${alpha(currentTheme.primary, 0.4)}`
                    : `0 20px 60px -8px ${alpha(currentTheme.accent, 0.4)}`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: `linear-gradient(135deg, ${isUser ? currentTheme.primary : currentTheme.accent}, ${isUser ? currentTheme.accent : currentTheme.primary})`,
                  borderRadius: '24px',
                  zIndex: -1,
                  opacity: 0.1,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  background: isUser
                    ? `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}20 100%)`
                    : `linear-gradient(135deg, ${isDarkMode ? '#1a202c' : '#ffffff'} 0%, ${isDarkMode ? '#2d3748' : '#f7fafc'} 100%)`,
                  border: `2px solid ${isUser ? currentTheme.primary : currentTheme.accent}`,
                  borderRadius: '6px',
                  transform: isUser ? 'rotate(45deg)' : 'rotate(45deg)',
                  [isUser ? 'right' : 'left']: -10,
                  bottom: 20,
                  zIndex: -1,
                },
              }}
            >
              {/* Message Content */}
              <Typography
                variant="body1"
                sx={{
                  color: isDarkMode ? '#f7fafc' : currentTheme.text.primary,
                  fontWeight: isUser ? 500 : 400,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  fontSize: '16px',
                  fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                  mb: 2,
                }}
              >
                {message.content}
              </Typography>

              {/* Message Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.8)' : 'rgba(30,41,59,0.7)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <CircleIcon sx={{ fontSize: 6, color: currentTheme.primary }} />
                  {formatTime(message.timestamp)}
                </Typography>

                {message.fileContext && message.fileContext.length > 0 && (
                  <Chip
                    label={`📎 ${message.fileContext.length} file${message.fileContext.length > 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 24,
                      fontSize: '11px',
                      borderColor: alpha(currentTheme.primary, 0.3),
                      color: currentTheme.primary,
                      backgroundColor: alpha(currentTheme.primary, 0.05),
                    }}
                  />
                )}
              </Box>
            </Paper>

            {/* Floating Avatar */}
            <Avatar
              sx={{
                position: 'absolute',
                [isUser ? 'right' : 'left']: -25,
                top: -8,
                width: 48,
                height: 48,
                background: isUser
                  ? `linear-gradient(135deg, ${currentTheme.success} 0%, #10b981 100%)`
                  : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                boxShadow: isUser
                  ? '0 12px 30px rgba(16, 185, 129, 0.4)'
                  : '0 12px 30px rgba(124, 58, 237, 0.4)',
                border: `3px solid ${isDarkMode ? '#1a202c' : '#ffffff'}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: isUser
                    ? '0 16px 40px rgba(16, 185, 129, 0.6)'
                    : '0 16px 40px rgba(124, 58, 237, 0.6)',
                }
              }}
            >
              {isUser ?
                <UserIcon sx={{ color: '#ffffff', fontSize: '24px' }} /> :
                <BotIcon sx={{ color: '#ffffff', fontSize: '24px' }} />
              }
            </Avatar>
          </Box>
        </Box>
      </Zoom>
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
    <Box sx={{ height, display: 'flex', flexDirection: 'row', position: 'relative' }}>
      {/* History Sidebar */}
      <Collapse in={showHistory} orientation="horizontal">
        {renderHistorySidebar()}
      </Collapse>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Enhanced Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${isDarkMode ? '#0f172a' : '#ffffff'} 0%, ${isDarkMode ? '#1e293b' : '#f8fafc'} 100%)`,
            borderBottom: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton
                onClick={() => setShowHistory(!showHistory)}
                sx={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}15 100%)`,
                  border: `2px solid ${alpha(currentTheme.primary, 0.2)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${currentTheme.primary}25 0%, ${currentTheme.accent}25 100%)`,
                    transform: 'scale(1.05)',
                  }
                }}
              >
                {showHistory ? <LeftArrowIcon /> : <RightArrowIcon />}
              </IconButton>

              <Avatar sx={{
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                width: 56,
                height: 56,
                boxShadow: '0 12px 30px rgba(124, 58, 237, 0.4)',
                animation: 'avatarFloat 3s ease-in-out infinite'
              }}>
                <BotIcon sx={{ color: '#ffffff', fontSize: '28px' }} />
              </Avatar>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: currentTheme.text.primary, mb: 0.5 }}>
                  AI Assistant
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text.secondary, fontWeight: 500 }}>
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
                  variant="outlined"
                  sx={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}10 0%, ${currentTheme.accent}10 100%)`,
                    borderColor: currentTheme.primary,
                    color: currentTheme.primary,
                    fontWeight: 600,
                  }}
                />
              )}

              {onClose && (
                <IconButton
                  onClick={onClose}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha('#ef4444', 0.1),
                      color: '#ef4444'
                    }
                  }}
                >
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
            background: `linear-gradient(180deg, ${isDarkMode ? '#0a0e1a' : '#fafbfc'} 0%, ${isDarkMode ? '#1a202c' : '#f0f4f8'} 100%)`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 20%, ${alpha(currentTheme.primary, 0.05)} 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, ${alpha(currentTheme.accent, 0.05)} 0%, transparent 50%),
                radial-gradient(circle at 40% 70%, ${alpha(currentTheme.secondary, 0.03)} 0%, transparent 50%)
              `,
              pointerEvents: 'none',
            },
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(currentTheme.primary, 0.3),
              borderRadius: 4,
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
              gap={4}
              sx={{ position: 'relative', zIndex: 1 }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar sx={{
                  background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                  width: 120,
                  height: 120,
                  boxShadow: '0 20px 60px rgba(124, 58, 237, 0.4)',
                  animation: 'pulse 2s ease-in-out infinite alternate'
                }}>
                  <BotIcon sx={{ color: '#ffffff', fontSize: '60px' }} />
                </Avatar>
                <SparkleIcon
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    color: currentTheme.accent,
                    fontSize: '36px',
                    animation: 'sparkle 1.5s ease-in-out infinite'
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: currentTheme.text.primary, mb: 1 }}>
                Welcome to AI Assistant
              </Typography>
              <Typography variant="h6" sx={{ color: currentTheme.text.secondary, maxWidth: 500, lineHeight: 1.6 }}>
                {selectedFiles.length > 0
                  ? `Ask questions about your ${selectedFiles.length} selected document${selectedFiles.length > 1 ? 's' : ''} or start a general conversation`
                  : 'Select documents or ask general questions to get started. Your conversations are automatically saved and organized.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', zIndex: 1, py: 3 }}>
              {messages.map((message, index) => renderMessage(message, index))}
              {isLoading && (
                <Fade in={true}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4, px: 3 }}>
                    <Box sx={{ position: 'relative', maxWidth: '75%' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          background: `linear-gradient(135deg, ${isDarkMode ? '#1a202c' : '#ffffff'} 0%, ${isDarkMode ? '#2d3748' : '#f7fafc'} 100%)`,
                          border: `2px solid ${currentTheme.accent}`,
                          borderRadius: '24px',
                          p: 3,
                          boxShadow: `0 12px 40px -8px ${alpha(currentTheme.accent, 0.3)}`,
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <CircularProgress size={24} sx={{ color: currentTheme.primary }} />
                          <Typography variant="body1" sx={{ color: currentTheme.text.secondary, fontWeight: 500 }}>
                            AI is thinking...
                          </Typography>
                        </Box>
                      </Paper>

                      <Avatar
                        sx={{
                          position: 'absolute',
                          left: -25,
                          top: -8,
                          width: 48,
                          height: 48,
                          background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                          boxShadow: '0 12px 30px rgba(124, 58, 237, 0.4)',
                          border: `3px solid ${isDarkMode ? '#1a202c' : '#ffffff'}`,
                        }}
                      >
                        <BotIcon sx={{ color: '#ffffff', fontSize: '24px' }} />
                      </Avatar>
                    </Box>
                  </Box>
                </Fade>
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        {/* Enhanced Input Area */}
        <Paper
          elevation={8}
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${isDarkMode ? '#0f172a' : '#ffffff'} 0%, ${isDarkMode ? '#1e293b' : '#f8fafc'} 100%)`,
            borderTop: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
            backdropFilter: 'blur(20px)',
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
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  '& input, & textarea': {
                    color: isDarkMode ? '#f8fafc' : currentTheme.text.primary,
                    fontSize: '16px',
                    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                    padding: '16px 20px',
                  },
                  '& fieldset': {
                    borderColor: alpha(currentTheme.primary, 0.3),
                    borderWidth: '2px',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(124, 58, 237, 0.15)',
                    '& fieldset': {
                      borderColor: currentTheme.primary,
                    },
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 50px rgba(124, 58, 237, 0.25)',
                    '& fieldset': {
                      borderColor: currentTheme.primary,
                      borderWidth: '2px',
                    },
                  },
                },
              }}
            />

            <IconButton
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              sx={{
                p: 2,
                background: isLoading || !inputValue.trim()
                  ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                  : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                color: 'white',
                borderRadius: '16px',
                boxShadow: isLoading || !inputValue.trim()
                  ? 'none'
                  : '0 12px 30px rgba(124, 58, 237, 0.4)',
                '&:hover': {
                  background: isLoading || !inputValue.trim()
                    ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    : `linear-gradient(135deg, ${currentTheme.secondary} 0%, ${currentTheme.primary} 100%)`,
                  transform: isLoading || !inputValue.trim() ? 'none' : 'translateY(-3px) scale(1.1)',
                  boxShadow: isLoading || !inputValue.trim()
                    ? 'none'
                    : '0 16px 40px rgba(124, 58, 237, 0.5)',
                },
                '&:active': {
                  transform: isLoading || !inputValue.trim() ? 'none' : 'translateY(0px) scale(0.95)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {isLoading ? <CircularProgress size={28} color="inherit" /> : <SendIcon sx={{ fontSize: 28 }} />}
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

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes messageSlideIn {
          0% {
            opacity: 0;
            transform: translateX(${Math.random() > 0.5 ? '30px' : '-30px'}) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.7; transform: scale(1.2) rotate(180deg); }
        }

        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </Box>
  );
};