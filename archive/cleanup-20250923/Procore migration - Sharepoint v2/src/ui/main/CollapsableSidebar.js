import React, { useEffect, useMemo, useContext, useState } from 'react';

import { debounce } from 'lodash';

import { useTheme } from '@mui/material/styles';
import {
  Collapse,
  Grid2 as Grid,
  Box,
  Typography,
  Tooltip,
  LinearProgress,
  Divider,
  FormGroup,
  FormControl,
  FormControlLabel,
  TextField,
  Checkbox,
  Select,
  Button,
  Alert,
  MenuItem,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';

import { useQuery } from '@tanstack/react-query';

import SearchIcon from '@mui/icons-material/Search';
import StopIcon from '@mui/icons-material/Stop';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { ApprovalContext } from '../approval/context/ApprovalProvider';
import SaveConfigViewDialog from './SaveConfigViewDialog';
import ApprovalTable from '../approval/ApprovalTable';
import ApprovalPreview from '../approval/ApprovalPreview';
import { useApprovalStore } from '../../store/approval-store';
import { useShallow } from 'zustand/react/shallow';

const hasSplitFeature = process.env.REACT_APP_SPLIT_FEATURE === 'true';

const CollapsableSidebar = ({
  isSearchCriteriaVisible,
  setIsSearchCriteriaVisible,
  handleSearchCriteriaVisibleClick,
  handleSearchFilesClick,
  handleSaveClick,
  isSavedSearchConfigOpen,
  setIsSavedSearchConfigOpen,
  isInProgressSavingConfig,
  searchConfigs,
  setSelectedSavedConfig,
  handleSaveFilterSelectChange,
  setSavedSearchConfigNameText,
  savedFilterConfigCurDefault,
  selectedSavedConfig,
  userType,
  filter,
  grouping,
  handleSaveSearchConfigActionBtnClick,
  approvalPageTableOrderBy,
  isNewConfigType,
  savedSearchConfigNameText,
  handleSavedSearchConfigNameTextChange,
  savedSearchConfigNameTextInput,
  isSavedSearchConfigType,
  setIsSavedSearchConfigType,
  handleSavedSearchConfigTypeChange,
  filterGroup,
  handleGroupingChange,
  termsMapData,
  setIsNewConfigType,
  handleSaveSearchConfigClick,
  isMinorVersionListOpen,
  setIsMinorVersionListOpen,
  isInProgressMinorVersionList,
  setMinorVersionIframePropRaw,
  // isError,
  minorVersionsResortTarget,
  handleMinorVersionResortSelectChange,
  accessibleResortsSanitized,
  handleSearchMinorVersionTextInputChange,
  searchMinorVersionTextInput,
  getPendingDraftVersions,
  approvalPageTableOrder,
  handleSortApprovalPageTable,
  sortedData,
  handleViewFileContentActionClick,
  versionFileStatusMapping,
  minorVersionIframePropRaw,
  termsGuidToLabel,
  termsMapCTData,
  minorVersions,
  minorVersionIframeSrc,
  minorVersionIframeSrcTitle,
  setMinorVersionIframeSrc,
  setMinorVersionIframeSrcTitle,
  setIsInProgressMinorVersionList,
  accessibleResorts,
  minorVersionIframeProp,
  setMinorVersionIframeProp,
  isMinorVersionCommentsOpen,
  setIsMinorVersionCommentsOpen,
  draftCommentTextInput,
  handleMinorVersionResortActionClick,
  handleRejectModalOpen,
  handleRejectModalClose,
  rejectReason,
  handleChangeReason,
  openRejectModal,
  setExpandedFilter,
  expandedFilter,
  termsDataLocal,
  handleSelectFilterChangeParent,
  isInprogress,
  searchFileName,
  handleSelectFilterChange,
  checkIfChecked,
  filterNullOveride,
  minorVersionComments,
  minorVersionsNextUrl,
  cancelAllPendingDraftVersionLongPullingRequests,
  controllerDraftApprovalFetchsRef,
  setMinorVersions,
  setMinorVersionsRaw,
  minorVersionsRaw,
}) => {
  const {
    approvalList,
    selectedStatus,
    setSelectedStatus,
    setRowDetails,
    setApprovalDetails,
    setFilter,
  } = useApprovalStore(
    useShallow((state) => ({
      selectedStatus: state.selectedStatus,
      setSelectedStatus: state.setSelectedStatus,
      setRowDetails: state.setRowDetails,
      approvalList: state.approvalList,
      setApprovalDetails: state.setApprovalDetails,
      setFilter: state.setFilter,
    })),
  );
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [isErrorMinorVersions, setIsErrorMinorVersions] = useState(false);
  const [isMinorVersionUpdated, setIsMinorVersionUpdated] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSelectStatusTable = (newValue) => {
    setSelectedStatus(newValue);
    setRowDetails(null);
    setApprovalDetails(null);
    setFilter(null);
  };

  const handleSearchChange = debounce((e) => {
    setFilter(e.target.value);
  }, 300);

  const { refetch } = useQuery({
    queryKey: ['fetchApprovalTable'],
    enabled: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const handleRefresh = () => {
    refetch();
    setRowDetails(null);
    setApprovalDetails(null);
    setFilter(null);
  };

  useEffect(() => {
    if (isSmallScreen) {
      setIsSearchCriteriaVisible(!isSmallScreen);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!isSavedSearchConfigOpen) {
      // reset dialog
      savedSearchConfigNameTextInput.current = null;
      setSavedSearchConfigNameText(null);
      setIsSavedSearchConfigType(null);
      setIsNewConfigType(false);
    } else {
      if (
        selectedSavedConfig?.Id !== 'globalfilesearch' &&
        !selectedSavedConfig?.modified
      ) {
        setIsSavedSearchConfigType(selectedSavedConfig?.ConfigType);
        setSavedSearchConfigNameText(selectedSavedConfig?.Title);
      }
    }
  }, [isSavedSearchConfigOpen]);

  const getGroupingValue = () => {
    // Use existing grouping if available
    if (grouping) return grouping;

    // Otherwise try to get it from selected config
    if (searchConfigs && selectedSavedConfig?.Id) {
      const configMatch = searchConfigs.find(
        (config) => config.Id === parseInt(selectedSavedConfig?.Id),
      );
      return configMatch?.Groupby || '';
    }

    // Default fallback
    return '';
  };

  const getFileName = (fileRef) => {
    if (!fileRef) return null;
    const arrFileRef = fileRef.split('/');
    const fileName = arrFileRef[arrFileRef.length - 1];
    return fileName;
  };

  const titleByStatus = useMemo(() => {
    if (selectedStatus === 3) {
      return 'My Draft Documents';
    } else if (selectedStatus === 2) {
      return 'Documents Pending Approvals';
    } else if (selectedStatus === 'split') {
      return 'My PDF Split Documents';
    }
    return 'For Draft and Approval Documents';
  }, [selectedStatus]);

  return (
    <Collapse
      timeout={10}
      orientation="horizontal"
      in={isSearchCriteriaVisible}
    >
      <Grid size={12}>
        <Box
          sx={{
            margin: '10px 0px 0px 0px',
            minWidth: '100%',
            position: 'relative',
          }}
        >
          <Grid container spacing={2} columns={16}>
            <Grid size={12}>
              <Typography
                sx={{
                  margin: '13px',
                  fontWeight: '600',
                  color: 'rgb(41, 152, 111)',
                }}
                variant="h6"
                gutterBottom
              >
                <FilterListIcon
                  onClick={handleSearchCriteriaVisibleClick}
                  sx={{
                    margin: '0px 3px -5px 0px',
                    fontSize: '23px',
                    color: 'rgb(41, 152, 111)',
                    cursor: 'pointer',
                  }}
                />
                Search Criteria
              </Typography>
            </Grid>
            <Grid
              sx={{
                alignContent: 'center',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
              size={3}
            >
              <Tooltip title="Save Filter">
                <>
                  {' '}
                  <SaveIcon
                    onClick={handleSaveClick}
                    sx={{
                      margin: '15px 10px 10px 0px ',
                      fontSize: '23px',
                      cursor: 'pointer',
                    }}
                  />{' '}
                </>
              </Tooltip>
              <Tooltip title="Search Files">
                <>
                  {' '}
                  <SearchIcon
                    onClick={handleSearchFilesClick}
                    sx={{
                      margin: '15px 10px 10px 0px ',
                      fontSize: '23px',
                      cursor: 'pointer',
                    }}
                  />{' '}
                </>
              </Tooltip>
            </Grid>
          </Grid>

          <SaveConfigViewDialog
            isSavedSearchConfigOpen={isSavedSearchConfigOpen}
            setIsSavedSearchConfigOpen={setIsSavedSearchConfigOpen}
            isInProgressSavingConfig={isInProgressSavingConfig}
            searchConfigs={searchConfigs}
            setSelectedSavedConfig={setSelectedSavedConfig}
            handleSaveFilterSelectChange={handleSaveFilterSelectChange}
            setSavedSearchConfigNameText={setSavedSearchConfigNameText}
            savedFilterConfigCurDefault={savedFilterConfigCurDefault}
            selectedSavedConfig={selectedSavedConfig}
            handleSaveSearchConfigActionBtnClick={
              handleSaveSearchConfigActionBtnClick
            }
            userType={userType}
            isNewConfigType={isNewConfigType}
            savedSearchConfigNameText={savedSearchConfigNameText}
            filter={filter}
            termsMapData={termsMapData}
            handleSavedSearchConfigNameTextChange={
              handleSavedSearchConfigNameTextChange
            }
            savedSearchConfigNameTextInput={savedSearchConfigNameTextInput}
            isSavedSearchConfigType={isSavedSearchConfigType}
            handleSavedSearchConfigTypeChange={
              handleSavedSearchConfigTypeChange
            }
            filterGroup={filterGroup}
            getGroupingValue={getGroupingValue}
            handleGroupingChange={handleGroupingChange}
            setIsSavedSearchConfigType={setIsSavedSearchConfigType}
            setIsNewConfigType={setIsNewConfigType}
            handleSaveSearchConfigClick={handleSaveSearchConfigClick}
          />

          <Dialog
            open={isMinorVersionListOpen}
            onClose={(event, reason) => {
              // Prevent closing the modal if the reason is 'backdropClick'
              if (reason !== 'backdropClick') {
                setIsMinorVersionListOpen(false);
              }
            }}
            fullWidth
            maxWidth="xl"
            BackdropProps={{
              // Disable clicks on the backdrop to prevent closing the modal
              onClick: (event) => event.stopPropagation(),
            }}
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
                  {/* For Draft and Approval Documents */}
                  {titleByStatus}
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
            </DialogTitle>
            <DialogContent sx={{ padding: 0 }}>
              {/* {isInProgressMinorVersionList && (
                <div
                  style={{
                    position: 'absolute',
                    zIndex: '9999',
                    backgroundColor: 'rgb(0 0 0 / 58%)',
                    inset: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignContent: 'center',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <LinearProgress sx={{ width: '5%', margin: '0 auto' }} />
                </div>
              )} */}

              {/* {isErrorMinorVersions && (
                <Alert severity="warning">
                  {isError} {isErrorMinorVersions}
                </Alert>
              )}

              {isMinorVersionUpdated && (
                <Alert severity="success">{isMinorVersionUpdated}</Alert>
              )} */}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ m: 1 }}
              >
                <Box display="flex" alignItems="center">
                  <ResortDropdown
                    minorVersionsResortTarget={minorVersionsResortTarget}
                    handleMinorVersionResortSelectChange={
                      handleMinorVersionResortSelectChange
                    }
                    accessibleResortsSanitized={accessibleResortsSanitized}
                  />
                  <ToggleSelection
                    handleSelectStatusTable={handleSelectStatusTable}
                    value={selectedStatus}
                    listCount={approvalList.length}
                  />
                </Box>
                <Box display="flex" justifyContent="end" alignItems="center">
                  <Tooltip
                    title="Filter is disabled when no status is selected"
                    disableHoverListener={selectedStatus}
                    disableFocusListener={selectedStatus}
                    disableTouchListener={selectedStatus}
                  >
                    <TextField
                      disabled={!selectedStatus}
                      onChange={handleSearchChange}
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
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Reload">
                    <IconButton
                      onClick={
                        minorVersionsNextUrl !== null &&
                        minorVersionsNextUrl !== ''
                          ? undefined
                          : handleRefresh
                      }
                      disabled={!selectedStatus}
                    >
                      <LoopOutlinedIcon
                        sx={{
                          color: 'rgb(41, 152, 111)',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                  {/* {minorVersionsNextUrl !== null &&
                    minorVersionsNextUrl !== '' && (
                      <>
                        <LinearProgress
                          sx={{
                            width: '25px',
                          }}
                        />
                        <Tooltip title="stop additional draft and approval search">
                          <StopIcon
                            onClick={
                              controllerDraftApprovalFetchsRef.current
                                ? () =>
                                    cancelAllPendingDraftVersionLongPullingRequests()
                                : undefined
                            }
                            sx={{
                              margin: '12px 15px 0px 0px',
                              cursor: controllerDraftApprovalFetchsRef.current
                                ? 'pointer'
                                : 'not-allowed',
                              color: controllerDraftApprovalFetchsRef.current
                                ? 'rgb(41, 152, 111)'
                                : 'gray',
                              float: 'right',
                            }}
                          />
                        </Tooltip>
                      </>
                    )} */}
                </Box>
              </Box>

              <Divider />

              <ApprovalTable
                approvalPageTableOrderBy={approvalPageTableOrderBy}
                approvalPageTableOrder={approvalPageTableOrder}
                handleSortApprovalPageTable={handleSortApprovalPageTable}
                handleViewFileContentActionClick={
                  handleViewFileContentActionClick
                }
                getFileName={getFileName}
                versionFileStatusMapping={versionFileStatusMapping}
                minorVersionIframePropRaw={minorVersionIframePropRaw}
                termsGuidToLabel={termsGuidToLabel}
                termsMapCTData={termsMapCTData}
                selectedResort={minorVersionsResortTarget}
                accessibleResortsSanitized={accessibleResortsSanitized}
              />

              <Divider />

              <ApprovalPreview
                setIsInProgressMinorVersionList={
                  setIsInProgressMinorVersionList
                }
                getPendingDraftVersions={getPendingDraftVersions}
                minorVersionsResortTarget={minorVersionsResortTarget}
                accessibleResorts={accessibleResorts}
                accessibleResortsSanitized={accessibleResortsSanitized}
                minorVersionIframePropRaw={minorVersionIframePropRaw}
                minorVersionIframeProp={minorVersionIframeProp}
                setMinorVersionIframeProp={setMinorVersionIframeProp}
                setMinorVersionIframePropRaw={setMinorVersionIframePropRaw}
                setMinorVersionIframeSrc={setMinorVersionIframeSrc}
                setMinorVersionIframeSrcTitle={setMinorVersionIframeSrcTitle}
                termsGuidToLabel={termsGuidToLabel}
                isMinorVersionCommentsOpen={isMinorVersionCommentsOpen}
                setIsMinorVersionCommentsOpen={setIsMinorVersionCommentsOpen}
                draftCommentTextInput={draftCommentTextInput}
                handleMinorVersionResortActionClick={
                  handleMinorVersionResortActionClick
                }
                handleRejectModalOpen={handleRejectModalOpen}
                handleRejectModalClose={handleRejectModalClose}
                rejectReason={rejectReason}
                handleChangeReason={handleChangeReason}
                openRejectModal={openRejectModal}
                minorVersionComments={minorVersionComments}
                setMinorVersions={setMinorVersions}
                minorVersions={minorVersions}
                setMinorVersionsRaw={setMinorVersionsRaw}
                minorVersionsRaw={minorVersionsRaw}
                setSelectedSavedConfig={setSelectedSavedConfig}
                setIsErrorMinorVersions={setIsErrorMinorVersions}
                setIsMinorVersionUpdated={setIsMinorVersionUpdated}
                setIsError={setIsError}
              />

              {/* <Divider />

              <Button
                onClick={() => setIsMinorVersionListOpen(false)}
                sx={{
                  margin: '10px 10px 10px 10px',
                  float: 'left',
                  color: 'red',
                }}
              >
                Close
              </Button> */}
              <DialogActions
                sx={{
                  justifyContent: 'flex-start',
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <Button
                  onClick={() => {
                    setIsMinorVersionListOpen(false);
                    setSelectedStatus(null);
                  }}
                  sx={{
                    color: 'red',
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </DialogContent>
          </Dialog>

          <div
            style={{
              height: 'calc(100vh - 155px)',
              overflow: 'auto',
              position: 'sticky',
              top: 0,
            }}
          >
            <Divider sx={{ margin: '0px 0px 15px 0px' }} />
            <div style={{ margin: '-5px 0px -10px 13px' }}>
              <Typography
                sx={{
                  margin: '0px 0px 0px 3px',
                  color: 'rgb(41, 152, 111)',
                }}
                variant="h8"
                gutterBottom
              >
                Document Metadata Selection
              </Typography>
            </div>
            <SimpleTreeView
              sx={{ padding: '15px', minWidth: '315px' }}
              checkboxSelection
              multiSelect
              onExpandedItemsChange={(e, itemIds) => setExpandedFilter(itemIds)}
              expandedItems={expandedFilter}
              selectedItems={Object.keys(filter)}
            >
              {Object.entries(termsDataLocal).map(([key, value]) => (
                <TreeItem
                  onChange={(e) => handleSelectFilterChangeParent(e, key)}
                  key={key}
                  disabled={isInprogress || searchFileName !== null}
                  sx={{ margin: '10px 0px 0px 0px' }}
                  itemId={key}
                  label={
                    <>
                      <span>{key}</span>{' '}
                      <span
                        style={{
                          fontWeight: '800',
                          color: 'rgb(41, 152, 111)',
                          float: 'right',
                        }}
                      >
                        {filter[key] && filter[key].length > 0
                          ? filter[key].length
                          : ''}
                      </span>
                    </>
                  }
                >
                  {Object.entries(termsDataLocal[key]).map(
                    key === 'Resort'
                      ? ([keyj, valuej]) =>
                          accessibleResorts.filter(
                            (item) => item.Sitename === keyj,
                          ).length > 0 ? (
                            <FormGroup
                              key={`${key}-${keyj}`}
                              sx={{ margin: '0px 0px -12px 50px' }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    onChange={(e) =>
                                      handleSelectFilterChange(e, key, valuej)
                                    }
                                    // defaultChecked={checkIfChecked(key, keyj)}
                                    checked={checkIfChecked(key, keyj)}
                                    disabled={isInprogress}
                                    sx={{
                                      color: 'rgb(41, 152, 111)',
                                      '&.Mui-checked': {
                                        color: 'rgb(41, 152, 111)',
                                      },
                                    }}
                                  />
                                }
                                label={`${keyj}`}
                              />
                            </FormGroup>
                          ) : (
                            <></>
                          )
                      : ([keyj, valuej]) => (
                          <FormGroup
                            key={`${key}-${keyj}`}
                            sx={{ margin: '0px 0px -12px 50px' }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  onChange={(e) =>
                                    handleSelectFilterChange(e, key, valuej)
                                  }
                                  // defaultChecked={checkIfChecked(key, keyj)}
                                  checked={checkIfChecked(key, keyj)}
                                  disabled={
                                    isInprogress ||
                                    (filterNullOveride.includes(key) &&
                                      keyj.toLowerCase() !== 'to be tagged')
                                  }
                                  sx={{
                                    color: 'rgb(41, 152, 111)',
                                    '&.Mui-checked': {
                                      color: 'rgb(41, 152, 111)',
                                    },
                                  }}
                                />
                              }
                              label={`${keyj}`}
                            />
                          </FormGroup>
                        ),
                  )}
                </TreeItem>
              ))}
            </SimpleTreeView>
          </div>
        </Box>
      </Grid>
    </Collapse>
  );
};

const ToggleSelection = ({ handleSelectStatusTable, value, listCount }) => {
  let valueCount = '';
  const selectedBtnVal = (val) => {
    if (val !== value) {
      valueCount = '';
      return {};
    } else {
      valueCount = `(${listCount})`;
    }
    return {
      sx: {
        borderBottom: '1px solid rgb(41, 152, 111)',
        borderWidth: '2px',
        borderRadius: '0px',
        textTransform: 'none',
      },
    };
  };

  return (
    <Box display="flex" gap={1} alignItems="center">
      <Button
        variant="text"
        size="small"
        sx={{
          textTransform: 'none',
        }}
        {...selectedBtnVal(2)}
        onClick={() => handleSelectStatusTable(2)}
      >
        My Pending Approvals {valueCount}
      </Button>
      <Button
        variant="text"
        size="small"
        sx={{
          textTransform: 'none',
        }}
        {...selectedBtnVal(3)}
        onClick={() => handleSelectStatusTable(3)}
      >
        My Drafts {valueCount}
      </Button>
      {hasSplitFeature ? (
        <Button
          variant="text"
          size="small"
          sx={{
            textTransform: 'none',
          }}
          {...selectedBtnVal('split')}
          onClick={() => handleSelectStatusTable('split')}
        >
          My PDF Splits {valueCount}
        </Button>
      ) : (
        <></>
      )}
    </Box>
  );
};

const ResortDropdown = ({
  minorVersionsResortTarget,
  handleMinorVersionResortSelectChange,
  accessibleResortsSanitized,
}) => {
  if (!accessibleResortsSanitized) return null;
  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ mx: 1 }}>
      <HomeWorkIcon
        sx={{
          color: 'rgb(41, 152, 111)',
          fontSize: '14px',
        }}
      />
      <FormControl
        variant="standard"
        sx={{
          color: 'rgb(41, 152, 111)',
        }}
        size="small"
      >
        <Select
          disableUnderline
          placeholder="Resorts"
          sx={{
            color: 'inherit',
            borderRadius: '0px',
            textAlign: 'center',
            fontSize: '14px',
            padding: '0px',
            fontWeight: '800',
          }}
          size="small"
          value={minorVersionsResortTarget || ''}
          label="Resorts"
          onChange={(e) => handleMinorVersionResortSelectChange(e)}
        >
          {accessibleResortsSanitized
            .sort((a, b) => (a.Sitename > b.Sitename ? 1 : -1))
            .map((row) => (
              <MenuItem size="small" key={row?.Sitename} value={row?.Sitename}>
                {row?.Sitename}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CollapsableSidebar;
