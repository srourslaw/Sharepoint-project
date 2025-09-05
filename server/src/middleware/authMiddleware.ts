import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedUser, AuthError } from '../types/auth';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: {
        id: string;
        accessToken: string;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Middleware to require authentication for protected routes
   */
  requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        this.sendAuthError(res, 'MISSING_SESSION', 'Authentication required. No session found.', 401);
        return;
      }

      const user = await this.authService.validateSession(sessionId);
      
      if (!user) {
        this.sendAuthError(res, 'INVALID_SESSION', 'Authentication required. Session is invalid or expired.', 401);
        return;
      }

      // Get fresh session data for access token
      const session = this.authService.getSession(sessionId);
      if (!session) {
        this.sendAuthError(res, 'SESSION_NOT_FOUND', 'Authentication session not found.', 401);
        return;
      }

      // Attach user and session info to request
      req.user = user;
      req.session = {
        id: sessionId,
        accessToken: session.accessToken,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      this.sendAuthError(res, 'AUTH_MIDDLEWARE_ERROR', 'Authentication verification failed.', 500);
    }
  };

  /**
   * Middleware to optionally include user info if authenticated
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = this.extractSessionId(req);
      
      if (sessionId) {
        const user = await this.authService.validateSession(sessionId);
        const session = this.authService.getSession(sessionId);
        
        if (user && session) {
          req.user = user;
          req.session = {
            id: sessionId,
            accessToken: session.accessToken,
          };
        }
      }

      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Don't block the request for optional auth
      next();
    }
  };

  /**
   * Middleware to check for specific Microsoft Graph permissions/scopes
   */
  requireScope = (requiredScope: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user || !req.session) {
        this.sendAuthError(res, 'AUTHENTICATION_REQUIRED', 'Authentication required to access this resource.', 401);
        return;
      }

      try {
        // In a more complex implementation, you would validate the actual scopes
        // For now, we'll just ensure the user is authenticated with a valid session
        const session = this.authService.getSession(req.session.id);
        
        if (!session) {
          this.sendAuthError(res, 'INSUFFICIENT_SCOPE', `Access denied. Required scope: ${requiredScope}`, 403);
          return;
        }

        next();
      } catch (error) {
        console.error('Scope validation error:', error);
        this.sendAuthError(res, 'SCOPE_VALIDATION_ERROR', 'Failed to validate required permissions.', 500);
      }
    };
  };

  /**
   * Middleware to refresh tokens proactively
   */
  refreshTokens = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = this.extractSessionId(req);
      
      if (sessionId) {
        // This will automatically refresh tokens if they're about to expire
        await this.authService.refreshSessionIfNeeded(sessionId);
      }

      next();
    } catch (error) {
      console.error('Token refresh middleware error:', error);
      // Don't block the request if token refresh fails
      // The main auth middleware will handle the invalid session
      next();
    }
  };

  /**
   * Extract session ID from various sources (headers, cookies, query params)
   */
  private extractSessionId(req: Request): string | null {
    // Check Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check custom session header
    const sessionHeader = req.headers['x-session-id'] as string;
    if (sessionHeader) {
      return sessionHeader;
    }

    // Check cookies
    const sessionCookie = req.cookies?.['session-id'];
    if (sessionCookie) {
      return sessionCookie;
    }

    // Check query parameters (least secure, use only for development)
    const sessionQuery = req.query.sessionId as string;
    if (sessionQuery) {
      return sessionQuery;
    }

    return null;
  }

  /**
   * Send standardized authentication error response
   */
  private sendAuthError(res: Response, code: string, message: string, statusCode: number): void {
    res.status(statusCode).json({
      error: {
        code,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Error handling middleware for authentication errors
 */
export const authErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error && typeof error === 'object' && 'code' in error && 'statusCode' in error) {
    const authError = error as AuthError;
    res.status(authError.statusCode).json({
      error: {
        code: authError.code,
        message: authError.message,
        statusCode: authError.statusCode,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Pass non-auth errors to the next error handler
  next(error);
};