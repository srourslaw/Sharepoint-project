import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { AuthService } from './services/authService';
import { AuthMiddleware, authErrorHandler } from './middleware/authMiddleware';
import { createAuthRoutes } from './routes/auth';
import { createSharePointRoutes } from './routes/sharepoint';
import { createAdvancedSharePointRoutes } from './routes/sharepoint-advanced';
import { createGeminiRoutes } from './routes/gemini';
import { createAIFeaturesRoutes } from './routes/aiFeatures';
import { createPnPRoutes } from './routes/pnpRoutes';
import { authConfig, serverConfig, validateConfig } from './utils/config';

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

// Initialize Express app
const app = express();

// Initialize services
const authService = new AuthService(authConfig);
const authMiddleware = new AuthMiddleware(authService);

// Middleware setup
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static('public'));

// Add token refresh middleware globally
app.use(authMiddleware.refreshTokens);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SharePoint Dashboard API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: serverConfig.environment
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: serverConfig.environment
  });
});

// Authentication routes
app.use('/auth', createAuthRoutes(authService, authMiddleware));

// Protected SharePoint API routes
app.use('/api/sharepoint', createSharePointRoutes(authService, authMiddleware));
app.use('/api/sharepoint-advanced', createAdvancedSharePointRoutes(authService, authMiddleware));
app.use('/api/pnp', createPnPRoutes(authService, authMiddleware));
app.use('/api/gemini', createGeminiRoutes(authService, authMiddleware));
app.use('/api/ai', createAIFeaturesRoutes(authService, authMiddleware));

// Sample protected route for testing
app.get('/api/protected', 
  authMiddleware.requireAuth, 
  (req, res) => {
    res.json({
      success: true,
      message: 'This is a protected route!',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  }
);

// Sample public route for testing
app.get('/api/public', 
  authMiddleware.optionalAuth,
  (req, res) => {
    res.json({
      success: true,
      message: 'This is a public route!',
      authenticated: !!req.user,
      user: req.user || null,
      timestamp: new Date().toISOString()
    });
  }
);

// Error handling middleware
app.use(authErrorHandler);

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
const port = serverConfig.port;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Environment: ${serverConfig.environment}`);
  console.log(`🔐 Auth redirect URI: ${authConfig.redirectUri}`);
  console.log(`🌐 CORS origin: ${serverConfig.corsOrigin}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  / - Health check`);
  console.log(`   GET  /health - Detailed health status`);
  console.log(`   GET  /auth/login - Start OAuth login`);
  console.log(`   GET  /auth/callback - OAuth callback`);
  console.log(`   GET  /auth/me - Get current user (protected)`);
  console.log(`   GET  /auth/status - Check auth status`);
  console.log(`   POST /auth/logout - Logout`);
  console.log(`   GET  /api/protected - Sample protected route`);
  console.log(`   GET  /api/public - Sample public route`);
  console.log(`   GET  /api/sharepoint/sites - Get SharePoint sites (protected)`);
  console.log(`   GET  /api/sharepoint/files - Get OneDrive files (protected)`);
  console.log(`\n📁 Advanced SharePoint API:`);
  console.log(`   GET  /api/sharepoint-advanced/sites - List all sites`);
  console.log(`   GET  /api/sharepoint-advanced/drives/:id/items/:itemId/children - List folder contents`);
  console.log(`   GET  /api/sharepoint-advanced/drives/:id/items/:itemId/content - Download file`);
  console.log(`   POST /api/sharepoint-advanced/drives/:id/items/:parentId/children - Upload files`);
  console.log(`   GET  /api/sharepoint-advanced/search?q=query - Search files`);
  console.log(`   GET  /api/sharepoint-advanced/cache/stats - Cache statistics`);
  console.log(`\n🤖 Gemini AI API:`);
  console.log(`   GET  /api/gemini/health - Service health check`);
  console.log(`   POST /api/gemini/generate - Basic text generation`);
  console.log(`   POST /api/gemini/analyze-text - Analyze text content`);
  console.log(`   POST /api/gemini/analyze-file - Analyze uploaded file`);
  console.log(`   POST /api/gemini/question - Ask questions about documents`);
  console.log(`   POST /api/gemini/chat - Chat with documents`);
  console.log(`   POST /api/gemini/summarize - Summarize text`);
  console.log(`   POST /api/gemini/stream - Streaming text generation`);
  console.log(`   GET  /api/gemini/usage - Usage statistics`);
  console.log(`\n🧠 AI Features API:`);
  console.log(`   POST /api/ai/summarize - Document summarization with multiple formats`);
  console.log(`   POST /api/ai/summarize/batch - Batch document summarization`);
  console.log(`   POST /api/ai/chat/start - Start document chat session`);
  console.log(`   POST /api/ai/chat/message - Send chat message`);
  console.log(`   GET  /api/ai/chat/session/:id - Get chat session`);
  console.log(`   POST /api/ai/extract - Content extraction and keyword identification`);
  console.log(`   POST /api/ai/extract/keywords/clusters - Keyword clustering`);
  console.log(`   POST /api/ai/translate - Language translation`);
  console.log(`   GET  /api/ai/translate/languages - Supported languages`);
  console.log(`   POST /api/ai/translate/detect - Language detection`);
  console.log(`   POST /api/ai/compare - Document comparison`);
  console.log(`   POST /api/ai/compare/similarity - Find similar documents`);
  console.log(`   POST /api/ai/sentiment - Sentiment analysis`);
  console.log(`   POST /api/ai/sentiment/batch - Batch sentiment analysis`);
  console.log(`   POST /api/ai/upload/analyze - Upload and analyze files`);
  console.log(`   POST /api/ai/format - Output formatting`);
  console.log(`   GET  /api/ai/health - AI services health check`);
  console.log(`   GET  /api/ai/capabilities - Available AI capabilities`);
  console.log(`\n🔍 PnP.js Enhanced SharePoint API:`);
  console.log(`   GET  /api/pnp/health - PnP.js service health check and connectivity test`);
  console.log(`   POST /api/pnp/search - Cross-site search with advanced filtering`);
  console.log(`   GET  /api/pnp/libraries - Enumerate all document libraries across sites`);
  console.log(`   GET  /api/pnp/files/:fileId/details - Enhanced file details with metadata`);
  console.log(`   GET  /api/pnp/capabilities - PnP.js service capabilities and features`);
  console.log(`\n🎨 Demo Interface:`);
  console.log(`   GET  /ai-features-demo.html - Interactive AI features demonstration`);
});
