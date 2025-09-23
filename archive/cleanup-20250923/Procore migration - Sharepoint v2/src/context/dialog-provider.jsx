import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { createContext, useContext, useState } from 'react';

const DialogContext = createContext({
  openDialog: () => {},
  closeDialog: () => {},
});

export function DialogProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: null,
    description: null,
    closeText: 'Cancel',
    confirmText: 'Submit',
    onConfirm: () => {},
    onClose: () => {},
  });

  function openDialog(dialogConfig = {}) {
    setDialogState((prev) => ({
      ...prev,
      open: true,
      ...dialogConfig,
    }));
  }

  function closeDialog() {
    if (typeof dialogState.onClose === 'function') {
      dialogState.onClose();
    }
    setDialogState((prev) => ({
      ...prev,
      open: false,
    }));
  }

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      <Dialog
        open={dialogState.open}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialogState.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogState.description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {dialogState.closeText && (
            <Button disabled={loading} onClick={closeDialog} color="error">
              {dialogState.closeText}
            </Button>
          )}
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await dialogState.onConfirm();
              setLoading(false);
              closeDialog();
            }}
            autoFocus
          >
            {dialogState.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);

  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider.');
  }

  return ctx;
}
