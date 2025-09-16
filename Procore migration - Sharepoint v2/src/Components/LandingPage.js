import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import * as Msal from '@azure/msal-browser';
import logo from '../logo-gemlife.png';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const LandingPage = (props) => {
  const navigate = useNavigate();
  const [isError, setIsError] = useState('');
  const { accountSelect } = useParams();

  const handleAccessPortalClick = async () => {
    try {
      setIsError('');
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
      };

      const msalInstance = new Msal.PublicClientApplication(msalConfig);
      const msalInit = await msalInstance.initialize();
      const response = await msalInstance.loginPopup({
        prompt: 'select_account',
      });

      const request = {
        scopes: [process.env.REACT_APP_TOKEN_SCOPE],
        account: response.account,
      };

      // Note: saving token in localStorage to later get user account
      const token = await msalInstance.acquireTokenSilent(request);
      localStorage.setItem('authToken', JSON.stringify(token));
      const urlParams = new URLSearchParams(window.location.search);
      const viewId = urlParams.get('viewId');
      const downloadId = urlParams.get('downloadId');
      const docName = urlParams.get('docName');

      if (viewId) {
        navigate(`/main/view/${viewId}`, {
          replace: true,
        });
      } else if (downloadId) {
        navigate(`/main/download/${downloadId}`, {
          replace: true,
        });
      } else if (docName) {
        navigate(`/main/split-drawing/${docName}`, {
          replace: true,
        });
      } else {
        navigate('/main', {
          replace: true,
        });
      }
    } catch (error) {
      if (
        error.name === 'BrowserAuthError' &&
        error.errorCode === 'user_cancelled'
      ) {
        setIsError('User canceled the authentication flow');
      } else {
        setIsError('Login failed. Make sure to Allow Pop-ups.');
      }
    }
  };

  useEffect(() => {
    const getToken = localStorage.getItem('authToken');
    if (getToken) {
      const token = JSON.parse(getToken);
      const { expiresOn, accessToken } = token;
      const fiveMinBeforeExpires = dayjs(expiresOn).subtract(60, 'minutes');
      const nowDateUTC = dayjs().utc();

      if (token.accessToken && fiveMinBeforeExpires.isAfter(nowDateUTC)) {
        navigate('/main', {
          replace: true,
        });
      }
    }
    if (accountSelect) handleAccessPortalClick();
  }, []);

  return (
    <Grid
      container
      sx={{ height: '100vh' }}
      justifyContent="center"
      alignItems="center"
    >
      <Box sx={{ justifyContent: 'center', alignItems: 'center' }}>
        {isError !== '' ? (
          <Alert sx={{ margin: '0px 0px 10px 0px' }} severity="error">
            {isError}
          </Alert>
        ) : (
          <></>
        )}
        <img
          style={{
            width: '160px',
            height: 'auto',
            margin: '15px auto',
            display: 'flex',
          }}
          src={logo}
          alt="Gemlife Logo"
        />
        <Button
          onClick={handleAccessPortalClick}
          sx={{ margin: '0 auto', display: 'block', borderRadius: '0px' }}
          variant="outlined"
        >
          Access Portal
        </Button>
      </Box>
    </Grid>
  );
};

export default LandingPage;
