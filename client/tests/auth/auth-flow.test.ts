import { AuthService } from '../../src/services/auth.service';
import { mockTokenResponse, createMockAuthService } from '../__mocks__/sharepoint.mock';
import { waitFor } from '../utils/test-utils';

// Mock MSAL
const mockMsalInstance = {
  loginPopup: jest.fn(),
  loginRedirect: jest.fn(),
  logout: jest.fn(),
  logoutRedirect: jest.fn(),
  acquireTokenSilent: jest.fn(),
  acquireTokenPopup: jest.fn(),
  acquireTokenRedirect: jest.fn(),
  handleRedirectPromise: jest.fn(),
  getAllAccounts: jest.fn(),
  getAccountByHomeId: jest.fn(),
  getAccountByLocalId: jest.fn(),
  getAccountByUsername: jest.fn(),
  getActiveAccount: jest.fn(),
  setActiveAccount: jest.fn(),
  addEventCallback: jest.fn(),
  removeEventCallback: jest.fn(),
};

jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn(() => mockMsalInstance),
  EventType: {
    LOGIN_SUCCESS: 'msal:loginSuccess',
    LOGIN_FAILURE: 'msal:loginFailure',
    ACQUIRE_TOKEN_SUCCESS: 'msal:acquireTokenSuccess',
    ACQUIRE_TOKEN_FAILURE: 'msal:acquireTokenFailure',
    LOGOUT_SUCCESS: 'msal:logoutSuccess',
  },
  InteractionType: {
    POPUP: 'popup',
    REDIRECT: 'redirect',
    SILENT: 'silent',
  },
  BrowserAuthError: class BrowserAuthError extends Error {
    errorCode: string;
    constructor(errorCode: string, errorMessage?: string) {
      super(errorMessage);
      this.errorCode = errorCode;
    }
  },
  BrowserAuthErrorMessage: {
    noAccountError: {
      code: 'no_account_error',
      desc: 'No account object provided.',
    },
    interactionInProgress: {
      code: 'interaction_in_progress',
      desc: 'Interaction is currently in progress.',
    },
  },
}));

