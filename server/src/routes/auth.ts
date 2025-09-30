import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { authConfig } from '../utils/config';

export const createAuthRoutes = (authService: AuthService, authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  /**
   * GET /auth/login
   * Initiate OAuth 2.0 login flow with Microsoft
   */
  router.get('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔐 Initiating real Microsoft OAuth login...');
      
      // Generate state for CSRF protection
      const state = 'auth_state_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      
      // Get Microsoft OAuth authorization URL
      const authUrl = await authService.getAuthUrl(state);
      
      console.log('🔗 Redirecting to Microsoft login:', authUrl);
      
      // Redirect user to Microsoft login page
      res.redirect(authUrl);
      
    } catch (error: any) {
      console.error('Microsoft login error:', error);
      res.status(500).json({
        error: {
          code: 'AUTH_URL_FAILED',
          message: 'Failed to generate Microsoft authorization URL',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /auth/callback
   * Handle OAuth 2.0 callback
   */
  router.get('/callback', async (req: Request, res: Response): Promise<void> => {
    console.log('🔄 OAuth callback received:', req.query);

    // Get frontend URL for redirects
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8081';
    const frontendUrl = corsOrigin.split(',')[0].trim();

    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors - redirect to frontend with error
      if (error) {
        console.error('❌ OAuth error:', { error, error_description });
        const errorUrl = `${frontendUrl}/?error=${encodeURIComponent(error as string)}&error_description=${encodeURIComponent((error_description as string) || 'OAuth authentication failed')}`;
        res.redirect(errorUrl);
        return;
      }

      if (!code) {
        console.error('❌ Missing authorization code');
        const errorUrl = `${frontendUrl}/?error=missing_code&error_description=${encodeURIComponent('Authorization code not provided')}`;
        res.redirect(errorUrl);
        return;
      }

      console.log('🔑 Exchanging authorization code for tokens...');

      // Exchange code for tokens
      const tokenResponse = await authService.exchangeCodeForTokens(code as string);
      console.log('✅ Tokens received successfully');

      // Create session
      console.log('📝 Creating authentication session...');
      const sessionId = await authService.createSession(tokenResponse);
      console.log('✅ Session created:', sessionId);

      // Set session cookie - optimized for Safari private mode
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = process.env.AZURE_REDIRECT_URI || '';
      const isNgrok = redirectUri.includes('ngrok-free.app');

      res.cookie('session-id', sessionId, {
        httpOnly: true,
        secure: isNgrok, // Use secure cookies for HTTPS ngrok
        sameSite: 'lax', // Essential for Safari private mode
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        // Remove domain for better compatibility
      });

      // Redirect back to frontend after successful authentication
      console.log('🎉 OAuth callback successful, redirecting to frontend');
      console.log('🔄 Frontend URL:', frontendUrl);

      const successUrl = `${frontendUrl}/?sessionId=${sessionId}&auth=success`;
      console.log('🔄 Full redirect URL:', successUrl);

      res.redirect(successUrl);

    } catch (error: any) {
      console.error('❌ OAuth callback error:', error);

      // Instead of returning JSON error (which Safari private doesn't handle well),
      // redirect to frontend with error parameters
      const errorUrl = `${frontendUrl}/?error=callback_failed&error_description=${encodeURIComponent('Authentication session creation failed')}`;

      console.log('🔄 Redirecting to error URL:', errorUrl);
      res.redirect(errorUrl);
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken, sessionId } = req.body;

      if (!refreshToken && !sessionId) {
        res.status(400).json({
          error: {
            code: 'MISSING_REFRESH_DATA',
            message: 'Refresh token or session ID required'
          }
        });
        return;
      }

      let newTokens;
      
      if (sessionId) {
        // Refresh using session
        const session = await authService.refreshSessionIfNeeded(sessionId);
        if (!session) {
          res.status(401).json({
            error: {
              code: 'INVALID_SESSION',
              message: 'Session not found or expired'
            }
          });
          return;
        }
        
        newTokens = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        };
      } else {
        // Direct refresh token usage
        newTokens = await authService.refreshToken(refreshToken);
      }

      res.json({
        success: true,
        tokens: newTokens,
        message: 'Tokens refreshed successfully'
      });
    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh access token',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user information
   */
  router.get('/me', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        user: req.user,
        session: {
          id: req.session?.id,
          hasValidToken: !!req.session?.accessToken
        }
      });
    } catch (error: any) {
      console.error('Get user info error:', error);
      res.status(500).json({
        error: {
          code: 'USER_INFO_ERROR',
          message: 'Failed to retrieve user information',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout and revoke session
   */
  router.post('/logout', authMiddleware.optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.session?.id || req.body.sessionId;
      
      if (sessionId) {
        authService.revokeSession(sessionId);
      }

      // Clear session cookie
      res.clearCookie('session-id');

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Failed to logout',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /auth/status
   * Check authentication status
   */
  router.get('/status', authMiddleware.optionalAuth, async (req: Request, res: Response): Promise<void> => {
    res.json({
      authenticated: !!req.user,
      user: req.user || null,
      sessionActive: !!req.session
    });
  });

  /**
   * TEST ROUTE: Simple Microsoft Graph API Test
   * Test direct Microsoft Graph API calls without SharePoint service
   */
  router.get('/test-sharepoint', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 Testing direct Microsoft Graph API...');
      
      if (!req.session?.accessToken) {
        res.status(401).json({
          error: 'No access token available',
          authenticated: false
        });
        return;
      }

      console.log('✅ Access token found');
      
      // Test 1: Try to create Graph client
      const graphClient = authService.getGraphClient(req.session.accessToken);
      console.log('✅ Graph client created successfully');
      
      // Test 2: Make a simple Graph API call
      console.log('🔍 Making direct Graph API call to /me...');
      const me = await graphClient.api('/me').get();
      console.log('✅ User info retrieved:', me.displayName);
      
      // Test 3: Try to get SharePoint sites directly through Graph API
      console.log('🔍 Making direct Graph API call to /sites...');
      const sitesResponse = await graphClient.api('/sites').get();
      console.log('✅ Sites API call successful, got', sitesResponse.value?.length || 0, 'sites');
      
      res.json({
        success: true,
        message: 'Direct Microsoft Graph API test completed successfully',
        user: me.displayName,
        sitesCount: sitesResponse.value?.length || 0,
        sites: sitesResponse.value || [],
        authenticated: true
      });
      
    } catch (error: any) {
      console.error('❌ Graph API test failed:', error);
      res.status(500).json({
        error: {
          code: 'GRAPH_API_TEST_ERROR',
          message: 'Microsoft Graph API test failed',
          details: error.message,
          stack: error.stack?.substring(0, 500) // Limit stack trace
        }
      });
    }
  });

  /**
   * TEST ROUTE: Create a fake session for testing
   * Remove this in production!
   */
  router.get('/test-session', async (req: Request, res: Response): Promise<void> => {
    try {
      const fakeUser = {
        id: 'test-user-123',
        displayName: 'Test User',
        mail: 'test@example.com',
        userPrincipalName: 'test@example.com'
      };
      
      const sessionId = 'test-session-' + Date.now();
      
      // Create a fake session directly in memory (bypass getUserInfo call)
      const session = {
        userId: fakeUser.id,
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token', 
        expiresAt: new Date(Date.now() + (3600 * 1000)), // 1 hour
        user: fakeUser,
      };
      
      // Access the private sessions map directly for testing
      (authService as any).sessions.set(sessionId, session);
      
      // Set session cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = process.env.AZURE_REDIRECT_URI || '';
      const isNgrok = redirectUri.includes('ngrok-free.app');

      res.cookie('session-id', sessionId, {
        httpOnly: true,
        secure: isNgrok, // Use secure cookies for HTTPS ngrok
        sameSite: 'lax', // Fixed: Use 'lax' for both localhost and ngrok to fix auth loops
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
        // Remove domain restriction to allow cookies to work across localhost and ngrok
      });
      
      res.json({
        success: true,
        sessionId,
        message: 'Test session created',
        user: fakeUser
      });
      
    } catch (error: any) {
      console.error('Test session creation error:', error);
      res.status(500).json({
        error: {
          code: 'TEST_SESSION_ERROR',
          message: 'Failed to create test session',
          details: error.message
        }
      });
    }
  });

  return router;
};