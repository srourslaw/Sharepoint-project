import api from '..';

export const getFormDigest = async (siteNameUrl = '', accessToken) => {
  return await api({
    baseURL: siteNameUrl,
    accessToken,
  }).post('/_api/contextinfo');
};

export const getFileIDByPath = async ({
  siteNameUrl = '',
  fileServerRelativeUrl,
  accessToken,
}) => {
  return await api({
    baseURL: siteNameUrl,
    accessToken,
  }).get(
    `/_api/web/GetFileByServerRelativeUrl('${fileServerRelativeUrl}')/ListItemAllFields?$select=*,FileDirRef`,
  );
};

export const getFileID = async ({
  siteNameUrl = '',
  UniqueId,
  accessToken,
}) => {
  return await api({
    baseURL: siteNameUrl,
    accessToken,
  }).get(
    `/_api/web/GetFileById('${UniqueId}')/ListItemAllFields?$select=*,FileDirRef,FileRef`,
  );
};

export const updateMetadata = async ({
  libraryName,
  fileId,
  payload,
  formDigestValue,
  siteNameUrl,
  fileServerRelativeUrl,
  FileDirRef,
  listGuid,
  isAutoApproveAvailable,
  callback,
  UniqueId,
  accessToken,
}) => {
  try {
    // **Step 1: Update List Item Metadata**
    const res = await api({
      baseURL: siteNameUrl,
      accessToken,
    }).post(
      `/_api/web/lists/GetByTitle('${libraryName}')/items(${fileId})/validateUpdateListItem`,
      payload,
      {
        headers: {
          'X-RequestDigest': `${formDigestValue}`,
          'IF-MATCH': '*', // For updates; use "*" to update regardless of version
        },
      },
    );

    // **Step 2: Publish the Document**
    const approvalRequest = await api({
      baseURL: siteNameUrl,
      accessToken,
    }).post(
      `/_api/web/GetFileById('${UniqueId}')/Publish('For Approval (automated)')`,
      {},
      {
        headers: {
          'X-RequestDigest': `${formDigestValue}`,
          'IF-MATCH': '*', // For updates; use "*" to update regardless of version
        },
      },
    );

    // **Step 3: Auto-Approve (if applicable)**
    if (isAutoApproveAvailable === true) {
      const autoApproveData = {
        itemIds: [fileId],
        formValues: [
          {
            FieldName: '_ModerationStatus',
            FieldValue: '0',
          },
          {
            FieldName: '_ModerationComments',
            FieldValue: 'Approved (Auto)',
          },
        ],
        folderPath: '',
      };

      const autoApprove = await api({
        baseURL: siteNameUrl,
        accessToken,
      }).post(
        `/_api/web/lists(guid'${listGuid}')/BulkValidateUpdateListItems()`,
        autoApproveData,
        {
          headers: {
            'X-RequestDigest': `${formDigestValue}`,
          },
        },
      );
    }
  } catch (e) {
    callback(e?.response?.data?.error?.message?.value);
  }
};

export const checkForAutoApproval = async ({
  siteUrl,
  siteName,
  callback,
  accessToken,
}) => {
  try {
    let approvalPermission = false;
    const res = await api({
      baseURL: siteUrl,
      accessToken,
    }).get(`/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`, {
      headers: {
        Accept: 'application/json;odata=nometadata',
      },
    });

    if (res.data?.d?.IsSiteAdmin === true || res.data?.IsSiteAdmin === true) {
      approvalPermission = true;
    }

    const res2 = await api({
      baseURL: siteUrl,
      accessToken,
    }).get(`/_api/web/currentuser/groups`, {
      headers: {
        Accept: 'application/json;odata=nometadata',
      },
    });

    if (res2.data?.value && res2.data?.value.length > 0) {
      for (let i = 0; i < res2.data?.value.length; i++) {
        const groupName = res2.data?.value[i]?.Title;
        if (groupName.toLowerCase() === `${siteName.toLowerCase()} owners`) {
          approvalPermission = true;
        }
      }
    }
    callback(approvalPermission);
  } catch (e) {
    callback(false);
  }
};

