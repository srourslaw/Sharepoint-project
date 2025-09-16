import React, { useContext } from 'react';

import ClearIcon from '@mui/icons-material/Clear';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ScheduleSendOutlinedIcon from '@mui/icons-material/ScheduleSendOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { ApprovalContext } from './context/ApprovalProvider';
import {
  Grid,
  Modal,
  Divider,
  TextField,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { formatDisplayDate } from '../../utils/helpers';
import { useApprovalStore } from '../../store/approval-store';
import { useShallow } from 'zustand/react/shallow';

const timezoneData_ = await import(
  `../../Data/timezone-resort-${process.env.REACT_APP_ENV}.json`
);
const timezoneResort = timezoneData_?.default;

const termKeyMappingCT_ = await import(
  `../../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termKeyMappingCT = termKeyMappingCT_?.default;

const ApprovalView = ({
  isAutoApproveAvailable,
  error,
  isMinorVersionCommentsOpen,
  handleSubmitDraftApprove,
  draftCommentTextInput,
  setIsMinorVersionCommentsOpen,
  handleMinorVersionResortActionClick,
  handleRejectModalOpen,
  openRejectModal,
  handleRejectModalClose,
  rejectReason,
  handleChangeReason,
}) => {
  const { approvalDetails, rowDetails } = useApprovalStore(
    useShallow((state) => ({
      rowDetails: state.rowDetails,
      approvalDetails: state.approvalDetails,
    })),
  );

  const isDocTypeDrawing =
    String(rowDetails?.['Document Type']).toLowerCase() === 'drawing';

  return (
    <>
      <Grid container spacing={2}>
        <FieldValue label="Business" value={rowDetails?.Business} isRequired />
        <FieldValue label="Resort" value={rowDetails?.Resort} isRequired />
        <FieldValue label="Park Stage" value={rowDetails?.['Park Stage']} />
        <FieldValue
          label="Department"
          value={rowDetails?.Department}
          isRequired
        />
        {String(rowDetails?.Department).toLowerCase() === 'residential' ? (
          <FieldValue label="Villa" value={rowDetails?.Villa} />
        ) : (
          <FieldValue label="Building" value={rowDetails?.Building} />
        )}
        <SpaceField />
        <FieldValue
          label="Document Type"
          value={rowDetails?.['Document Type']}
          isRequired
        />
        <FieldValue label="Discipline" value={rowDetails?.Discipline} />
      </Grid>

      <Divider sx={{ mb: 2 }} />

      <Grid container sx={{ mb: 2 }} spacing={2}>
        <FieldValue
          label="Drawing Number"
          value={rowDetails?.DrawingNumber}
          isRequired
        />
        <FieldValue label="Title" value={rowDetails?.Title} isRequired />
        <FieldValue
          label="Revision Number"
          value={rowDetails?.RevisionNumber}
          isRequired={
            rowDetails?.['Document Type']?.toLowerCase() === 'drawing'
          }
        />
        <FieldValue
          label="Drawing Set Name"
          value={rowDetails?.['Drawing Set Name']}
          isRequired
        />
        <FieldValue
          label="Drawing Area"
          value={rowDetails?.['Drawing Area']}
          isRequired
        />
        <FieldValue label="Gate" value={rowDetails?.Gate} />
        <FieldValue label="Modified By" value={rowDetails?.Editor?.Title} />
        <FieldValue
          label="Confidentiality"
          value={rowDetails?.Confidentiality}
        />
        <FieldValue
          label="Short Description"
          value={rowDetails?.['ShortDescription']}
        />
        <DateFieldValue
          label="Drawing Date"
          value={rowDetails?.[termKeyMappingCT['Drawing Date']]}
          isEnabled={isDocTypeDrawing}
          resort={rowDetails?.['Resort']}
        />
        <DateFieldValue
          label="Drawing Received Date"
          value={rowDetails?.[termKeyMappingCT['Drawing Received Date']]}
          isEnabled={isDocTypeDrawing}
          resort={rowDetails?.['Resort']}
        />
        <FieldValue
          label="Submitters Comment"
          value={rowDetails?.['CheckInComment']}
        />
      </Grid>

      {isAutoApproveAvailable && rowDetails?.OData__ModerationStatus === 3 ? (
        <Box display="flex" justifyContent="right" sx={{ px: 3 }}>
          <Button
            disabled={error}
            onClick={handleSubmitDraftApprove}
            sx={{
              margin: '10px 10px 10px 10px',
              fontSize: '12px',
            }}
            startIcon={<DoneAllIcon />}
          >
            Submit Draft & Approve
            {/* Submit */}
          </Button>
        </Box>
      ) : isMinorVersionCommentsOpen ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TextField
            fullWidth
            inputRef={draftCommentTextInput}
            id="draftComment"
            label="Request for Approval Comments"
            variant="outlined"
            size="small"
            sx={{
              margin: '15px 0px 0px 0px',
              '& .MuiInputLabel-root': {
                fontSize: '12px',
              },
              input: { fontSize: '12px' },
            }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Button
              disabled={error}
              onClick={() => setIsMinorVersionCommentsOpen(false)}
              sx={{
                margin: '10px 0px 10px 0px',
                color: 'red',
                fontSize: '12px',
              }}
              startIcon={<ClearIcon />}
            >
              Cancel
            </Button>
            <Button
              disabled={error}
              onClick={(e) =>
                handleMinorVersionResortActionClick(
                  e,
                  2,
                  rowDetails?.Id,
                  rowDetails?.FileDirRef,
                  rowDetails?.Title,
                  rowDetails?.OData__UIVersionString,
                  rowDetails?.FileRef,
                )
              }
              sx={{
                margin: '10px 0px 10px 0px',
                fontSize: '12px',
              }}
              startIcon={<SendOutlinedIcon />}
            >
              Send Request
            </Button>
          </Box>
        </Box>
      ) : rowDetails?.OData__ModerationStatus === 2 ? ( // if pending state
        <>
          <Box display="flex" justifyContent="space-between" sx={{ px: 3 }}>
            <Button
              disabled={error}
              onClick={handleRejectModalOpen}
              sx={{
                margin: '10px 10px 10px 10px',
                color: 'red',
                fontSize: '12px',
              }}
              startIcon={<ClearIcon />}
            >
              Reject
            </Button>
            <Button
              disabled={error}
              onClick={(e) =>
                handleMinorVersionResortActionClick(
                  e,
                  0,
                  rowDetails?.Id,
                  rowDetails?.FileDirRef,
                  rowDetails?.Title,
                  rowDetails?.OData__UIVersionString,
                  rowDetails?.FileRef,
                )
              }
              sx={{
                margin: '10px 10px 10px 10px',
                fontSize: '12px',
              }}
              startIcon={<DoneAllIcon />}
            >
              Approve
            </Button>
          </Box>
          <Modal
            open={openRejectModal}
            onClose={handleRejectModalClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgb(41, 152, 111)',
                  padding: '10px',
                }}
              >
                <Typography
                  sx={{
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: '800',
                  }}
                >
                  Warning: Reject Confirmation
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  }}
                >
                  <CloseIcon
                    onClick={handleRejectModalClose}
                    sx={{
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
              </div>
              <Box
                sx={{
                  p: 3,
                }}
              >
                <Typography>
                  Are you sure you would like to reject this document?
                </Typography>
                <TextField
                  label="Reason"
                  size="small"
                  rows={3}
                  value={rejectReason}
                  onChange={handleChangeReason}
                  multiline
                  fullWidth
                />
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ p: 1 }}
              >
                <Button
                  disabled={error}
                  onClick={handleRejectModalClose}
                  color="info"
                >
                  Cancel
                </Button>
                <Button
                  disabled={rejectReason === '' || error}
                  onClick={(e) =>
                    handleMinorVersionResortActionClick(
                      e,
                      1,
                      rowDetails?.Id,
                      rowDetails?.FileDirRef,
                      rowDetails?.Title,
                      rowDetails?.OData__UIVersionString,
                      rowDetails?.FileRef,
                    )
                  }
                  color="error"
                >
                  Reject
                </Button>
              </Box>
            </Box>
          </Modal>
        </>
      ) : (
        // if draft state
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button
            disabled={error}
            onClick={(e) => setIsMinorVersionCommentsOpen(rowDetails?.Id)}
            sx={{
              margin: '10px 10px 10px 10px',
              fontSize: '12px',
            }}
            startIcon={<ScheduleSendOutlinedIcon />}
          >
            Request Approval
          </Button>
        </Box>
      )}
    </>
  );
};

const DateFieldValue = ({ label, value, isEnabled, resort }) => {
  const siteTimezone = timezoneResort[resort];
  const formattedValue = formatDisplayDate(
    value,
    siteTimezone,
    'DD - MMM - YYYY',
  );
  return (
    <FieldValue
      label={label}
      value={isEnabled ? formattedValue : '-'}
      isRequired
    />
  );
};

const FieldValue = ({ label, isRequired, value }) => {
  return (
    <Grid item xs={6} sm={4} md={6} lg={4}>
      <Box>
        <Typography
          variant="caption"
          color="rgb(41, 152, 111)"
          sx={{ fontWeight: 700 }}
        >
          {label}
          {isRequired && '*'}
        </Typography>
        <Typography
          variant="body1"
          color="gray"
          sx={{ mb: 1, fontWeight: 800 }}
        >
          {value ? (
            value
          ) : (
            <span
              style={{
                color: 'gray',
                fontStyle: 'italic',
              }}
            >
              -
            </span>
          )}
        </Typography>
      </Box>
    </Grid>
  );
};

const SpaceField = () => {
  return <Grid item xs={6} sm={4} md={6} lg={4} />;
};

export default ApprovalView;
