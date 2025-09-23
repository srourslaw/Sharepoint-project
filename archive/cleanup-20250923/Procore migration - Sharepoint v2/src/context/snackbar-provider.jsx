import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useState } from 'react';
import { ALERT_SEVERITY } from '../const/common';

const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    severity: ALERT_SEVERITY.SUCCESS,
    title: '',
    message: '',
  });

  const showSnackbar = useCallback(
    ({ message, severity = ALERT_SEVERITY.SUCCESS, title }) => {
      setAlertConfig({
        severity,
        title: title || getDefaultTitle(severity),
        message,
      });
      setOpen(true);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const getDefaultTitle = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.SUCCESS:
        return 'Success';
      case ALERT_SEVERITY.ERROR:
        return 'Error';
      case ALERT_SEVERITY.WARNING:
        return 'Warning';
      case ALERT_SEVERITY.INFO:
        return 'Info';
      default:
        return '';
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      <Snackbar
        open={open}
        onClose={handleClose}
        autoHideDuration={100000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={alertConfig.severity}
          sx={{
            minWidth: '350px',
            maxWidth: '425px',
          }}
        >
          {alertConfig.title && <AlertTitle>{alertConfig.title}</AlertTitle>}
          {alertConfig.message}
        </Alert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider.');
  }

  return context;
}
