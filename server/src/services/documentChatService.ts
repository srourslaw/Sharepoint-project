import { EventEmitter } from 'events';
import { GeminiService } from './geminiService';
import { DocumentAnalysisService } from './documentAnalysisService';
import { 
  ChatSession, 
  ChatMessage, 
  ChatRequest, 
  ChatResponse, 
  QuestionAnswerRequest,
  QuestionAnswerResult,
  SourceReference,
  AnswerType,
  StreamingRequest,
  StreamingChunk
} from '../types/gemini';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface DocumentChatContext {
  documentId: string;
  documentName: string;
  content: string;
  summary?: string;
  keywords?: string[];
  entities?: any[];
  lastUpdated: Date;
}

export interface EnhancedChatRequest extends ChatRequest {
  documentIds?: string[];
  includeContext?: boolean;
  searchRelevantContent?: boolean;
  maxContextTokens?: number;
  answerFormat?: 'brief' | 'detailed' | 'bullet_points' | 'conversational';
  includeSourceReferences?: boolean;
  language?: string;
}

export interface EnhancedChatResponse extends ChatResponse {
  sourceReferences?: SourceReference[];
  relevantDocuments?: string[];
  contextUsed?: DocumentChatContext[];
  answerType?: AnswerType;
  relatedQuestions?: string[];
  confidence?: number;
}

export interface ChatSessionMetrics {
  totalMessages: number;
  totalTokensUsed: number;
  averageResponseTime: number;
  documentsReferenced: string[];
  topTopics: string[];
  sessionDuration: number;
}

export class DocumentChatService extends EventEmitter {
  private chatSessions: Map<string, ChatSession> = new Map();
  private documentContexts: Map<string, DocumentChatContext> = new Map();
  private sessionMetrics: Map<string, ChatSessionMetrics> = new Map();

  constructor(
    private geminiService: GeminiService,
    private analysisService: DocumentAnalysisService
  ) {
    super();
  }

  async startChatSession(
    userId: string, 
    documentIds: string[], 
    title?: string
  ): Promise<ChatSession> {
    const sessionId = `chat_${userId}_${Date.now()}`;
    
    // Load document contexts
    const documentContexts: DocumentChatContext[] = [];
    for (const docId of documentIds) {
      const context = this.documentContexts.get(docId);
      if (context) {
        documentContexts.push(context);
      }
    }

    const session: ChatSession = {
      sessionId,
      messages: [],
      context: this.buildInitialContext(documentContexts),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      title: title || `Chat with ${documentIds.length} document(s)`,
      summary: ''
    };

    this.chatSessions.set(sessionId, session);
    this.initializeSessionMetrics(sessionId, documentIds);

    // Send welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello! I'm ready to help you with questions about your ${documentIds.length} document(s). What would you like to know?`,
      timestamp: new Date(),
      metadata: {
        type: 'welcome',
        documentsLoaded: documentIds.length
      }
    };

    session.messages.push(welcomeMessage);
    this.updateSession(sessionId, session);

