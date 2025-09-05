import type { 
  LoginResponse, 
  CallbackResponse, 
  AuthStatusResponse, 
  User,
  AuthError,
  CustomHeaders
} from '../types/auth';
import { AuthStorage } from '../utils/authStorage';

const API_BASE_URL = (window as any).__RUNTIME_CONFIG__?.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Authentication API service
 */
export class AuthApi {
  /**
   * Create authenticated fetch with session ID
   */
  private static async authenticatedFetch(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const sessionId = AuthStorage.getSessionId();
    
    const headers: CustomHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add session ID to headers if available
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });
  }

  /**
   * Handle API response and extract data or throw error
   */
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: AuthError;
      
      try {
        const errorResponse = await response.json();
        errorData = errorResponse.error || {
          code: 'API_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      } catch {
        errorData = {
          code: 'NETWORK_ERROR',
          message: `Network error: ${response.status} ${response.statusText}`,
          statusCode: response.status
        };
      }

      throw errorData;
    }

    try {
      return await response.json();
    } catch (error) {
      throw {
        code: 'PARSE_ERROR',
        message: 'Failed to parse response JSON',
        statusCode: 500
      } as AuthError;
    }
  }

  /**
   * Initiate login flow - get Microsoft OAuth URL
   */
  static async initiateLogin(state?: string): Promise<LoginResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/auth/login`);
      if (state) {
        url.searchParams.append('state', state);
      }

      const response = await fetch(url.toString());
      return this.handleResponse<LoginResponse>(response);
    } catch (error) {
      console.error('Login initiation failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback (usually called by the backend)
   * This method is mainly for reference - the backend handles the actual callback
   */
  static async handleCallback(code: string, state?: string): Promise<CallbackResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/auth/callback`);
      url.searchParams.append('code', code);
      if (state) {
        url.searchParams.append('state', state);
      }

      const response = await fetch(url.toString());
      return this.handleResponse<CallbackResponse>(response);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw error;
    }
  }

  /**
   * Get current authentication status
   */
  static async getAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const response = await this.authenticatedFetch('/auth/status');
      const result = await this.handleResponse<AuthStatusResponse>(response);
      
      // Update last check timestamp
      AuthStorage.setLastCheck();
      
      return result;
    } catch (error) {
      console.error('Auth status check failed:', error);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<{ user: User; session: { id: string; hasValidToken: boolean } }> {
    try {
      const response = await this.authenticatedFetch('/auth/me');
      return this.handleResponse<{ user: User; session: { id: string; hasValidToken: boolean } }>(response);
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  static async refreshTokens(): Promise<{ tokens: any }> {
    try {
      const sessionId = AuthStorage.getSessionId();
      
      if (!sessionId) {
        throw {
          code: 'NO_SESSION',
          message: 'No session ID available for refresh',
          statusCode: 401
        } as AuthError;
      }

      const response = await this.authenticatedFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });

      return this.handleResponse<{ tokens: any }>(response);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<{ message: string }> {
    try {
      const response = await this.authenticatedFetch('/auth/logout', {
        method: 'POST'
      });

      const result = await this.handleResponse<{ message: string }>(response);
      
      // Clear local storage
      AuthStorage.clearSession();
      
      return result;
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local storage even if API call fails
      AuthStorage.clearSession();
      throw error;
    }
  }

  /**
   * Make an authenticated API request to SharePoint endpoints
   */
  static async makeAuthenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await this.authenticatedFetch(endpoint, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      // If token expired, try to refresh and retry once
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        try {
          await this.refreshTokens();
          const retryResponse = await this.authenticatedFetch(endpoint, options);
          return this.handleResponse<T>(retryResponse);
        } catch (refreshError) {
          console.error('Token refresh and retry failed:', refreshError);
          throw refreshError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}