import { OpenAI } from 'openai';
import { EventEmitter } from 'events';
import {
  GeminiRequest,
  GeminiResponse,
  GeminiError,
  GeminiErrorCode
} from '../types/gemini';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * OpenAI service that implements the same interface as GeminiService
 * to allow easy switching between AI providers
 */
export class OpenAIService extends EventEmitter {
  private client: OpenAI;
  private config: OpenAIConfig;
  private requestCount = 0;

  constructor(config: OpenAIConfig) {
    super();
    this.config = {
      model: 'gpt-5-nano', // Using GPT-5-nano for cost efficiency ($0.05 vs $0.15)
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 30000,
      ...config
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout
    });
  }

  /**
   * Generate text using OpenAI (compatible with GeminiService interface)
   */
  async generateText(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    const requestId = `openai_${Date.now()}_${++this.requestCount}`;

    try {
      console.log(`🤖 OpenAI Request [${requestId}]:`, {
        prompt: request.prompt.substring(0, 100) + '...',
        maxTokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature,
        model: this.config.model
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature,
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;

      console.log(`✅ OpenAI Response [${requestId}]:`, {
        responseLength: responseText.length,
        processingTime,
        usage: completion.usage
      });

      const response: GeminiResponse = {
        text: responseText,
        finishReason: this.mapFinishReason(completion.choices[0]?.finish_reason),
        safetyRatings: [],
        citationMetadata: undefined,
        tokenCount: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          candidatesTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        model: this.config.model!,
        timestamp: new Date().toISOString()
      };

      this.emit('response', {
        requestId,
        response,
        processingTime
      });

      return response;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      console.error(`❌ OpenAI Error [${requestId}]:`, {
        error: error.message,
        type: error.type,
        code: error.code,
        processingTime
      });

      const geminiError = this.mapOpenAIError(error, requestId);
      
      this.emit('error', {
        requestId,
        error: geminiError,
        processingTime
      });

      throw geminiError;
    }
  }

  /**
   * Generate text with streaming (compatible with GeminiService interface)
   */
  async *generateTextStream(request: GeminiRequest): AsyncGenerator<{ text: string; done: boolean }> {
    const requestId = `openai_stream_${Date.now()}_${++this.requestCount}`;

    try {
      console.log(`🌊 OpenAI Stream Request [${requestId}]:`, {
        prompt: request.prompt.substring(0, 100) + '...',
        maxTokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature
      });

      const stream = await this.client.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature || this.config.temperature,
        stream: true
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          yield { text: delta, done: false };
        }
      }

      yield { text: '', done: true };
      console.log(`✅ OpenAI Stream Complete [${requestId}]`);

    } catch (error: any) {
      console.error(`❌ OpenAI Stream Error [${requestId}]:`, error.message);
      const geminiError = this.mapOpenAIError(error, requestId);
      
      this.emit('error', {
        requestId,
        error: geminiError
      });

      throw geminiError;
    }
  }

  /**
   * Map OpenAI finish reason to Gemini format
   */
  private mapFinishReason(finishReason: string | null | undefined): string {
    switch (finishReason) {
      case 'stop':
        return 'STOP';
      case 'length':
        return 'MAX_TOKENS';
      case 'content_filter':
        return 'SAFETY';
      case 'function_call':
      case 'tool_calls':
        return 'STOP';
      default:
        return 'OTHER';
    }
  }

  /**
   * Map OpenAI errors to Gemini format
   */
  private mapOpenAIError(error: any, requestId: string): GeminiError {
    let code: GeminiErrorCode = GeminiErrorCode.UNKNOWN_ERROR;
    let statusCode = 500;
    let message = error.message || 'Unknown OpenAI error';

    if (error.type) {
      switch (error.type) {
        case 'invalid_request_error':
          code = GeminiErrorCode.INVALID_REQUEST;
          statusCode = 400;
          break;
        case 'authentication_error':
          code = GeminiErrorCode.API_KEY_INVALID;
          statusCode = 401;
          break;
        case 'permission_error':
          code = GeminiErrorCode.API_KEY_INVALID;
          statusCode = 403;
          break;
        case 'not_found_error':
          code = GeminiErrorCode.INVALID_REQUEST;
          statusCode = 404;
          break;
        case 'rate_limit_error':
          code = GeminiErrorCode.QUOTA_EXCEEDED;
          statusCode = 429;
          break;
        case 'api_error':
        case 'api_connection_error':
        case 'api_connection_timeout_error':
          code = GeminiErrorCode.SERVICE_UNAVAILABLE;
          statusCode = 503;
          break;
        case 'server_error':
          code = GeminiErrorCode.SERVICE_UNAVAILABLE;
          statusCode = 500;
          break;
      }
    }

    // Handle specific OpenAI error codes
    if (error.code) {
      switch (error.code) {
        case 'context_length_exceeded':
          code = GeminiErrorCode.CONTEXT_TOO_LONG;
          statusCode = 400;
          break;
        case 'content_filter':
          code = GeminiErrorCode.CONTENT_FILTERED;
          statusCode = 400;
          break;
        case 'insufficient_quota':
          code = GeminiErrorCode.QUOTA_EXCEEDED;
          statusCode = 429;
          break;
      }
    }

    return new GeminiError(code, message, statusCode, {
      requestId,
      provider: 'openai',
      originalError: error
    });
  }

  /**
   * Test the connection to OpenAI
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: 'Hello, this is a test message. Please respond with "OK".',
        maxTokens: 10,
        temperature: 0
      });

      return response.text.toLowerCase().includes('ok');
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      provider: 'openai',
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      requestCount: this.requestCount
    };
  }
}