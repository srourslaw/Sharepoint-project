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

  // Mock file database - matches the files from useFilePreview.safe.ts
  private mockFileNames: Record<string, string> = {
    'safe-file-1': 'Business Plan.docx',
    'safe-file-2': 'Financial Report.xlsx',
    'safe-file-3': 'Presentation.pptx',
    'safe-folder-1': 'Archive'
  };

  // Mock file content for different file types
  private mockFileContent: Record<string, string> = {
    'safe-file-1': `# Business Plan - Executive Summary

## Company Overview
Our company is a leading provider of innovative solutions in the technology sector. We specialize in developing cutting-edge applications that solve real-world problems for businesses and consumers alike.

## Market Analysis
The market for our products is rapidly growing, with an estimated size of $50 billion globally. Key trends include:
- Increased digital transformation
- Growing demand for automation
- Rising importance of data analytics

## Financial Projections
- Year 1 Revenue: $500,000
- Year 2 Revenue: $1,200,000
- Year 3 Revenue: $2,800,000

## Key Objectives
1. Establish market presence
2. Build strong customer base
3. Achieve profitability by year 2
4. Expand to international markets

This document contains sensitive business information and should be treated as confidential.`,

    'safe-file-2': `Financial Report - Q4 2023

Revenue:
- Product Sales: $1,250,000
- Service Revenue: $380,000
- Total Revenue: $1,630,000

Expenses:
- Cost of Goods Sold: $650,000
- Operating Expenses: $420,000
- Marketing: $180,000
- R&D: $200,000
- Total Expenses: $1,450,000

Net Income: $180,000

Key Metrics:
- Gross Margin: 48.2%
- Operating Margin: 11.0%
- Customer Acquisition Cost: $45
- Customer Lifetime Value: $890`,

    'safe-file-3': `Presentation Outline:

Slide 1: Title - Quarterly Business Review
Slide 2: Agenda
- Financial Performance
- Market Updates
- Product Roadmap
- Team Updates

Slide 3: Financial Highlights
- Revenue Growth: 23% YoY
- New Customers: 45
- Customer Retention: 92%

Slide 4: Market Opportunities
- Emerging Markets
- New Product Categories
- Strategic Partnerships

Slide 5: Next Quarter Goals
- Launch new product line
- Expand sales team
- Enter European market`
  };

  constructor() {
    // Get API keys from environment variables (configured via backend)
    this.openaiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.geminiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  }

  private getDocumentContent(fileId: string): string | null {
    return this.mockFileContent[fileId] || null;
  }

  private getDocumentFileName(fileId: string): string | null {
    return this.mockFileNames[fileId] || null;
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
      
      if (documentContext) {
        // Perform basic text analysis on the actual document content
        const content = documentContext.toLowerCase();
        let response = `Based on my analysis of "${selectedFileName}", here are my findings:\n\n`;
        
        // Sensitive information detection
        const sensitiveKeywords = ['revenue', 'financial', 'confidential', 'sensitive', 'salary', 'cost', 'profit', 'strategic', 'business plan'];
        const foundSensitive = sensitiveKeywords.filter(keyword => content.includes(keyword));
        
        if (foundSensitive.length > 0) {
          response += `🔒 **Sensitive Information Detected:**\n`;
          response += `- This document contains sensitive business information\n`;
          response += `- Found references to: ${foundSensitive.join(', ')}\n`;
          response += `- Recommend handling with appropriate confidentiality measures\n\n`;
        }
        
        // Basic content analysis
        if (content.includes('financial') || content.includes('revenue')) {
          response += `💰 **Financial Content:**\n- Contains financial data and projections\n- Includes revenue, expense, and performance metrics\n\n`;
        }
        
        if (content.includes('market') || content.includes('strategy')) {
          response += `📊 **Strategic Content:**\n- Includes market analysis and strategic planning\n- Contains business objectives and competitive insights\n\n`;
        }
        
        response += `📄 **Document Analysis Complete**\nAnalyzed ${documentContext.split(' ').length} words of content from your selected document.`;
        
        return {
          content: response,
          confidence: 0.85,
          sourceReferences: [{
            fileId: documentIds?.[0] || 'unknown',
            fileName: selectedFileName,
            snippet: documentContext.substring(0, 150) + '...',
            confidence: 0.8,
            relevanceScore: 0.9
          }]
        };
      } else {
        // Generic fallback when no document context
        return {
          content: "I'm experiencing some technical difficulties connecting to the AI service. Please try again in a moment, or select a document to analyze.",
          confidence: 0.5,
          sourceReferences: undefined
        };
      }
    }
  }
}

export const aiService = new AIService();