import React, { useMemo } from 'react';
import {
  InputLabel,
  Select,
  Box,
  Tooltip,
  FormControl,
  TextField,
  MenuItem,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import DmsUploadPage from '../../Components/_UploadPage';

const GlobalSearchFilter = ({
  // filter props
  handleSearchCriteriaVisibleClick,
  isSearchCriteriaVisible,
  // upload props
  accessibleResortsSanitized,
  filter,
  // document approvals props
  userType,
  handleMinorVersionListOpenClick,
  // global filter search
  searchFileNameTextInputFocused,
  searchFileName,
  handleSearchEnterKeyDown,
  isInprogress,
  handleSearchFileNameTextInputChange,
  searchFileNameTextInput,
  // filter query
  filterGroup,
  response,
  handleFilterChange,
  searchTextInput,
  // group by
  grouping,
  handleGroupingChange,
  termsMapData,
}) => {
  const renderFilterSelection = useMemo(() => {
    if (isSearchCriteriaVisible) {
      return;
    }
    return (
      <FilterListIcon
        onClick={handleSearchCriteriaVisibleClick}
        sx={{
          borderRight: '1px solid gray',
          paddingRight: '10px',
          margin: '0px 0px 0px 7px',
          cursor: 'pointer',
        }}
      />
    );
  }, [isSearchCriteriaVisible, handleSearchCriteriaVisibleClick]);

  const renderUploadPage = useMemo(() => {
    if (accessibleResortsSanitized.length === 0) {
      return;
    }
    return (
      <DmsUploadPage
        uploadType="uploadGeneric"
        groupingVal={JSON.stringify({})}
        filterVal={JSON.stringify(filter)}
        accessibleResorts={accessibleResortsSanitized}
        filter={filter}
      />
    );
  }, [accessibleResortsSanitized, filter]);

  const renderDocumentApproval = useMemo(() => {
    if (userType === 0) {
      return;
    }
    return (
      <Tooltip title="Document Approvals">
        <AdminPanelSettingsIcon
          onClick={handleMinorVersionListOpenClick}
          style={{
            borderLeft: '1px solid gray',
            cursor: 'pointer',
            padding: '0px 0px 0px 8px',
          }}
        />
      </Tooltip>
    );
  }, [userType, handleMinorVersionListOpenClick]);

  const renderGlobalFileSearch = useMemo(() => {
    return (
      <FormControl fullWidth>
        <TextField
          focused={searchFileNameTextInputFocused}
          placeholder="Filename or document content to search"
          value={searchFileName || null}
          onKeyDown={handleSearchEnterKeyDown}
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 0 },
          }}
          disabled={isInprogress}
          id="fileNameSearch"
          label="Global File Search"
          size="small"
          onChange={handleSearchFileNameTextInputChange}
          inputRef={searchFileNameTextInput}
          fullWidth
        />
      </FormControl>
    );
  }, [
    searchFileNameTextInputFocused,
    searchFileName,
    handleSearchEnterKeyDown,
    isInprogress,
    handleSearchFileNameTextInputChange,
    searchFileNameTextInput,
  ]);

  const renderFilter = useMemo(() => {
    return (
      <FormControl fullWidth>
        <TextField
          placeholder="Filter name to narrow down the results below"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: 1,
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
      </FormControl>
    );
  }, [filterGroup, response, handleFilterChange, searchTextInput]);

  const renderGroupBy = useMemo(() => {
    return (
      <FormControl size="small" fullWidth>
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
          fullWidth
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
    );
  }, [grouping, handleGroupingChange]);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="10px"
      justifyContent="space-between"
      sx={{
        mt: '10px',
        minHeight: '60px',
        px: '15px',
      }}
    >
      {renderFilterSelection}
      {renderUploadPage}
      {renderDocumentApproval}
      <Box width="40%">{renderGlobalFileSearch}</Box>
      <Box width="40%">{renderFilter}</Box>
      <Box width="20%">{renderGroupBy}</Box>
    </Box>
  );
};

export default GlobalSearchFilter;
