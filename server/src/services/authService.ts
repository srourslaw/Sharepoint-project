import { ConfidentialClientApplication, AuthenticationResult, CryptoProvider } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthConfig, TokenResponse, AuthenticatedUser, AuthSession, AuthError } from '../types/auth';

export class AuthService {
  private msalClient: ConfidentialClientApplication;
  private config: AuthConfig;
  private sessions: Map<string, AuthSession> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    
    const msalConfig = {
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Generate authorization URL for OAuth 2.0 flow
   */
  async getAuthUrl(state?: string): Promise<string> {
    try {
      // For now, disable PKCE to simplify the OAuth flow
      // This is acceptable for server-to-server applications with client secrets
      const authCodeUrlParameters = {
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri,
        state: state || 'default-state',
      };

      const response = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
      return response;
    } catch (error) {
      throw this.createAuthError('AUTH_URL_GENERATION_FAILED', 'Failed to generate authorization URL', 500, error);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(authCode: string, codeVerifier?: string): Promise<TokenResponse> {
    try {
      const tokenRequest = {
        code: authCode,
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri,
      };

      const response: AuthenticationResult = await this.msalClient.acquireTokenByCode(tokenRequest);

      if (!response.accessToken) {
        throw new Error('No access token received');
      }

      // Store account info for token refresh instead of using refresh tokens
      const accountInfo = response.account ? {
        homeAccountId: response.account.homeAccountId,
        localAccountId: response.account.localAccountId,
        username: response.account.username,
        tenantId: response.account.tenantId
      } : undefined;

      return {
        accessToken: response.accessToken,
        refreshToken: accountInfo ? JSON.stringify(accountInfo) : undefined,
        expiresIn: response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : 3600,
        tokenType: 'Bearer',
        scope: response.scopes?.join(' ') || this.config.scopes.join(' '),
      };
    } catch (error) {
      throw this.createAuthError('TOKEN_EXCHANGE_FAILED', 'Failed to exchange authorization code for tokens', 400, error);
    }
  }

  /**
   * Refresh access token using account info
   */
  async refreshToken(accountInfoJson: string): Promise<TokenResponse> {
    try {
      const accountInfo = JSON.parse(accountInfoJson);
      const account = await this.msalClient.getTokenCache().getAccountByHomeId(accountInfo.homeAccountId);

      let targetAccount = account;

      if (!targetAccount) {
        // Try to find account by local account ID as fallback
        const allAccounts = await this.msalClient.getTokenCache().getAllAccounts();
        targetAccount = allAccounts.find(acc =>
          acc.localAccountId === accountInfo.localAccountId ||
          acc.username === accountInfo.username
        ) || null;

        if (!targetAccount) {
          throw new Error('Account not found for refresh');
        }
      }

      const silentRequest = {
        account: targetAccount,
        scopes: this.config.scopes,
      };

      const response: AuthenticationResult = await this.msalClient.acquireTokenSilent(silentRequest);

      if (!response.accessToken) {
        throw new Error('No access token received from refresh');
      }

      // Keep the same account info for future refreshes
      return {
        accessToken: response.accessToken,
        refreshToken: accountInfoJson,
        expiresIn: response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : 3600,
        tokenType: 'Bearer',
        scope: response.scopes?.join(' ') || this.config.scopes.join(' '),
      };
    } catch (error) {
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh access token', 401, error);
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<AuthenticatedUser> {
    try {
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const user = await graphClient.api('/me').get();
      
      return {
        id: user.id,
        displayName: user.displayName,
        mail: user.mail || user.userPrincipalName,
        userPrincipalName: user.userPrincipalName,
      };
    } catch (error) {
      throw this.createAuthError('USER_INFO_FAILED', 'Failed to fetch user information', 401, error);
    }
  }

  /**
   * Create and store authentication session
   */
  async createSession(tokenResponse: TokenResponse): Promise<string> {
    try {
      const user = await this.getUserInfo(tokenResponse.accessToken);
      const sessionId = this.generateSessionId();
      
      // Extend session expiration to 24 hours for better user experience
      // Track token expiration separately for proper refresh timing
      const sessionExpirationHours = 24;
      const session: AuthSession = {
        userId: user.id,
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresAt: new Date(Date.now() + (sessionExpirationHours * 60 * 60 * 1000)),
        tokenExpiresAt: new Date(Date.now() + (tokenResponse.expiresIn * 1000)),
        user: user,
      };

      this.sessions.set(sessionId, session);
      return sessionId;
    } catch (error) {
      throw this.createAuthError('SESSION_CREATION_FAILED', 'Failed to create authentication session', 500, error);
    }
  }

  /**
   * Get session by session ID
   */
  getSession(sessionId: string): AuthSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Refresh session token if needed
   */
  async refreshSessionIfNeeded(sessionId: string): Promise<AuthSession | null> {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if token will expire in the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (session.tokenExpiresAt < fiveMinutesFromNow && session.refreshToken) {
      try {
        const tokenResponse = await this.refreshToken(session.refreshToken);
        
        // Update session with new tokens, keep 24-hour session expiration
        session.accessToken = tokenResponse.accessToken;
        session.refreshToken = tokenResponse.refreshToken || session.refreshToken;
        session.tokenExpiresAt = new Date(Date.now() + (tokenResponse.expiresIn * 1000));
        
        this.sessions.set(sessionId, session);
        return session;
      } catch (error) {
        // If refresh fails, remove the session
        this.sessions.delete(sessionId);
        throw this.createAuthError('SESSION_REFRESH_FAILED', 'Failed to refresh session token', 401, error);
      }
    }

    return session;
  }

  /**
   * Revoke session and clean up
   */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get Microsoft Graph client for authenticated requests
   */
  getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(code: string, message: string, statusCode: number, originalError?: any): AuthError {
    console.error(`Auth Error [${code}]:`, message, originalError);
    
    return {
      code,
      message,
      statusCode,
    };
  }

  /**
   * Validate session and return user info
   */
  async validateSession(sessionId: string): Promise<AuthenticatedUser | null> {
    try {
      const session = await this.refreshSessionIfNeeded(sessionId);
      return session ? session.user : null;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }
}