import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig, loginRequest } from '../config/msal';
import { getSharePointService, SharePointService } from '../services/sharepoint';

// Create MSAL instance following successful DMS pattern
const msalInstance = new PublicClientApplication(msalConfig);

// Context type definition
interface MSALAuthContextType {
  instance: PublicClientApplication;
  accounts: AccountInfo[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  sharepointService: SharePointService;
}

const MSALAuthContext = createContext<MSALAuthContextType | undefined>(undefined);

interface MSALAuthProviderProps {
  children: React.ReactNode;
}

export const MSALAuthProvider: React.FC<MSALAuthProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sharepointService] = useState(() => getSharePointService(msalInstance));

  // Initialize MSAL and check for existing authentication
  useEffect(() => {
    const initializeMSAL = async () => {
      try {
        await msalInstance.initialize();

        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
          console.log('Authentication successful:', response.account);
        }

        // Get current accounts
        const currentAccounts = msalInstance.getAllAccounts();
        setAccounts(currentAccounts);
        setIsAuthenticated(currentAccounts.length > 0);
      } catch (error) {
        console.error('MSAL initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMSAL();
  }, []);

  // Login function - using popup like successful DMS
  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Initiating MSAL login...');

      const loginResponse = await msalInstance.loginPopup(loginRequest);

      if (loginResponse && loginResponse.account) {
        const currentAccounts = msalInstance.getAllAccounts();
        setAccounts(currentAccounts);
        setIsAuthenticated(true);
        console.log('Login successful:', loginResponse.account);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      const logoutRequest = {
        account: accounts[0],
        postLogoutRedirectUri: window.location.origin,
      };

      await msalInstance.logoutPopup(logoutRequest);
      setAccounts([]);
      setIsAuthenticated(false);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get access token for API calls
  const getAccessToken = async (): Promise<string | null> => {
    try {
      if (accounts.length === 0) {
        return null;
      }

      const tokenRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
        account: accounts[0],
      };

      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);

      // Try to get token interactively if silent fails
      try {
        const response = await msalInstance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError);
        return null;
      }
    }
  };

  const contextValue: MSALAuthContextType = {
    instance: msalInstance,
    accounts,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAccessToken,
    sharepointService,
  };

  return (
    <MSALAuthContext.Provider value={contextValue}>
      <MsalProvider instance={msalInstance}>
        {children}
      </MsalProvider>
    </MSALAuthContext.Provider>
  );
};

// Custom hook to use MSAL auth context
export const useMSALAuth = (): MSALAuthContextType => {
  const context = useContext(MSALAuthContext);
  if (context === undefined) {
    throw new Error('useMSALAuth must be used within an MSALAuthProvider');
  }
  return context;
};