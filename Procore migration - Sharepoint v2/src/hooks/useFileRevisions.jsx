import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getMetadataValueByKey, normalizeCells } from '../utils/helpers';
import { useMutation } from '@tanstack/react-query';
import api from '../apis';
import { useQuery } from '@tanstack/react-query';
import { FormHelperText } from '@mui/material';
import { debounce } from 'lodash';
import useRenewToken from './useRenewToken';

const termsMapCTDataVersioning_ = await import(
  `../Data/termKeyMappingVersioning-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTDataVersioning = termsMapCTDataVersioning_?.default;

const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const formFieldAutoPopulateKey = [
  termsMapCTDataVersioning['Building'],
  termsMapCTDataVersioning['Park Stage'],
  termsMapCTDataVersioning['Gate'],
  termsMapCTDataVersioning['Villa'],
  termsMapCTDataVersioning['Discipline'],
  termsMapCTDataVersioning['Confidentiality'],
];

const useFileRevisions = ({
  accessibleResorts,
  selectedFileName,
  metadatas,
  setMetadatas,
  files,
  isAuth,
  setFileVers,
  setIsError,
  setRevisionSuggestionText,
  setFieldContext,
  fieldContext,
  setFieldRulesTargets,
  fieldRules,
  termsData,
  setAlertText,
}) => {
  const { getAccessToken } = useRenewToken();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ siteUrl, fileId }) => {
      const accessToken = await getAccessToken();
      const res = await axios.get(
        `${siteUrl}/_api/web/GetFileById('${fileId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef`,
        {
          headers: {
            'Content-Type': 'application/json;odata=verbose',
            Accept: 'application/json;odata=verbose',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const { data } = await api({
        baseURL: res.data?.d?.Versions?.__deferred?.uri,
        accessToken,
      }).get();

      // need building, business, drawing set name, gate, villa, discipline, ParkStage, Confidentiality
      return (
        data?.d?.results.map(
          ({
            VersionLabel,
            RevisionNumber,
            DrawingNumber,
            FileLeafRef,
            ...rest
          }) => ({
            fileName: FileLeafRef,
            DrawingNumber,
            version: VersionLabel,
            revision: RevisionNumber,
            metadata: Object.fromEntries(
              Object.entries(rest)
                .filter(([key]) => formFieldAutoPopulateKey.includes(key))
                .map(([key, value]) => [
                  key,
                  value?.Label && value?.TermGuid
                    ? `${value.Label}|${value.TermGuid}`
                    : null,
                ]),
            ),
          }),
        ) || []
      );
    },
    onSettled() {},
  });

  useEffect(() => {}, [isPending]);

  const getRequiredMetadata = useCallback(
    () => ({
      documentType: metadatas['Document Type'] || '',
      business: getMetadataValueByKey(metadatas, 'Business'),
      department: getMetadataValueByKey(metadatas, 'Department'),
      resort: getMetadataValueByKey(metadatas, 'Resort'),
      drawingNumber: getMetadataValueByKey(metadatas, 'Drawing Number'),
      drawingArea: getMetadataValueByKey(metadatas, 'Drawing Area'),
    }),
    [metadatas],
  );
  const metadata = useMemo(getRequiredMetadata, [getRequiredMetadata]);

  const shouldFetchRevision = useMemo(() => {
    const {
      documentType,
      business,
      department,
      resort,
      drawingNumber,
      drawingArea,
    } = metadata;
    return !!(
      documentType?.includes('Drawing') &&
      selectedFileName &&
      business &&
      department &&
      resort &&
      drawingNumber &&
      drawingArea
    );
  }, [selectedFileName, metadata]);

  const fetchRevisions = useCallback(async () => {
    if (!shouldFetchRevision) return;

    const { business, department, resort, drawingNumber, drawingArea } =
      metadata;

    const filterPayload = `Title="${selectedFileName}" ${termsMapData['Business']}="${business}" ${termsMapData['Resort']}="${resort}" ${termsMapData['Department']}="${department}" ${termsMapData['Drawing Number']}="${drawingNumber}" ${termsMapData['Drawing Area']}="${drawingArea}" contentclass:STS_ListItem_DocumentLibrary (RelatedHubSites:${process.env.REACT_APP_RELATEDHUBSITE}) (-SiteId:${process.env.REACT_APP_RELATEDHUBSITE})`;

    const accessToken = await getAccessToken();

    const data = {
      request: {
        Querytext: filterPayload.trim(),
        SelectProperties: {
          results: process.env.REACT_APP_SELECTPROP.split(','),
        },
        StartRow: 0,
        RowLimit: process.env.REACT_APP_MAXRESULTS,
        ClientType: 'PnPModernSearch',
        __metadata: {
          type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
        },
      },
    };

    axios
      .post(
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
      )
      .then(handleRevisionResponse)
      .catch(handleRevisionError);
  }, [selectedFileName, shouldFetchRevision, metadata, isAuth]);

  const [debouncedQueryKey, setDebouncedQueryKey] = useState([]);

  // Debounce the search term update
  useEffect(() => {
    const handler = debounce((value) => setDebouncedQueryKey(value), 500);
    handler([metadata, selectedFileName]);

    return () => handler.cancel();
  }, [metadata, selectedFileName]);

  useQuery({
    queryKey: debouncedQueryKey,
    queryFn: fetchRevisions,
    enabled: shouldFetchRevision, // Only fetch when conditions are met
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const handleRevisionResponse = useCallback(
    (res) => {
      if (res.data.error) {
        setIsError(res?.data?.errorMessage || 'Something went wrong');
        return;
      }

      if (!res.data) {
        setIsError('Search error - unable to fetch files.');
        return;
      }

      const results = res.data.PrimaryQueryResult.RelevantResults.Table.Rows;
      setIsError('');

      if (results.length >= process.env.REACT_APP_MAXRESULTS) {
        setIsError('Too many results - select more filters.');
      }

      processRevisionResults(results);
    },
    [setFileVers, setIsError, metadatas],
  );

  const processRevisionResults = async (results) => {
    if (!results.length) {
      handleNoRevisions();
      return;
    }

    const siteUrl = accessibleResorts.find(
      (accessibleResort) =>
        accessibleResort?.Sitename.toUpperCase() ===
        getMetadataValueByKey(metadatas, 'Resort').toUpperCase(),
    )?.SiteURL;
    const { uniqueId } = normalizeCells(results[0].Cells);

    const versions = await mutateAsync({
      fileId: uniqueId,
      siteUrl,
    });

    if (!versions.length) {
      handleNoRevisions();
      return;
    }

    setFileVers([versions[0]]);
    generateRevisionSuggestion(results);
    populateFormBasedOnLatestVersion(versions[0]);
  };

  function populateFormBasedOnLatestVersion(revision) {
    const { metadata } = revision;

    setMetadatas((prev) => {
      const formattedMetadata = Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => {
          const metadataKey = Object.entries(termsMapCTDataVersioning).find(
            ([_, val]) => val === key,
          )?.[0];

          if (!metadataKey) return [];

          return [metadataKey, value];
        }),
      );

      return { ...prev, ...formattedMetadata };
    });
  }

  const handleNoRevisions = useCallback(() => {
    setFileVers([]);
    setRevisionSuggestionText(null);
  }, [setFileVers, setRevisionSuggestionText]);

  const generateRevisionSuggestion = useCallback(
    (results) => {
      const {
        titleMetadata,
        drawingNumberMetadata,
        departmentMetadata,
        revisionNumber,
        drawingAreaMetadata,
      } = normalizeCells(results[0].Cells);

      const nextSuggestionRevisionChar = String.fromCharCode(
        revisionNumber.charCodeAt(0) + 1,
      );
      if (nextSuggestionRevisionChar) {
        setRevisionSuggestionText(
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
          </div>,
        );
        setAlertText(
          `This upload will add a version to file ${departmentMetadata}–${drawingAreaMetadata}–${drawingNumberMetadata}–${titleMetadata}–${revisionNumber}`,
        );
      }
    },
    [setRevisionSuggestionText],
  );

  const handleRevisionError = useCallback((e) => {
    setIsError(
      e?.response?.data?.error?.message?.value || 'Something went wrong',
    );

    if (e.response?.status === 401) {
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, 1000);
    }
  });

  const updateFieldContext = useCallback(() => {
    setFieldRulesTargets.forEach((targetField) => {
      if (!metadatas[targetField]) return;

      const metadataValue = metadatas[targetField].split('|')[0];

      if (Object.keys(fieldRules).includes(metadataValue)) {
        if (!fieldContext.includes(metadataValue)) {
          setFieldContext([...fieldContext, metadataValue]);
        }
      } else {
        const valuesToRemove = Object.keys(termsData['DMS Terms'][targetField]);
        setFieldContext((prevItems) =>
          prevItems.filter((item) => !valuesToRemove.includes(item)),
        );
      }
    });
  }, [
    metadatas,
    fieldRules,
    fieldContext,
    setFieldContext,
    setFieldRulesTargets,
    termsData,
  ]);

  return { updateFieldContext };
};

export default useFileRevisions;
