import { EventEmitter } from 'events';

// Gemini API Configuration
export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  stopSequences: string[];
  safetySettings: SafetySetting[];
}

export interface SafetySetting {
  category: string;
  threshold: string;
}

// Request/Response Types
export interface GeminiRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  sessionId?: string;
}

export interface GeminiResponse {
  text: string;
  finishReason: string;
  safetyRatings: SafetyRating[];
  citationMetadata?: CitationMetadata;
  tokenCount: TokenCount;
  model: string;
  timestamp: string;
}

export interface SafetyRating {
  category: string;
  probability: string;
}

export interface CitationMetadata {
  citations: Citation[];
}

export interface Citation {
  startIndex: number;
  endIndex: number;
  uri?: string;
  title?: string;
}

export interface TokenCount {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

// Document Analysis Types
export interface DocumentAnalysisRequest {
  text: string;
  analysisType: AnalysisType;
  options: AnalysisOptions;
  fileName?: string;
  fileType?: string;
}

export enum AnalysisType {
  SUMMARY = 'summary',
  KEYWORDS = 'keywords',
  ENTITIES = 'entities',
  SENTIMENT = 'sentiment',
  TOPICS = 'topics',
  STRUCTURE = 'structure',
  COMPREHENSIVE = 'comprehensive'
}

export interface AnalysisOptions {
  language?: string;
  summaryLength?: 'short' | 'medium' | 'long';
  includeMetrics?: boolean;
  extractEntities?: boolean;
  includeSentiment?: boolean;
  includeKeywords?: boolean;
  keywordCount?: number;
  confidenceThreshold?: number;
}

export interface DocumentAnalysisResult {
  analysisType: AnalysisType;
  fileName?: string;
  summary?: Summary;
  keywords?: Keyword[];
  entities?: Entity[];
  sentiment?: SentimentAnalysis;
  topics?: Topic[];
  structure?: DocumentStructure;
  metrics?: DocumentMetrics;
  timestamp: string;
  processingTime: number;
}

export interface Summary {
  text: string;
  length: 'short' | 'medium' | 'long' | 'custom';
  keyPoints: string[];
  confidence: number;
}

export interface Keyword {
  text: string;
  relevance: number;
  frequency: number;
  category?: string;
}

export interface Entity {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset?: number;
  endOffset?: number;
  metadata?: Record<string, any>;
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  MONEY = 'money',
  OTHER = 'other'
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  sentences?: SentimentScore[];
  emotionalTone?: EmotionalTone;
}

export interface SentimentScore {
  score: number; // -1 to 1
  magnitude: number; // 0 to infinity
  label: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
}

export interface EmotionalTone {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  description?: string;
}

export interface DocumentStructure {
  sections: DocumentSection[];
  headings: Heading[];
  paragraphs: number;
  sentences: number;
  words: number;
  readabilityScore?: number;
}

export interface DocumentSection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  level: number;
}

export interface Heading {
  text: string;
  level: number;
  position: number;
}

export interface DocumentMetrics {
  readingTime: number; // minutes
  complexity: 'simple' | 'moderate' | 'complex';
  readabilityScore: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
}

// Question-Answering Types
export interface QuestionAnswerRequest {
  question: string;
  context: string;
  options: QAOptions;
  sessionId?: string;
}

export interface QAOptions {
  maxAnswerLength?: number;
  includeConfidence?: boolean;
  includeExplanation?: boolean;
  answerFormat?: 'brief' | 'detailed' | 'bullet_points';
  language?: string;
}

export interface QuestionAnswerResult {
  question: string;
  answer: string;
  confidence: number;
  explanation?: string;
  sourceReferences?: SourceReference[];
  relatedQuestions?: string[];
  answerType: AnswerType;
  timestamp: string;
}

export enum AnswerType {
  FACTUAL = 'factual',
  OPINION = 'opinion',
  DEFINITION = 'definition',
  EXPLANATION = 'explanation',
  COMPARISON = 'comparison',
  PROCEDURE = 'procedure',
  NOT_FOUND = 'not_found'
}

export interface SourceReference {
  text: string;
  startIndex: number;
  endIndex: number;
  relevance: number;
}

// Streaming Types
export interface StreamingRequest {
  prompt: string;
  context?: string;
  options: StreamingOptions;
  sessionId: string;
}

export interface StreamingOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  includeUsage?: boolean;
}

export interface StreamingChunk {
  text: string;
  isComplete: boolean;
  tokenCount?: number;
  finishReason?: string;
  timestamp: string;
}

export interface StreamingSession {
  sessionId: string;
  emitter: EventEmitter;
  isActive: boolean;
  startTime: Date;
  totalTokens: number;
  chunks: StreamingChunk[];
}

// Rate Limiting Types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
}

// Error Types
export class GeminiError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: any;
  public retryAfter?: number;

  constructor(code: string, message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export enum GeminiErrorCode {
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  MODEL_OVERLOADED = 'MODEL_OVERLOADED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CONTEXT_TOO_LONG = 'CONTEXT_TOO_LONG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Service Configuration
export interface GeminiServiceConfig {
  apiKey: string;
  model: string;
  defaultOptions: Partial<GeminiConfig>;
  rateLimiting: RateLimitConfig;
  retryOptions: RetryOptions;
  cachingEnabled: boolean;
  streamingEnabled: boolean;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: GeminiErrorCode[];
}

// Usage Analytics
export interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
  mostUsedFeatures: string[];
  costEstimate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface RequestMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  responseTime: number;
  success: boolean;
  errorCode?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Chat/Conversation Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  context?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  title?: string;
  summary?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: string;
  options: ChatOptions;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  includeHistory?: boolean;
  systemPrompt?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  totalTokens: number;
  responseTime: number;
  suggestions?: string[];
  context?: string;
}

// Re-export SummarizationRequest from text summarization service
export interface SummarizationRequest {
  text: string;
  summaryType: 'extractive' | 'abstractive' | 'bullet_points' | 'executive' | 'technical' | 'creative';
  length: 'short' | 'medium' | 'long' | 'custom';
  focusAreas?: string[];
  customInstructions?: string;
  preserveStructure?: boolean;
  includeKeyPoints?: boolean;
  targetAudience?: string;
  language?: string;
}

export interface SummarizationResult {
  summary: Summary;
  summaryType: SummarizationRequest['summaryType'];
  length: SummarizationRequest['length'];
  keyPoints: string[];
  confidence: number;
  processingTime: number;
  timestamp: string;
  fileName?: string;
}