    this.emit('sessionStarted', { sessionId, userId, documentIds });
    return session;
  }

  async sendMessage(request: EnhancedChatRequest): Promise<EnhancedChatResponse> {
    const startTime = Date.now();
    
    // Sanitize input
    const sanitizedMessage = this.sanitizeInput(request.message);
    
    // Get or create session
    let session = request.sessionId ? this.chatSessions.get(request.sessionId) : null;
    if (!session) {
      throw new Error('Chat session not found. Please start a new session.');
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
      metadata: { 
        originalLength: request.message.length,
        sanitized: sanitizedMessage !== request.message
      }
    };
    session.messages.push(userMessage);

    // Build context for this query
    const queryContext = await this.buildQueryContext(
      sanitizedMessage, 
      session, 
      request
    );

    // Generate response
    const prompt = this.buildChatPrompt(sanitizedMessage, queryContext, request);
    
    try {
      const geminiResponse = await this.geminiService.generateText({
        prompt,
        maxTokens: this.calculateMaxTokens(request.answerFormat || 'conversational'),
        temperature: 1.0, // gpt-5-nano only supports temperature 1.0
        sessionId: session.sessionId
      });

      const parsedResponse = this.parseAssistantResponse(
        geminiResponse.text, 
        queryContext,
        request
      );

      // Add assistant message to session
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: parsedResponse.content,
        timestamp: new Date(),
        metadata: {
          answerType: parsedResponse.answerType,
          confidence: parsedResponse.confidence,
          tokensUsed: geminiResponse.tokenCount?.totalTokens || 0
        }
      };
      session.messages.push(assistantMessage);

      // Update session
      session.updatedAt = new Date();
      this.updateSession(session.sessionId, session);

      const responseTime = Date.now() - startTime;
      this.updateSessionMetrics(session.sessionId, responseTime, geminiResponse.tokenCount?.totalTokens || 0);

      const response: EnhancedChatResponse = {
        message: assistantMessage,
        sessionId: session.sessionId,
        totalTokens: geminiResponse.tokenCount?.totalTokens || 0,
        responseTime,
        sourceReferences: parsedResponse.sourceReferences,
        relevantDocuments: parsedResponse.relevantDocuments,
        contextUsed: queryContext.documents,
        answerType: parsedResponse.answerType,
        relatedQuestions: parsedResponse.relatedQuestions,
        confidence: parsedResponse.confidence,
        suggestions: parsedResponse.suggestions,
        context: session.context
      };

      this.emit('messageProcessed', { sessionId: session.sessionId, response });
      return response;

    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message to session
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try rephrasing or ask a different question.',
        timestamp: new Date(),
        metadata: { error: true, errorType: 'processing_error' }
      };
      session.messages.push(errorMessage);
      this.updateSession(session.sessionId, session);

      throw error;
    }
  }

  async streamMessage(request: EnhancedChatRequest): Promise<EventEmitter> {
    const streamEmitter = new EventEmitter();
    const sanitizedMessage = this.sanitizeInput(request.message);
    
    let session = request.sessionId ? this.chatSessions.get(request.sessionId) : null;
    if (!session) {
      streamEmitter.emit('error', new Error('Chat session not found'));
      return streamEmitter;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    try {
      // Build context
      const queryContext = await this.buildQueryContext(sanitizedMessage, session, request);
      const prompt = this.buildChatPrompt(sanitizedMessage, queryContext, request);

      // Start streaming
      const streamingRequest: StreamingRequest = {
        prompt,
        context: session.context,
        options: {
          temperature: 1.0, // gpt-5-nano only supports temperature 1.0
          maxTokens: this.calculateMaxTokens(request.answerFormat || 'conversational')
        },
        sessionId: session.sessionId
      };

      const geminiStream = await this.geminiService.generateStreamingText(streamingRequest);
      let fullResponse = '';

      geminiStream.emitter.on('chunk', (chunk: StreamingChunk) => {
        fullResponse += chunk.text;
        streamEmitter.emit('chunk', {
          ...chunk,
          sessionId: session!.sessionId,
          messageType: 'assistant'
        });
      });

      geminiStream.emitter.on('complete', () => {
        // Add complete message to session
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date(),
          metadata: { streamed: true }
        };
        session.messages.push(assistantMessage);
        session!.updatedAt = new Date();
        this.updateSession(session!.sessionId, session!);

        streamEmitter.emit('complete', {
          sessionId: session!.sessionId,
          message: assistantMessage,
          context: queryContext
        });
      });

      geminiStream.emitter.on('error', (error: any) => {
        streamEmitter.emit('error', error);
      });

    } catch (error: any) {
      streamEmitter.emit('error', error);
    }

    return streamEmitter;
  }

  async askQuestion(request: QuestionAnswerRequest): Promise<QuestionAnswerResult> {
    const startTime = Date.now();
    const sanitizedQuestion = this.sanitizeInput(request.question);
    const sanitizedContext = this.sanitizeInput(request.context);

    // Build enhanced QA prompt
    const prompt = this.buildQAPrompt(sanitizedQuestion, sanitizedContext, request.options);

    const geminiResponse = await this.geminiService.generateText({
      prompt,
      maxTokens: request.options.maxAnswerLength || 500,
      temperature: 0.4,
      sessionId: request.sessionId || `qa_${Date.now()}`
    });

    const result = this.parseQAResponse(
      geminiResponse.text, 
      sanitizedQuestion, 
      sanitizedContext,
      request.options
    );

    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  }

  async addDocumentToContext(
    sessionId: string, 
    documentId: string, 
    documentName: string, 
    content: string
  ): Promise<void> {
    // Analyze document for better context
    const analysis = await this.analysisService.analyzeDocument({
      text: content,
      analysisType: 'comprehensive' as any,
      options: {
        includeMetrics: true,
        extractEntities: true,
        includeKeywords: true
      }
    });

    const documentContext: DocumentChatContext = {
      documentId,
      documentName,
      content: this.sanitizeInput(content),
      summary: analysis.summary?.text,
      keywords: analysis.keywords?.map(k => k.text) || [],
      entities: analysis.entities || [],
      lastUpdated: new Date()
    };

    this.documentContexts.set(documentId, documentContext);

    // Update session context if it exists
    const session = this.chatSessions.get(sessionId);
    if (session) {
      session.context = this.buildInitialContext([
        ...Array.from(this.documentContexts.values()),
        documentContext
      ]);
      session.updatedAt = new Date();
      this.updateSession(sessionId, session);
    }

    this.emit('documentAdded', { sessionId, documentId, documentName });
  }

  getChatSession(sessionId: string): ChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  getSessionMetrics(sessionId: string): ChatSessionMetrics | undefined {
    return this.sessionMetrics.get(sessionId);
  }

  async summarizeSession(sessionId: string): Promise<string> {
    const session = this.chatSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const conversation = session.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const summaryPrompt = `Summarize this chat conversation, highlighting the main topics discussed and key insights shared:

${conversation}

Provide a concise summary (2-3 sentences) of what was discussed.`;

    const response = await this.geminiService.generateText({
      prompt: summaryPrompt,
      maxTokens: 200,
      temperature: 0.3
    });

    session.summary = response.text;
    this.updateSession(sessionId, session);

    return response.text;
  }

  closeSession(sessionId: string): void {
    const session = this.chatSessions.get(sessionId);
    if (session) {
      this.emit('sessionClosed', { sessionId, duration: Date.now() - session.createdAt.getTime() });
    }
    
    this.chatSessions.delete(sessionId);
    this.sessionMetrics.delete(sessionId);
  }

  private sanitizeInput(text: string): string {
    const sanitized = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    
    return sanitized
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);
  }

  private buildInitialContext(documents: DocumentChatContext[]): string {
    if (documents.length === 0) return '';

    return `Available documents for this chat session:

${documents.map((doc: DocumentChatContext) => `
Document: ${doc.documentName}
Summary: ${doc.summary || 'No summary available'}
Key topics: ${doc.keywords?.slice(0, 5).join(', ') || 'None identified'}
---`).join('\n')}

I can answer questions about these documents, find specific information, make comparisons, and provide insights based on their content.`;
  }

  private async buildQueryContext(
    query: string, 
    session: ChatSession, 
    request: EnhancedChatRequest
  ): Promise<{
    documents: DocumentChatContext[];
    relevantContent: string;
    conversationHistory: string;
  }> {
    const relevantDocs: DocumentChatContext[] = [];
    let relevantContent = '';

    // Get relevant documents
    if (request.documentIds) {
      for (const docId of request.documentIds) {
        const doc = this.documentContexts.get(docId);
        if (doc) {
          relevantDocs.push(doc);
        }
      }
    } else {
      // Use all documents in context
      relevantDocs.push(...Array.from(this.documentContexts.values()));
    }

    // Extract relevant content if requested
    if (request.searchRelevantContent && relevantDocs.length > 0) {
      relevantContent = await this.extractRelevantContent(query, relevantDocs, request.maxContextTokens || 4000);
    }

    // Build conversation history (last 6 messages)
    const recentMessages = session.messages.slice(-6);
    const conversationHistory = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return {
      documents: relevantDocs,
      relevantContent,
      conversationHistory
    };
  }

  private async extractRelevantContent(
    query: string, 
    documents: DocumentChatContext[], 
    maxTokens: number
  ): Promise<string> {
    const relevantSections: Array<{content: string, score: number, docName: string}> = [];

    for (const doc of documents) {
      // Split document into paragraphs and score them
      const paragraphs = doc.content.split(/\n\s*\n/);
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim().length < 50) continue;
        
        const score = this.calculateRelevanceScore(query, paragraph, doc.keywords || []);
        if (score > 0.3) {
          relevantSections.push({
            content: paragraph.trim(),
            score,
            docName: doc.documentName
          });
        }
      }
    }

    // Sort by relevance and fit within token limit
    relevantSections.sort((a, b) => b.score - a.score);
    
    let totalTokens = 0;
    const selectedSections: typeof relevantSections = [];

    for (const section of relevantSections) {
      const sectionTokens = this.getTokenCount(section.content);
      if (totalTokens + sectionTokens <= maxTokens) {
        selectedSections.push(section);
        totalTokens += sectionTokens;
      } else {
        break;
      }
    }

    return selectedSections
      .map(section => `[From ${section.docName}]: ${section.content}`)
      .join('\n\n');
  }

  private calculateRelevanceScore(query: string, content: string, keywords: string[]): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // Direct word matches
    for (const word of queryWords) {
      if (word.length > 3 && contentLower.includes(word)) {
        score += 0.3;
      }
    }
    
    // Keyword matches
    for (const keyword of keywords) {
      if (queryWords.some(word => keyword.toLowerCase().includes(word.toLowerCase()))) {
        score += 0.4;
      }
    }
    
    return Math.min(1, score);
  }

  private buildChatPrompt(
    message: string, 
    context: any, 
    request: EnhancedChatRequest
  ): string {
    let prompt = `You are a helpful AI assistant specialized in analyzing and answering questions about documents. 

Current conversation context:
${context.conversationHistory}

Available documents:
${context.documents.map((doc: any) => `- ${doc.documentName}: ${doc.summary || 'Available for analysis'}`).join('\n')}`;

    if (context.relevantContent) {
      prompt += `\n\nRelevant content for this query:
${context.relevantContent}`;
    }

    prompt += `\n\nUser question: ${message}

Instructions:
- Provide accurate, helpful responses based on the available documents
- If information isn't available in the documents, clearly state that
- ${request.answerFormat === 'brief' ? 'Keep responses concise and to the point' : ''}
- ${request.answerFormat === 'detailed' ? 'Provide comprehensive, detailed responses with explanations' : ''}
- ${request.answerFormat === 'bullet_points' ? 'Format key information as bullet points' : ''}
- ${request.includeSourceReferences ? 'Include specific references to source documents when possible' : ''}
- Be conversational and helpful in your tone`;

    if (request.language && request.language !== 'en') {
      prompt += `\n- Respond in ${request.language}`;
    }

    return prompt;
  }

  private buildQAPrompt(
    question: string, 
    context: string, 
    options: any
  ): string {
    let prompt = `Answer the following question based on the provided context.

Context:
${context}

Question: ${question}

Instructions:
- Base your answer strictly on the provided context
- If the context doesn't contain enough information, state that clearly
- ${options.answerFormat === 'brief' ? 'Provide a concise answer' : ''}
- ${options.answerFormat === 'detailed' ? 'Provide a detailed explanation' : ''}
- ${options.answerFormat === 'bullet_points' ? 'Format the answer as bullet points' : ''}
- ${options.includeConfidence ? 'Include a confidence level (0-100) at the end' : ''}
- ${options.includeExplanation ? 'Explain your reasoning' : ''}`;

    return prompt;
  }

  private parseAssistantResponse(responseText: string, context: any, request: EnhancedChatRequest) {
    // Try to extract structured information from the response
    const lines = responseText.split('\n');
    
    return {
      content: responseText,
      answerType: this.detectAnswerType(responseText),
      confidence: this.extractConfidence(responseText) || 85,
      sourceReferences: this.extractSourceReferences(responseText, context),
      relevantDocuments: context.documents.map((doc: any) => doc.documentName),
      relatedQuestions: this.generateRelatedQuestions(responseText, request.message),
      suggestions: this.generateSuggestions(responseText)
    };
  }

  private parseQAResponse(responseText: string, question: string, context: string, options: any): QuestionAnswerResult {
    return {
      question,
      answer: responseText,
      confidence: this.extractConfidence(responseText) || 85,
      explanation: options.includeExplanation ? this.extractExplanation(responseText) : undefined,
      sourceReferences: this.extractSourceReferences(responseText, { relevantContent: context }),
      relatedQuestions: this.generateRelatedQuestions(responseText, question),
      answerType: this.detectAnswerType(responseText),
      timestamp: new Date().toISOString()
    };
  }

  private detectAnswerType(text: string): AnswerType {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('define') || lowerText.includes('definition')) return 'definition' as AnswerType;
    if (lowerText.includes('compare') || lowerText.includes('versus')) return 'comparison' as AnswerType;
    if (lowerText.includes('how to') || lowerText.includes('steps')) return 'procedure' as AnswerType;
    if (lowerText.includes('because') || lowerText.includes('reason')) return 'explanation' as AnswerType;
    if (lowerText.includes('opinion') || lowerText.includes('believe')) return 'opinion' as AnswerType;
    
    return 'factual' as AnswerType;
  }

  private extractConfidence(text: string): number | null {
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : null;
  }

  private extractSourceReferences(text: string, context: any): SourceReference[] {
    const references: SourceReference[] = [];
    const fromPattern = /\[From ([^\]]+)\]/g;
    let match;

    while ((match = fromPattern.exec(text)) !== null) {
      references.push({
        text: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        relevance: 0.8
      });
    }

    return references;
  }

  private generateRelatedQuestions(response: string, originalQuestion: string): string[] {
    // Simple related question generation based on response content
    const questions: string[] = [];
    
    if (response.includes('summary') || response.includes('overview')) {
      questions.push('Can you provide more specific details about this topic?');
    }
    
    if (response.includes('because') || response.includes('due to')) {
      questions.push('What are the implications of this?');
    }
    
    if (response.includes('process') || response.includes('steps')) {
      questions.push('Are there any alternatives to this approach?');
    }

    return questions.slice(0, 3);
  }

  private generateSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    if (response.length > 500) {
      suggestions.push('Ask for a shorter summary');
    }
    
    if (response.includes('document') || response.includes('file')) {
      suggestions.push('Ask about specific sections of the document');
    }
    
    return suggestions.slice(0, 2);
  }

  private extractExplanation(text: string): string | undefined {
    const explanationMarkers = ['because', 'since', 'due to', 'as a result'];
    
    for (const marker of explanationMarkers) {
      const index = text.toLowerCase().indexOf(marker);
      if (index !== -1) {
        return text.substring(index);
      }
    }
    
    return undefined;
  }

  private calculateMaxTokens(answerFormat: string): number {
    switch (answerFormat) {
      case 'brief': return 150;
      case 'bullet_points': return 300;
      case 'detailed': return 800;
      case 'conversational': return 500;
      default: return 400;
    }
  }

  private getTokenCount(text: string): number {
    try {
      return encode(text).length;
    } catch {
      return Math.ceil(text.length / 4);
    }
  }

  private updateSession(sessionId: string, session: ChatSession): void {
    this.chatSessions.set(sessionId, session);
    this.emit('sessionUpdated', { sessionId, session });
  }

  private initializeSessionMetrics(sessionId: string, documentIds: string[]): void {
    this.sessionMetrics.set(sessionId, {
      totalMessages: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      documentsReferenced: documentIds,
      topTopics: [],
      sessionDuration: 0
    });
  }

  private updateSessionMetrics(sessionId: string, responseTime: number, tokensUsed: number): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      metrics.totalMessages++;
      metrics.totalTokensUsed += tokensUsed;
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
      this.sessionMetrics.set(sessionId, metrics);
    }
  }
}