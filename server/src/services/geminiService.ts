import { GoogleGenerativeAI, GenerativeModel, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { EventEmitter } from 'events';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { 
  GeminiConfig, 
  GeminiRequest, 
  GeminiResponse, 
  GeminiError, 
  GeminiErrorCode,
  StreamingRequest,
  StreamingChunk,
  StreamingSession,
  RateLimitStatus,
  UsageMetrics,
  RequestMetrics,
  GeminiServiceConfig
} from '../types/gemini';

/**
 * Comprehensive Google Gemini API service with rate limiting, error handling, and streaming
 */
export class GeminiService extends EventEmitter {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  private config: GeminiServiceConfig;
  private rateLimiter!: RateLimiterMemory;
  private streamingSessions: Map<string, StreamingSession> = new Map();
  private metrics: RequestMetrics[] = [];
  private isInitialized = false;

  constructor(config: GeminiServiceConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the Gemini service
   */
  private initialize(): void {
    try {
      if (!this.config.apiKey) {
        throw new GeminiError(
          GeminiErrorCode.API_KEY_INVALID,
          'Gemini API key is required',
          401
        );
      }

      // Initialize Google AI
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);

      // Configure the model
      const modelConfig = {
        temperature: this.config.defaultOptions.temperature || 0.7,
        topK: this.config.defaultOptions.topK || 40,
        topP: this.config.defaultOptions.topP || 0.8,
        maxOutputTokens: this.config.defaultOptions.maxTokens || 2048,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      };

      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model || 'gemini-pro',
        generationConfig: modelConfig
      });

      // Initialize rate limiter
      this.rateLimiter = new RateLimiterMemory({
        points: this.config.rateLimiting.maxRequests,
        duration: Math.ceil(this.config.rateLimiting.windowMs / 1000),
      });

      this.isInitialized = true;
      this.emit('initialized');

      // Start cleanup interval for streaming sessions
      setInterval(() => this.cleanupStreamingSessions(), 60000); // Every minute

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Generate text response
   */
  async generateText(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.isInitialized) {
      throw new GeminiError(
        GeminiErrorCode.SERVICE_UNAVAILABLE,
        'Gemini service not initialized',
        503
      );
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Check rate limits
      await this.checkRateLimit(request.sessionId || 'anonymous');

      // Prepare the prompt
      const prompt = this.buildPrompt(request);
      
      // Track request
      this.emit('request', { requestId, prompt: request.prompt, sessionId: request.sessionId });

      // Generate response
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Count tokens (approximation)
      const tokenCount = {
        promptTokens: this.estimateTokenCount(prompt),
        candidatesTokens: this.estimateTokenCount(text),
        totalTokens: 0
      };
      tokenCount.totalTokens = tokenCount.promptTokens + tokenCount.candidatesTokens;

      // Build response
      const geminiResponse: GeminiResponse = {
        text,
        finishReason: response.candidates?.[0]?.finishReason || 'STOP',
        safetyRatings: response.candidates?.[0]?.safetyRatings?.map(rating => ({
          category: rating.category,
          probability: rating.probability
        })) || [],
        tokenCount,
        model: this.config.model || 'gemini-pro',
        timestamp: new Date().toISOString()
      };

      // Track metrics
      const responseTime = Date.now() - startTime;
      this.trackRequest({
        requestId,
        endpoint: 'generateText',
        method: 'POST',
        promptTokens: tokenCount.promptTokens,
        responseTokens: tokenCount.candidatesTokens,
        totalTokens: tokenCount.totalTokens,
        responseTime,
        success: true,
        timestamp: new Date(),
        sessionId: request.sessionId
      });

      this.emit('response', { requestId, response: geminiResponse, responseTime });
      return geminiResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const geminiError = this.handleError(error);
      
      // Track failed request
      this.trackRequest({
        requestId,
        endpoint: 'generateText',
        method: 'POST',
        promptTokens: this.estimateTokenCount(request.prompt),
        responseTokens: 0,
        totalTokens: this.estimateTokenCount(request.prompt),
        responseTime,
        success: false,
        errorCode: geminiError.code,
        timestamp: new Date(),
        sessionId: request.sessionId
      });

      this.emit('error', { requestId, error: geminiError, responseTime });
      throw geminiError;
    }
  }

  /**
   * Generate streaming response
   */
  async generateStreamingText(request: StreamingRequest): Promise<StreamingSession> {
    if (!this.isInitialized) {
      throw new GeminiError(
        GeminiErrorCode.SERVICE_UNAVAILABLE,
        'Gemini service not initialized',
        503
      );
    }

    if (!this.config.streamingEnabled) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Streaming is not enabled',
        400
      );
    }

    const sessionId = request.sessionId || this.generateSessionId();
    const startTime = new Date();

    try {
      // Check rate limits
      await this.checkRateLimit(sessionId);

      // Create streaming session
      const session: StreamingSession = {
        sessionId,
        emitter: new EventEmitter(),
        isActive: true,
        startTime,
        totalTokens: 0,
        chunks: []
      };

      this.streamingSessions.set(sessionId, session);

      // Prepare the prompt
      const prompt = this.buildPrompt({
        prompt: request.prompt,
        context: request.context
      });

      this.emit('streamingStarted', { sessionId, prompt: request.prompt });

      // Start streaming
      this.startStreamingGeneration(session, prompt);

      return session;

    } catch (error) {
      const geminiError = this.handleError(error);
      this.emit('streamingError', { sessionId, error: geminiError });
      throw geminiError;
    }
  }

  /**
   * Start the actual streaming generation
   */
  private async startStreamingGeneration(session: StreamingSession, prompt: string): Promise<void> {
    try {
      const result = await this.model.generateContentStream(prompt);
      let fullText = '';
      let chunkIndex = 0;

      for await (const chunk of result.stream) {
        if (!session.isActive) {
          break;
        }

        const chunkText = chunk.text();
        fullText += chunkText;
        
        const streamingChunk: StreamingChunk = {
          text: chunkText,
          isComplete: false,
          tokenCount: this.estimateTokenCount(chunkText),
          timestamp: new Date().toISOString()
        };

        session.chunks.push(streamingChunk);
        session.totalTokens += streamingChunk.tokenCount || 0;

        // Emit chunk
        session.emitter.emit('chunk', streamingChunk);
        this.emit('streamingChunk', { sessionId: session.sessionId, chunk: streamingChunk, chunkIndex });

        chunkIndex++;
      }

      // Final chunk
      const finalChunk: StreamingChunk = {
        text: '',
        isComplete: true,
        finishReason: 'STOP',
        tokenCount: 0,
        timestamp: new Date().toISOString()
      };

      session.chunks.push(finalChunk);
      session.isActive = false;

      session.emitter.emit('complete', {
        fullText,
        totalTokens: session.totalTokens,
        chunkCount: chunkIndex,
        duration: Date.now() - session.startTime.getTime()
      });

      this.emit('streamingCompleted', { 
        sessionId: session.sessionId, 
        fullText,
        totalTokens: session.totalTokens,
        duration: Date.now() - session.startTime.getTime()
      });

    } catch (error) {
      session.isActive = false;
      const geminiError = this.handleError(error);
      
      session.emitter.emit('error', geminiError);
      this.emit('streamingError', { sessionId: session.sessionId, error: geminiError });
    }
  }

  /**
   * Stop streaming session
   */
  stopStreaming(sessionId: string): boolean {
    const session = this.streamingSessions.get(sessionId);
    if (session && session.isActive) {
      session.isActive = false;
      session.emitter.emit('stopped');
      this.emit('streamingStopped', { sessionId });
      return true;
    }
    return false;
  }

  /**
   * Get streaming session
   */
  getStreamingSession(sessionId: string): StreamingSession | undefined {
    return this.streamingSessions.get(sessionId);
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(key: string): Promise<void> {
    try {
      await this.rateLimiter.consume(key);
    } catch (rejRes: any) {
      const secs = Math.round((rejRes.msBeforeNext || 1000) / 1000) || 1;
      throw new GeminiError(
        GeminiErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${secs} seconds.`,
        429,
        { retryAfter: secs }
      );
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(key: string): Promise<RateLimitStatus> {
    try {
      const resRateLimiter = await this.rateLimiter.get(key);
      
      return {
        limit: this.config.rateLimiting.maxRequests,
        remaining: resRateLimiter ? this.config.rateLimiting.maxRequests - (resRateLimiter as any).hitCount : this.config.rateLimiting.maxRequests,
        resetTime: resRateLimiter ? new Date(Date.now() + (resRateLimiter.msBeforeNext || 0)) : new Date(),
        isBlocked: false
      };
    } catch (error) {
      return {
        limit: this.config.rateLimiting.maxRequests,
        remaining: 0,
        resetTime: new Date(Date.now() + this.config.rateLimiting.windowMs),
        isBlocked: true
      };
    }
  }

  /**
   * Build prompt with context
   */
  private buildPrompt(request: { prompt: string; context?: string }): string {
    if (!request.context) {
      return request.prompt;
    }

    return `Context: ${request.context}\n\nUser: ${request.prompt}\n\nAssistant:`;
  }

  /**
   * Handle errors and convert to GeminiError
   */
  private handleError(error: any): GeminiError {
    if (error instanceof GeminiError) {
      return error;
    }

    // Handle Google AI API errors
    if (error.message) {
      if (error.message.includes('API key')) {
        return new GeminiError(
          GeminiErrorCode.API_KEY_INVALID,
          'Invalid API key',
          401
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return new GeminiError(
          GeminiErrorCode.QUOTA_EXCEEDED,
          'API quota exceeded',
          429
        );
      }
      
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        return new GeminiError(
          GeminiErrorCode.CONTENT_FILTERED,
          'Content was filtered by safety settings',
          400
        );
      }
      
      if (error.message.includes('overloaded')) {
        return new GeminiError(
          GeminiErrorCode.MODEL_OVERLOADED,
          'Model is overloaded, try again later',
          503
        );
      }
      
      if (error.message.includes('context') || error.message.includes('token')) {
        return new GeminiError(
          GeminiErrorCode.CONTEXT_TOO_LONG,
          'Context or prompt is too long',
          400
        );
      }
    }

    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return new GeminiError(
        GeminiErrorCode.NETWORK_ERROR,
        'Network connection failed',
        0
      );
    }

    // Default error
    return new GeminiError(
      GeminiErrorCode.UNKNOWN_ERROR,
      error.message || 'Unknown error occurred',
      500
    );
  }

  /**
   * Estimate token count (approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~0.75 tokens per word for English
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words * 0.75);
  }

  /**
   * Track request metrics
   */
  private trackRequest(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 requests
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get usage metrics
   */
  getUsageMetrics(period?: { start: Date; end: Date }): UsageMetrics {
    let filteredMetrics = this.metrics;
    
    if (period) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= period.start && m.timestamp <= period.end
      );
    }

    const totalRequests = filteredMetrics.length;
    const successfulRequests = filteredMetrics.filter(m => m.success);
    const totalTokens = filteredMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const rateLimitHits = filteredMetrics.filter(m => m.errorCode === GeminiErrorCode.RATE_LIMIT_EXCEEDED).length;

    // Estimate cost (rough approximation)
    const costPerToken = 0.00025; // Example rate
    const costEstimate = totalTokens * costPerToken;

    return {
      totalRequests,
      totalTokens,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (totalRequests - successfulRequests.length) / totalRequests : 0,
      rateLimitHits,
      mostUsedFeatures: this.getMostUsedFeatures(filteredMetrics),
      costEstimate,
      period: period || {
        start: new Date(Math.min(...this.metrics.map(m => m.timestamp.getTime()))),
        end: new Date(Math.max(...this.metrics.map(m => m.timestamp.getTime())))
      }
    };
  }

  /**
   * Get most used features
   */
  private getMostUsedFeatures(metrics: RequestMetrics[]): string[] {
    const featureCounts = metrics.reduce((counts, metric) => {
      counts[metric.endpoint] = (counts[metric.endpoint] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature);
  }

  /**
   * Clean up inactive streaming sessions
   */
  private cleanupStreamingSessions(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.streamingSessions.entries()) {
      if (!session.isActive && (now - session.startTime.getTime()) > maxAge) {
        session.emitter.removeAllListeners();
        this.streamingSessions.delete(sessionId);
        this.emit('sessionCleaned', { sessionId });
      }
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const testRequest: GeminiRequest = {
        prompt: 'Hello, this is a health check. Please respond with "OK".',
        maxTokens: 10
      };

      const response = await this.generateText(testRequest);
      
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          model: this.config.model,
          activeStreamingSessions: this.streamingSessions.size,
          recentMetrics: this.metrics.slice(-5),
          testResponse: response.text.substring(0, 50)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          initialized: this.isInitialized,
          error: error instanceof Error ? error.message : 'Unknown error',
          activeStreamingSessions: this.streamingSessions.size
        }
      };
    }
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown');
    
    // Stop all active streaming sessions
    for (const [sessionId, session] of this.streamingSessions.entries()) {
      if (session.isActive) {
        this.stopStreaming(sessionId);
      }
    }

    // Clear all sessions
    this.streamingSessions.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.isInitialized = false;
  }
}