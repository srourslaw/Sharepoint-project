import React from 'react';
import {
  FormControl,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

export const FilterConfigToggle = ({
  isNewConfigType,
  selectedSavedConfig,
  savedSearchConfigNameText,
  savedSearchConfigNameTextInput,
  userType,
  isSavedSearchConfigType,
  handleSavedSearchConfigTypeChange,
  handleSavedSearchConfigNameTextChange,
}) => {
  // Common styles to reduce repetition
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px',
    margin: '2px 0px 4px 0px',
  };

  const textFieldStyle = {
    flex: 1,
    '& .MuiOutlinedInput-root': { borderRadius: 0 },
  };

  const labelStyle = {
    '& .MuiFormControlLabel-label': {
      fontSize: '12px',
    },
  };

  // Determine if the user can create global/internal configs
  const isAdmin = userType === 2;

  // Treat globalfilesearch the same as a new config
  const isEditable =
    isNewConfigType ||
    selectedSavedConfig?.Id === 'globalfilesearch' ||
    selectedSavedConfig?.modified;

  return (
    <div style={containerStyle}>
      <FormControl fullWidth sx={isEditable ? { pt: 2 } : {}}>
        <TextField
          InputLabelProps={{ shrink: true }}
          sx={textFieldStyle}
          inputProps={{ maxLength: 50 }}
          required
          id="saveFilterName"
          label="Saved Filter Name"
          size="small"
          defaultValue={isEditable ? '' : selectedSavedConfig?.Title}
          value={savedSearchConfigNameText}
          onChange={handleSavedSearchConfigNameTextChange}
          inputRef={savedSearchConfigNameTextInput}
        />
        <RadioGroup
          sx={isEditable ? { fontSize: '10px' } : {}}
          row
          aria-labelledby="saveFilterType-controlled-radio-buttons-group"
          name="controlled-radio-buttons-group"
          value={isSavedSearchConfigType}
          onChange={handleSavedSearchConfigTypeChange}
        >
          <FormControlLabel
            sx={labelStyle}
            value="Personal"
            control={<Radio size="small" disabled={!isEditable} />}
            label="Personal"
          />

          {isAdmin && (
            <>
              <FormControlLabel
                sx={labelStyle}
                value="Global"
                control={<Radio size="small" disabled={!isEditable} />}
                label="Global"
              />

              <FormControlLabel
                sx={labelStyle}
                value="Internal"
                control={<Radio size="small" disabled={!isEditable} />}
                label="Internal"
              />
            </>
          )}
        </RadioGroup>
      </FormControl>
    </div>
  );
};
