export interface User {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthSession {
  sessionId: string;
  user: User;
  tokens?: AuthTokens;
  expiresAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: AuthSession | null;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp?: string;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: AuthError | null;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  getSessionId: () => string | null;
  isSessionValid: () => boolean;
}

export interface LoginResponse {
  success: boolean;
  authUrl: string;
  message: string;
}

export interface CallbackResponse {
  success: boolean;
  sessionId: string;
  message: string;
  user: User;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
  sessionActive: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: AuthError;
}

// Custom header type that includes our session header
export interface CustomHeaders extends Record<string, string> {
  'Content-Type'?: string;
  'Authorization'?: string;
  'x-session-id'?: string;
}