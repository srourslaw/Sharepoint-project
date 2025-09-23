import { useFormContext, useWatch } from 'react-hook-form';
import { useUserSiteAuthorization } from '../../hooks/useResortAuthorization';
import { Button, Grid2 } from '@mui/material';
import { TERMS_KEY_MAPPING_CT, UPLOAD_MODE } from '../../const/common';
import { useContext, useMemo } from 'react';
import { BulkUploadDialogContext } from './bulk-upload-dialog';
import { useBulkUploadStore } from './bulk-upload-store';
import { SplitDrawingDialog } from '../split-drawing/split-drawing-dialog';

export function UploadSubmitButtons() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext();
  const { handleClose } = useContext(BulkUploadDialogContext);

  const resort = useWatch({
    name: TERMS_KEY_MAPPING_CT.RESORT,
  });

  const { isAutoApproveAvailable, isLoading: isAuthLoading } =
    useUserSiteAuthorization({
      siteName: resort?.split('|')[0],
    });

  const uploadError = useBulkUploadStore((state) => state.uploadError);
  const submitMode = useBulkUploadStore((state) => state.submitMode);

  const { draftLoading, approveLoading, forApprovalLoading } = useMemo(() => {
    return {
      draftLoading:
        isAuthLoading || (submitMode === UPLOAD_MODE.DRAFT && isSubmitting),
      approveLoading:
        isAuthLoading ||
        (submitMode === UPLOAD_MODE.FOR_APPROVAL && isSubmitting),
      forApprovalLoading:
        isAuthLoading ||
        (submitMode === UPLOAD_MODE.PRE_APPROVE && isSubmitting),
    };
  }, [isAuthLoading, submitMode, isSubmitting]);

  return (
    <Grid2
      container
      sx={{
        marginTop: '8px',
        display: 'flex',
        flexDirection: {
          xs: 'column',
          sm: 'row',
        },
        gap: 2, // spacing between buttons
        justifyContent: 'space-between',
        alignItems: {
          xs: 'stretch',
          sm: 'center',
        },
      }}
    >
      <Button color="error" onClick={handleClose}>
        Close
      </Button>

      <Grid2
        item
        sx={{
          display: 'flex',
          gap: 2,
        }}
      >
        {process.env.REACT_APP_SPLIT_FEATURE === 'true' && (
          <SplitDrawingDialog isLoading={isAuthLoading} />
        )}
        <Button
          type="submit"
          name={UPLOAD_MODE.DRAFT}
          loading={draftLoading}
          disabled={!isValid || uploadError || isSubmitting}
        >
          Save As Draft
        </Button>
        {isAutoApproveAvailable ? (
          <Button
            name={UPLOAD_MODE.PRE_APPROVE}
            disabled={!isValid || uploadError || isSubmitting}
            type="submit"
            loading={forApprovalLoading}
            sx={{ fontWeight: 'bold' }}
          >
            Submit & Approve
          </Button>
        ) : (
          <Button
            name={UPLOAD_MODE.FOR_APPROVAL}
            disabled={!isValid || uploadError || isSubmitting}
            type="submit"
            loading={approveLoading}
            sx={{ fontWeight: 'bold' }}
          >
            Submit for Approval
          </Button>
        )}
      </Grid2>
    </Grid2>
  );
}
