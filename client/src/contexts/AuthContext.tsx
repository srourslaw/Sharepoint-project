import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { 
  AuthContextType, 
  AuthState, 
  AuthError, 
  User, 
  AuthSession 
} from '../types/auth';
import { AuthApi } from '../services/authApi';
import { AuthStorage } from '../utils/authStorage';

// Action types for the reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AuthError | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: AuthSession | null }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    
    case 'SET_SESSION':
      return { 
        ...state, 
        session: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    
    case 'SET_AUTHENTICATED':
      return { 
        ...state, 
        isAuthenticated: action.payload,
        isLoading: false
      };
    
    case 'CLEAR_AUTH':
      return {
        ...initialState,
        isLoading: false
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Get session ID from storage
  const getSessionId = useCallback((): string | null => {
    return AuthStorage.getSessionId();
  }, []);

  // Check if session is valid
  const isSessionValid = useCallback((): boolean => {
    return AuthStorage.isSessionValid();
  }, []);

  // Check authentication status with the server
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // First check local session validity
      if (!AuthStorage.isSessionValid()) {
        dispatch({ type: 'CLEAR_AUTH' });
        return;
      }

      // Check with server if we should revalidate
      if (AuthStorage.shouldRevalidate()) {
        const statusResponse = await AuthApi.getAuthStatus();
        
        if (statusResponse.authenticated && statusResponse.user) {
          // Update local storage with fresh data
          const session = AuthStorage.getSession();
          if (session) {
            AuthStorage.updateSession({
              user: statusResponse.user,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });
          }
          
          dispatch({ type: 'SET_USER', payload: statusResponse.user });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        } else {
          AuthStorage.clearSession();
          dispatch({ type: 'CLEAR_AUTH' });
        }
      } else {
        // Use cached session data
        const session = AuthStorage.getSession();
        if (session && session.user) {
          dispatch({ type: 'SET_USER', payload: session.user });
          dispatch({ type: 'SET_SESSION', payload: session });
        } else {
          dispatch({ type: 'CLEAR_AUTH' });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      
      // Clear invalid session on auth errors
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const authError = error as AuthError;
        if (authError.statusCode === 401 || authError.statusCode === 403) {
          AuthStorage.clearSession();
          dispatch({ type: 'CLEAR_AUTH' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: authError });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: {
          code: 'AUTH_CHECK_FAILED',
          message: 'Failed to check authentication status'
        }});
      }
    }
  }, []);

  // Get dynamic API base URL based on current environment
  const getApiBaseUrl = useCallback((): string => {
    // For development with proxy, use relative URLs
    if (import.meta.env.DEV) {
      return '';  // Vite proxy will handle /auth and /api requests
    }

    // For production or if runtime config is available
    return window.__RUNTIME_CONFIG__?.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  }, []);

  // Login function - redirects to Microsoft OAuth
  const login = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Use dynamic API base URL
      const apiBaseUrl = getApiBaseUrl();
      const loginUrl = `${apiBaseUrl}/auth/login`;

      console.log('🔐 Redirecting to login:', loginUrl);
      window.location.href = loginUrl;

    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  }, [getApiBaseUrl]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await AuthApi.logout();
      
      // Clear all auth data
      AuthStorage.clearSession();
      sessionStorage.removeItem('oauth_state');
      
      dispatch({ type: 'CLEAR_AUTH' });
      
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Clear local data even if API call fails
      AuthStorage.clearSession();
      sessionStorage.removeItem('oauth_state');
      dispatch({ type: 'CLEAR_AUTH' });
      
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  }, []);

  // Handle OAuth callback (when user returns from Microsoft)
  const handleOAuthCallback = useCallback(async (): Promise<void> => {
    try {
      // Safe access to window.location with fallbacks
      const location = window?.location;
      if (!location) return;
      
      const searchString = (location.search || '').toString();
      if (!searchString) return;
      
      const urlParams = new URLSearchParams(searchString);
      const code = urlParams.get('code');
      const sessionId = urlParams.get('sessionId');
      const authSuccess = urlParams.get('auth');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // Clear URL parameters to clean up the URL
      if (window?.history?.replaceState && location?.pathname) {
        try {
          window.history.replaceState({}, document.title, location.pathname);
        } catch (historyError) {
          console.warn('Failed to clean URL:', historyError);
        }
      }

      // Handle OAuth errors
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: {
          code: error,
          message: errorDescription || 'OAuth authentication failed'
        }});
        return;
      }

      // Handle direct session ID from backend (new flow)
      if (sessionId && authSuccess === 'success') {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          
          // Store the session ID in multiple places for compatibility
          localStorage.setItem('session_id', sessionId);
          sessionStorage.setItem('session_id', sessionId);

          // Also notify the API service about the new session
          const { api } = await import('../services/api');
          api.setSession(sessionId);

          // Add small delay to ensure session is available
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check auth status with the new session
          await checkAuthStatus();
          
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        } catch (error) {
          console.error('Session ID authentication failed:', error);
          dispatch({ type: 'SET_ERROR', payload: error as AuthError });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      }

      // If we have a code, the backend has already processed it and redirected us here
      // Just check our auth status to see if we're now authenticated
      if (code) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          await checkAuthStatus();
          // Clean up any OAuth state
          try {
            sessionStorage.removeItem('oauth_state');
          } catch (storageError) {
            console.warn('Failed to clean OAuth state:', storageError);
          }
        } catch (error) {
          console.error('OAuth callback handling failed:', error);
          dispatch({ type: 'SET_ERROR', payload: error as AuthError });
        }
      }
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      dispatch({ type: 'SET_ERROR', payload: {
        code: 'OAUTH_CALLBACK_FAILED',
        message: 'Failed to handle OAuth callback'
      }});
    }
  }, [checkAuthStatus]);

  // Handle OAuth callback automatically on mount if URL parameters are present
  useEffect(() => {
    const checkForOAuthCallback = async () => {
      try {
        const searchString = window?.location?.search;
        if (searchString && (searchString.includes('sessionId=') || searchString.includes('code='))) {
          console.log('🔄 OAuth callback detected, processing...');
          dispatch({ type: 'SET_LOADING', payload: true });
          await handleOAuthCallback();
          return; // Don't run normal initialization if handling callback
        }

        // Normal initialization if no callback parameters
        console.log('🔍 Checking authentication status...');
        dispatch({ type: 'SET_LOADING', payload: true });

        // Check if we have a valid session in storage first
        if (AuthStorage.isSessionValid()) {
          console.log('✅ Valid session found in storage');

          // Use AuthApi.getAuthStatus() which includes session ID headers
          const result = await AuthApi.getAuthStatus();

          if (result && result.authenticated && result.user) {
            console.log('✅ User authenticated:', result.user.displayName);
            dispatch({ type: 'SET_USER', payload: result.user });
          } else {
            console.log('❌ Session invalid, clearing auth');
            AuthStorage.clearSession();
            dispatch({ type: 'CLEAR_AUTH' });
          }
        } else {
          console.log('❌ No valid session found');
          dispatch({ type: 'CLEAR_AUTH' });
        }

      } catch (error: any) {
        console.error('❌ Auth initialization failed:', error);

        // Don't clear session on network errors, only on auth errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          AuthStorage.clearSession();
        }

        dispatch({ type: 'CLEAR_AUTH' });
      }
    };

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(checkForOAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [handleOAuthCallback]);

  // Periodic token refresh - DISABLED to prevent auto-page refreshes
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // COMMENTED OUT: This was causing page refreshes every 5 minutes
    // Keeping auth checks but only on user interaction instead

    /*
    const refreshInterval = setInterval(async () => {
      try {
        if (AuthStorage.shouldRevalidate()) {
          await checkAuthStatus();
        }
      } catch (error) {
        console.error('Periodic auth check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
    */

    console.log('🔧 Periodic auth refresh disabled to prevent auto-page refreshes');

    // Alternative: Check auth only on user activity (page focus, clicks)
    const handleUserActivity = async () => {
      try {
        if (AuthStorage.shouldRevalidate()) {
          console.log('👤 User activity detected, checking auth status...');
          await checkAuthStatus();
        }
      } catch (error) {
        console.error('User activity auth check failed:', error);
      }
    };

    // Check auth when user focuses the window (switches back to tab)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      }
    };

    // Add event listeners for user activity
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [state.isAuthenticated, checkAuthStatus]);

  // Context value
  const contextValue: AuthContextType = {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    error: state.error,
    login,
    logout,
    checkAuthStatus,
    clearError,
    getSessionId,
    isSessionValid,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};