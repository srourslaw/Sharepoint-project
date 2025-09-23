import React from 'react';

import {
  Modal,
  Box,
  LinearProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Divider,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SaveSearchConfigModal = ({
  isSavedSearchConfigOpen,
  setIsSavedSearchConfigOpen,
  isInProgressSavingConfig,
  savedSearchConfigNameTextInput,
  handleSavedSearchConfigTypeChange,
  handleSaveSearchConfigClick,
  isSavedSearchConfigType,
  termsMapData,
  handleGroupingChange,
  selectedSavedConfig,
  setIsNewConfigType,
  isNewConfigType,
  filterGroup,
  grouping,
  userType,
  filter,
}) => {
  return (
    <Modal
      open={isSavedSearchConfigOpen}
      onClose={(event, reason) => {
        // Prevent closing the modal if the reason is 'backdropClick'
        if (reason !== 'backdropClick') {
          setIsSavedSearchConfigOpen(false);
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
          width: 650,
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
            <LinearProgress sx={{ width: '15%', margin: '0 auto' }} />
          </div>
        ) : (
          <></>
        )}
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

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ margin: '15px 10px 5px 10px' }}
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
              value={grouping}
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
          selectedSavedConfig?.Id !== 'globalfilesearch' ? (
            <div style={{ display: 'inline-block', width: '100%' }}>
              <ToggleButtonGroup
                sx={{ float: 'right', margin: '5px 5px 5px 5px' }}
                size="small"
                color="primary"
                value={isNewConfigType}
                exclusive
                onChange={(e, selected) => {
                  setIsNewConfigType(selected ? true : false);
                }}
                aria-label="Update Type"
              >
                <ToggleButton value={true}>New</ToggleButton>
                <ToggleButton value={false}>Update</ToggleButton>
              </ToggleButtonGroup>
            </div>
          ) : (
            <></>
          )}
        </Box>

        {isNewConfigType ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px',
            }}
          >
            <FormControl
              fullWidth
              sx={{
                pt: 2,
              }}
            >
              <TextField
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 0 },
                }}
                inputProps={{ maxLength: 50 }}
                required
                id="saveFilterName"
                label="Saved Filter Name"
                size="small"
                inputRef={savedSearchConfigNameTextInput}
              />
              <RadioGroup
                sx={{ fontSize: '10px' }}
                row
                aria-labelledby="saveFilterType-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={isSavedSearchConfigType}
                onChange={handleSavedSearchConfigTypeChange}
              >
                <FormControlLabel
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '12px',
                    },
                  }}
                  value="Personal"
                  control={<Radio size="small" />}
                  label="Personal"
                />
                {userType === 2 ? ( // only site admins can set global search config
                  <FormControlLabel
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '12px',
                      },
                    }}
                    value="Global"
                    control={<Radio size="small" />}
                    label="Global"
                  />
                ) : (
                  <></>
                )}
                {userType === 2 ? ( // prevent external users to save internal search configs
                  <FormControlLabel
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '12px',
                      },
                    }}
                    value="Internal"
                    control={<Radio size="small" />}
                    label="Internal"
                  />
                ) : (
                  <></>
                )}
              </RadioGroup>
            </FormControl>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px',
            }}
          >
            <FormControl fullWidth>
              <TextField
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 0 },
                }}
                disabled={isNewConfigType ? false : true}
                value={selectedSavedConfig?.Title}
                id="saveFilterName"
                label="Saved Filter Name"
                size="small"
                inputRef={savedSearchConfigNameTextInput}
              />
              <RadioGroup
                row
                aria-labelledby="saveFilterType-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={selectedSavedConfig?.ConfigType}
                onChange={handleSavedSearchConfigTypeChange}
              >
                <FormControlLabel
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '12px',
                    },
                  }}
                  value="Personal"
                  control={
                    <Radio
                      disabled={isNewConfigType ? false : true}
                      size="small"
                    />
                  }
                  label="Personal"
                />
                {userType === 2 ? ( // only site admins can set global search config
                  <FormControlLabel
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '12px',
                      },
                    }}
                    value="Global"
                    control={
                      <Radio
                        disabled={isNewConfigType ? false : true}
                        size="small"
                      />
                    }
                    label="Global"
                  />
                ) : (
                  <></>
                )}
                {userType === 2 ? ( // prevent external users to save internal search configs
                  <FormControlLabel
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '12px',
                      },
                    }}
                    value="Internal"
                    control={
                      <Radio
                        disabled={isNewConfigType ? false : true}
                        size="small"
                      />
                    }
                    label="Internal"
                  />
                ) : (
                  <></>
                )}
              </RadioGroup>
            </FormControl>
          </div>
        )}

        <div
          style={{
            margin: '0px 10px 0px 10px',
            display: 'flex',
            gap: '20px',
            maxWidth: '100%',
            overflowX: 'auto',
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
              !(
                Object.keys(filter).length &&
                savedSearchConfigNameTextInput?.current?.value !== null &&
                savedSearchConfigNameTextInput?.current?.value !== '' &&
                isSavedSearchConfigType !== ''
              ) && isNewConfigType
            }
            onClick={() => handleSaveSearchConfigClick()}
            sx={{ margin: '10px 10px 10px 10px', float: 'right' }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SaveSearchConfigModal;
