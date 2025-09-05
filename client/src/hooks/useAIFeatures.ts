import { useState, useEffect } from 'react';
import { 
  ChatSession, 
  ChatMessage, 
  SummarizationRequest, 
  SummarizationResult,
  ApiResponse 
} from '../types';
import { api } from '../services/api';

interface EnhancedChatRequest {
  message: string;
  documentIds: string[];
  sessionId?: string;
  includeContext?: boolean;
  streamResponse?: boolean;
  contextWindow?: number;
}

interface EnhancedChatResponse {
  sessionId: string;
  message: ChatMessage;
  sourceReferences?: string[];
  confidence?: number;
  processingTime: number;
}

interface DocumentSummarizationRequest extends SummarizationRequest {
  documentIds: string[];
}

interface UseAIFeaturesReturn {
  chatSession: ChatSession | null;
  sendMessage: (request: EnhancedChatRequest) => Promise<void>;
  summarizeDocuments: (request: DocumentSummarizationRequest) => Promise<SummarizationResult>;
  translateContent: (content: string, targetLanguage: string) => Promise<any>;
  analyzeContent: (content: string, analysisType: string) => Promise<any>;
  extractContent: (content: string, extractionTypes: string[]) => Promise<any>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAIFeatures = (): UseAIFeaturesReturn => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const initializeChatSession = async (documentIds: string[]): Promise<string> => {
    try {
      const response = await api.post<ApiResponse<{ sessionId: string; session: ChatSession }>>(
        '/api/ai/chat/start',
        { documentIds }
      );

      if (response.data.success && response.data.data) {
        const { sessionId, session } = response.data.data;
        setChatSession(session);
        return sessionId;
      } else {
        throw new Error(response.data.error?.message || 'Failed to start chat session');
      }
    } catch (err: any) {
      console.error('Error initializing chat session:', err);
      throw new Error(err.response?.data?.error?.message || 'Failed to start chat session');
    }
  };

  const sendMessage = async (request: EnhancedChatRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      let sessionId = request.sessionId;

      // Initialize session if needed
      if (!sessionId) {
        sessionId = await initializeChatSession(request.documentIds);
      }

      const response = await api.post<ApiResponse<EnhancedChatResponse>>(
        '/api/ai/chat/message',
        {
          sessionId,
          message: request.message,
          includeContext: request.includeContext ?? true,
          streamResponse: request.streamResponse ?? false,
          contextWindow: request.contextWindow,
        }
      );

      if (response.data.success && response.data.data) {
        const chatResponse = response.data.data;
        
        // Update session with new message
        setChatSession(prev => {
          if (!prev) return null;
          
          const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: request.message,
            timestamp: new Date().toISOString(),
          };

          return {
            ...prev,
            messages: [...prev.messages, userMessage, chatResponse.message],
            updatedAt: new Date().toISOString(),
          };
        });
      } else {
        throw new Error(response.data.error?.message || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error?.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const summarizeDocuments = async (request: DocumentSummarizationRequest): Promise<SummarizationResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<SummarizationResult>>(
        '/api/ai/summarize',
        {
          documentIds: request.documentIds,
          summaryType: request.summaryType,
          length: request.length,
          includeKeywords: request.includeKeywords,
          includeMetrics: request.includeMetrics,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to summarize documents');
      }
    } catch (err: any) {
      console.error('Error summarizing documents:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to summarize documents';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const translateContent = async (content: string, targetLanguage: string): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<any>>('/api/ai/translate', {
        text: content,
        targetLanguage,
        style: 'natural',
        includeConfidence: true,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to translate content');
      }
    } catch (err: any) {
      console.error('Error translating content:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to translate content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async (content: string, analysisType: string): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<any>>('/api/ai/sentiment', {
        text: content,
        analysisTypes: [analysisType],
        includeEmotionalTone: true,
        includeConfidence: true,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to analyze content');
      }
    } catch (err: any) {
      console.error('Error analyzing content:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to analyze content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractContent = async (content: string, extractionTypes: string[]): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<ApiResponse<any>>('/api/ai/extract', {
        text: content,
        extractionTypes,
        includeConfidence: true,
        outputFormat: 'json',
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to extract content');
      }
    } catch (err: any) {
      console.error('Error extracting content:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to extract content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    chatSession,
    sendMessage,
    summarizeDocuments,
    translateContent,
    analyzeContent,
    extractContent,
    loading,
    error,
    clearError,
  };
};