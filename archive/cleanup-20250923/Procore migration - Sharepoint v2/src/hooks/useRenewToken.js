import { useMsal } from '@azure/msal-react';
import dayjs from 'dayjs';
import { renewTokenPromise } from '../configs/renewToken';
import { useNavigate } from 'react-router-dom';

const renewCounter = 45 * 60 * 1000;
const almostExpiredCounter = 15 * 60 * 1000;

const useRenewToken = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const renewToken = async () => {
    const getToken = localStorage.getItem('authToken');
    try {
      const ext = JSON.parse(getToken);

      if (!ext) {
        return null;
      }

      const request = {
        scopes: [process.env.REACT_APP_TOKEN_SCOPE],
        account: ext.account,
      };

      const token = await instance.acquireTokenSilent(request);
      localStorage.setItem('authToken', JSON.stringify(token));
      return token.accessToken;
    } catch (error) {
      console.log('error renew token', error);
    }
  };

  const getAccessToken = async (return_obj = false) => {
    const getToken = localStorage.getItem('authToken');
    const ext = JSON.parse(getToken);

    if (!ext) {
      return null;
    }

    const token = await renewTokenPromise({
      instance,
      scopes: [process.env.REACT_APP_TOKEN_SCOPE],
      account: ext.account,
    });
    // const newToken = await renewToken();
    if (return_obj) {
      return token;
    }
    return token.accessToken;
  };

  return {
    renewToken,
    getAccessToken,
  };
};

export default useRenewToken;
