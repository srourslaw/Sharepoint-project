import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { GeminiService } from '../services/geminiService';
import { DocumentSummarizationService, EnhancedSummarizationRequest } from '../services/documentSummarizationService';
import { DocumentChatService, EnhancedChatRequest } from '../services/documentChatService';
import { ContentExtractionService, ExtractionType } from '../services/contentExtractionService';
import { TranslationService, TranslationRequest } from '../services/translationService';
import { DocumentComparisonService, ComparisonType } from '../services/documentComparisonService';
import { SentimentAnalysisService, SentimentAnalysisType } from '../services/sentimentAnalysisService';
import { SanitizationService } from '../services/sanitizationService';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: 50, // Number of requests
  duration: 60, // Per 60 seconds
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

export function createAIFeaturesRoutes(
  authService: AuthService,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Initialize services
  const geminiService = new GeminiService({
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    defaultOptions: {},
    rateLimiting: {
      maxRequests: 100,
      windowMs: 60000
    },
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryableErrors: []
    },
    cachingEnabled: true,
    streamingEnabled: true
  });

  const analysisService = new DocumentAnalysisService(geminiService);
  const summarizationService = new DocumentSummarizationService(geminiService, analysisService);
  const chatService = new DocumentChatService(geminiService, analysisService);
  const extractionService = new ContentExtractionService(geminiService, analysisService);
  const translationService = new TranslationService(geminiService);
  const comparisonService = new DocumentComparisonService(geminiService, extractionService, analysisService);
  const sentimentService = new SentimentAnalysisService(geminiService);
  const sanitizationService = new SanitizationService();

  // Rate limiting middleware
  const rateLimitMiddleware = async (req: Request, res: Response, next: Function) => {
    try {
      await rateLimiter.consume(req.ip || 'unknown');
      next();
    } catch (rejRes: any) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000)
        }
      });
    }
  };

  // Apply middleware to all routes
  router.use(authMiddleware.requireAuth);
  router.use(rateLimitMiddleware);

  // Document Summarization Endpoints
  router.post('/summarize', async (req: Request, res: Response) => {
    try {
      const { text, summaryType, length, ...options }: EnhancedSummarizationRequest = req.body;

      if (!text) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXT', message: 'Text content is required' }
        });
      }

      // Sanitize input
      const sanitizedResult = await sanitizationService.sanitizeInput(text, {
        maxLength: 100000,
        stripHtml: true,
        preventInjection: true
      });

      if (!sanitizedResult.metadata.riskLevel || sanitizedResult.metadata.riskLevel === 'high') {
        return res.status(400).json({
          error: { code: 'SECURITY_RISK', message: 'Content flagged for security risks' }
        });
      }

      const result = await summarizationService.summarizeDocument({
        text: sanitizedResult.sanitizedValue,
        summaryType: summaryType || 'abstractive',
        length: length || 'medium',
        ...options
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Summarization error:', error);
      res.status(500).json({
        error: {
          code: 'SUMMARIZATION_ERROR',
          message: 'Failed to generate summary',
          details: error.message
        }
      });
    }
  });

  router.post('/summarize/batch', async (req: Request, res: Response) => {
    try {
      const { requests } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUESTS', message: 'Requests array is required' }
        });
      }

      const result = await summarizationService.batchSummarize(requests);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Batch summarization error:', error);
      res.status(500).json({
        error: {
          code: 'BATCH_SUMMARIZATION_ERROR',
          message: 'Failed to process batch summarization',
          details: error.message
        }
      });
    }
  });

  // Document Chat Endpoints
  router.post('/chat/start', async (req: Request, res: Response) => {
    try {
      const { documentIds, title } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_DOCUMENTS', message: 'Document IDs are required' }
        });
      }

      const session = await chatService.startChatSession(userId, documentIds, title);

      res.json({
        success: true,
        data: session
      });

    } catch (error: any) {
      console.error('Chat session start error:', error);
      res.status(500).json({
        error: {
          code: 'CHAT_SESSION_ERROR',
          message: 'Failed to start chat session',
          details: error.message
        }
      });
    }
  });

  router.post('/chat/message', async (req: Request, res: Response) => {
    try {
      const chatRequest: EnhancedChatRequest = req.body;

      if (!chatRequest.message || !chatRequest.sessionId) {
        return res.status(400).json({
          error: { code: 'MISSING_PARAMETERS', message: 'Message and session ID are required' }
        });
      }

      // Sanitize message
      const sanitizedResult = await sanitizationService.sanitizeInput(chatRequest.message, {
        maxLength: 10000,
        stripHtml: true,
        preventInjection: true
      });

      if (sanitizedResult.metadata.riskLevel === 'high') {
        return res.status(400).json({
          error: { code: 'SECURITY_RISK', message: 'Message flagged for security risks' }
        });
      }

      const response = await chatService.sendMessage({
        ...chatRequest,
        message: sanitizedResult.sanitizedValue
      });

      res.json({
        success: true,
        data: response
      });

    } catch (error: any) {
      console.error('Chat message error:', error);
      res.status(500).json({
        error: {
          code: 'CHAT_MESSAGE_ERROR',
          message: 'Failed to process chat message',
          details: error.message
        }
      });
    }
  });

  router.get('/chat/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = chatService.getChatSession(sessionId);

      if (!session) {
        return res.status(404).json({
          error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found' }
        });
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error: any) {
      console.error('Get chat session error:', error);
      res.status(500).json({
        error: {
          code: 'GET_SESSION_ERROR',
          message: 'Failed to retrieve chat session',
          details: error.message
        }
      });
    }
  });

  // Content Extraction Endpoints
  router.post('/extract', async (req: Request, res: Response) => {
    try {
      const { text, extractionTypes, options = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXT', message: 'Text content is required' }
        });
      }

      if (!Array.isArray(extractionTypes) || extractionTypes.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_EXTRACTION_TYPES', message: 'Extraction types are required' }
        });
      }

      // Sanitize input
      const sanitizedResult = await sanitizationService.sanitizeInput(text, {
        maxLength: 100000,
        stripHtml: true
      });

      const result = await extractionService.extractContent({
        text: sanitizedResult.sanitizedValue,
        extractionTypes: extractionTypes as ExtractionType[],
        options
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Content extraction error:', error);
      res.status(500).json({
        error: {
          code: 'EXTRACTION_ERROR',
          message: 'Failed to extract content',
          details: error.message
        }
      });
    }
  });

  router.post('/extract/keywords/clusters', async (req: Request, res: Response) => {
    try {
      const { text, options = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXT', message: 'Text content is required' }
        });
      }

      const result = await extractionService.extractKeywordClusters(text, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Keyword clustering error:', error);
      res.status(500).json({
        error: {
          code: 'CLUSTERING_ERROR',
          message: 'Failed to cluster keywords',
          details: error.message
        }
      });
    }
  });

  // Language Translation Endpoints
  router.post('/translate', async (req: Request, res: Response) => {
    try {
      const translationRequest: TranslationRequest = req.body;

      if (!translationRequest.text || !translationRequest.targetLanguage) {
        return res.status(400).json({
          error: { code: 'MISSING_PARAMETERS', message: 'Text and target language are required' }
        });
      }

      // Sanitize input
      const sanitizedResult = await sanitizationService.sanitizeInput(translationRequest.text, {
        maxLength: 100000,
        stripHtml: false,
        preserveFormatting: translationRequest.preserveFormatting
      });

      const result = await translationService.translateText({
        ...translationRequest,
        text: sanitizedResult.sanitizedValue
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Translation error:', error);
      res.status(500).json({
        error: {
          code: 'TRANSLATION_ERROR',
          message: 'Failed to translate text',
          details: error.message
        }
      });
    }
  });

  router.get('/translate/languages', async (req: Request, res: Response) => {
    try {
      const languages = translationService.getSupportedLanguages();

      res.json({
        success: true,
        data: languages
      });

    } catch (error: any) {
      console.error('Get languages error:', error);
      res.status(500).json({
        error: {
          code: 'GET_LANGUAGES_ERROR',
          message: 'Failed to retrieve supported languages',
          details: error.message
        }
      });
    }
  });

  router.post('/translate/detect', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXT', message: 'Text content is required' }
        });
      }

      const result = await translationService.detectLanguage(text);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Language detection error:', error);
      res.status(500).json({
        error: {
          code: 'DETECTION_ERROR',
          message: 'Failed to detect language',
          details: error.message
        }
      });
    }
  });

  // Document Comparison Endpoints
  router.post('/compare', async (req: Request, res: Response) => {
    try {
      const { documents, comparisonTypes, options = {} } = req.body;

      if (!Array.isArray(documents) || documents.length < 2) {
        return res.status(400).json({
          error: { code: 'INSUFFICIENT_DOCUMENTS', message: 'At least 2 documents are required for comparison' }
        });
      }

      if (!Array.isArray(comparisonTypes) || comparisonTypes.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_COMPARISON_TYPES', message: 'Comparison types are required' }
        });
      }

      // Sanitize document content
      const sanitizedDocuments = await Promise.all(
        documents.map(async (doc: any) => ({
          ...doc,
          content: (await sanitizationService.sanitizeInput(doc.content, {
            maxLength: 50000,
            stripHtml: true
          })).sanitizedValue
        }))
      );

      const result = await comparisonService.compareDocuments({
        documents: sanitizedDocuments,
        comparisonTypes: comparisonTypes as ComparisonType[],
        options
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Document comparison error:', error);
      res.status(500).json({
        error: {
          code: 'COMPARISON_ERROR',
          message: 'Failed to compare documents',
          details: error.message
        }
      });
    }
  });

  router.post('/compare/similarity', async (req: Request, res: Response) => {
    try {
      const { targetDocument, candidateDocuments, threshold = 70 } = req.body;

      if (!targetDocument || !Array.isArray(candidateDocuments)) {
        return res.status(400).json({
          error: { code: 'MISSING_PARAMETERS', message: 'Target document and candidate documents are required' }
        });
      }

      const result = await comparisonService.findSimilarDocuments(
        targetDocument,
        candidateDocuments,
        threshold
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Similarity search error:', error);
      res.status(500).json({
        error: {
          code: 'SIMILARITY_ERROR',
          message: 'Failed to find similar documents',
          details: error.message
        }
      });
    }
  });

  // Sentiment Analysis Endpoints
  router.post('/sentiment', async (req: Request, res: Response) => {
    try {
      const { text, analysisTypes, options = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXT', message: 'Text content is required' }
        });
      }

      if (!Array.isArray(analysisTypes) || analysisTypes.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_ANALYSIS_TYPES', message: 'Analysis types are required' }
        });
      }

      // Sanitize input
      const sanitizedResult = await sanitizationService.sanitizeInput(text, {
        maxLength: 50000,
        stripHtml: true
      });

      const result = await sentimentService.analyzeSentiment({
        text: sanitizedResult.sanitizedValue,
        analysisTypes: analysisTypes as SentimentAnalysisType[],
        options
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({
        error: {
          code: 'SENTIMENT_ERROR',
          message: 'Failed to analyze sentiment',
          details: error.message
        }
      });
    }
  });

  router.post('/sentiment/batch', async (req: Request, res: Response) => {
    try {
      const { texts, options = {} } = req.body;

      if (!Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_TEXTS', message: 'Text array is required' }
        });
      }

      const result = await sentimentService.analyzeBatchSentiment({ texts, options });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Batch sentiment analysis error:', error);
      res.status(500).json({
        error: {
          code: 'BATCH_SENTIMENT_ERROR',
          message: 'Failed to analyze batch sentiment',
          details: error.message
        }
      });
    }
  });

  // File Upload and Processing Endpoints
  router.post('/upload/analyze', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { analysisType = 'comprehensive' } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: { code: 'NO_FILES', message: 'No files uploaded' }
        });
      }

      const results = [];

      for (const file of files) {
        try {
          // Extract text content based on file type
          let textContent = '';
          
          if (file.mimetype === 'text/plain') {
            textContent = file.buffer.toString('utf8');
          } else {
            // For other file types, would need appropriate parsers
            textContent = file.buffer.toString('utf8');
          }

          // Sanitize content
          const sanitizedResult = await sanitizationService.sanitizeInput(textContent, {
            maxLength: 100000,
            stripHtml: true
          });

          if (sanitizedResult.metadata.riskLevel === 'high') {
            results.push({
              filename: file.originalname,
              error: 'File flagged for security risks'
            });
            continue;
          }

          // Perform comprehensive analysis
          const analysisResult = await analysisService.analyzeDocument({
            text: sanitizedResult.sanitizedValue,
            analysisType: analysisType as any,
            options: {
              includeMetrics: true,
              extractEntities: true,
              includeSentiment: true,
              includeKeywords: true
            },
            fileName: file.originalname
          });

          results.push({
            filename: file.originalname,
            analysis: analysisResult
          });

        } catch (error: any) {
          console.error(`Error processing file ${file.originalname}:`, error);
          results.push({
            filename: file.originalname,
            error: `Processing failed: ${error.message}`
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalFiles: files.length,
          processedFiles: results.filter(r => !r.error).length,
          results
        }
      });

    } catch (error: any) {
      console.error('File upload/analysis error:', error);
      res.status(500).json({
        error: {
          code: 'UPLOAD_ANALYSIS_ERROR',
          message: 'Failed to process uploaded files',
          details: error.message
        }
      });
    }
  });

  // Output Formatting Endpoint
  router.post('/format', async (req: Request, res: Response) => {
    try {
      const { data, format, options = {} } = req.body;

      if (!data) {
        return res.status(400).json({
          error: { code: 'MISSING_DATA', message: 'Data to format is required' }
        });
      }

      if (!format) {
        return res.status(400).json({
          error: { code: 'MISSING_FORMAT', message: 'Output format is required' }
        });
      }

      const result = await sanitizationService.formatOutput(data, {
        format,
        ...options
      });

      res.set({
        'Content-Type': result.contentType,
        'Content-Length': result.size.toString(),
        ...(result.headers || {})
      });

      if (Buffer.isBuffer(result.content)) {
        res.send(result.content);
      } else {
        res.send(result.content);
      }

    } catch (error: any) {
      console.error('Output formatting error:', error);
      res.status(500).json({
        error: {
          code: 'FORMATTING_ERROR',
          message: 'Failed to format output',
          details: error.message
        }
      });
    }
  });

  // Health check and status endpoints
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const healthStatus = {
        status: 'healthy',
        services: {
          gemini: await geminiService.getRateLimitStatus('default').then(() => 'active').catch(() => 'inactive'),
          summarization: 'active',
          chat: 'active',
          extraction: 'active',
          translation: 'active',
          comparison: 'active',
          sentiment: 'active',
          sanitization: 'active'
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: healthStatus
      });

    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Health check failed',
          details: error.message
        }
      });
    }
  });

  router.get('/capabilities', async (req: Request, res: Response) => {
    try {
      const capabilities = {
        summarization: {
          types: ['extractive', 'abstractive', 'bullet_points', 'executive', 'technical', 'creative'],
          lengths: ['short', 'medium', 'long', 'custom'],
          features: ['batch_processing', 'multiple_formats', 'keyword_extraction', 'metrics']
        },
        chat: {
          features: ['context_management', 'streaming', 'session_management', 'multi_document'],
          supportedFormats: ['brief', 'detailed', 'bullet_points', 'conversational']
        },
        extraction: {
          types: Object.values(ExtractionType),
          features: ['keyword_clustering', 'content_mapping', 'structured_data']
        },
        translation: {
          languages: translationService.getSupportedLanguages().length,
          features: ['auto_detection', 'batch_translation', 'quality_assessment']
        },
        comparison: {
          types: Object.values(ComparisonType),
          features: ['multi_document', 'plagiarism_detection', 'version_comparison']
        },
        sentiment: {
          types: Object.values(SentimentAnalysisType),
          features: ['emotion_detection', 'aspect_sentiment', 'batch_analysis']
        }
      };

      res.json({
        success: true,
        data: capabilities
      });

    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'CAPABILITIES_ERROR',
          message: 'Failed to retrieve capabilities',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/ai/quick-actions
   * Get available quick actions for AI features
   */
  router.get('/quick-actions', async (req: Request, res: Response) => {
    try {
      const quickActions = [
        {
          id: 'summarize_document',
          name: 'Summarize Document',
          description: 'Generate a concise summary of the document',
          icon: 'summarize',
          category: 'analysis',
          enabled: true
        },
        {
          id: 'extract_keywords',
          name: 'Extract Keywords',
          description: 'Extract key terms and important keywords',
          icon: 'tag',
          category: 'analysis',
          enabled: true
        },
        {
          id: 'analyze_sentiment',
          name: 'Analyze Sentiment',
          description: 'Determine the emotional tone of the content',
          icon: 'mood',
          category: 'analysis',
          enabled: true
        },
        {
          id: 'translate_document',
          name: 'Translate',
          description: 'Translate document to different languages',
          icon: 'translate',
          category: 'processing',
          enabled: true
        },
        {
          id: 'start_chat',
          name: 'Ask Questions',
          description: 'Start an interactive chat about the document',
          icon: 'chat',
          category: 'interaction',
          enabled: true
        },
        {
          id: 'compare_documents',
          name: 'Compare Documents',
          description: 'Compare this document with others',
          icon: 'compare',
          category: 'analysis',
          enabled: true
        }
      ];

      res.json({
        success: true,
        data: quickActions,
        message: 'Quick actions retrieved successfully'
      });

    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'QUICK_ACTIONS_ERROR',
          message: 'Failed to retrieve quick actions',
          details: error.message
        }
      });
    }
  });

  return router;
}