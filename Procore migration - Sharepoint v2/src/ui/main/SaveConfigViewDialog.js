import React from 'react';

import {
  Modal,
  Box,
  LinearProgress,
  Typography,
  Divider,
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { FilterConfigToggle } from '../../Components/filter/filter-config-toggle';
import { FilterActionsCell } from '../../Components/filter/actions-cell';

const SaveConfigViewDialog = ({
  isSavedSearchConfigOpen,
  setIsSavedSearchConfigOpen,
  isInProgressSavingConfig,
  searchConfigs,
  setSelectedSavedConfig,
  handleSaveFilterSelectChange,
  setSavedSearchConfigNameText,
  savedFilterConfigCurDefault,
  selectedSavedConfig,
  handleSaveSearchConfigActionBtnClick,
  userType,
  isNewConfigType,
  savedSearchConfigNameText,
  filter,
  termsMapData,
  handleSavedSearchConfigNameTextChange,
  savedSearchConfigNameTextInput,
  isSavedSearchConfigType,
  handleSavedSearchConfigTypeChange,
  filterGroup,
  getGroupingValue,
  handleGroupingChange,
  setIsSavedSearchConfigType,
  setIsNewConfigType,
  handleSaveSearchConfigClick,
}) => {
  return (
    <Dialog
      open={isSavedSearchConfigOpen}
      onClose={(event, reason) => {
        // Prevent closing the modal if the reason is 'backdropClick'
        if (reason !== 'backdropClick') {
          setIsSavedSearchConfigOpen(false);
        }
      }}
      PaperProps={{
        sx: {
          width: '820px',
          maxWidth: { xs: '100%', sm: '100%', md: '90%', lg: '90%' },
        },
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
      <DialogTitle sx={{ padding: 0 }}>
        <div
          style={{
            backgroundColor: 'rgb(41, 152, 111)',
            padding: '10px',
            position: 'relative',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              color: 'white',
              fontWeight: '800',
            }}
          >
            Save Config View
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
            }}
          >
            <CloseIcon
              onClick={() => setIsSavedSearchConfigOpen(false)}
              sx={{
                color: '#fff',
                cursor: 'pointer',
              }}
            />
          </Box>
        </div>
      </DialogTitle>
      <DialogContent sx={{ padding: 0 }}>
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
            <LinearProgress sx={{ width: '15%', margin: '0 auto' }} />
          </div>
        ) : (
          <></>
        )}

        <Divider />

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ width: '100%', overflow: 'auto' }}
        >
          <Table
            sx={{ minWidth: '30vw' }}
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
                  <TableCell
                    sx={{
                      color: 'gray',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    component="th"
                    scope="row"
                    onClick={() => {
                      setSelectedSavedConfig((prev) => ({
                        ...prev,
                        Id: row?.Id,
                        Title: row?.Title,
                        ConfigType: row?.ConfigType,
                      }));

                      handleSaveFilterSelectChange({
                        target: { value: row?.Id },
                      });

                      setSavedSearchConfigNameText(row?.Title);
                    }}
                  >
                    {row?.Title}{' '}
                    {savedFilterConfigCurDefault == row?.Id ? (
                      <small
                        style={{
                          color: 'rgb(41, 152, 111)',
                          fontWeight: '800',
                          fontStyle: 'italic',
                        }}
                      >
                        default
                      </small>
                    ) : (
                      ''
                    )}
                    {selectedSavedConfig?.Id == row?.Id ? (
                      <small
                        style={{
                          color: 'rgb(41, 43, 152)',
                          fontWeight: '800',
                          fontStyle: 'italic',
                        }}
                      >
                        selected
                      </small>
                    ) : (
                      ''
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'gray' }} component="th" scope="row">
                    {row?.modified ? '–' : row?.ConfigType}
                  </TableCell>
                  <FilterActionsCell
                    row={row}
                    handleSaveSearchConfigActionBtnClick={
                      handleSaveSearchConfigActionBtnClick
                    }
                    savedFilterConfigCurDefault={savedFilterConfigCurDefault}
                    userType={userType}
                  />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <FilterConfigToggle
          isNewConfigType={isNewConfigType}
          selectedSavedConfig={selectedSavedConfig}
          savedSearchConfigNameText={savedSearchConfigNameText}
          savedSearchConfigNameTextInput={savedSearchConfigNameTextInput}
          userType={userType}
          isSavedSearchConfigType={isSavedSearchConfigType}
          handleSavedSearchConfigTypeChange={handleSavedSearchConfigTypeChange}
          handleSavedSearchConfigNameTextChange={
            handleSavedSearchConfigNameTextChange
          }
        />
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ margin: '-10px 10px 5px 10px' }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel id="groupby-select-small-label">Group by</InputLabel>
            <Select
              sx={{
                color: 'inherit',
                borderRadius: '0px',
              }}
              disabled={Object.keys(filterGroup).length <= 0}
              labelId="groupby-select-small-label"
              id="demo-select-small"
              value={getGroupingValue()}
              label="Group By"
              size="small"
              onChange={handleGroupingChange}
              fullWidth
            >
              {Object.keys(termsMapData).map((key) =>
                key.includes('Revision Number') ||
                key.includes('Short Description') ? (
                  <React.Fragment key={key}></React.Fragment>
                ) : (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>

          {selectedSavedConfig !== null &&
          Object.keys(selectedSavedConfig).length > 0 &&
          !selectedSavedConfig.modified &&
          selectedSavedConfig?.Id !== 'globalfilesearch' ? (
            <div style={{ display: 'inline-block', width: '100%' }}>
              <ToggleButtonGroup
                exclusive
                sx={{
                  float: 'right',
                  margin: '-10px 10px 0px 10px',
                }}
                size="small"
                color="primary"
                value={isNewConfigType}
                onChange={(e, selected) => {
                  if (selected !== null) {
                    setSavedSearchConfigNameText(
                      selected ? '' : selectedSavedConfig?.Title,
                    );
                    setIsSavedSearchConfigType(
                      selected ? null : selectedSavedConfig?.ConfigType,
                    );
                    setIsNewConfigType(selected);
                  }
                }}
                aria-label="Update Type"
              >
                <ToggleButton value={true}>New</ToggleButton>
                <ToggleButton
                  disabled={
                    userType !== 2 &&
                    selectedSavedConfig?.ConfigType !== 'Personal'
                  }
                  value={false}
                >
                  Update
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          ) : (
            <></>
          )}
        </Box>

        <div
          style={{
            margin: '0px 10px 0px 10px',
            display: 'flex',
            gap: '20px',
            maxWidth: '100%',
            overflow: 'auto',
          }}
        >
          {Object.keys(filter).map((key) => {
            return (
              <div key={key}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'block',
                    margin: '10px 10px 10px 0px',
                  }}
                >
                  {key}
                </Typography>
                {filter[key].map((item) => {
                  return (
                    <p
                      key={key}
                      style={{
                        fontSize: '12px',
                        margin: '-10px 0px 10px 2px',
                      }}
                    >
                      {item.split('|')[0]}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>

        <Divider />

        <Divider />
        <Box display="flex" justifyContent="space-between">
          <Button
            onClick={() => setIsSavedSearchConfigOpen(false)}
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
              !Object.keys(filter).length ||
              !isSavedSearchConfigType ||
              !savedSearchConfigNameText
            }
            onClick={() => handleSaveSearchConfigClick()}
            sx={{ margin: '10px 10px 10px 10px', float: 'right' }}
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SaveConfigViewDialog;
