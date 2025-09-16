import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export function ConfirmationRevisionDialog({
  alertText,
  open,
  setOpen,
  onSubmit,
}) {
  const handleClose = () => {
    setOpen(false);
  };

  function handleSubmit() {
    onSubmit();
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Please confirm version overwrite
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {alertText}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error">
          Back To Edit
        </Button>
        <Button onClick={handleSubmit} autoFocus>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
