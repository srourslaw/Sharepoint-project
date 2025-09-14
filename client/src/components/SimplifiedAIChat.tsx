import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { useEnhancedAIChat } from '../hooks/useEnhancedAIChat';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';

interface SimplifiedAIChatProps {
  selectedFiles: string[];
  onClose?: () => void;
  height?: number | string;
}

interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const SimplifiedAIChat: React.FC<SimplifiedAIChatProps> = ({
  selectedFiles,
  onClose,
  height = '100%',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const { currentTheme, isDarkMode } = useDynamicTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, clearChat } = useEnhancedAIChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: SimpleMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage({
        content: userMessage.content,
        documentIds: selectedFiles,
        includeContext: true,
      });

      // Add AI response
      const aiMessage: SimpleMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage: SimpleMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, selectedFiles, sendMessage, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    clearChat();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: SimpleMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) {
      return (
        <Box key={message.id} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Alert severity="warning" variant="outlined" sx={{ maxWidth: '80%' }}>
            {message.content}
          </Alert>
        </Box>
      );
    }

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        {!isUser && (
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`, 
            width: 32, 
            height: 32,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}>
            <BotIcon sx={{ color: '#ffffff', fontSize: '18px' }} />
          </Avatar>
        )}

        <Box sx={{ maxWidth: '70%' }}>
          <Box
            sx={{
              p: 2,
              background: isUser
                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '2px solid',
              borderColor: currentTheme.primary,
              borderRadius: '16px',
              borderTopLeftRadius: !isUser ? '4px' : '16px',
              borderTopRightRadius: isUser ? '4px' : '16px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.1)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                right: '-1px',
                bottom: '-1px',
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                borderRadius: '16px',
                zIndex: -1,
              },
            }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: isDarkMode ? '#f8fafc' : currentTheme.text.primary,
                fontWeight: isUser ? 500 : 400,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              }}
            >
              {message.content}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(30,41,59,0.6)',
                display: 'block',
                mt: 1,
                textAlign: 'right',
                fontSize: '11px',
              }}
            >
              {formatTime(message.timestamp)}
            </Typography>
          </Box>
        </Box>

        {isUser && (
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${currentTheme.success} 0%, ${currentTheme.success} 100%)`, 
            width: 32, 
            height: 32,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <UserIcon sx={{ color: '#ffffff', fontSize: '18px' }} />
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`, 
              width: 32, 
              height: 32,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}>
              <BotIcon sx={{ color: '#ffffff', fontSize: '18px' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                AI Assistant
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
                label={`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            
            <IconButton size="small" onClick={handleClearChat} disabled={messages.length === 0}>
              <ClearIcon />
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
          p: 2,
          backgroundColor: isDarkMode ? '#0f0f1e' : currentTheme.background,
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
            gap={2}
          >
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`, 
              width: 64, 
              height: 64,
              boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)'
            }}>
              <BotIcon sx={{ color: '#ffffff', fontSize: '32px' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">
              Welcome to AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFiles.length > 0
                ? `Ask questions about your ${selectedFiles.length} selected document${selectedFiles.length > 1 ? 's' : ''}`
                : 'Select documents or ask general questions'}
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(renderMessage)}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, alignItems: 'flex-start', gap: 1 }}>
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`, 
                  width: 32, 
                  height: 32,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                }}>
                  <BotIcon sx={{ color: '#ffffff', fontSize: '18px' }} />
                </Avatar>
                <Box
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                    border: '2px solid',
                    borderColor: currentTheme.primary,
                    borderRadius: '16px',
                    borderTopLeftRadius: '4px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.1)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '-1px',
                      left: '-1px',
                      right: '-1px',
                      bottom: '-1px',
                      background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                      borderRadius: '16px',
                      zIndex: -1,
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      <Paper elevation={2} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="flex-end" gap={1}>
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
            size="small"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : currentTheme.surface,
                borderRadius: '12px',
                '& input, & textarea': {
                  color: isDarkMode ? '#f8fafc' : currentTheme.text.primary,
                  fontSize: '14px',
                  fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
                },
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(124, 58, 237, 0.2)',
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
                  '& fieldset': {
                    borderColor: currentTheme.primary,
                  },
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(124, 58, 237, 0.25)',
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
              p: 1,
              background: isLoading || !inputValue.trim() 
                ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' 
                : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
              color: 'white',
              borderRadius: '12px',
              boxShadow: isLoading || !inputValue.trim() 
                ? 'none' 
                : '0 8px 25px rgba(124, 58, 237, 0.4)',
              '&:hover': {
                background: isLoading || !inputValue.trim() 
                  ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' 
                  : `linear-gradient(135deg, ${currentTheme.secondary} 0%, ${currentTheme.primary} 100%)`,
                transform: isLoading || !inputValue.trim() ? 'none' : 'translateY(-2px)',
                boxShadow: isLoading || !inputValue.trim() 
                  ? 'none' 
                  : '0 12px 30px rgba(124, 58, 237, 0.5)',
              },
            }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>

        {selectedFiles.length === 0 && (
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 Select documents from the file browser to ask specific questions about them, 
              or ask general questions without selecting any files.
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};