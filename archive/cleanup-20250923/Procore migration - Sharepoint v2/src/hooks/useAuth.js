import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const useAuth = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [isAuth, setIsAuth] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const [isError, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authVisible, setAuthVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    if (isAuth) {
      setAuthVisible(true);
      setTimeout(() => {
        setAuthVisible(false);
      }, 3000);
    }
  }, [isAuth]);

  useEffect(() => {
    if (isAuth && isError) {
      setErrorVisible(true);
      setTimeout(() => {
        setErrorVisible(false);
      }, 5000);
    }
  }, [isError, isAuth]);

  useEffect(() => {
    const authToken = window.localStorage.getItem('authToken');
    if (authToken) {
      const token = JSON.parse(authToken);
      setIsAuth(Boolean(token));
      // TODO: needs encode and decode authToken for security using JWT
      setAuthInfo(token);
    } else {
      setError(true);
      setErrorMsg('Unauthorized access. Redirecting to landing page...');
      if (params?.docId && window.location.pathname.includes('/view')) {
        navigate(`/?viewId=${encodeURIComponent(`${params?.docId}`)}`);
      } else if (
        params?.docId &&
        window.location.pathname.includes('/download')
      ) {
        navigate(`/?downloadId=${encodeURIComponent(`${params?.docId}`)}`);
      } else {
        navigate('/');
      }
    }
  }, []);

  return {
    isAuth,
    isError,
    errorMsg,
    setErrorMsg,
    authInfo,
    authVisible,
    errorVisible,
  };
};

export default useAuth;