describe('Authentication Flow Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService({
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      redirectUri: 'http://localhost:3000',
    });

    // Clear all mocks
    Object.values(mockMsalInstance).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Authentication', () => {
    it('should handle successful popup login', async () => {
      mockMsalInstance.loginPopup.mockResolvedValue(mockTokenResponse);
      mockMsalInstance.getAllAccounts.mockReturnValue([mockTokenResponse.account]);

      const result = await authService.login();

      expect(mockMsalInstance.loginPopup).toHaveBeenCalledWith({
        scopes: ['Sites.Read.All', 'Files.Read.All'],
        prompt: 'select_account',
      });
      expect(result).toEqual(mockTokenResponse);
    });

    it('should handle successful redirect login', async () => {
      mockMsalInstance.handleRedirectPromise.mockResolvedValue(mockTokenResponse);

      const result = await authService.handleRedirectPromise();

      expect(mockMsalInstance.handleRedirectPromise).toHaveBeenCalled();
      expect(result).toEqual(mockTokenResponse);
    });

    it('should handle login cancellation', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue({
        errorCode: 'user_cancelled',
        errorMessage: 'User cancelled the flow',
      });

      await expect(authService.login()).rejects.toThrow('User cancelled the flow');
    });

    it('should handle network errors during login', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue({
        errorCode: 'network_error',
        errorMessage: 'Network request failed',
      });

      await expect(authService.login()).rejects.toThrow('Network request failed');
    });

    it('should handle blocked popup during login', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue({
        errorCode: 'popup_blocked',
        errorMessage: 'Popup blocked by browser',
      });

      // Should fallback to redirect
      mockMsalInstance.loginRedirect.mockResolvedValue(undefined);

      await authService.login();

      expect(mockMsalInstance.loginRedirect).toHaveBeenCalled();
    });
  });

  describe('Token Acquisition', () => {
    beforeEach(() => {
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);
    });

    it('should acquire token silently when possible', async () => {
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const token = await authService.getAccessToken();

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: ['Sites.Read.All', 'Files.Read.All'],
        account: mockTokenResponse.account,
      });
      expect(token).toBe(mockTokenResponse.accessToken);
    });

    it('should fallback to popup when silent acquisition fails', async () => {
      mockMsalInstance.acquireTokenSilent.mockRejectedValue({
        errorCode: 'consent_required',
        errorMessage: 'User consent required',
      });
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(mockTokenResponse);

      const token = await authService.getAccessToken();

      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalled();
      expect(token).toBe(mockTokenResponse.accessToken);
    });

    it('should handle token refresh automatically', async () => {
      const expiredTokenResponse = {
        ...mockTokenResponse,
        expiresOn: new Date(Date.now() - 3600000), // Expired 1 hour ago
      };

      mockMsalInstance.acquireTokenSilent
        .mockResolvedValueOnce(expiredTokenResponse)
        .mockResolvedValueOnce(mockTokenResponse);

      const token = await authService.getAccessToken();

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(2);
      expect(token).toBe(mockTokenResponse.accessToken);
    });

    it('should handle multiple concurrent token requests', async () => {
      mockMsalInstance.acquireTokenSilent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTokenResponse), 100))
      );

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => authService.getAccessToken());
      const tokens = await Promise.all(promises);

      // Should only make one actual token request
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(1);
      tokens.forEach(token => expect(token).toBe(mockTokenResponse.accessToken));
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);
    });

    it('should handle successful popup logout', async () => {
      mockMsalInstance.logout.mockResolvedValue(undefined);

      await authService.logout();

      expect(mockMsalInstance.logout).toHaveBeenCalledWith({
        account: mockTokenResponse.account,
        postLogoutRedirectUri: 'http://localhost:3000',
      });
    });

    it('should handle redirect logout', async () => {
      mockMsalInstance.logoutRedirect.mockResolvedValue(undefined);

      await authService.logout(false); // Use redirect

      expect(mockMsalInstance.logoutRedirect).toHaveBeenCalled();
    });

    it('should clear local state on logout', async () => {
      mockMsalInstance.logout.mockResolvedValue(undefined);

      // Set some initial state
      jest.spyOn(authService, 'isAuthenticated').mockReturnValue(true);

      await authService.logout();

      // Should clear local authentication state
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should detect authenticated state correctly', () => {
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should detect unauthenticated state correctly', () => {
      mockMsalInstance.getActiveAccount.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should get current user information', async () => {
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);

      const user = await authService.getCurrentUser();

      expect(user).toEqual({
        id: mockTokenResponse.account.localAccountId,
        displayName: mockTokenResponse.account.name,
        email: mockTokenResponse.account.username,
        userPrincipalName: mockTokenResponse.account.username,
      });
    });

    it('should handle session expiration', async () => {
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);
      mockMsalInstance.acquireTokenSilent.mockRejectedValue({
        errorCode: 'token_expired',
        errorMessage: 'Token has expired',
      });

      // Should attempt to refresh token
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(mockTokenResponse);

      const token = await authService.getAccessToken();
      expect(token).toBe(mockTokenResponse.accessToken);
    });
  });

  describe('Multi-Account Scenarios', () => {
    const secondAccount = {
      homeAccountId: 'second-home-account-id',
      environment: 'login.microsoftonline.com',
      tenantId: 'second-tenant-id',
      username: 'second@example.com',
      localAccountId: 'second-local-account-id',
      name: 'Second User',
    };

    it('should handle multiple accounts', async () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([
        mockTokenResponse.account,
        secondAccount,
      ]);

      const accounts = await authService.getAllAccounts();

      expect(accounts).toHaveLength(2);
      expect(accounts[0].email).toBe('test@example.com');
      expect(accounts[1].email).toBe('second@example.com');
    });

    it('should switch between accounts', async () => {
      mockMsalInstance.getAllAccounts.mockReturnValue([
        mockTokenResponse.account,
        secondAccount,
      ]);
      mockMsalInstance.getAccountByUsername.mockReturnValue(secondAccount);

      await authService.switchAccount('second@example.com');

      expect(mockMsalInstance.setActiveAccount).toHaveBeenCalledWith(secondAccount);
    });

    it('should handle account-specific token acquisition', async () => {
      const secondAccountToken = {
        ...mockTokenResponse,
        account: secondAccount,
        accessToken: 'second-access-token',
      };

      mockMsalInstance.getActiveAccount.mockReturnValue(secondAccount);
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(secondAccountToken);

      const token = await authService.getAccessToken();

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: ['Sites.Read.All', 'Files.Read.All'],
        account: secondAccount,
      });
      expect(token).toBe('second-access-token');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle interaction in progress errors', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue({
        errorCode: 'interaction_in_progress',
        errorMessage: 'Interaction is currently in progress',
      });

      // Should wait and retry
      jest.useFakeTimers();
      
      const loginPromise = authService.login();
      
      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(2000);
      
      // Mock successful retry
      mockMsalInstance.loginPopup.mockResolvedValue(mockTokenResponse);
      
      const result = await loginPromise;
      expect(result).toEqual(mockTokenResponse);

      jest.useRealTimers();
    });

    it('should handle consent errors gracefully', async () => {
      mockMsalInstance.acquireTokenSilent.mockRejectedValue({
        errorCode: 'consent_required',
        errorMessage: 'AADSTS65001: User consent required',
      });
      mockMsalInstance.acquireTokenPopup.mockResolvedValue(mockTokenResponse);

      const token = await authService.getAccessToken();

      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledWith({
        scopes: ['Sites.Read.All', 'Files.Read.All'],
        account: undefined,
      });
      expect(token).toBe(mockTokenResponse.accessToken);
    });

    it('should handle service unavailable errors', async () => {
      mockMsalInstance.loginPopup.mockRejectedValue({
        errorCode: 'service_unavailable',
        errorMessage: 'Service is temporarily unavailable',
      });

      await expect(authService.login()).rejects.toThrow('Service is temporarily unavailable');
    });

    it('should retry failed operations with exponential backoff', async () => {
      let attemptCount = 0;
      mockMsalInstance.acquireTokenSilent.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject({
            errorCode: 'network_error',
            errorMessage: 'Network request failed',
          });
        }
        return Promise.resolve(mockTokenResponse);
      });

      jest.useFakeTimers();

      const tokenPromise = authService.getAccessToken();

      // Fast-forward through retry delays
      jest.advanceTimersByTime(5000);

      const token = await tokenPromise;

      expect(token).toBe(mockTokenResponse.accessToken);
      expect(attemptCount).toBe(3);

      jest.useRealTimers();
    });
  });

  describe('Security and Compliance', () => {
    it('should validate token integrity', async () => {
      const invalidToken = {
        ...mockTokenResponse,
        accessToken: 'invalid.token.here',
      };

      mockMsalInstance.acquireTokenSilent.mockResolvedValue(invalidToken);

      await expect(authService.getAccessToken()).rejects.toThrow('Invalid token format');
    });

    it('should handle token tampering attempts', async () => {
      const tamperedToken = {
        ...mockTokenResponse,
        account: {
          ...mockTokenResponse.account,
          tenantId: 'malicious-tenant',
        },
      };

      mockMsalInstance.acquireTokenSilent.mockResolvedValue(tamperedToken);

      await expect(authService.getAccessToken()).rejects.toThrow('Token validation failed');
    });

    it('should enforce scope restrictions', async () => {
      const unauthorizedScopes = ['User.ReadWrite.All', 'Mail.Read'];

      await expect(
        authService.getAccessTokenForScopes(unauthorizedScopes)
      ).rejects.toThrow('Unauthorized scopes requested');
    });

    it('should handle tenant restrictions', async () => {
      const restrictedTenantResponse = {
        ...mockTokenResponse,
        account: {
          ...mockTokenResponse.account,
          tenantId: 'restricted-tenant-id',
        },
      };

      mockMsalInstance.loginPopup.mockResolvedValue(restrictedTenantResponse);

      await expect(authService.login()).rejects.toThrow('Access denied for tenant');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache tokens appropriately', async () => {
      mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockTokenResponse);

      // Make multiple token requests
      await authService.getAccessToken();
      await authService.getAccessToken();
      await authService.getAccessToken();

      // Should only make one actual request due to caching
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(1);
    });

    it('should refresh expired cached tokens', async () => {
      const expiredToken = {
        ...mockTokenResponse,
        expiresOn: new Date(Date.now() - 3600000),
      };

      mockMsalInstance.acquireTokenSilent
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(mockTokenResponse);

      const token = await authService.getAccessToken();

      expect(token).toBe(mockTokenResponse.accessToken);
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(2);
    });

    it('should handle high-frequency token requests efficiently', async () => {
      mockMsalInstance.acquireTokenSilent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTokenResponse), 50))
      );

      const start = performance.now();
      
      // Make many concurrent requests
      const promises = Array.from({ length: 100 }, () => authService.getAccessToken());
      await Promise.all(promises);

      const duration = performance.now() - start;

      // Should complete quickly due to request deduplication
      expect(duration).toBeLessThan(1000);
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit authentication events', async () => {
      const onAuthSuccess = jest.fn();
      const onAuthFailure = jest.fn();

      authService.on('login_success', onAuthSuccess);
      authService.on('login_failure', onAuthFailure);

      mockMsalInstance.loginPopup.mockResolvedValue(mockTokenResponse);

      await authService.login();

      expect(onAuthSuccess).toHaveBeenCalledWith(mockTokenResponse);
      expect(onAuthFailure).not.toHaveBeenCalled();
    });

    it('should handle authentication state changes', async () => {
      const onStateChange = jest.fn();
      authService.on('auth_state_change', onStateChange);

      mockMsalInstance.loginPopup.mockResolvedValue(mockTokenResponse);
      mockMsalInstance.getActiveAccount.mockReturnValue(mockTokenResponse.account);

      await authService.login();

      expect(onStateChange).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: expect.any(Object),
      });
    });

    it('should cleanup event listeners properly', () => {
      const callback = jest.fn();
      
      authService.on('login_success', callback);
      authService.off('login_success', callback);

      // Trigger event - callback should not be called
      authService.emit('login_success', mockTokenResponse);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});