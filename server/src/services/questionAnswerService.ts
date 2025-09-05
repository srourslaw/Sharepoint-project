import { GeminiService } from './geminiService';
import {
  QuestionAnswerRequest,
  QuestionAnswerResult,
  AnswerType,
  SourceReference,
  GeminiRequest,
  GeminiError,
  GeminiErrorCode,
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ChatSession
} from '../types/gemini';

/**
 * Question-answering service using Gemini AI
 */
export class QuestionAnswerService {
  private geminiService: GeminiService;
  private chatSessions: Map<string, ChatSession> = new Map();
  private qaPromptTemplates: Map<string, string> = new Map();

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.initializePromptTemplates();
  }

  /**
   * Initialize prompt templates
   */
  private initializePromptTemplates(): void {
    this.qaPromptTemplates.set('factual', `
You are an expert document analyst. Answer the question based strictly on the provided context.

Context:
{{CONTEXT}}

Question: {{QUESTION}}

Instructions:
- Answer only based on the provided context
- If the answer is not in the context, say "I cannot find this information in the provided document"
- Be concise but complete
- Include specific details from the context when relevant
- Indicate your confidence level (high/medium/low)

Provide your response in JSON format:
{
  "answer": "Your answer here",
  "confidence": "high",
  "answerType": "factual",
  "sourceReferences": [
    {"text": "relevant quote", "startIndex": 100, "endIndex": 150, "relevance": 0.9}
  ],
  "explanation": "Brief explanation of reasoning"
}
`);

    this.qaPromptTemplates.set('detailed', `
You are a comprehensive document analyst. Provide a detailed answer to the question based on the context.

Context:
{{CONTEXT}}

Question: {{QUESTION}}

Instructions:
- Provide a comprehensive answer with background information
- Include relevant examples from the context
- Explain the reasoning behind your answer
- Suggest related questions the user might want to ask
- Indicate areas where more information might be helpful

Format as JSON:
{
  "answer": "Detailed answer with explanations",
  "confidence": "high",
  "answerType": "explanation",
  "sourceReferences": [...],
  "explanation": "Detailed reasoning",
  "relatedQuestions": ["Related question 1", "Related question 2"]
}
`);

    this.qaPromptTemplates.set('brief', `
Based on the provided context, give a brief, direct answer to the question.

Context: {{CONTEXT}}

Question: {{QUESTION}}

Respond in JSON:
{
  "answer": "Brief direct answer",
  "confidence": "medium",
  "answerType": "factual"
}
`);

    this.qaPromptTemplates.set('comparison', `
Compare and analyze the aspects mentioned in the question using the provided context.

Context:
{{CONTEXT}}

Question: {{QUESTION}}

Provide a comparative analysis in JSON format:
{
  "answer": "Comparative analysis",
  "confidence": "high",
  "answerType": "comparison",
  "sourceReferences": [...],
  "explanation": "Comparison methodology and findings"
}
`);
  }

  /**
   * Answer a question based on document context
   */
  async answerQuestion(request: QuestionAnswerRequest): Promise<QuestionAnswerResult> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateQARequest(request);

      // Determine answer format and select appropriate prompt
      const promptTemplate = this.selectPromptTemplate(request);
      const prompt = this.buildQAPrompt(promptTemplate, request);

      // Make request to Gemini
      const geminiRequest: GeminiRequest = {
        prompt,
        maxTokens: this.getMaxTokensForQA(request.options.answerFormat),
        temperature: 0.2, // Lower temperature for more consistent answers
        sessionId: request.sessionId || `qa_${Date.now()}`
      };

      const geminiResponse = await this.geminiService.generateText(geminiRequest);

      // Parse the response
      const result = await this.parseQAResponse(
        geminiResponse.text,
        request.question
      );

      // Add metadata
      result.timestamp = new Date().toISOString();

      return result;

    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      throw new GeminiError(
        GeminiErrorCode.UNKNOWN_ERROR,
        `Question answering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Start or continue a chat session
   */
  async chatWithDocument(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    let session: ChatSession;

    try {
      // Get or create chat session
      if (request.sessionId && this.chatSessions.has(request.sessionId)) {
        session = this.chatSessions.get(request.sessionId)!;
      } else {
        session = this.createChatSession(request.sessionId, request.context);
      }

      // Add user message to session
      const userMessage: ChatMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date()
      };
      session.messages.push(userMessage);
      session.updatedAt = new Date();

      // Build chat prompt with context and history
      const prompt = this.buildChatPrompt(session, request);

      // Make request to Gemini
      const geminiRequest: GeminiRequest = {
        prompt,
        maxTokens: request.options.maxTokens || 1000,
        temperature: request.options.temperature || 0.3,
        sessionId: session.sessionId
      };

      const geminiResponse = await this.geminiService.generateText(geminiRequest);

      // Add assistant message to session
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: geminiResponse.text,
        timestamp: new Date()
      };
      session.messages.push(assistantMessage);
      session.updatedAt = new Date();

      // Generate suggestions for follow-up questions
      const suggestions = await this.generateFollowUpSuggestions(
        session.messages.slice(-3), // Last 3 messages
        session.context
      );

      // Build response
      const response: ChatResponse = {
        message: assistantMessage,
        sessionId: session.sessionId,
        totalTokens: geminiResponse.tokenCount.totalTokens,
        responseTime: Date.now() - startTime,
        suggestions,
        context: session.context
      };

      // Update session title if it's the first exchange
      if (session.messages.length === 2 && !session.title) {
        session.title = this.generateSessionTitle(request.message);
      }

      // Save session
      this.chatSessions.set(session.sessionId, session);

      return response;

    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      throw new GeminiError(
        GeminiErrorCode.UNKNOWN_ERROR,
        `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get chat session
   */
  getChatSession(sessionId: string): ChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  /**
   * List user's chat sessions
   */
  listChatSessions(userId?: string): ChatSession[] {
    const sessions = Array.from(this.chatSessions.values());
    
    if (userId) {
      return sessions.filter(session => session.userId === userId);
    }
    
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Delete chat session
   */
  deleteChatSession(sessionId: string): boolean {
    return this.chatSessions.delete(sessionId);
  }

  /**
   * Multi-document question answering
   */
  async answerFromMultipleDocuments(
    question: string,
    documents: Array<{ text: string; title?: string; source?: string }>,
    options: { maxAnswerLength?: number; includeSourceReferences?: boolean } = {}
  ): Promise<QuestionAnswerResult> {
    // Combine documents with source attribution
    const combinedContext = documents
      .map((doc, index) => `
Document ${index + 1}${doc.title ? ` (${doc.title})` : ''}:
${doc.text.substring(0, 2000)}
${doc.source ? `Source: ${doc.source}` : ''}
      `)
      .join('\n\n---\n\n');

    const request: QuestionAnswerRequest = {
      question,
      context: combinedContext,
      options: {
        maxAnswerLength: options.maxAnswerLength || 500,
        includeConfidence: true,
        includeExplanation: true,
        answerFormat: 'detailed'
      }
    };

    const result = await this.answerQuestion(request);

    // Enhanced source references for multi-document context
    if (options.includeSourceReferences && result.sourceReferences) {
      result.sourceReferences = result.sourceReferences.map(ref => {
        // Try to determine which document the reference came from
        const documentMatch = combinedContext.substring(0, ref.startIndex).match(/Document (\d+)/g);
        if (documentMatch) {
          const docIndex = parseInt(documentMatch[documentMatch.length - 1].replace('Document ', '')) - 1;
          if (documents[docIndex]) {
            (ref as any).documentTitle = documents[docIndex].title;
            (ref as any).documentSource = documents[docIndex].source;
          }
        }
        return ref;
      });
    }

    return result;
  }

  /**
   * Validate QA request
   */
  private validateQARequest(request: QuestionAnswerRequest): void {
    if (!request.question || request.question.trim().length === 0) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Question is required',
        400
      );
    }

    if (!request.context || request.context.trim().length === 0) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Context document is required',
        400
      );
    }

    if (request.context.length > 50000) { // 50K characters limit
      throw new GeminiError(
        GeminiErrorCode.CONTEXT_TOO_LONG,
        'Context document is too long (max 50,000 characters)',
        400
      );
    }
  }

  /**
   * Select appropriate prompt template
   */
  private selectPromptTemplate(request: QuestionAnswerRequest): string {
    const question = request.question.toLowerCase();

    // Detect question type and select appropriate template
    if (question.includes('compare') || question.includes('difference') || question.includes('versus')) {
      return this.qaPromptTemplates.get('comparison')!;
    }

    switch (request.options.answerFormat) {
      case 'brief':
        return this.qaPromptTemplates.get('brief')!;
      case 'detailed':
        return this.qaPromptTemplates.get('detailed')!;
      default:
        return this.qaPromptTemplates.get('factual')!;
    }
  }

  /**
   * Build QA prompt
   */
  private buildQAPrompt(template: string, request: QuestionAnswerRequest): string {
    return template
      .replace('{{CONTEXT}}', request.context)
      .replace('{{QUESTION}}', request.question);
  }

  /**
   * Get max tokens for QA format
   */
  private getMaxTokensForQA(format: string = 'brief'): number {
    const tokenLimits = {
      brief: 200,
      detailed: 800,
      bullet_points: 400
    };

    return tokenLimits[format as keyof typeof tokenLimits] || 400;
  }

  /**
   * Parse QA response
   */
  private async parseQAResponse(
    responseText: string,
    question: string
  ): Promise<QuestionAnswerResult> {
    try {
      // Clean and extract JSON
      const cleanedText = responseText.trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Fallback: treat entire response as answer
        return {
          question,
          answer: cleanedText,
          confidence: 0.5,
          answerType: AnswerType.FACTUAL,
          timestamp: ''
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        question,
        answer: parsed.answer || cleanedText,
        confidence: this.parseConfidence(parsed.confidence),
        explanation: parsed.explanation,
        sourceReferences: parsed.sourceReferences || [],
        relatedQuestions: parsed.relatedQuestions || [],
        answerType: this.parseAnswerType(parsed.answerType),
        timestamp: ''
      };

    } catch (error) {
      // Fallback response
      return {
        question,
        answer: responseText,
        confidence: 0.5,
        answerType: AnswerType.FACTUAL,
        timestamp: ''
      };
    }
  }

  /**
   * Parse confidence level
   */
  private parseConfidence(confidence: string | number): number {
    if (typeof confidence === 'number') {
      return Math.max(0, Math.min(1, confidence));
    }

    const confidenceMap: { [key: string]: number } = {
      'high': 0.8,
      'medium': 0.6,
      'low': 0.4
    };

    return confidenceMap[confidence?.toLowerCase()] || 0.5;
  }

  /**
   * Parse answer type
   */
  private parseAnswerType(type: string): AnswerType {
    const normalizedType = type?.toLowerCase();
    
    switch (normalizedType) {
      case 'factual': return AnswerType.FACTUAL;
      case 'opinion': return AnswerType.OPINION;
      case 'definition': return AnswerType.DEFINITION;
      case 'explanation': return AnswerType.EXPLANATION;
      case 'comparison': return AnswerType.COMPARISON;
      case 'procedure': return AnswerType.PROCEDURE;
      default: return AnswerType.FACTUAL;
    }
  }

  /**
   * Create new chat session
   */
  private createChatSession(sessionId?: string, context?: string): ChatSession {
    const session: ChatSession = {
      sessionId: sessionId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messages: [],
      context,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add system message if context is provided
    if (context) {
      session.messages.push({
        role: 'system',
        content: `You are helping the user understand and ask questions about the following document:\n\n${context.substring(0, 1000)}...`,
        timestamp: new Date()
      });
    }

    return session;
  }

  /**
   * Build chat prompt with history and context
   */
  private buildChatPrompt(session: ChatSession, request: ChatRequest): string {
    let prompt = '';

    // Add system prompt
    if (request.options.systemPrompt) {
      prompt += `System: ${request.options.systemPrompt}\n\n`;
    } else if (session.context) {
      prompt += `You are an AI assistant helping users understand and ask questions about a document. Always base your responses on the provided document context.\n\n`;
      prompt += `Document Context:\n${session.context.substring(0, 2000)}...\n\n`;
    }

    // Add conversation history (last 5 exchanges to manage context length)
    const recentMessages = request.options.includeHistory ? session.messages.slice(-10) : [];
    for (const message of recentMessages) {
      if (message.role !== 'system') {
        const role = message.role === 'user' ? 'Human' : 'Assistant';
        prompt += `${role}: ${message.content}\n\n`;
      }
    }

    prompt += `Human: ${request.message}\n\nAssistant:`;

    return prompt;
  }

  /**
   * Generate follow-up question suggestions
   */
  private async generateFollowUpSuggestions(
    recentMessages: ChatMessage[],
    context?: string
  ): Promise<string[]> {
    if (recentMessages.length === 0) {
      return [];
    }

    const lastExchange = recentMessages.slice(-2);
    const prompt = `
Based on this conversation exchange, suggest 3 relevant follow-up questions the user might want to ask about the document.

Recent conversation:
${lastExchange.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond with a JSON array of questions:
["Question 1", "Question 2", "Question 3"]
`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 200,
        temperature: 0.4
      });

      const suggestions = JSON.parse(response.text);
      return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    } catch (error) {
      // Fallback suggestions
      return [
        "Can you explain more about this topic?",
        "What are the key points I should remember?",
        "Are there any related concepts I should know about?"
      ];
    }
  }

  /**
   * Generate session title from first message
   */
  private generateSessionTitle(firstMessage: string): string {
    // Simple title generation - take first few words
    const words = firstMessage.split(/\s+/).slice(0, 6);
    let title = words.join(' ');
    
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'Chat Session';
  }

  /**
   * Cleanup old chat sessions
   */
  cleanupOldSessions(maxAgeHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.chatSessions.entries()) {
      if (session.updatedAt < cutoffTime) {
        sessionsToDelete.push(sessionId);
      }
    }

    sessionsToDelete.forEach(sessionId => {
      this.chatSessions.delete(sessionId);
    });

    return sessionsToDelete.length;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    averageSessionLength: number;
  } {
    const sessions = Array.from(this.chatSessions.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const activeSessions = sessions.filter(s => s.updatedAt > oneHourAgo).length;
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const averageSessionLength = sessions.length > 0 ? totalMessages / sessions.length : 0;

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalMessages,
      averageSessionLength: Math.round(averageSessionLength * 10) / 10
    };
  }
}