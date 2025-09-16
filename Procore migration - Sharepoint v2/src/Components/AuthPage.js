import { useState, useEffect } from 'react';
import CustomNavigation from './_Navigation';
import Alert from '@mui/material/Alert';

const AuthPage = (props) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isInprogress, setInprogress] = useState(true);
  const [isError, setIsError] = useState('');

  useEffect(() => {
    const authToken = window.localStorage.getItem('authToken');
    if (authToken !== null) {
      const authTokenObj = JSON.parse(authToken);
      setIsAuth(authTokenObj);
      setInprogress(false);
      setTimeout(() => {
        window.location.href = '/main';
      }, 3000);
    } else {
      setIsError('Unauthorized access. Redirecting Please wait...');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }, []);

  return (
    <div>
      <CustomNavigation />
      {isAuth !== false ? (
        <Alert severity="info">
          <strong>Authenticated as: </strong> {isAuth.account.name} -{' '}
          {isAuth.account.username}. Redirecting to Main Page...
        </Alert>
      ) : (
        <></>
      )}
      {isError !== '' ? (
        <Alert severity="error">
          {isError}
          <a href="/">go back</a>
        </Alert>
      ) : (
        <></>
      )}
    </div>
  );
};

export default AuthPage;
