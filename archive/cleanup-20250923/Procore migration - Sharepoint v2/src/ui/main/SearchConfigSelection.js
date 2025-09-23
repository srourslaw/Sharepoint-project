import React from 'react';

import {
  Modal,
  Box,
  LinearProgress,
  Typography,
  Divider,
  Button,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const SearchConfigSelection = ({
  savedFilterConfigViewOpen,
  setSavedFilterConfigViewOpen,
  setSavedFilterConfigModifications,
  isInProgressSavingConfig,
  savedFilterConfigModifications,
  searchConfigs,
  savedFilterConfigCurDefault,
  handleConfigSavedFilter,
  handleSaveModifiedSearchConfigClick,
}) => {
  return (
    <Modal
      open={savedFilterConfigViewOpen}
      onClose={(event, reason) => {
        // Prevent closing the modal if the reason is 'backdropClick'
        if (reason !== 'backdropClick') {
          setSavedFilterConfigViewOpen(false);
          setSavedFilterConfigModifications({});
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
          width: '50%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          padding: '0px 0px 0px 0px!important',
        }}
      >
        {isInProgressSavingConfig ? (
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
            textAlign: 'center',
            color: 'white',
            padding: '10px',
            fontWeight: '800',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              color: 'white',
              fontWeight: '800',
            }}
          >
            Configure Saved Views
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
            }}
          >
            <CloseIcon
              onClick={() => {
                setSavedFilterConfigViewOpen(false);
                setSavedFilterConfigModifications({});
              }}
              sx={{
                color: '#fff',
                cursor: 'pointer',
              }}
            />
          </Box>
        </div>

        <Typography
          variant="caption"
          gutterBottom
          sx={{
            display: 'block',
            textAlign: 'center',
            margin: '5px 0px 0px 0px',
          }}
        >
          {Object.keys(savedFilterConfigModifications).length ? (
            <>
              {searchConfigs && savedFilterConfigModifications?.default ? (
                searchConfigs.map((row) =>
                  row?.Id === savedFilterConfigModifications?.default ? (
                    <>
                      The{' '}
                      <strong style={{ color: 'rgb(41, 152, 111)' }}>
                        {row?.Title}
                      </strong>{' '}
                      view will be set as default.
                      <br />
                    </>
                  ) : (
                    ''
                  ),
                )
              ) : (
                <></>
              )}

              {savedFilterConfigModifications.hasOwnProperty('delete') &&
              savedFilterConfigModifications['delete']?.length > 0
                ? 'The '
                : ''}
              {searchConfigs && savedFilterConfigModifications?.delete ? (
                savedFilterConfigModifications?.delete.map((row_) =>
                  searchConfigs.map((row) =>
                    row?.Id === row_ ? (
                      <>
                        <strong style={{ color: 'rgb(232, 44, 11)' }}>
                          {row?.Title}
                        </strong>
                        {', '}
                      </>
                    ) : (
                      ''
                    ),
                  ),
                )
              ) : (
                <></>
              )}
              {savedFilterConfigModifications.hasOwnProperty('delete') &&
              savedFilterConfigModifications['delete']?.length > 0
                ? 'views will be deleted.'
                : ''}
            </>
          ) : (
            <></>
          )}
        </Typography>

        <Divider />

        <TableContainer
          component={Paper}
          sx={{ maxHeight: '400px', overflow: 'auto' }}
        >
          <Table
            sx={{ minWidth: '30vw', maxHeight: '80%' }}
            size="small"
            aria-label="a dense table"
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                    width: '70%',
                  }}
                >
                  View Name
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                    width: '20%',
                  }}
                >
                  View Type
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                    width: '10%',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ maxHeight: '100px' }}>
              {searchConfigs.map((row) => (
                <TableRow
                  key={row?.Id}
                  sx={{
                    '&:last-child td, &:last-child th': {
                      border: 0,
                    },
                  }}
                >
                  <TableCell sx={{ color: 'gray' }} component="th" scope="row">
                    {row?.Title}{' '}
                    {savedFilterConfigCurDefault == row?.Id ? (
                      <small
                        style={{
                          color: 'rgb(41, 152, 111)',
                          fontWeight: '800',
                        }}
                      >
                        (current default)
                      </small>
                    ) : (
                      ''
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'gray' }} component="th" scope="row">
                    {row?.ConfigType}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Tooltip placement="right" title="Set Default">
                      <BookmarkAddedIcon
                        onClick={() => {
                          handleConfigSavedFilter('default', row?.Id);
                        }}
                        sx={{
                          cursor:
                            isInProgressSavingConfig ||
                            (savedFilterConfigModifications?.delete &&
                              savedFilterConfigModifications?.delete.includes(
                                row?.Id,
                              ))
                              ? 'not-allowed'
                              : 'pointer',
                          color:
                            isInProgressSavingConfig ||
                            (savedFilterConfigModifications?.delete &&
                              savedFilterConfigModifications?.delete.includes(
                                row?.Id,
                              ))
                              ? 'gray'
                              : savedFilterConfigModifications?.default &&
                                  savedFilterConfigModifications?.default ==
                                    row?.Id
                                ? 'rgb(41, 152, 111)'
                                : 'black',
                        }}
                      />
                    </Tooltip>
                    <Tooltip placement="right" title="Delete">
                      <RemoveCircleOutlineIcon
                        onClick={() => {
                          handleConfigSavedFilter('delete', row?.Id);
                        }}
                        sx={{
                          margin: '0px 0px 0px 5px',
                          cursor:
                            isInProgressSavingConfig ||
                            (savedFilterConfigModifications?.default &&
                              savedFilterConfigModifications?.default ==
                                row?.Id)
                              ? 'not-allowed'
                              : 'pointer',
                          color:
                            isInProgressSavingConfig ||
                            (savedFilterConfigModifications?.default &&
                              savedFilterConfigModifications?.default ==
                                row?.Id)
                              ? 'gray'
                              : 'red',
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <Box display="flex" justifyContent="space-between">
          <Button
            onClick={() => {
              setSavedFilterConfigViewOpen(false);
              setSavedFilterConfigModifications({});
            }}
            sx={{
              margin: '10px 10px 10px 10px',
              float: 'right',
              color: 'red',
            }}
          >
            Close
          </Button>
          <Button
            disabled={
              !Object.keys(savedFilterConfigModifications).length ||
              isInProgressSavingConfig
            }
            onClick={() => handleSaveModifiedSearchConfigClick()}
            sx={{ margin: '10px 10px 10px 10px', float: 'right' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SearchConfigSelection;
