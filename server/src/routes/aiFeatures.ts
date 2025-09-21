import { Router, Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { GeminiService } from '../services/geminiService';
import { OpenAIService } from '../services/openaiService';
import { DocumentSummarizationService, EnhancedSummarizationRequest } from '../services/documentSummarizationService';
import { DocumentChatService, EnhancedChatRequest } from '../services/documentChatService';
import { ContentExtractionService, ExtractionType } from '../services/contentExtractionService';
import { TranslationService, TranslationRequest } from '../services/translationService';
import { DocumentComparisonService, ComparisonType } from '../services/documentComparisonService';
import { SentimentAnalysisService, SentimentAnalysisType } from '../services/sentimentAnalysisService';
import { SanitizationService } from '../services/sanitizationService';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import { SharePointService } from '../services/sharepointService';
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
  authMiddleware: AuthMiddleware,
  sharepointService?: SharePointService
): Router {
  const router = Router();

  // Initialize AI services - create both OpenAI and Gemini instances
  let aiService: GeminiService | OpenAIService;
  let openaiService: OpenAIService | null = null;
  let geminiService: GeminiService | null = null;

  // Initialize both services if API keys are available
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
    openaiService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-5-nano',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '8192'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.AI_TIMEOUT || '30000')
    });
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    geminiService = new GeminiService({
      apiKey: process.env.GEMINI_API_KEY,
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
  }

  // Set default service - prefer OpenAI if available
  if (openaiService) {
    console.log('🤖 Using OpenAI service as default');
    aiService = openaiService;
  } else if (geminiService) {
    console.log('🤖 Using GEMINI service as default');
    aiService = geminiService;
  } else {
    throw new Error('No AI service available - please configure OpenAI or Gemini API keys');
  }

  // Function to get AI service by type
  const getAIService = (modelType: string = 'default'): GeminiService | OpenAIService => {
    switch (modelType) {
      case 'openai':
        if (!openaiService) throw new Error('OpenAI service not available');
        return openaiService;
      case 'gemini':
        if (!geminiService) throw new Error('Gemini service not available');
        return geminiService;
      case 'claude':
        throw new Error('Claude AI not implemented yet');
      default:
        return aiService;
    }
  };

  const analysisService = new DocumentAnalysisService(aiService as any);
  const summarizationService = new DocumentSummarizationService(aiService as any, analysisService);
  const chatService = new DocumentChatService(aiService as any, analysisService);
  const extractionService = new ContentExtractionService(aiService as any, analysisService);
  const translationService = new TranslationService(aiService as any);
  const comparisonService = new DocumentComparisonService(aiService as any, extractionService, analysisService);
  const sentimentService = new SentimentAnalysisService(aiService as any);
  const sanitizationService = new SanitizationService();
  
  // Simple in-memory storage for chat sessions
  const chatSessions = new Map<string, any>();

  // Helper function to truncate text to fit within token limits
  const truncateTextForTokens = (text: string, maxTokens: number = 60000): string => {
    if (!text) return text;
    
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Truncate and add notice
    const truncated = text.substring(0, maxChars);
    return truncated + '\n\n[NOTE: Document content has been truncated due to size limits. This shows the first part of the document.]';
  };

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
      const { text, documentIds, summaryType, length, aiModel, ...options }: EnhancedSummarizationRequest & { documentIds?: string[]; aiModel?: string } = req.body;

      // Get the appropriate AI service based on the request
      const selectedAIService = aiModel ? getAIService(aiModel) : aiService;

      let textContent = text;

      // If documentIds are provided, fetch and combine document content
      if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        console.log('📄 AI Summarize: Processing document IDs:', documentIds);
        
        try {
          // Use the document analysis service to fetch document content
          const documentContents: string[] = [];
          
          for (const docId of documentIds) {
            console.log('📄 AI Summarize: Fetching content for document ID:', docId);
            
            try {
              // Use the internal SharePoint file content endpoint with text extraction
              
              try {
                const response = await axios.get(`http://localhost:3001/api/sharepoint-advanced/files/${docId}/content?extractText=true&format=text`, {
                  headers: {
                    'Authorization': req.headers.authorization,
                    'Cookie': req.headers.cookie
                  }
                });
                
                const extractedText = response.data;
                
                if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > 0) {
                  // Truncate text to prevent token limit issues
                  const truncatedText = truncateTextForTokens(extractedText, 40000); // More space for summarization
                  documentContents.push(`[Document ID: ${docId}]\n${truncatedText}`);
                  console.log('✅ AI Summarize: Added actual document content for analysis, original length:', extractedText.length, 'truncated length:', truncatedText.length);
                } else {
                  console.warn('⚠️ AI Summarize: No text content extracted from document:', docId);
                }
                
              } catch (apiError: any) {
                console.warn('⚠️ AI Summarize: API error fetching content for document:', docId, apiError.message);
              }
              
            } catch (docFetchError: any) {
              console.warn('⚠️ AI Summarize: Could not fetch content for document:', docId, docFetchError.message);
              // Continue with other documents
            }
          }
          
          if (documentContents.length === 0) {
            return res.status(400).json({
              error: { code: 'NO_DOCUMENT_CONTENT', message: 'Could not extract text from any of the provided documents' }
            });
          }
          
          // Combine all document contents
          textContent = documentContents.join('\n\n--- Document Separator ---\n\n');
          console.log('📄 AI Summarize: Combined document content, total length:', textContent.length);
          
        } catch (docError: any) {
          console.error('📄 AI Summarize: Error fetching document content:', docError);
          return res.status(500).json({
            error: { code: 'DOCUMENT_FETCH_ERROR', message: 'Failed to fetch document content: ' + docError.message }
          });
        }
      }

      if (!textContent) {
        return res.status(400).json({
          error: { code: 'MISSING_CONTENT', message: 'Either text content or document IDs are required' }
        });
      }

      // Sanitize input
      const sanitizedResult = await sanitizationService.sanitizeInput(textContent, {
        maxLength: 100000,
        stripHtml: true,
        preventInjection: true
      });

      if (!sanitizedResult.metadata.riskLevel || sanitizedResult.metadata.riskLevel === 'high') {
        return res.status(400).json({
          error: { code: 'SECURITY_RISK', message: 'Content flagged for security risks' }
        });
      }

      console.log(`🤖 AI Summarize: Sending to ${aiModel || 'default'} for summarization...`);

      // Create a temporary summarization service with the selected AI model
      const tempAnalysisService = new DocumentAnalysisService(selectedAIService as any);
      const tempSummarizationService = new DocumentSummarizationService(selectedAIService as any, tempAnalysisService);

      const result = await tempSummarizationService.summarizeDocument({
        text: sanitizedResult.sanitizedValue,
        summaryType: summaryType || 'abstractive',
        length: length || 'medium',
        ...options
      });

      console.log('✅ AI Summarize: GEMINI summarization completed');
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

      console.log('📄 AI Chat Start: Processing document IDs:', documentIds);
      
      // Fetch document contents for the chat session
      const documentContents: string[] = [];
      
      for (const docId of documentIds) {
        try {
          console.log('📄 AI Chat: Fetching content for document ID:', docId);
          
          // Use the internal SharePoint file content endpoint with text extraction
          // This mimics the /api/sharepoint-advanced/files/:fileId/content?extractText=true endpoint
          
          try {
            // First, get file metadata to determine the file type
            const fileMetadataResponse = await axios.get(`http://localhost:3001/api/sharepoint-advanced/files/${docId}`, {
              headers: {
                'Authorization': req.headers.authorization,
                'Cookie': req.headers.cookie
              }
            });
            
            const fileMetadata = fileMetadataResponse.data;
            const fileName = fileMetadata?.name || 'Unknown File';
            const fileType = fileMetadata?.mimeType || 'unknown';
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            
            console.log('📄 AI Chat: File metadata -', {
              docId,
              name: fileName,
              type: fileType,
              extension: fileExtension,
              size: fileMetadata?.size
            });
            
            const response = await axios.get(`http://localhost:3001/api/sharepoint-advanced/files/${docId}/content?extractText=true&format=text`, {
              headers: {
                'Authorization': req.headers.authorization,
                'Cookie': req.headers.cookie
              }
            });
            
            const extractedText = response.data;
            
            console.log('📄 AI Chat: Content extraction result -', {
              docId,
              fileName,
              fileType,
              extractedTextType: typeof extractedText,
              extractedTextLength: extractedText?.length || 0,
              extractedTextPreview: typeof extractedText === 'string' ? extractedText.substring(0, 100) + '...' : String(extractedText).substring(0, 100) + '...'
            });
            
            if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > 0) {
              // Truncate text to prevent token limit issues - using smaller limit for images
              const isImageFile = fileType && (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension));
              const tokenLimit = isImageFile ? 5000 : 15000; // Much smaller for images, moderate for other files
              const truncatedText = truncateTextForTokens(extractedText, tokenLimit);
              documentContents.push(`[File: ${fileName}]\n[Type: ${fileType}]\n[Document ID: ${docId}]\n${truncatedText}`);
              console.log('✅ AI Chat: Added document content -', {
                fileName,
                fileType,
                originalLength: extractedText.length,
                truncatedLength: truncatedText.length
              });
            } else {
              console.warn('⚠️ AI Chat: No text content extracted from document -', {
                docId,
                fileName,
                fileType,
                extractedText: typeof extractedText,
                extractedTextValue: extractedText
              });
              
              // For images, add a note that OCR might be needed
              if (fileType && (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension))) {
                documentContents.push(`[File: ${fileName}]\n[Type: Image - ${fileType}]\n[Document ID: ${docId}]\n[NOTE: This is an image file. Text extraction from images requires OCR processing which may have limited results.]`);
                console.log('📷 AI Chat: Added image file placeholder for:', fileName);
              }
            }
            
          } catch (apiError: any) {
            console.error('❌ AI Chat: API error fetching content for document:', docId, {
              error: apiError.message,
              status: apiError.response?.status,
              statusText: apiError.response?.statusText,
              data: apiError.response?.data
            });
          }
          
        } catch (docFetchError: any) {
          console.warn('⚠️ AI Chat: Could not fetch content for document:', docId, docFetchError.message);
        }
      }

      // Create a simple chat session with document content
      const sessionId = `chat_${userId}_${Date.now()}`;
      const session = {
        sessionId,
        userId,
        title: title || 'Document Chat',
        documentIds,
        documentContent: documentContents.join('\n\n--- Document Separator ---\n\n'),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ AI Chat: Created session with', documentContents.length, 'documents, total content length:', session.documentContent.length);

      // Store the session
      chatSessions.set(sessionId, session);

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
      const { message, sessionId } = req.body;

      if (!message || !sessionId) {
        return res.status(400).json({
          error: { code: 'MISSING_PARAMETERS', message: 'Message and session ID are required' }
        });
      }

      // Get the chat session
      const session = chatSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found' }
        });
      }

      console.log('💬 AI Chat: Processing message for session:', sessionId, 'Message:', message.substring(0, 100));
      console.log('💬 AI Chat: Session details -', {
        sessionId,
        documentIds: session.documentIds,
        documentContentLength: session.documentContent?.length || 0,
        messageCount: session.messages?.length || 0
      });

      // Sanitize message
      const sanitizedResult = await sanitizationService.sanitizeInput(message, {
        maxLength: 10000,
        stripHtml: true,
        preventInjection: true
      });

      if (sanitizedResult.metadata.riskLevel === 'high') {
        return res.status(400).json({
          error: { code: 'SECURITY_RISK', message: 'Message flagged for security risks' }
        });
      }

      // Create the prompt with document content - implement smart chunking
      const documentContext = session.documentContent || '';
      console.log('💬 AI Chat: Document context -', {
        hasDocumentContext: !!documentContext,
        documentContextLength: documentContext.length,
        documentContextPreview: documentContext.substring(0, 200) + '...'
      });
      
      // Implement intelligent content chunking to stay within token limits
      const MAX_CONTEXT_TOKENS = 6000; // Leave room for system prompt and response
      let processedDocumentContext = documentContext;
      
      if (documentContext.length > MAX_CONTEXT_TOKENS) {
        console.log('📄 AI Chat: Document too large, implementing smart chunking...');
        
        // Extract key sections and create summary
        const paragraphs = documentContext.split('\n\n').filter((p: string) => p.trim().length > 50);
        let selectedContent = '';
        let currentLength = 0;
        
        // Prioritize content based on question keywords
        const questionKeywords = sanitizedResult.sanitizedValue.toLowerCase().split(' ')
          .filter((word: string) => word.length > 3);
        
        // Score paragraphs by relevance to question
        const scoredParagraphs = paragraphs.map((paragraph: string) => {
          const lowerParagraph = paragraph.toLowerCase();
          const score = questionKeywords.reduce((acc: number, keyword: string) => {
            return acc + (lowerParagraph.includes(keyword) ? 2 : 0);
          }, 0);
          return { paragraph, score, length: paragraph.length };
        }).sort((a: any, b: any) => b.score - a.score);
        
        // Select most relevant content within token limit
        for (const item of scoredParagraphs) {
          if (currentLength + item.length <= MAX_CONTEXT_TOKENS) {
            selectedContent += item.paragraph + '\n\n';
            currentLength += item.length;
          }
        }
        
        // If still too much content, take first portion and add summary note
        if (selectedContent.length === 0) {
          selectedContent = documentContext.substring(0, MAX_CONTEXT_TOKENS) + 
            '\n\n[Note: Content truncated due to length. This represents the beginning of the document.]';
        }
        
        processedDocumentContext = selectedContent;
        console.log('📄 AI Chat: Content chunked -', {
          originalLength: documentContext.length,
          processedLength: processedDocumentContext.length,
          reductionRatio: Math.round((1 - processedDocumentContext.length / documentContext.length) * 100) + '%'
        });
      }
      
      const prompt = `You are a helpful AI assistant specialized in analyzing and answering questions about documents. 

${processedDocumentContext ? `Based on the following document content, please answer the user's question:

