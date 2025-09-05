import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { AuthService } from '../services/authService';
import { GeminiService } from '../services/geminiService';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import { QuestionAnswerService } from '../services/questionAnswerService';
import { TextSummarizationService, SummaryType, SummaryLength, SummarizationRequest as ServiceSummarizationRequest } from '../services/textSummarizationService';
import { AdvancedFileProcessor } from '../utils/advanced-file-processor';
import { QuickFileValidator } from '../utils/file-validator';
import { 
  GeminiServiceConfig, 
  DocumentAnalysisRequest,
  AnalysisType,
  QuestionAnswerRequest,
  ChatRequest,
  StreamingRequest,
  SummarizationRequest,
  GeminiError,
  GeminiErrorCode
} from '../types/gemini';
import { geminiConfig } from '../utils/config';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow text-based files for document analysis
    const allowedMimeTypes = [
      'text/plain',
      'text/html',
      'text/csv',
      'application/json',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    cb(null, allowedMimeTypes.includes(file.mimetype));
  }
});

export const createGeminiRoutes = (authService: AuthService, authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  // Initialize services
  const geminiServiceConfig: GeminiServiceConfig = {
    apiKey: geminiConfig.apiKey,
    model: 'gemini-pro',
    defaultOptions: {
      temperature: 0.7,
      topK: 40,
      topP: 0.8,
      maxTokens: 2048
    },
    rateLimiting: {
      maxRequests: 100,
      windowMs: 60 * 1000 // 1 minute
    },
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [GeminiErrorCode.RATE_LIMIT_EXCEEDED, GeminiErrorCode.MODEL_OVERLOADED]
    },
    cachingEnabled: true,
    streamingEnabled: true
  };

  const geminiService = new GeminiService(geminiServiceConfig);
  const documentAnalysisService = new DocumentAnalysisService(geminiService);
  const questionAnswerService = new QuestionAnswerService(geminiService);
  const summarizationService = new TextSummarizationService(geminiService);
  const fileProcessor = new AdvancedFileProcessor();

  // All routes require authentication
  router.use(authMiddleware.requireAuth);

  // ==================== HEALTH CHECK ====================

  /**
   * GET /api/gemini/health
   * Health check for Gemini services
   */
  router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await geminiService.healthCheck();
      const rateLimitStatus = await geminiService.getRateLimitStatus(req.user?.id || 'anonymous');
      const usageMetrics = geminiService.getUsageMetrics();
      const sessionStats = questionAnswerService.getSessionStats();

      res.json({
        success: true,
        services: {
          gemini: health,
          rateLimit: rateLimitStatus,
          usage: {
            totalRequests: usageMetrics.totalRequests,
            errorRate: usageMetrics.errorRate,
            averageResponseTime: usageMetrics.averageResponseTime
          },
          chat: sessionStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Health check failed'
        }
      });
    }
  });

  // ==================== TEXT GENERATION ====================

  /**
   * POST /api/gemini/generate
   * Basic text generation
   */
  router.post('/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, maxTokens, temperature, context } = req.body;

      if (!prompt) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_PROMPT', message: 'Prompt is required' }
        });
        return;
      }

      const result = await geminiService.generateText({
        prompt,
        maxTokens,
        temperature,
        context,
        sessionId: req.user?.id
      });

      res.json({
        success: true,
        data: {
          text: result.text,
          tokenCount: result.tokenCount,
          finishReason: result.finishReason,
          model: result.model,
          timestamp: result.timestamp
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== DOCUMENT ANALYSIS ====================

  /**
   * POST /api/gemini/analyze-text
   * Analyze text content
   */
  router.post('/analyze-text', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, analysisType, options } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEXT', message: 'Text to analyze is required' }
        });
        return;
      }

      const analysisRequest: DocumentAnalysisRequest = {
        text,
        analysisType: analysisType || AnalysisType.COMPREHENSIVE,
        options: options || {}
      };

      const result = await documentAnalysisService.analyzeDocument(analysisRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/analyze-file
   * Analyze uploaded file
   */
  router.post('/analyze-file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'File is required' }
        });
        return;
      }

      // Validate file
      const validation = QuickFileValidator.validateForUpload(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE', message: validation.message }
        });
        return;
      }

      // Extract text from file
      const processedFile = await fileProcessor.processFileWithProgress(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        true, // extract text
        `analyze-${Date.now()}`
      );

      if (!processedFile.extractedText) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_TEXT_EXTRACTED', message: 'Could not extract text from file' }
        });
        return;
      }

      // Analyze the extracted text
      const { analysisType, options } = req.body;
      const analysisRequest: DocumentAnalysisRequest = {
        text: processedFile.extractedText,
        analysisType: analysisType || AnalysisType.COMPREHENSIVE,
        options: options || {},
        fileName: req.file.originalname,
        fileType: processedFile.metadata?.fileType
      };

      const result = await documentAnalysisService.analyzeDocument(analysisRequest);

      res.json({
        success: true,
        data: {
          ...result,
          fileInfo: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            processingTime: processedFile.metadata?.processingTimeMs
          }
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/analyze-batch
   * Batch analyze multiple files
   */
  router.post('/analyze-batch', upload.array('files', 5), async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILES', message: 'At least one file is required' }
        });
        return;
      }

      const { analysisType } = req.body;
      const analysisRequests: DocumentAnalysisRequest[] = [];

      // Process each file and extract text
      for (const file of files) {
        try {
          const processedFile = await fileProcessor.processFileWithProgress(
            file.buffer,
            file.mimetype,
            file.originalname,
            true,
            `batch-${Date.now()}-${file.originalname}`
          );

          if (processedFile.extractedText) {
            analysisRequests.push({
              text: processedFile.extractedText,
              analysisType: analysisType || AnalysisType.SUMMARY,
              options: {},
              fileName: file.originalname,
              fileType: processedFile.metadata?.fileType
            });
          }
        } catch (error) {
          console.warn(`Failed to process file ${file.originalname}:`, error);
        }
      }

      if (analysisRequests.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_PROCESSABLE_FILES', message: 'No files could be processed for analysis' }
        });
        return;
      }

      // Batch analyze
      const results = await documentAnalysisService.batchAnalyzeDocuments(analysisRequests);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalFiles: files.length,
            processedFiles: analysisRequests.length,
            analysisType: analysisType || AnalysisType.SUMMARY
          }
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/suggestions
   * Get analysis suggestions for document
   */
  router.post('/suggestions', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEXT', message: 'Text is required' }
        });
        return;
      }

      const suggestions = await documentAnalysisService.getAnalysisSuggestions(text);

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== QUESTION ANSWERING ====================

  /**
   * POST /api/gemini/question
   * Answer question about document
   */
  router.post('/question', async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, context, options, sessionId } = req.body;

      if (!question || !context) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Question and context are required' }
        });
        return;
      }

      const qaRequest: QuestionAnswerRequest = {
        question,
        context,
        options: options || {},
        sessionId
      };

      const result = await questionAnswerService.answerQuestion(qaRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/question-file
   * Answer question about uploaded file
   */
  router.post('/question-file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, options } = req.body;

      if (!req.file || !question) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_REQUIRED_FIELDS', message: 'File and question are required' }
        });
        return;
      }

      // Extract text from file
      const processedFile = await fileProcessor.processFileWithProgress(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        true
      );

      if (!processedFile.extractedText) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_TEXT_EXTRACTED', message: 'Could not extract text from file' }
        });
        return;
      }

      const qaRequest: QuestionAnswerRequest = {
        question,
        context: processedFile.extractedText,
        options: options || {}
      };

      const result = await questionAnswerService.answerQuestion(qaRequest);

      res.json({
        success: true,
        data: {
          ...result,
          fileInfo: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
          }
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/multi-question
   * Answer question using multiple documents
   */
  router.post('/multi-question', upload.array('files', 5), async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const { question, options } = req.body;

      if (!question || !files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Question and files are required' }
        });
        return;
      }

      // Process files and extract text
      const documents: Array<{ text: string; title?: string; source?: string }> = [];

      for (const file of files) {
        try {
          const processedFile = await fileProcessor.processFileWithProgress(
            file.buffer,
            file.mimetype,
            file.originalname,
            true
          );

          if (processedFile.extractedText) {
            documents.push({
              text: processedFile.extractedText,
              title: file.originalname,
              source: file.originalname
            });
          }
        } catch (error) {
          console.warn(`Failed to process file ${file.originalname}:`, error);
        }
      }

      if (documents.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_PROCESSABLE_FILES', message: 'No files could be processed' }
        });
        return;
      }

      const result = await questionAnswerService.answerFromMultipleDocuments(
        question,
        documents,
        { includeSourceReferences: true, ...options }
      );

      res.json({
        success: true,
        data: {
          ...result,
          documentsAnalyzed: documents.length,
          totalFiles: files.length
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== CHAT ====================

  /**
   * POST /api/gemini/chat
   * Chat with document
   */
  router.post('/chat', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId, context, options } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_MESSAGE', message: 'Message is required' }
        });
        return;
      }

      const chatRequest: ChatRequest = {
        message,
        sessionId,
        context,
        options: options || {}
      };

      const result = await questionAnswerService.chatWithDocument(chatRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * GET /api/gemini/chat/sessions
   * List chat sessions
   */
  router.get('/chat/sessions', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const sessions = questionAnswerService.listChatSessions(userId);

      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            sessionId: session.sessionId,
            title: session.title,
            messageCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          }))
        }
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * GET /api/gemini/chat/sessions/:sessionId
   * Get chat session details
   */
  router.get('/chat/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = questionAnswerService.getChatSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found' }
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * DELETE /api/gemini/chat/sessions/:sessionId
   * Delete chat session
   */
  router.delete('/chat/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const deleted = questionAnswerService.deleteChatSession(sessionId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Chat session deleted successfully'
      });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== TEXT SUMMARIZATION ====================

  /**
   * POST /api/gemini/summarize
   * Summarize text
   */
  router.post('/summarize', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, summaryType, length, focusAreas, customInstructions, targetAudience } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEXT', message: 'Text to summarize is required' }
        });
        return;
      }

      const request: ServiceSummarizationRequest = {
        text,
        summaryType: summaryType || SummaryType.ABSTRACTIVE,
        length: length || SummaryLength.MEDIUM,
        focusAreas,
        customInstructions,
        targetAudience,
        includeKeyPoints: true
      };

      const result = await summarizationService.summarizeText(request);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/summarize-file
   * Summarize uploaded file
   */
  router.post('/summarize-file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'File is required' }
        });
        return;
      }

      // Extract text from file
      const processedFile = await fileProcessor.processFileWithProgress(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        true
      );

      if (!processedFile.extractedText) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_TEXT_EXTRACTED', message: 'Could not extract text from file' }
        });
        return;
      }

      const { summaryType, length, focusAreas, customInstructions } = req.body;

      const request: ServiceSummarizationRequest = {
        text: processedFile.extractedText,
        summaryType: summaryType || SummaryType.ABSTRACTIVE,
        length: length || SummaryLength.MEDIUM,
        focusAreas,
        customInstructions,
        includeKeyPoints: true
      };

      const result = await summarizationService.summarizeText(request);

      res.json({
        success: true,
        data: {
          ...result,
          fileInfo: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            processingTime: processedFile.metadata?.processingTimeMs
          }
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/smart-summarize
   * Smart summarization with automatic parameter selection
   */
  router.post('/smart-summarize', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, targetLength, purpose } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEXT', message: 'Text to summarize is required' }
        });
        return;
      }

      const result = await summarizationService.smartSummarize(text, targetLength, purpose);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * POST /api/gemini/batch-summarize
   * Batch summarize multiple files
   */
  router.post('/batch-summarize', upload.array('files', 10), async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILES', message: 'At least one file is required' }
        });
        return;
      }

      // Process files and extract text
      const documents: Array<{ text: string; title?: string; id?: string }> = [];

      for (const file of files) {
        try {
          const processedFile = await fileProcessor.processFileWithProgress(
            file.buffer,
            file.mimetype,
            file.originalname,
            true
          );

          if (processedFile.extractedText) {
            documents.push({
              text: processedFile.extractedText,
              title: file.originalname,
              id: file.originalname
            });
          }
        } catch (error) {
          console.warn(`Failed to process file ${file.originalname}:`, error);
        }
      }

      const { summaryType, length, generateOverallSummary, includeComparison } = req.body;

      const result = await summarizationService.batchSummarize({
        documents,
        summaryType: summaryType || SummaryType.ABSTRACTIVE,
        length: length || SummaryLength.MEDIUM,
        options: {
          generateOverallSummary: generateOverallSummary || false,
          includeComparison: includeComparison || false,
          preserveIndividualSummaries: true
        }
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== STREAMING ====================

  /**
   * POST /api/gemini/stream
   * Start streaming text generation
   */
  router.post('/stream', async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, context, options } = req.body;

      if (!prompt) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_PROMPT', message: 'Prompt is required' }
        });
        return;
      }

      const streamingRequest: StreamingRequest = {
        prompt,
        context,
        options: options || {},
        sessionId: `stream_${Date.now()}_${req.user?.id || 'anonymous'}`
      };

      const session = await geminiService.generateStreamingText(streamingRequest);

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          message: 'Streaming session started. Use WebSocket or polling to get chunks.'
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * GET /api/gemini/stream/:sessionId
   * Get streaming session status and chunks
   */
  router.get('/stream/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const session = geminiService.getStreamingSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Streaming session not found' }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          isActive: session.isActive,
          totalTokens: session.totalTokens,
          chunkCount: session.chunks.length,
          chunks: session.chunks,
          startTime: session.startTime
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  /**
   * DELETE /api/gemini/stream/:sessionId
   * Stop streaming session
   */
  router.delete('/stream/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const stopped = geminiService.stopStreaming(sessionId);

      if (!stopped) {
        res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Streaming session not found or already stopped' }
        });
        return;
      }

      res.json({
        success: true,
        message: 'Streaming session stopped successfully'
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // ==================== USAGE AND STATS ====================

  /**
   * GET /api/gemini/usage
   * Get usage metrics and statistics
   */
  router.get('/usage', async (req: Request, res: Response): Promise<void> => {
    try {
      const { period } = req.query;
      let periodFilter;

      if (period === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        periodFilter = { start: today, end: new Date() };
      } else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        periodFilter = { start: weekAgo, end: new Date() };
      }

      const usageMetrics = geminiService.getUsageMetrics(periodFilter);
      const sessionStats = questionAnswerService.getSessionStats();
      const summaryStats = summarizationService.getSummarizationStats();

      res.json({
        success: true,
        data: {
          usage: usageMetrics,
          chat: sessionStats,
          summarization: summaryStats,
          period: period || 'all'
        }
      });

    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  return router;
};

/**
 * Handle Gemini-specific errors
 */
function handleGeminiError(res: Response, error: any): void {
  if (error instanceof GeminiError) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        retryAfter: error.retryAfter
      }
    });
  } else {
    console.error('Unhandled Gemini API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }
    });
  }
}