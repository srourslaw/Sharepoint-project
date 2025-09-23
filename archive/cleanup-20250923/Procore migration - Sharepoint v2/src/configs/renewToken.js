import { InteractionRequiredAuthError } from '@azure/msal-browser';

let tokenPromise = null;

export const renewTokenPromise = async ({ instance, account, scopes }) => {
  if (!account) {
    console.warn('No MSAL account provided — user may need to login');
    return null;
  }

  if (tokenPromise) {
    return tokenPromise.then((token) => token);
  }

  const request = {
    scopes,
    account,
  };

  tokenPromise = new Promise(async (resolve, reject) => {
    try {
      const tokenResponse = await instance.acquireTokenSilent(request);
      localStorage.setItem('authToken', JSON.stringify(tokenResponse));
      resolve(tokenResponse);
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const tokenResponse = await instance.acquireTokenPopup(request);
          localStorage.setItem('authToken', JSON.stringify(tokenResponse));
          resolve(tokenResponse);
        } catch (popupError) {
          console.error('Popup failed', popupError);
          reject(popupError);
        }
      } else {
        console.error('Token refresh failed', error);
        reject(error);
      }
    }
  });

  try {
    const token = await tokenPromise;
    return token;
  } finally {
    tokenPromise = null;
  }
};
