import { useEffect } from 'react';
import { Button, IconButton, Modal, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const BulkDownloadModal = ({
  open,
  onClose,
  content,
  onConfirm,
  fileStatus,
}) => {
  useEffect(() => {
    if (!open) return;

    let timer;

    if (!onConfirm) {
      if (fileStatus === 'ok') {
        timer = setTimeout(() => {
          onClose();
        }, 5000);
      }
    }

    return () => clearTimeout(timer);
  }, [open, onConfirm, fileStatus, onClose]);

  const getSubtext = () => {
    if (fileStatus === 'ok')
      return 'This modal will close automatically in 5 seconds.';
    if (fileStatus === 'failed')
      return 'Please contact support if the issue persists.';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'max-content',
          maxWidth: '1024px',
          minWidth: '400px',
          backgroundColor: 'white',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: '50px',
            backgroundColor: 'rgb(41, 152, 111)',
            paddingInline: '16px',
            position: 'sticky',
            zIndex: 50,
            top: 0,
          }}
        >
          <Typography sx={{ fontSize: 16, color: 'white', fontWeight: '800' }}>
            Bulk Download
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ marginLeft: 'auto', color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '16px',
            whiteSpace: 'pre-wrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Main message */}
          <Typography sx={{ fontSize: 16, fontWeight: '800' }}>
            {content.main}
          </Typography>

          {/* Subtext */}
          {getSubtext() && (
            <Typography
              sx={{ fontSize: 10, fontWeight: '400', marginTop: '4px' }}
            >
              {getSubtext()}
            </Typography>
          )}

          {/* Failed Files */}
          {content.failed.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 700, color: 'red', marginTop: 2 }}>
                Failed Files
              </Typography>
              {content.failed.map((line, idx) => (
                <Typography key={`failed-${idx}`}>{line}</Typography>
              ))}
            </>
          )}

          {/* Successful Files */}
          {content.success.length > 0 && (
            <>
              <Typography
                sx={{ fontWeight: 700, color: 'green', marginTop: 2 }}
              >
                Successful Files
              </Typography>
              {content.success.map((line, idx) => (
                <Typography key={`success-${idx}`}>{line}</Typography>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px',
            borderTop: '1px solid #ddd',
          }}
        >
          <Button onClick={onClose} variant="outlined" color="error">
            Close
          </Button>

          {onConfirm && (
            <Button
              onClick={onConfirm}
              variant="contained"
              sx={{ bgcolor: 'rgb(41, 152, 111)' }}
            >
              Download Anyway
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
