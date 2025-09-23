import { useMutation } from '@tanstack/react-query';
import {
  ALERT_SEVERITY,
  LOCAL_STORAGE_KEYS,
  TERMS_KEY_MAPPING_CT,
  UPLOAD_MODE,
} from '../../const/common';
import axios from 'axios';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useSnackbar } from '../../context/snackbar-provider';
import {
  dateFormattedValue,
  fileNameSanitizeSoft,
  getFileExtension,
} from '../../utils/helpers';
import { isAxiosError } from 'axios';
import {
  autoApproveFolder,
  createCheckSharepointFolderIfExist,
} from './services';
import { useBulkUploadStore } from './bulk-upload-store';
import { spAxios } from '../../lib/sp-axios';

const termsMapCTData_ = await import(
  `../../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTData = termsMapCTData_?.default;

function normalizeFormValue(value) {
  return value ?? '';
}

export function useUploadMutation() {
  const { showSnackbar } = useSnackbar();
  const [accessibleResorts] = useLocalStorage(
    LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS,
  );
  const [token] = useLocalStorage(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  const accessToken = token?.accessToken;
  const fileVersions = useBulkUploadStore((state) => state.fileVersions);

  const getSiteUrl = (resortName) => {
    return accessibleResorts.find(
      (resort) =>
        resort.Sitename.toLowerCase() ===
        resortName?.split('|')[0].toLowerCase(),
    )?.SiteURL;
  };

  const getFormDigest = async (siteUrl) => {
    const { data } = await axios.post(`${siteUrl}/_api/contextinfo`, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.FormDigestValue.split(',')[0];
  };

  const uploadFile = async ({
    siteUrl,
    title,
    file,
    drawingArea,
    formDigestValue,
  }) => {
    const isUploadRevision = fileVersions !== null;

    try {
      const baseSite =
        String(siteUrl).split('/')[String(siteUrl).split('/').length - 1];

      if (isUploadRevision) {
        const fileResponse = await spAxios.get(
          `${siteUrl}/_api/web/GetFileById('${fileVersions.uniqueId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef`,
          {
            headers: {
              Accept: 'application/json;odata=verbose',
            },
          },
        );

        await spAxios.put(
          `${siteUrl}/_api/web/GetFileById('${fileVersions.uniqueId}')/$value`,
          file,
          {
            headers: {
              Accept: 'application/json;odata=nometadata',
              'X-RequestDigest': `${formDigestValue}`,
            },
          },
        );
        const safeFileName = fileNameSanitizeSoft(file.name).replace(
          /'/g,
          '%27',
        );
        await spAxios.post(
          fileResponse.data?.d?.__metadata.uri,
          {
            FileLeafRef: safeFileName,
          },
          {
            headers: {
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/json;odata=nometadata',
              'X-RequestDigest': `${formDigestValue}`,
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE',
            },
          },
        );

        return { UniqueId: fileVersions.uniqueId };
      }

      if (drawingArea) {
        await createCheckSharepointFolderIfExist(
          siteUrl,
          baseSite,
          ['Drawings', drawingArea],
          accessToken,
        );
        const safeFileName = fileNameSanitizeSoft(file.name).replace(
          /'/g,
          '%27',
        );
        const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
        const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingArea}`;
        const { data } = await axios.post(
          `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderURL}')/Files/add(url='${encodeURIComponent(safeFileName)}')`,
          file,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/octet-stream',
            },
          },
        );
        await autoApproveFolder(siteUrl, accessToken, rootFolderURL);
        await autoApproveFolder(siteUrl, accessToken, folderURL);
        return data;
      } else {
        const safeFileName = fileNameSanitizeSoft(file.name).replace(
          /'/g,
          '%27',
        );
        const { data } = await axios.post(
          `${siteUrl}/_api/web/lists/getbytitle('Documents')/rootfolder/files/add(url='${encodeURIComponent(safeFileName)}')`,
          file,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/octet-stream',
            },
          },
        );
        return data;
      }
    } catch (err) {
      let errorMessage = err?.response?.data?.['odata.error']?.message?.value;

      if (errorMessage) {
        const isDuplicate = errorMessage.includes('already exists');
        errorMessage = isDuplicate
          ? `The file name ${title} of your upload already exist for this Resort - but the metadata does not match for a revision update. To upload the same file as a new drawing please change the file name or locate the original drawing and use the "Upload Revision" button to perform a revision update.`
          : errorMessage;
      }

      throw new Error(
        errorMessage ?? 'Something went wrong while uploading the file.',
      );
    }
  };

  const getListItemInfo = async (siteUrl, fileId) => {
    const { data } = await axios.get(
      `${siteUrl}/_api/web/GetFileById('${fileId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef,Id`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      },
    );
    return data.d;
  };

  const updateMetadata = async ({
    siteUrl,
    fileId,
    formValues,
    formDigestValue,
  }) => {
    await axios.post(
      `${siteUrl}/_api/web/lists/GetByTitle('Documents')/items(${fileId})/validateUpdateListItem`,
      { formValues },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-RequestDigest': formDigestValue,
        },
        maxBodyLength: Infinity,
      },
    );
  };

  const publishForApproval = async ({ siteUrl, fileId, formDigestValue }) => {
    await axios.post(
      `${siteUrl}/_api/web/GetFileById('${fileId}')/Publish('For Approval (automated)')`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-RequestDigest': formDigestValue,
          Accept: 'application/json;odata=verbose',
        },
      },
    );
  };

  const bulkApprove = async ({
    siteUrl,
    fileId,
    listGuid,
    formDigestValue,
  }) => {
    const listTarget = listGuid
      ? `(guid'${listGuid}')`
      : "/GetByTitle('Documents')";

    const data = {
      itemIds: [fileId],
      formValues: [
        { FieldName: '_ModerationStatus', FieldValue: '0' },
        { FieldName: '_ModerationComments', FieldValue: 'Approved (Auto)' },
      ],
      folderPath: '',
    };

    await axios.post(
      `${siteUrl}/_api/web/lists${listTarget}/BulkValidateUpdateListItems()`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-RequestDigest': formDigestValue,
        },
      },
    );
  };

  const mutation = useMutation({
    mutationFn: async ({ data, mode }) => {
      const {
        file,
        Title,
        [TERMS_KEY_MAPPING_CT.RESORT]: resort,
        [TERMS_KEY_MAPPING_CT.DRAWING_AREA]: drawingArea,
        [TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]: documentType,
      } = data;
      const siteUrl = getSiteUrl(resort);
      const formDigestValue = await getFormDigest(siteUrl);

      let subFolder = '';
      if (documentType?.split('|')[0]?.toLowerCase() === 'drawing') {
        subFolder = `${drawingArea?.split('|')[0]}/`;
      }

      const { UniqueId } = await uploadFile({
        siteUrl,
        title: Title,
        file,
        formDigestValue,
        drawingArea: subFolder,
      });

      const listItem = await getListItemInfo(siteUrl, UniqueId);
      const fileId = listItem.Id;
      const fileExtension = getFileExtension(file.name);

      const formValues = Object.entries(data)
        .filter(([key]) => key !== 'Title' && termsMapCTData[key])
        .map(([key, value]) => ({
          FieldName: termsMapCTData[key],
          FieldValue: normalizeFormValue(
            [
              TERMS_KEY_MAPPING_CT.DRAWING_DATE,
              TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
            ].includes(key)
              ? dateFormattedValue(value)
              : value,
          ),
        }));

      formValues.push({
        FieldName: 'Title',
        FieldValue: Title,
      });

      formValues.push({
        FieldName: 'File_x0020_Type',
        FieldValue: fileExtension,
      });

      await updateMetadata({ siteUrl, fileId, formValues, formDigestValue });

      if (
        mode === UPLOAD_MODE.FOR_APPROVAL ||
        mode === UPLOAD_MODE.PRE_APPROVE
      ) {
        await publishForApproval({
          siteUrl,
          fileId: UniqueId,
          formDigestValue,
        });
      }

      if (mode === UPLOAD_MODE.PRE_APPROVE) {
        const listGuid = listItem.__metadata.uri.match(/guid'([^']+)'/)?.[1];

        await bulkApprove({ siteUrl, fileId, listGuid, formDigestValue });
      }

      return { UniqueId, Title };
    },
    onSuccess: (result) => {
      showSnackbar({
        message: (
          <p>
            File <strong>{result.Title}</strong> uploaded successfully. Metadata
            will be searchable after a few minutes.
          </p>
        ),
      });
    },
    onError: (error) => {
      let errorMessage = error.message;

      if (isAxiosError(error)) {
        errorMessage =
          error?.response?.data?.['odata.error']?.message?.value ||
          error?.response?.data?.error?.message?.value ||
          'Something went wrong while uploading the file.';
      }

      showSnackbar({
        message: errorMessage,
        severity: ALERT_SEVERITY.ERROR,
      });
    },
  });

  return mutation;
}