export const approveReject = async ({
  event,
  mode,
  docId,
  FileDirRef,
  Title,
  Version,
  FileRef,
  currentStatus,
  UniqueId,
  siteNameUrlObj,
  // getPendingDraftVersions,
  metadata,
  accessToken,
  errCallback,
}) => {
  try {
    const uri = metadata.uri;
    const listGuidMatch = uri.match(/guid'([^']+)'/);
    const listGuid = listGuidMatch[1];
    const siteNameUrl = siteNameUrlObj.SiteURL;
    const fileId = docId;
    const { data: formDigest } = await getFormDigest(siteNameUrl, accessToken);
    const formDigestValue =
      formDigest?.d?.GetContextWebInformation?.FormDigestValue.split(',')[0];

    switch (currentStatus) {
      case 2: // pending
        const autoApprove_ = await api({
          baseURL: siteNameUrl,
          accessToken,
        }).post(
          `/_api/web/lists(guid'${listGuid}')/BulkValidateUpdateListItems()`,
          autoApproveData,
          {
            headers: {
              'X-RequestDigest': `${formDigestValue}`,
              // "X-HTTP-Method": "MERGE", // Use MERGE to update fields
            },
          },
        );
        // getPendingDraftVersions();
        // setIsInProgressMinorVersionList(false);
        break;

      case 3: // draft
        const approvalRequest = await api({
          baseURL: siteNameUrl,
          accessToken,
        }).post(
          `/_api/web/GetFileById('${UniqueId}')/Publish('For Approval (automated)')`,
          {},
          {
            headers: {
              'X-RequestDigest': `${formDigestValue}`,
              'IF-MATCH': '*', // For updates; use "*" to update regardless of version
              // "X-HTTP-Method": "MERGE", // Use MERGE to update fields
            },
          },
        );

        const autoApproveData = {
          itemIds: [fileId],
          formValues: [
            {
              FieldName: '_ModerationStatus',
              FieldValue: '0',
            },
            {
              FieldName: '_ModerationComments',
              FieldValue: 'Approved (Auto)',
            },
          ],
          folderPath: '',
        };

        const autoApprove = await api({
          baseURL: siteNameUrl,
          accessToken,
        }).post(
          `/_api/web/lists(guid'${listGuid}')/BulkValidateUpdateListItems()`,
          autoApproveData,
          {
            headers: {
              'X-RequestDigest': `${formDigestValue}`,
            },
          },
        );

        if (autoApprove) {
          // setMinorVersionIframeSrc(firstRow?.ServerRedirectedEmbedUri);
          // setMinorVersionIframeSrcTitle(firstRow?.Title);
          // let MinorVersionIframePropTmp = {};
          // Object.keys(termsMapCTData).forEach((key) => {
          //   if (!MinorVersionIframePropTmp[key]) {
          //     if (firstRow?.[termsMapCTData[key]]?.TermGuid) {
          //       MinorVersionIframePropTmp[key] = termsGuidToLabel(
          //         key,
          //         firstRow?.[termsMapCTData[key]]?.TermGuid,
          //       );
          //     } else {
          //       MinorVersionIframePropTmp[key] =
          //         firstRow?.[termsMapCTData[key]];
          //     }
          //   }
          // });
          // setMinorVersionIframeProp(MinorVersionIframePropTmp);
          // setIsInProgressMinorVersionList(false);
        }
        break;

      default:
        break;
    }
  } catch (e) {
    console.log('Error in approveReject:', e);
    errCallback(e);
  }
};

export const moveFile = async ({
  srcPathname,
  destSitePath,
  isAutoApproveAvailable,
  callback,
  accessToken,
}) => {
  try {
    // get the file name from the srcPathname
    const fileName = srcPathname.split('/').pop();
    const destinationPathname = `${destSitePath}/Shared Documents/${fileName}`;
    const destinationRelativePath = new URL(destinationPathname).pathname;

    await api({
      baseURL: `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com`,
      accessToken,
    }).post('/_api/SP.MoveCopyUtil.MoveFileByPath', {
      srcPath: {
        DecodedUrl: srcPathname,
      },
      destPath: {
        DecodedUrl: destinationPathname,
      },
      overwrite: true,
      options: {
        KeepBoth: false,
        ResetAuthorAndCreatedOnCopy: false,
        ShouldBypassSharedLocks: true,
      },
    });

    const responseListItemAllFields = await getFileIDByPath({
      siteNameUrl: destSitePath,
      fileServerRelativeUrl: `/sites/${destinationPathname.split('/sites/')[1]}`,
      accessToken,
    });

    const fileId = responseListItemAllFields.data?.d?.Id;
    const FileDirRef = responseListItemAllFields.data?.d?.FileDirRef;

    const { data: formDigest } = await getFormDigest(destSitePath, accessToken);
    const formDigestValue =
      formDigest?.d?.GetContextWebInformation?.FormDigestValue.split(',')[0];

    await api({
      baseURL: destSitePath,
      accessToken,
    }).post(
      `/_api/web/GetFileByServerRelativePath(DecodedUrl=@a1)/Publish(@a2)?@a1='${encodeURIComponent(destinationRelativePath)}'&@a2='For Approval (automated)'`,
      {},
      {
        headers: {
          'X-RequestDigest': `${formDigestValue}`,
          'IF-MATCH': '*', // For updates; use "*" to update regardless of version
        },
      },
    );

    if (isAutoApproveAvailable === true) {
      const autoApproveData = {
        itemIds: [fileId],
        formValues: [
          {
            FieldName: '_ModerationStatus',
            FieldValue: '0',
          },
          {
            FieldName: '_ModerationComments',
            FieldValue: 'Approved (Auto)',
          },
        ],
        folderPath: '',
      };

      const autoApprove = await api({
        baseURL: destSitePath,
        accessToken,
      }).post(
        `/_api/web/GetListUsingPath(DecodedUrl=@a1)/BulkValidateUpdateListItems()?@a1='${encodeURIComponent(FileDirRef)}'`,
        autoApproveData,
        {
          headers: {
            'X-RequestDigest': `${formDigestValue}`,
          },
        },
      );
    }
  } catch (e) {
    callback(e?.response?.data?.error?.message?.value);
  }
};
