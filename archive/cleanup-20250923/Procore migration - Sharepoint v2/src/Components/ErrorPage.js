import { useState, useEffect } from 'react';
import CustomNavigation from './_Navigation';
import Alert from '@mui/material/Alert';

const ErrorPage = (props) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isInprogress, setInprogress] = useState(true);
  const [isError, setIsError] = useState('');

  useEffect(() => {
    const authToken = window.localStorage.getItem('authToken');
    if (authToken !== null) {
      const authTokenObj = JSON.parse(authToken);
      setIsAuth(authTokenObj);
      setInprogress(false);
    }
  }, []);

  return (
    <div>
      <CustomNavigation />
      {isAuth !== false ? (
        <Alert severity="info">
          <strong>Authenticated as: </strong> {isAuth.account.name} -{' '}
          {isAuth.account.username}
        </Alert>
      ) : (
        <></>
      )}
      <Alert severity="error">
        Something went wrong{' '}
        <strong>
          <a href="/">go back</a>
        </strong>
      </Alert>
    </div>
  );
};

export default ErrorPage;
