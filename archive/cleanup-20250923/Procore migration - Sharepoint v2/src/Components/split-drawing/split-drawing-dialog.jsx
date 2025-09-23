import {
  Dialog,
  DialogTitle,
  Grid2,
  IconButton,
  Stack,
  Typography,
  Button,
  DialogContent,
} from '@mui/material';
import { Fragment, memo, useCallback } from 'react';
import { Close } from '@mui/icons-material';
import { useBulkUploadStore } from '../upload/bulk-upload-store';
import { useWatch } from 'react-hook-form';
import { ALERT_SEVERITY, TERMS_KEY_MAPPING_CT } from '../../const/common';
import { SplitDrawingModal } from './split-drawing-modal';
import { useSplitDrawing } from '../../hooks/useSplitDrawing';
import { useSnackbar } from '../../context/snackbar-provider';

const SplitDrawingDialogHeader = memo(function SplitDrawingDialogHeader() {
  const { handleCloseSplit } = useSplitDrawing();

  return (
    <Grid2
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        position: 'relative',
        height: '50px',
        backgroundColor: 'rgb(41, 152, 111)',
      }}
    >
      <DialogTitle
        sx={{
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        File Upload Split Drawing
      </DialogTitle>

      <IconButton
        onClick={handleCloseSplit}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
        }}
      >
        <Close
          sx={{
            color: 'white',
          }}
        />
      </IconButton>
    </Grid2>
  );
});

const SplitDrawingDialogContent = memo(function SplitDrawingDialogContent() {
  const selectedFile = useBulkUploadStore((state) => state.selectedFile);

  return (
    <DialogContent>
      <Grid2
        container
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '8px',
          marginBottom: '8px',
          flexWrap: {
            sm: 'nowrap',
          },
          flexDirection: 'column',
          minHeight: '83vh',
        }}
      >
        <Stack spacing={2}>
          <SplitDrawingModal selectedFile={selectedFile} />
        </Stack>
      </Grid2>
    </DialogContent>
  );
});

export function SplitDrawingDialog({ isLoading }) {
  const { openModal, handleOpenSplit, handleCloseSplit } = useSplitDrawing();
  const selectedFile = useBulkUploadStore((state) => state.selectedFile);
  const selectedFiles = useBulkUploadStore((state) => state.selectedFiles);
  const { showSnackbar } = useSnackbar();

  const documentType = useWatch({
    name: TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE,
  });

  const splitable =
    documentType?.split('|')[0] === 'Drawing' &&
    selectedFile?.file.type === 'application/pdf';

  const handleOpen = useCallback(() => {
    if (selectedFiles.length > 1) {
      showSnackbar({
        message: 'Please select only one file to split.',
        severity: ALERT_SEVERITY.ERROR,
      });
      return;
    }
    handleOpenSplit();
  }, [handleOpenSplit, selectedFiles, showSnackbar]);

  return (
    <Fragment>
      <Button
        variant="text"
        loading={isLoading}
        disabled={!splitable}
        onClick={handleOpen}
      >
        Split
      </Button>

      <Dialog
        open={openModal}
        onClose={handleCloseSplit}
        fullWidth
        maxWidth="false"
      >
        <SplitDrawingDialogHeader />
        <SplitDrawingDialogContent />
      </Dialog>
    </Fragment>
  );
}
