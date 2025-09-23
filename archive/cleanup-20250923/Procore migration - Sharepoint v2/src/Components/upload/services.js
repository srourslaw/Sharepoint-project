import axios from 'axios';

const checkifFolderExistWeb = async (
  siteUrl,
  site,
  dirFolders,
  accessToken,
) => {
  const checkifFolderExist = await axios.get(
    `${siteUrl}/_api/web/getfolderbyserverrelativeurl('/sites/${site}/Shared Documents/${dirFolders}')`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json;odata=verbose',
      },
    },
  );
  return checkifFolderExist;
};

const createFolder = async (siteUrl, folderName, site, accessToken) => {
  const createFolder = await axios.post(
    `${siteUrl}/_api/web/folders`,
    {
      __metadata: { type: 'SP.Folder' },
      ServerRelativeUrl: `/sites/${site}/Shared Documents/${folderName}`,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
      },
    },
  );
  return createFolder;
};

export const createCheckSharepointFolderIfExist = async (
  siteUrl,
  site,
  folders = [],
  accessToken,
  cb = () => {},
) => {
  const dirFolders = folders.join('/');
  try {
    await checkifFolderExistWeb(siteUrl, site, dirFolders, accessToken);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const [firstFolder, secondFolder] = folders;
      await createFolder(siteUrl, firstFolder, site, accessToken);
      await createFolder(
        siteUrl,
        `${firstFolder}/${secondFolder}`,
        site,
        accessToken,
      );
      cb();
    } else {
      throw error;
    }
  }
};

export const autoApproveFolder = async (
  siteUrl,
  accessToken,
  folderURL,
  data,
) => {
  const resData = await axios.get(
    `${siteUrl}/_api/web/getfolderbyserverrelativeurl('${folderURL}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
      },
    },
  );

  let FileId = null;
  let uri = null;
  let listGuid = null;

  if (resData.data?.d?.ListItemAllFields === null) {
    FileId = data.data?.d?.ID;
    uri = data.data?.d?.__metadata.uri;
    listGuid = uri.match(/guid'([^']+)'/)[1];
  } else {
    FileId = resData.data?.d?.ID;
    uri = resData.data?.d?.__metadata.uri;
    listGuid = uri.match(/guid'([^']+)'/)[1];
  }

  await axios.post(
    `${siteUrl}/_api/web/lists(guid'${listGuid}')/BulkValidateUpdateListItems()`,
    {
      itemIds: [FileId],
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
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        // 'X-RequestDigest': `${formDigestValue}`,
      },
    },
  );
};

export const moveFileToFolder = async (
  siteUrl,
  accessToken,
  sourceFileURL,
  moveToFileURL,
) => {
  if (process.env.REACT_APP_CREATE_COPY) {
    const siteLink = String(siteUrl).split('/sites/')[0];
    const source = sourceFileURL.substring(0, sourceFileURL.lastIndexOf('/'));
    const destination = moveToFileURL.substring(
      0,
      moveToFileURL.lastIndexOf('/'),
    );
    if (source !== destination) {
      const sourceURL = new URL(siteLink + sourceFileURL);
      const destinationURL = new URL(siteLink + destination);
      const postResponse = await axios.post(
        `${siteUrl}/_api/site/CreateCopyJobs`,
        {
          exportObjectUris: [sourceURL],
          destinationUri: destinationURL,
          options: {
            IgnoreVersionHistory: true,
            IsMoveMode: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json;odata=verbose',
          },
        },
      );
      console.log('postResponse', postResponse);
      const encryptionKey =
        postResponse.data.d.CreateCopyJobs.results[0].EncryptionKey;
      const jobId = postResponse.data.d.CreateCopyJobs.results[0].JobId;
      const jobQueueUri =
        postResponse.data.d.CreateCopyJobs.results[0].JobQueueUri;
      const getCopyJobProgress = await axios.post(
        `${siteUrl}/_api/site/GetCopyJobProgress`,
        {
          copyJobInfo: {
            __metadata: { type: 'SP.CopyMigrationInfo' },
            EncryptionKey: encryptionKey,
            JobId: jobId,
            JobQueueUri: jobQueueUri,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
          },
        },
      );
      console.log('getCopyJobProgress', getCopyJobProgress);

      const results =
        getCopyJobProgress.data.d.GetCopyJobProgress.Logs.results.map((log) => {
          const parsedLog = JSON.parse(log);
          return {
            Event: parsedLog.Event,
            Time: parsedLog.Time,
            Message: parsedLog.Message,
          };
        });
      return results.filter(
        (result) =>
          result.Event === 'JobWarning' || result.Event === 'JobError',
      );
    }
  } else {
    return await axios.post(
      `${siteUrl}/_api/web/getfilebyserverrelativeurl('${sourceFileURL}')/moveto(newurl='${moveToFileURL}', flags=1)`,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      },
    );
  }
};
