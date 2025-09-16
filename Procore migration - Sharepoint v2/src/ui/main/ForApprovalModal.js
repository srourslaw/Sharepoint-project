import React from 'react';

import {
  Modal,
  Box,
  LinearProgress,
  Typography,
  Alert,
  Grid2 as Grid,
  MenuItem,
  TextField,
  Tooltip,
  Divider,
  Paper,
  FormControl,
  Button,
  Select,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import ScheduleSendOutlinedIcon from '@mui/icons-material/ScheduleSendOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ForApprovalTable from './ForApprovalTable';

const ForApprovalModal = ({
  isMinorVersionListOpen,
  setIsMinorVersionListOpen,
  isInProgressMinorVersionList,
  isErrorMinorVersions,
  isError,
  isMinorVersionUpdated,
  handleSearchMinorVersionTextInputChange,
  searchMinorVersionTextInput,
  getPendingDraftVersions,
  approvalPageTableOrderBy,
  approvalPageTableOrder,
  handleSortApprovalPageTable,
  sortedData,
  handleViewFileContentActionClick,
  termsMapData,
  versionFileStatusMapping,
  termsGuidToLabel,
  termsMapCTData,
  minorVersionIframePropRaw,
  convertUTCToLocal,
  minorVersionsResortTarget,
  handleMinorVersionResortSelectChange,
  termsDataLocal,
  minorVersions,
  minorVersionIframeSrc,
  minorVersionIframeSrcTitle,
  setMinorVersionIframeSrc,
  setMinorVersionIframeSrcTitle,
  minorVersionIframeProp,
  minorVersionComments,
  isMinorVersionCommentsOpen,
  draftCommentTextInput,
  setIsMinorVersionCommentsOpen,
  handleMinorVersionResortActionClick,
  handleRejectModalOpen,
  handleRejectModalClose,
  openRejectModal,
  rejectReason,
  handleChangeReason,
}) => {
  return (
    <Modal
      open={isMinorVersionListOpen}
      onClose={(event, reason) => {
        // Prevent closing the modal if the reason is 'backdropClick'
        if (reason !== 'backdropClick') {
          setIsMinorVersionListOpen(false);
        }
      }}
      BackdropProps={{
        // Disable clicks on the backdrop to prevent closing the modal
        onClick: (event) => event.stopPropagation(),
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        '&:focus, &:active': {
          outline: 'none',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          width: '98%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          padding: '0px 0px 0px 0px!important',
        }}
      >
        {isInProgressMinorVersionList ? (
          <div
            style={{
              position: 'absolute',
              zIndex: '9999',
              backgroundColor: 'rgb(0 0 0 / 58%)',
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'center',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <LinearProgress sx={{ width: '5%', margin: '0 auto' }} />
          </div>
        ) : (
          <></>
        )}

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
            For Draft and Approval Documents
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
            }}
          >
            <CloseIcon
              onClick={() => setIsMinorVersionListOpen(false)}
              sx={{
                color: '#fff',
                cursor: 'pointer',
              }}
            />
          </Box>
        </div>

        {isErrorMinorVersions ? (
          <Alert severity="warning">
            {isError} {isErrorMinorVersions}
          </Alert>
        ) : (
          <></>
        )}

        {isMinorVersionUpdated ? (
          <Alert severity="success">{isMinorVersionUpdated}</Alert>
        ) : (
          <></>
        )}

        <Grid container spacing={2}>
          <Grid item lg={3} sx={{ flex: 1 }}>
            <HomeWorkIcon
              sx={{
                margin: '13px 0px 0px 10px',
                color: 'rgb(41, 152, 111)',
                fontSize: '14px',
              }}
            />
            <FormControl
              variant="standard"
              sx={{
                margin: '10px 0px 5px 10px',
                color: 'rgb(41, 152, 111)',
              }}
              size="small"
            >
              <Select
                disableUnderline
                sx={{
                  color: 'inherit',
                  borderRadius: '0px',
                  textAlign: 'center',
                  fontSize: '14px',
                  padding: '0px',
                  fontWeight: '800',
                }}
                value={minorVersionsResortTarget || ''}
                label="Resorts"
                onChange={(e) => handleMinorVersionResortSelectChange(e)}
              >
                {Object.keys(termsDataLocal).length > 0 &&
                Object.keys(termsDataLocal?.Resort).length > 0 ? (
                  Object.entries(termsDataLocal['Resort']).map(
                    ([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.split('|')[0]}
                      </MenuItem>
                    ),
                  )
                ) : (
                  <></>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
            lg={3}
            sx={{
              flex: 1,
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            <TextField
              onChange={handleSearchMinorVersionTextInputChange}
              inputRef={searchMinorVersionTextInput}
              id="search-DraftPendingDocs"
              label="Filter"
              variant="outlined"
              size="small"
              sx={{
                '& .MuiInputLabel-root': { fontSize: '11px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  fontSize: '11px',
                },
                fontSize: '11px',
                margin: '9px 0px 8px 5px',
                width: '80%',
              }}
            />
          </Grid>
          <Grid item lg={3} sx={{ flex: 1 }}>
            <Tooltip title="Reload">
              <LoopOutlinedIcon
                onClick={() => {
                  getPendingDraftVersions();
                }}
                sx={{
                  margin: '12px 15px 0px 0px',
                  cursor: 'pointer',
                  color: 'rgb(41, 152, 111)',
                  float: 'right',
                }}
              />
            </Tooltip>
          </Grid>
        </Grid>

        <Divider />

        <ForApprovalTable
          approvalPageTableOrderBy={approvalPageTableOrderBy}
          approvalPageTableOrder={approvalPageTableOrder}
          handleSortApprovalPageTable={handleSortApprovalPageTable}
          sortedData={sortedData}
          handleViewFileContentActionClick={handleViewFileContentActionClick}
          termsMapData={termsMapData}
          versionFileStatusMapping={versionFileStatusMapping}
          termsGuidToLabel={termsGuidToLabel}
          termsMapCTData={termsMapCTData}
          minorVersionIframePropRaw={minorVersionIframePropRaw}
          convertUTCToLocal={convertUTCToLocal}
        />

        <Divider />

        {minorVersions.length > 0 &&
        minorVersionIframeSrc &&
        minorVersionIframeSrcTitle ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  padding: '8px 5px 10px 0px',
                  width: '100%',
                  backgroundColor:
                    minorVersionIframePropRaw?.OData__ModerationStatus == 2
                      ? 'red'
                      : '#e9e9e9',
                  color:
                    minorVersionIframePropRaw?.OData__ModerationStatus == 2
                      ? 'white'
                      : 'gray',
                  fontWeight: '500',
                }}
              >
                {versionFileStatusMapping[
                  minorVersionIframePropRaw?.OData__ModerationStatus
                ] || 'unknown'}
                &nbsp; - &nbsp;{minorVersionIframeSrcTitle}
                <ClearIcon
                  onClick={() => {
                    setMinorVersionIframeSrc(null);
                    setMinorVersionIframeSrcTitle(null);
                  }}
                  sx={{
                    fontSize: '17px',
                    margin: '0px 5px -5px 0px',
                    float: 'right',
                  }}
                />
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <iframe
                src={minorVersionIframeSrc}
                width="60%"
                height="400"
                frameborder="0"
                scrolling="no"
                allowfullscreen
                title={minorVersionIframeSrcTitle}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              ></iframe>
              {/* <span style={{fontSize: '10px', padding: '10px 5px 10px 0px', width: "640px"}}>Configure <strong>chrome://settings/cookies, edge://settings/cookies</strong> Select <strong> Allow third-party cookies</strong></span> */}
              <div
                style={{
                  width: '50%',
                  margin: '10px 0px 0px 10px',
                  textAlign: 'center',
                }}
              >
                <Grid
                  container
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                >
                  {Object.keys(termsMapCTData).map(
                    (
                      key,
                      index,
                      arr /* explicit termsMapCTData source to include other non-term store based fields ie. DrawingNumber */,
                    ) => (
                      <>
                        <Grid
                          item
                          xs={6}
                          sm={6}
                          sx={{ margin: '10px 0px 0px 0px' }}
                        >
                          <span
                            style={{
                              float: 'left',
                              fontSize: '12px',
                              color: 'rgb(41, 152, 111)',
                              fontWeight: '800',
                              margin: '-15px 0px 0px 0px',
                            }}
                          >
                            {key}
                          </span>
                          <Paper
                            elevation={1}
                            sx={{
                              padding: '1px 0px 1px 0px',
                              fontSize: '12px',
                              borderRadius: '0px',
                              maxWidth: '150px',
                              minWidth: '190px',
                              maxHeight: '200px',
                            }}
                          >
                            <p
                              style={{
                                color: 'gray',
                                fontSize: '12px',
                              }}
                            >
                              {(minorVersionIframeProp &&
                                minorVersionIframeProp[key]) || (
                                <>
                                  <span
                                    style={{
                                      color: 'gray',
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    &lt;not specified&gt;
                                  </span>
                                </>
                              )}
                            </p>
                          </Paper>
                        </Grid>
                        {index === arr.length - 1 ? (
                          minorVersionComments !== '' ? (
                            <Grid
                              item
                              xs={6}
                              sm={6}
                              sx={{ margin: '10px 0px 0px 0px' }}
                            >
                              <span
                                style={{
                                  float: 'left',
                                  fontSize: '12px',
                                  color: 'rgb(41, 152, 111)',
                                  fontWeight: '800',
                                  margin: '-15px 0px 0px 0px',
                                }}
                              >
                                Comments
                              </span>
                              <Paper
                                elevation={1}
                                sx={{
                                  padding: '1px 0px 1px 0px',
                                  fontSize: '12px',
                                  borderRadius: '0px',
                                  maxWidth: '150px',
                                  minWidth: '190px',
                                  maxHeight: '200px',
                                }}
                              >
                                <p
                                  style={{
                                    color: 'gray',
                                    fontSize: '12px',
                                  }}
                                >
                                  {minorVersionComments}
                                </p>
                              </Paper>
                            </Grid>
                          ) : (
                            <></>
                          )
                        ) : (
                          <></>
                        )}
                      </>
                    ),
                  )}
                </Grid>

                {isMinorVersionCommentsOpen ? (
                  <>
                    <TextField
                      fullWidth
                      inputRef={draftCommentTextInput}
                      id="draftComment"
                      label="Request for Approval Comments"
                      variant="outlined"
                      size="small"
                      sx={{
                        width: '90%',
                        margin: '15px 0px 0px 0px',
                        '& .MuiInputLabel-root': {
                          fontSize: '12px',
                        },
                        input: { fontSize: '12px' },
                      }}
                    />
                    <Button
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
                      onClick={(e) =>
                        handleMinorVersionResortActionClick(
                          e,
                          2,
                          minorVersionIframePropRaw?.Id,
                          minorVersionIframePropRaw?.FileDirRef,
                          minorVersionIframePropRaw?.Title,
                          minorVersionIframePropRaw?.OData__UIVersionString,
                          minorVersionIframePropRaw?.FileRef,
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
                  </>
                ) : minorVersionIframePropRaw?.OData__ModerationStatus == 2 ? ( // if pending state
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      sx={{ px: 3 }}
                    >
                      <Button
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
                        onClick={(e) =>
                          handleMinorVersionResortActionClick(
                            e,
                            0,
                            minorVersionIframePropRaw?.Id,
                            minorVersionIframePropRaw?.FileDirRef,
                            minorVersionIframePropRaw?.Title,
                            minorVersionIframePropRaw?.OData__UIVersionString,
                            minorVersionIframePropRaw?.FileRef,
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
                          <Button onClick={handleRejectModalClose} color="info">
                            Cancel
                          </Button>
                          <Button
                            disabled={rejectReason === ''}
                            onClick={(e) =>
                              handleMinorVersionResortActionClick(
                                e,
                                1,
                                minorVersionIframePropRaw?.Id,
                                minorVersionIframePropRaw?.FileDirRef,
                                minorVersionIframePropRaw?.Title,
                                minorVersionIframePropRaw?.OData__UIVersionString,
                                minorVersionIframePropRaw?.FileRef,
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
                  <>
                    <Button
                      onClick={(e) =>
                        setIsMinorVersionCommentsOpen(
                          minorVersionIframePropRaw?.Id,
                        )
                      }
                      sx={{
                        margin: '10px 10px 10px 10px',
                        fontSize: '12px',
                      }}
                      startIcon={<ScheduleSendOutlinedIcon />}
                    >
                      Request Approval
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                minHeight: '470px',
                display: 'flex',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  justifyContent: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  fontStyle: 'italic',
                  fontWeight: '800',
                  color: '#d2d2d2',
                }}
              >
                Preview file
              </span>
            </div>
          </>
        )}

        <Divider />

        <Button
          onClick={() => setIsMinorVersionListOpen(false)}
          sx={{
            margin: '10px 10px 10px 10px',
            float: 'left',
            color: 'red',
          }}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default ForApprovalModal;
