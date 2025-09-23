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
  private openaiKey: string;
  private geminiKey: string;

  // Mock file database has been removed - this service now relies on real SharePoint files

  // Mock file content has been removed - this service now relies on real SharePoint file content

  constructor() {
    // Get API keys from environment variables (configured via backend)
    this.openaiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.geminiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  }

  private getDocumentContent(fileId: string): string | null {
    // Mock data has been removed - this should now fetch real content from SharePoint
    return null;
  }

  private getDocumentFileName(fileId: string): string | null {
    // Mock data has been removed - this should now fetch real file names from SharePoint
    return null;
  }

  async sendMessageToOpenAI(message: string, documentContext?: string, selectedFileName = 'Selected Document'): Promise<AIResponse> {
    try {
      const systemPrompt = documentContext 
        ? `You are an AI assistant helping analyze SharePoint documents. Here is the document context:\n\n${documentContext}\n\nPlease provide helpful insights based on this context and the user's question.`
        : 'You are an AI assistant helping with SharePoint document management and analysis.';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      return {
        content,
        confidence: 0.9,
        sourceReferences: documentContext ? [{
          fileId: 'document-1',
          fileName: selectedFileName,
          snippet: documentContext.substring(0, 150) + '...',
          confidence: 0.85,
          relevanceScore: 0.9
        }] : undefined
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async sendMessageToGemini(message: string, documentContext?: string, selectedFileName = 'Selected Document'): Promise<AIResponse> {
    try {
      const prompt = documentContext 
        ? `Context from SharePoint documents:\n\n${documentContext}\n\nUser question: ${message}\n\nPlease provide a helpful response based on the document context.`
        : message;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I could not generate a response.';

      return {
        content,
        confidence: 0.88,
        sourceReferences: documentContext ? [{
          fileId: 'document-1',
          fileName: selectedFileName,
          snippet: documentContext.substring(0, 150) + '...',
          confidence: 0.8,
          relevanceScore: 0.85
        }] : undefined
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async sendMessage(message: string, documentIds?: string[], useOpenAI = true): Promise<AIResponse> {
    // Create real document context by fetching actual content
    let documentContext: string | undefined;
    let selectedFileName = 'Selected Documents';
    
    if (documentIds?.length) {
      const documentContents = documentIds.map(id => {
        const content = this.getDocumentContent(id);
        const fileName = this.getDocumentFileName(id);
        return content ? `=== ${fileName} ===\n${content}\n` : null;
      }).filter(Boolean);
      
      if (documentContents.length > 0) {
        documentContext = `ACTUAL DOCUMENT CONTENT:\n\n${documentContents.join('\n')}`;
        selectedFileName = this.getDocumentFileName(documentIds[0]) || 'Selected Document';
      }
    }

    try {
      if (useOpenAI) {
        return await this.sendMessageToOpenAI(message, documentContext, selectedFileName);
      } else {
        return await this.sendMessageToGemini(message, documentContext, selectedFileName);
      }
    } catch (error) {
      // Fallback to local analysis if API fails
      console.warn('AI API failed, using fallback analysis:', error);
      
      // Return error message when AI API fails - no mock content
      return {
        content: "AI service is currently unavailable. Please try again in a moment.",
        confidence: 0.0,
        sourceReferences: undefined
      };
    }
  }
}

export const aiService = new AIService();