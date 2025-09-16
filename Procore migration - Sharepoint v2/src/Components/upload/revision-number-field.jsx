import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FormTextField } from './upload-form';
import { LOCAL_STORAGE_KEYS, TERMS_KEY_MAPPING_CT } from '../../const/common';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  CircularProgress,
  FormHelperText,
  InputAdornment,
  Stack,
  Tooltip,
} from '@mui/material';
import { useDebounce } from '@uidotdev/usehooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import useRenewToken from '../../hooks/useRenewToken';
import axios from 'axios';
import { normalizeCells } from '../../utils/helpers';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useBulkUploadStore } from './bulk-upload-store';

const termsMapCTDataVersioning = await import(
  `../../Data/termKeyMappingVersioning-${process.env.REACT_APP_ENV}.json`
).then((module) => module.default);

const termsMapData = await import(
  `../../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
).then((module) => module.default);

const CHECK_REVISION_FIELDS = [
  'Title',
  TERMS_KEY_MAPPING_CT.BUSINESS,
  TERMS_KEY_MAPPING_CT.DEPARTMENT,
  TERMS_KEY_MAPPING_CT.RESORT,
  TERMS_KEY_MAPPING_CT.DRAWING_NUMBER,
  TERMS_KEY_MAPPING_CT.DRAWING_AREA,
];

const formFieldAutoPopulateKey = [
  termsMapCTDataVersioning['Building'],
  termsMapCTDataVersioning['Park Stage'],
  termsMapCTDataVersioning['Gate'],
  termsMapCTDataVersioning['Villa'],
  termsMapCTDataVersioning['Discipline'],
  termsMapCTDataVersioning['Confidentiality'],
];

const generateRevisionSuggestion = (cells) => {
  const {
    titleMetadata,
    drawingNumberMetadata,
    departmentMetadata,
    revisionNumber,
    drawingAreaMetadata,
  } = normalizeCells(cells);

  const nextSuggestionRevisionChar = String.fromCharCode(
    revisionNumber.charCodeAt(0) + 1,
  );

  if (nextSuggestionRevisionChar) {
    return (
      <div>
        <FormHelperText sx={{ color: 'blue', fontStyle: 'italic' }}>
          Next Revision code is {nextSuggestionRevisionChar}
        </FormHelperText>
        <FormHelperText
          sx={{ color: 'red', fontStyle: 'italic', fontSize: 10 }}
        >
          This upload will add a version to file {departmentMetadata}–
          {drawingAreaMetadata}–{drawingNumberMetadata}–{titleMetadata}–
          {revisionNumber}
        </FormHelperText>
      </div>
    );
  }
};

export const RevisionNumberField = memo(function RevisionNumberField({
  isDrawing,
  name = TERMS_KEY_MAPPING_CT.REVISION_NUMBER,
  size = { xs: 12, sm: 4 },
  disabled = false,
  pageKey,
  setConfirmationDialogText = () => {},
}) {
  const [accessibleResorts] = useLocalStorage(
    LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS,
    [],
  );
  const { setValue } = useFormContext();
  const { getAccessToken } = useRenewToken();
  const setFileVersions = useBulkUploadStore((state) => state.setFileVersions);

  const [suggestionText, setSuggestionText] = useState();
  const [localFileVersions, setLocalFileVersions] = useState(null);

  const handleNoRevisions = useCallback(() => {
    setFileVersions(null);
    setLocalFileVersions(null);
    setSuggestionText(null);
    setConfirmationDialogText(null);
  }, [setFileVersions, setSuggestionText]);

  const { mutateAsync } = useMutation({
    mutationFn: async ({ siteUrl, fileId }) => {
      const accessToken = await getAccessToken();
      const res = await axios.get(
        `${siteUrl}/_api/web/GetFileById('${fileId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef`,
        {
          headers: {
            Accept: 'application/json;odata=verbose',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { data } = await axios.get(res.data?.d?.Versions?.__deferred?.uri, {
        headers: {
          Accept: 'application/json;odata=verbose',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return (
        data?.d?.results.map(
          ({
            VersionLabel,
            RevisionNumber,
            DrawingNumber,
            FileLeafRef,
            UniqueId,
            __metadata,
            ...rest
          }) => ({
            fileName: FileLeafRef,
            DrawingNumber,
            version: VersionLabel,
            revision: RevisionNumber,
            uniqueId: UniqueId,
            __metadata,
            metadata: Object.fromEntries(
              Object.entries(rest)
                .filter(([key]) => formFieldAutoPopulateKey.includes(key))
                .map(([key, value]) => [
                  // reverse lookup the key, it need to match terms key
                  Object.keys(termsMapCTDataVersioning).find(
                    (objKey) => termsMapCTDataVersioning[objKey] === key,
                  ),
                  value?.Label && value?.TermGuid
                    ? `${value.Label}|${value.TermGuid}`
                    : null,
                ]),
            ),
          }),
        ) || []
      );
    },
    onError() {
      handleNoRevisions();
    },
  });

  // listen to all value, then fetch revision accordingly
  const getRevisionFieldNames = (pageKey) => {
    const pageOnlyFields = ['Title', TERMS_KEY_MAPPING_CT.DRAWING_NUMBER];

    return CHECK_REVISION_FIELDS.map((field) =>
      pageKey && pageOnlyFields.includes(field)
        ? `pages.${pageKey}.${field}`
        : field,
    );
  };

  const revisionCheckedFields = useWatch({
    name: getRevisionFieldNames(pageKey),
  });

  const queryKey = useDebounce(revisionCheckedFields, 300);

  const shouldFetchRevision = useMemo(
    () => isDrawing && queryKey.every(Boolean),
    [isDrawing, queryKey],
  );

  const fetchRevisions = useCallback(async () => {
    const [title, business, department, resort, drawingNumber, drawingArea] =
      revisionCheckedFields;

    const filterPayload = `Title="${title}" ${termsMapData['Business']}="${business.split('|')[0]}" ${termsMapData['Resort']}="${resort.split('|')[0]}" ${termsMapData['Department']}="${department.split('|')[0]}" ${termsMapData['Drawing Number']}="${drawingNumber}" ${termsMapData['Drawing Area']}="${drawingArea.split('|')[0]}" contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`;

    const accessToken = await getAccessToken();

    const data = {
      request: {
        Querytext: filterPayload.trim(),
        SelectProperties: {
          results: process.env.REACT_APP_SELECTPROP.split(','),
        },
        StartRow: 0,
        RowLimit: 1,
        ClientType: 'PnPModernSearch',
        __metadata: {
          type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
        },
      },
    };

    return axios.post(
      `https://${process.env.REACT_APP_TENANT_NAME}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/search/postquery`,
      data,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=verbose;charset=utf-8',
          Authorization: `Bearer ${accessToken}`,
        },
        maxBodyLength: Infinity,
      },
    );
  }, [revisionCheckedFields]);

  const processRevisionResults = async (cells) => {
    if (!cells.length) {
      handleNoRevisions();
      return;
    }

    const resort = revisionCheckedFields[3].split('|')[0];

    const siteUrl = accessibleResorts.find(
      (accessibleResort) =>
        accessibleResort?.Sitename.toUpperCase() === resort.toUpperCase(),
    )?.SiteURL;

    const {
      uniqueId,
      titleMetadata,
      drawingNumberMetadata,
      departmentMetadata,
      revisionNumber,
      drawingAreaMetadata,
    } = normalizeCells(cells);

    const versions = await mutateAsync({
      fileId: uniqueId,
      siteUrl,
    });

    if (!versions.length) {
      handleNoRevisions();
      return;
    }

    setFileVersions(versions[0]);
    setLocalFileVersions(versions[0]);
    setSuggestionText(generateRevisionSuggestion(cells));
    setConfirmationDialogText(
      `This upload will add a version to file ${departmentMetadata}–${drawingAreaMetadata}–${drawingNumberMetadata}–${titleMetadata}–${revisionNumber}`,
    );
    populateFormBasedOnLatestVersion(versions[0]);
  };

  function populateFormBasedOnLatestVersion(revision) {
    const { metadata } = revision;

    Object.entries(metadata).forEach(([key, value]) => {
      if (key) {
        setValue(key, value);
      }
    });
  }

  const { data, isSuccess, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: fetchRevisions,
    enabled: shouldFetchRevision, // Only fetch when conditions are met
    refetchOnWindowFocus: false,
    refetchInterval: false,
    select: (res) => {
      return res.data.PrimaryQueryResult.RelevantResults.Table.Rows[0]?.Cells;
    },
  });

  useEffect(() => {
    if (data && isSuccess) {
      processRevisionResults(data);
    } else {
      handleNoRevisions();
    }
  }, [data, isSuccess]);

  const tooltipRevisionText = useMemo(() => {
    if (!localFileVersions) return;

    const revisionText = [
      localFileVersions.DrawingNumber,
      localFileVersions.fileName,
      localFileVersions.version,
      localFileVersions.revision,
    ]
      .filter(Boolean)
      .join(' - ');

    return revisionText;
  }, [localFileVersions]);

  return (
    <FormTextField
      size={size}
      required={isDrawing}
      label="Revision Number"
      name={name}
      disabled={disabled}
      endAdornment={
        isLoading ? (
          <CircularProgress size={16} />
        ) : (
          localFileVersions && (
            <InputAdornment position="end">
              <Tooltip
                placement="right"
                title={
                  <Stack spacing={1}>
                    <strong>Matching Files and it's versions</strong>
                    <div
                      style={{
                        whiteSpace: 'pre-line',
                      }}
                    >
                      <strong>Revision: </strong>
                      {tooltipRevisionText}
                    </div>
                  </Stack>
                }
              >
                {isDrawing && (
                  <span
                    style={{
                      zIndex: 100,
                      cursor: 'pointer',
                      backgroundColor: 'rgb(41, 152, 111)',
                      color: 'white',
                      padding: '0px 5px 0px 5px',
                      fontSize: '10px',
                      fontWeight: '800',
                      borderRadius: '5px',
                    }}
                  >
                    previous revision
                  </span>
                )}
              </Tooltip>
            </InputAdornment>
          )
        )
      }
    >
      {suggestionText}
    </FormTextField>
  );
});
