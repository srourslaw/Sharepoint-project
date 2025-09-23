import { ChatMessage } from '../types';

export interface AIResponse {
  content: string;
  confidence: number;
  sourceReferences?: Array<{
    fileId: string;
    fileName: string;
    snippet: string;
    confidence: number;
    relevanceScore: number;
  }>;
}

class AIService {
  private baseUrl: string;

  constructor() {
    // Use backend API instead of direct OpenAI/Gemini calls
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3001';
  }

  /**
   * Start a chat session with document analysis
   */
  async startChatSession(documentIds: string[], title?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          documentIds,
          title: title || 'Document Chat'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to start chat session:', error);
      throw error;
    }
  }

  /**
   * Send a message to an existing chat session
   */
  async sendChatMessage(sessionId: string, message: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert backend response to AIResponse format
      return {
        content: data.data?.message?.content || 'No response received',
        confidence: 0.9,
        sourceReferences: [] // Could be enhanced with actual source references
      };
    } catch (error) {
      console.error('Failed to send chat message:', error);

      // Return user-friendly error message
      return {
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        confidence: 0.0,
        sourceReferences: undefined
      };
    }
  }

  /**
   * Send message with document analysis (simplified interface)
   */
  async sendMessage(message: string, documentIds?: string[], useOpenAI = true): Promise<AIResponse> {
    try {
      if (!documentIds || documentIds.length === 0) {
        // Simple message without documents
        return {
          content: "Please select a document to analyze before asking questions.",
          confidence: 0.0,
          sourceReferences: undefined
        };
      }

      // Start a chat session with the documents
      const sessionData = await this.startChatSession(documentIds, 'Quick Analysis');
      const sessionId = sessionData.data?.sessionId;

      if (!sessionId) {
        throw new Error('Failed to create chat session');
      }

      // Send the message to the session
      return await this.sendChatMessage(sessionId, message);

    } catch (error) {
      console.error('AI service error:', error);

      return {
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        confidence: 0.0,
        sourceReferences: undefined
      };
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async sendMessageToOpenAI(message: string, documentContext?: string, selectedFileName = 'Selected Document'): Promise<AIResponse> {
    // Use the unified sendMessage method
    return this.sendMessage(message, documentContext ? ['document-context'] : []);
  }

  async sendMessageToGemini(message: string, documentContext?: string, selectedFileName = 'Selected Document'): Promise<AIResponse> {
    // Use the unified sendMessage method
    return this.sendMessage(message, documentContext ? ['document-context'] : []);
  }

  /**
   * Summarize documents using backend API
   */
  async summarizeDocuments(documentIds: string[], summaryType = 'abstractive', length = 'medium') {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          documentIds,
          summaryType,
          length
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to summarize documents:', error);
      throw error;
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/models`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get AI models:', error);
      return { data: [] };
    }
  }

  /**
   * Health check for AI services
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/health`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export const aiService = new AIService();