import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { useCallback, useState, useEffect } from 'react';
import { AuthApi } from '../services/authApi';
import { AuthError } from '../types/auth';

/**
 * Primary authentication hook
 * Re-exports the context hook with additional utilities
 */
export const useAuth = () => {
  return useAuthContext();
};

/**
 * Hook for making authenticated API requests
 */
export const useAuthenticatedRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { logout } = useAuth();

  const makeRequest = useCallback(async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthApi.makeAuthenticatedRequest<T>(endpoint, options);
      return result;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);

      // Auto-logout on authentication errors
      if (authError.statusCode === 401 || authError.statusCode === 403) {
        await logout();
      }

      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    makeRequest,
    isLoading,
    error,
    clearError
  };
};

/**
 * Hook for authentication status with auto-refresh
 */
export const useAuthStatus = (autoRefresh = true, refreshInterval = 5 * 60 * 1000) => {
  const { isAuthenticated, user, checkAuthStatus, isLoading, error } = useAuth();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      await checkAuthStatus();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Auth status refresh failed:', error);
    }
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, refreshInterval, refresh]);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    lastRefresh,
    refresh
  };
};

/**
 * Hook for protected route access
 */
export const useProtectedRoute = (redirectPath = '/login') => {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // In a real app, you'd use React Router for navigation
      console.warn(`Access denied. User should be redirected to ${redirectPath}`);
    }
  }, [isAuthenticated, isLoading, redirectPath]);

  return {
    isAuthenticated,
    isLoading,
    user,
    hasAccess: isAuthenticated && !isLoading
  };
};

/**
 * Hook for handling login state
 */
export const useLogin = () => {
  const { login, isLoading, error } = useAuth();
  const [loginAttempted, setLoginAttempted] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoginAttempted(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [login]);

  return {
    login: handleLogin,
    isLoading,
    error,
    loginAttempted
  };
};

/**
 * Hook for handling logout state
 */
export const useLogout = () => {
  const { logout, isLoading } = useAuth();
  const [logoutAttempted, setLogoutAttempted] = useState(false);

  const handleLogout = useCallback(async () => {
    setLogoutAttempted(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Reset after a delay to allow for UI feedback
      setTimeout(() => setLogoutAttempted(false), 2000);
    }
  }, [logout]);

  return {
    logout: handleLogout,
    isLoading,
    logoutAttempted
  };
};

/**
 * Hook for SharePoint-specific operations
 */
export const useSharePoint = () => {
  const { makeRequest, isLoading, error, clearError } = useAuthenticatedRequest();

  const getSites = useCallback(async () => {
    return makeRequest('/api/sharepoint/sites');
  }, [makeRequest]);

  const getFiles = useCallback(async () => {
    return makeRequest('/api/sharepoint/files');
  }, [makeRequest]);

  const getSiteLists = useCallback(async (siteId: string) => {
    return makeRequest(`/api/sharepoint/site/${siteId}/lists`);
  }, [makeRequest]);

  return {
    getSites,
    getFiles,
    getSiteLists,
    isLoading,
    error,
    clearError
  };
};

/**
 * Hook for error handling with auto-dismiss
 */
export const useAuthError = (autoDismissDelay = 5000) => {
  const { error, clearError } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const dismissError = useCallback(() => {
    setDismissed(true);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error && !dismissed && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        dismissError();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [error, dismissed, autoDismissDelay, dismissError]);

  useEffect(() => {
    if (!error) {
      setDismissed(false);
    }
  }, [error]);

  return {
    error: dismissed ? null : error,
    dismissError,
    hasDismissed: dismissed
  };
};