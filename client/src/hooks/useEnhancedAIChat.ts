import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChatSession, 
  ChatMessage, 
  QuickAction, 
  ChatAttachment,
  ChatExportOptions,
  ApiResponse 
} from '../types';
import { api } from '../services/api';
import { aiService } from '../services/aiService';

interface SendMessageRequest {
  content?: string;
  documentIds?: string[];
  attachments?: ChatAttachment[];
  actionType?: string;
  parameters?: any;
  includeContext?: boolean;
  streamResponse?: boolean;
}

interface UseEnhancedAIChatReturn {
  session: ChatSession | null;
  messages: ChatMessage[];
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  uploadFile: (file: File) => Promise<ChatAttachment>;
  exportChat: (options: ChatExportOptions) => Promise<void>;
  clearChat: () => Promise<void>;
  loading: boolean;
  typing: boolean;
  error: string | null;
  quickActions: QuickAction[];
  retryLastMessage: () => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
}

export const useEnhancedAIChat = (initialSessionId?: string): UseEnhancedAIChatReturn => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  
  const lastMessageRef = useRef<SendMessageRequest | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session or load existing one
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    } else {
      setSession(null);
      setMessages([]);
    }
  }, [initialSessionId]);

  // Load quick actions
  useEffect(() => {
    loadQuickActions();
  }, []);

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<ChatSession>>(`/api/ai/chat/session/${sessionId}`);
      
      if (response.data.success && response.data.data) {
        const sessionData = response.data.data;
        setSession(sessionData);
        setMessages(sessionData.messages || []);
      } else {
        throw new Error('Failed to load session');
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError('Failed to load chat session');
    } finally {
      setLoading(false);
    }
  };

  const loadQuickActions = async () => {
    try {
      const response = await api.get<ApiResponse<QuickAction[]>>('/api/ai/quick-actions');
      
      if (response.data.success && response.data.data) {
        setQuickActions(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load quick actions:', err);
      // Use mock data when API fails
      setQuickActions([
        {
          id: 'summarize',
          label: 'Summarize Document',
          prompt: 'Please provide a summary of this document',
          icon: 'summary',
          category: 'summary',
          requiresDocuments: true
        },
        {
          id: 'analyze',
          label: 'Analyze Content',
          prompt: 'Please analyze the key themes and insights in this content',
          icon: 'analytics',
          category: 'analysis',
          requiresDocuments: true
        },
        {
          id: 'extract',
          label: 'Extract Key Points',
          prompt: 'Extract the main points and action items from this document',
          icon: 'list',
          category: 'extraction',
          requiresDocuments: true
        }
      ]);
    }
  };

  const startTypingIndicator = () => {
    setTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a maximum typing duration
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 30000); // 30 seconds max
  };

  const stopTypingIndicator = () => {
    setTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<void> => {
    // Defensive check for undefined content
    const content = request.content || '';
    if (!content.trim() && (!request.attachments || request.attachments.length === 0)) {
      return;
    }
    
    // Update the request object with safe content
    const safeRequest = { ...request, content: content.trim() };

    setError(null);
    setLoading(true);
    lastMessageRef.current = safeRequest;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: safeRequest.content,
      timestamp: new Date().toISOString(),
      attachments: safeRequest.attachments,
      messageType: 'text',
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Check if we have documents to analyze
      const hasDocuments = safeRequest.documentIds && safeRequest.documentIds.length > 0;
      
      if (hasDocuments) {
        // Initialize session for document-based chat
        let sessionId = session?.id;
        if (!sessionId) {
          const initResponse = await api.post<ApiResponse<{ sessionId: string; session: ChatSession }>>('/api/ai/chat/start', {
            documentIds: safeRequest.documentIds,
            title: safeRequest.content.substring(0, 100) || 'Chat Session',
          });

          if (initResponse.data.success && initResponse.data.data) {
            sessionId = initResponse.data.data.sessionId;
            setSession(initResponse.data.data.session);
          } else {
            throw new Error('Failed to initialize chat session');
          }
        }

        startTypingIndicator();

        // Send message to AI for document-based chat
        const messageResponse = await api.post<ApiResponse<{
          message: ChatMessage;
          sessionUpdated: ChatSession;
        }>>('/api/ai/chat/message', {
          sessionId,
          message: safeRequest.content,
          documentIds: safeRequest.documentIds,
          attachments: safeRequest.attachments?.map(att => att.id),
          actionType: safeRequest.actionType,
          parameters: safeRequest.parameters,
          includeContext: safeRequest.includeContext ?? true,
          streamResponse: safeRequest.streamResponse ?? false,
        });

        stopTypingIndicator();

        if (messageResponse.data.success && messageResponse.data.data) {
          const { message: aiMessage, sessionUpdated } = messageResponse.data.data;
          
          setMessages(prev => [...prev, aiMessage]);
          setSession(sessionUpdated);
        } else {
          throw new Error(messageResponse.data.error?.message || 'Failed to get AI response');
        }
      } else {
        // General chat without documents - use gemini endpoint
        startTypingIndicator();
        
        const geminiResponse = await api.post('/api/gemini/chat', {
          message: safeRequest.content,
          options: {
            temperature: 0.7,
            maxTokens: 1000
          }
        });

        stopTypingIndicator();

        if (geminiResponse.data.success) {
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: geminiResponse.data.data.text || geminiResponse.data.data,
            timestamp: new Date().toISOString(),
            messageType: 'text',
            confidence: 0.9
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Create mock session for general chat
          if (!session) {
            setSession({
              id: `general-session-${Date.now()}`,
              title: 'General Chat',
              messages: [],
              documentIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalMessages: 0
            });
          }
        } else {
          throw new Error('Failed to get AI response for general chat');
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      stopTypingIndicator();
      
      // Show error message instead of fallback
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        messageType: 'text',
        confidence: 0.5
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const uploadFile = useCallback(async (file: File): Promise<ChatAttachment> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<ChatAttachment>>('/api/ai/upload/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      throw new Error(err.response?.data?.error?.message || 'File upload failed');
    }
  }, []);

  const exportChat = useCallback(async (options: ChatExportOptions): Promise<void> => {
    if (!session) {
      throw new Error('No active session to export');
    }

    try {
      setLoading(true);
      
      const response = await api.post('/api/ai/chat/export', {
        sessionId: session.id,
        ...options,
      }, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const extension = options.format === 'json' ? '.json' :
                       options.format === 'txt' ? '.txt' :
                       options.format === 'markdown' ? '.md' :
                       options.format === 'html' ? '.html' :
                       options.format === 'pdf' ? '.pdf' : '.txt';
      
      const filename = `chat_export_${session.id}_${new Date().toISOString().split('T')[0]}${extension}`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting chat:', err);
      throw new Error(err.response?.data?.error?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const clearChat = useCallback(async (): Promise<void> => {
    try {
      if (session) {
        await api.delete(`/api/ai/chat/session/${session.id}`);
      }
      
      setSession(null);
      setMessages([]);
      setError(null);
      lastMessageRef.current = null;
    } catch (err: any) {
      console.error('Error clearing chat:', err);
      setError('Failed to clear chat');
    }
  }, [session]);

  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (!lastMessageRef.current) {
      setError('No message to retry');
      return;
    }

    // Remove the last AI response if it exists
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  const regenerateResponse = useCallback(async (messageId: string): Promise<void> => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (message.role !== 'assistant') return;

    // Find the user message that triggered this response
    const userMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.role === 'user');

    if (!userMessage) return;

    // Remove the AI response
    setMessages(prev => prev.filter(m => m.id !== messageId));

    // Regenerate response
    await sendMessage({
      content: userMessage.content,
      documentIds: session?.documentIds,
      attachments: userMessage.attachments,
      includeContext: true,
    });
  }, [messages, session, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
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
    retryLastMessage,
    regenerateResponse,
  };
};