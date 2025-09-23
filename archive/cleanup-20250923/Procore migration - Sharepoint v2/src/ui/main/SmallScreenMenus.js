import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DmsUploadPage from '../../Components/_UploadPage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import { BulkUploadDialog } from '../../Components/upload/bulk-upload-dialog';
import { UploadFile } from '@mui/icons-material';

const SmallScreenMenus = ({
  isSearchCriteriaVisible,
  handleSearchCriteriaVisibleClick,
  accessibleResortsSanitized,
  filter,
  userType,
  handleMinorVersionListOpenClick,
  searchFileName,
  searchFileNameTextInputFocused,
  isInprogress,
  handleSearchEnterKeyDown,
  handleSearchFileNameTextInputChange,
  filterGroup,
  response,
  handleFilterChange,
  searchTextInput,
  grouping,
  handleGroupingChange,
  termsMapData,
  searchFileNameTextInput,
  searchConfigs,
  selectedSavedConfig,
  isSavedFilterModified,
  handleSaveFilterSelectChange,
}) => {
  return (
    <div
      style={{
        margin: '10px 0px 10px 0px',
        minHeight: '60px',
        backgroundColor: 'white',
        gap: '10px',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          {isSearchCriteriaVisible ? (
            <></>
          ) : (
            <FilterListIcon
              onClick={handleSearchCriteriaVisibleClick}
              sx={{
                paddingRight: '20px',
                margin: '0px -10px 0px 7px',
                cursor: 'pointer',
              }}
            />
          )}

          {accessibleResortsSanitized.length > 0 && (
            <BulkUploadDialog icon={<UploadFile />} />
          )}

          {userType === 0 || accessibleResortsSanitized.length <= 0 ? (
            <></>
          ) : (
            <Tooltip title="Document Approvals">
              <AdminPanelSettingsIcon
                onClick={handleMinorVersionListOpenClick}
                style={{
                  cursor: 'pointer',
                  padding: '0px 0px 0px 8px',
                }}
              />
            </Tooltip>
          )}
        </Box>
        {searchConfigs.length > 0 ? (
          <Box
            style={{
              color: 'white',
              marginLeft: 10,
            }}
          >
            <FormControl variant="standard" size="small">
              <Select
                label="Save Filters"
                disabled={isInprogress}
                disableUnderline
                sx={{
                  color: '#000',
                  borderRadius: '0px',
                  textAlign: 'center',
                  fontSize: '18px',
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
                labelId="saved-filters-select-small-label"
                id="savefilters-select-small"
                value={
                  selectedSavedConfig?.Id ||
                  searchConfigs[searchConfigs.length - 1]?.Id
                }
                onChange={handleSaveFilterSelectChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '350px', // Adjust the maximum height here
                    },
                  },
                }}
              >
                <MenuItem key="globalfilesearch" value="globalfilesearch">
                  Global File Search
                </MenuItem>
                {searchConfigs.map((item, index) => (
                  <MenuItem key={index} value={item?.Id}>
                    {item?.Title}{' '}
                    {isSavedFilterModified &&
                    isSavedFilterModified === item?.Title
                      ? '[Modified]'
                      : ''}
                    &nbsp;
                    <Chip
                      variant="outlined"
                      label={item?.ConfigType}
                      sx={{ fontSize: '12px', fontWeight: 500 }}
                    />
                  </MenuItem>
                ))}
                <MenuItem
                  sx={{ color: 'rgb(41, 152, 111)' }}
                  key="searchConfigs"
                  value="searchConfigs"
                >
                  <SettingsIcon
                    sx={{
                      color: 'rgb(41, 152, 111)',
                      margin: '0px 5px 0px -8px',
                    }}
                  />{' '}
                  Configure Saved Views
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : searchFileName !== null && searchFileName !== '' ? (
          <div
            style={{
              color: 'white',
              margin: '-36px auto',
              width: 'auto',
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FormControl
              variant="standard"
              sx={{ width: '100%', margin: '13px 0px 0px 0px' }}
              size="small"
            >
              <Select
                disabled={isInprogress}
                disableUnderline
                sx={{
                  color: 'inherit',
                  borderRadius: '0px',
                  textAlign: 'center',
                  fontSize: '18px',
                  padding: '10px',
                }}
                labelId="saved-filters-select-small-label"
                id="savefilters-select-small"
                value={'globalfilesearch'}
                label="Save Filters"
                onChange={handleSaveFilterSelectChange}
              >
                <MenuItem key="globalfilesearch" value="globalfilesearch">
                  Global File Search
                </MenuItem>
              </Select>
            </FormControl>
          </div>
        ) : (
          <div
            style={{
              fontSize: '18px',
              color: 'white',
              margin: '-35px auto',
              width: 'auto',
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            No Saved Search Criteria
          </div>
        )}
      </Box>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <TextField
          focused={searchFileNameTextInputFocused}
          placeholder="Filename or document content to search"
          value={searchFileName || null}
          onKeyDown={handleSearchEnterKeyDown}
          InputLabelProps={{ shrink: true }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 0 },
          }}
          disabled={isInprogress}
          id="fileNameSearch"
          label="Global File Search"
          size="small"
          onChange={handleSearchFileNameTextInputChange}
          inputRef={searchFileNameTextInput}
        />
      </FormControl>
      <TextField
        placeholder="Filter name to narrow down the results below"
        InputLabelProps={{ shrink: true }}
        sx={{
          mt: 2,
          '& .MuiOutlinedInput-root': { borderRadius: 0 },
        }}
        disabled={Object.keys(filterGroup).length <= 0}
        size="small"
        id="outlined-search"
        label={
          response.length <= 0
            ? 'Filter'
            : `Filter from ${response.length} results`
        }
        type="search"
        onChange={handleFilterChange}
        inputRef={searchTextInput}
        fullWidth
      />
      <FormControl size="small" fullWidth sx={{ mt: 2 }}>
        <InputLabel id="groupby-select-small-label">Group by</InputLabel>
        <Select
          sx={{
            color: 'inherit',
            borderRadius: '0px',
            margin: '0px 5px 0px 0px',
          }}
          disabled={Object.keys(filterGroup).length <= 0}
          labelId="groupby-select-small-label"
          id="demo-select-small"
          value={grouping}
          label="Group By"
          onChange={handleGroupingChange}
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
    </div>
  );
};

export default SmallScreenMenus;
