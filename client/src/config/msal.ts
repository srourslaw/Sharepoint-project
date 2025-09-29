import { Configuration, PopupRequest } from '@azure/msal-browser';

// MSAL configuration based on successful DMS project
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'fd3b804c-5ac4-4e00-8359-f6712fc1e634',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'a68d3c04-09fe-4a33-a02c-e880c1a7504d'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:8081',
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage', // Critical: Use localStorage like successful DMS
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 1: // Error
            console.error(message);
            break;
          case 2: // Warning
            console.warn(message);
            break;
          case 3: // Info
            console.info(message);
            break;
          case 4: // Verbose
            console.debug(message);
            break;
        }
      }
    }
  }
};

// SharePoint API scopes - matching successful DMS project
export const loginRequest: PopupRequest = {
  scopes: [
    'openid',
    'profile',
    'email',
    'User.Read',
    'Sites.Read.All',
    'Files.Read.All',
    'offline_access'
  ],
  prompt: 'select_account',
};

// API request configuration for SharePoint calls
export const sharepointApiRequest = {
  scopes: ['https://graph.microsoft.com/.default'],
};