import React, { useContext } from 'react';
import { ApprovalContext } from './context/ApprovalProvider';
import { Grid, Box, Typography } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import ViewEditComponent from '../../Components/ViewEditComponent';
import { useApprovalStore } from '../../store/approval-store';
import { useShallow } from 'zustand/react/shallow';

const versionFileStatusMapping_ = await import(
  `../../Data/versionFileStatusMapping.json`
);
const versionFileStatusMapping = versionFileStatusMapping_?.default;

const ApprovalPreview = ({
  setIsInProgressMinorVersionList,
  getPendingDraftVersions,
  minorVersionsResortTarget,
  accessibleResorts,
  accessibleResortsSanitized,
  minorVersionIframePropRaw,
  minorVersionIframeProp,
  setMinorVersionIframeProp,
  setMinorVersionIframePropRaw,
  setMinorVersionIframeSrc,
  setMinorVersionIframeSrcTitle,
  termsGuidToLabel,
  isMinorVersionCommentsOpen,
  setIsMinorVersionCommentsOpen,
  draftCommentTextInput,
  handleMinorVersionResortActionClick,
  handleRejectModalOpen,
  handleRejectModalClose,
  rejectReason,
  handleChangeReason,
  openRejectModal,
  minorVersionComments,
  setMinorVersions,
  minorVersions,
  setMinorVersionsRaw,
  minorVersionsRaw,
  setSelectedSavedConfig,
  setIsErrorMinorVersions,
  setIsMinorVersionUpdated,
  setIsError,
}) => {
  const { rowDetails, setApprovalDetails, setRowDetails, setSelectedStatus } =
    useApprovalStore(
      useShallow((state) => ({
        rowDetails: state.rowDetails,
        setApprovalDetails: state.setApprovalDetails,
        setRowDetails: state.setRowDetails,
        setSelectedStatus: state.setSelectedStatus,
      })),
    );
  const iframeSource = `${rowDetails?.__metadata?.uri.split('_api')[0]}_layouts/15/embed.aspx?UniqueId=${rowDetails?.UniqueId}&version=${rowDetails?.Id}`;

  const getFileName = (fileRef) => {
    if (!fileRef) return null;
    const arrFileRef = fileRef.split('/');
    const fileName = arrFileRef[arrFileRef.length - 1];
    return fileName;
  };

  if (rowDetails) {
    return (
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            zIndex: 10,
            backgroundColor:
              rowDetails?.OData__ModerationStatus === 2 ? 'red' : '#e9e9e9',
            padding: '10px',
            position: 'relative',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              color:
                rowDetails?.OData__ModerationStatus === 2 ? 'white' : 'gray',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            {versionFileStatusMapping[rowDetails?.OData__ModerationStatus] ||
              'unknown'}
            &nbsp; - &nbsp;
            {rowDetails?.Title || getFileName(rowDetails?.FileRef)}
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
                setApprovalDetails(null);
                setRowDetails(null);
                setSelectedStatus(null);
                // setMinorVersionIframeSrc(null);
                // setMinorVersionIframeSrcTitle(null);
              }}
              sx={{
                cursor: 'pointer',
              }}
            />
          </Box>
        </div>
        <Grid
          container
          spacing={2}
          sx={{
            p: 2,
            overflowY: 'scroll',
          }}
        >
          <Grid
            sx={{
              display: {
                xs: 'block',
                sm: 'block',
                md: 'none',
                lg: 'none',
              },
            }}
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
          >
            <ViewEditComponent
              setIsInProgressMinorVersionList={setIsInProgressMinorVersionList}
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
              setIsErrorMinorVersions={setIsErrorMinorVersions}
              setIsMinorVersionUpdated={setIsMinorVersionUpdated}
              setIsError={setIsError}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            sx={{
              minHeight: {
                xs: '600px',
                sm: '600px',
                md: '400px',
                lg: '400px',
              },
            }}
          >
            <iframe
              src={iframeSource}
              width="100%"
              height="100%"
              frameborder="0"
              scrolling="no"
              allowfullscreen
              title={rowDetails?.Title}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            ></iframe>
          </Grid>
          {/* <span style={{fontSize: '10px', padding: '10px 5px 10px 0px', width: "640px"}}>Configure <strong>chrome://settings/cookies, edge://settings/cookies</strong> Select <strong> Allow third-party cookies</strong></span> */}
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            lg={6}
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'block',
                lg: 'block',
              },
            }}
          >
            <ViewEditComponent
              setIsInProgressMinorVersionList={setIsInProgressMinorVersionList}
              setSelectedSavedConfig={setSelectedSavedConfig}
              getPendingDraftVersions={getPendingDraftVersions}
              minorVersionsResortTarget={minorVersionsResortTarget}
              accessibleResorts={accessibleResorts}
              accessibleResortsSanitized={accessibleResortsSanitized}
              minorVersionIframePropRaw={minorVersionIframePropRaw}
              minorVersionIframeProp={minorVersionIframeProp}
              setMinorVersionIframePropRaw={setMinorVersionIframePropRaw}
              setMinorVersionIframeSrc={setMinorVersionIframeSrc}
              setMinorVersionIframeSrcTitle={setMinorVersionIframeSrcTitle}
              termsGuidToLabel={termsGuidToLabel}
              setMinorVersionIframeProp={setMinorVersionIframeProp}
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
              setIsErrorMinorVersions={setIsErrorMinorVersions}
              setIsMinorVersionUpdated={setIsMinorVersionUpdated}
              setIsError={setIsError}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <div
      style={{
        minHeight: '470px',
        height: `calc(80vh - 200px})`,
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
        Please select a resort and status
      </span>
    </div>
  );
};

export default ApprovalPreview;
