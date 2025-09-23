import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_TOKEN_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
    knownAuthorities: [],
    redirectUri: `${process.env.REACT_APP_TOKEN_REDIRECT}`,
    postLogoutRedirectUri: `${process.env.REACT_APP_TOKEN_REDIRECT}`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;

        switch (level) {
          case LogLevel.Error:
            // console.error(message);
            break;
          case LogLevel.Info:
            // console.info(message);
            break;
          case LogLevel.Verbose:
            // console.debug(message);
            break;
          case LogLevel.Warning:
            // console.warn(message);
            break;
        }
      },
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