DOCUMENT CONTENT:
${processedDocumentContext}

USER QUESTION: ${sanitizedResult.sanitizedValue}

Please provide a helpful and accurate answer based on the document content. If the question cannot be answered from the document content, please say so clearly.` : 
`USER QUESTION: ${sanitizedResult.sanitizedValue}

I don't have any document content available to analyze. Please provide documents for me to analyze and answer questions about.`}`;

      console.log('🤖 AI Chat: Sending prompt to OpenAI -', {
        promptLength: prompt.length,
        messageLength: message.length,
        sessionDocumentIds: session.documentIds,
        hasDocumentContent: !!documentContext
      });

      // Send to AI service
      const aiResponse = await aiService.generateText({
        prompt,
        maxTokens: 500,
        temperature: 0.7
      });

      console.log('✅ AI Chat: Received response from AI, length:', aiResponse.text.length);

      // Create response message
      const responseMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.text,
        timestamp: new Date().toISOString()
      };

      // Add messages to session
      const userMessage = {
        id: `msg_${Date.now() - 1}`,
        role: 'user',
        content: sanitizedResult.sanitizedValue,
        timestamp: new Date().toISOString()
      };

      session.messages.push(userMessage, responseMessage);
      session.updatedAt = new Date().toISOString();
      chatSessions.set(sessionId, session);

      res.json({
        success: true,
        data: {
          sessionId,
          message: responseMessage,
          processingTime: Date.now()
        }
      });

    } catch (error: any) {
      console.error('❌ AI Chat: Error processing message -', {
        sessionId: req.body.sessionId,
        message: req.body.message?.substring(0, 100) + '...',
        error: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name,
        errorCode: error.code,
        errorStatus: error.status || error.statusCode
      });
      
      // Handle specific AI service errors
      if (error.message && error.message.includes('Request too large')) {
        console.error('❌ AI Chat: Token limit exceeded error');
        res.status(400).json({
          error: {
            code: 'DOCUMENT_TOO_LARGE',
            message: 'The document is too large to analyze. Please try with a smaller document or ask more specific questions.',
            details: 'Token limit exceeded'
          }
        });
      } else if (error.message && error.message.includes('rate limit')) {
        console.error('❌ AI Chat: Rate limit exceeded error');
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'AI service rate limit exceeded. Please wait a moment and try again.',
            details: error.message
          }
        });
      } else if (error.code && error.code.includes('INVALID_REQUEST')) {
        console.error('❌ AI Chat: Invalid request error');
        res.status(400).json({
          error: {
            code: 'INVALID_AI_REQUEST',
            message: 'There was an issue with the AI request format. This might be due to document content format issues.',
            details: error.message
          }
        });
      } else {
        console.error('❌ AI Chat: Generic error - sending technical difficulties message');
        res.status(500).json({
          error: {
            code: 'CHAT_MESSAGE_ERROR',
            message: 'I\'m experiencing some technical difficulties connecting to the AI service. Please try again in a moment, or select a document to analyze.',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          }
        });
      }
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
          aiService: aiService instanceof OpenAIService ? 'openai-active' : 'gemini-active',
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

  /**
   * GET /api/ai/models
   * Get available AI models and their status
   */
  router.get('/models', async (req: Request, res: Response) => {
    try {
      const models = [
        {
          id: 'openai',
          name: 'OpenAI (GPT-5-nano)',
          provider: 'OpenAI',
          description: 'Advanced AI model for comprehensive document analysis',
          available: !!openaiService,
          default: !!openaiService,
          color: '#00A67E'
        },
        {
          id: 'gemini',
          name: 'Gemini AI',
          provider: 'Google',
          description: 'Google\'s advanced AI model for document processing',
          available: !!geminiService,
          default: !openaiService && !!geminiService,
          color: '#4285F4'
        },
        {
          id: 'claude',
          name: 'Claude AI',
          provider: 'Anthropic',
          description: 'Anthropic\'s Claude AI for intelligent analysis',
          available: false,
          default: false,
          color: '#FF6B35'
        }
      ];

      res.json({
        success: true,
        data: models,
        message: 'Available AI models retrieved successfully'
      });

    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'MODELS_ERROR',
          message: 'Failed to retrieve AI models',
          details: error.message
        }
      });
    }
  });

  return router;
}