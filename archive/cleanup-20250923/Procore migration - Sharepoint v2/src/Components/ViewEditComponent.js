import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

import { useForm } from 'react-hook-form';
import EditIcon from '@mui/icons-material/Edit';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  TextField,
  Box,
  Typography,
  Autocomplete,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  getFormDigest,
  getFileID,
  updateMetadata,
  checkForAutoApproval,
  approveReject,
} from '../apis/services/viewServices';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  dateFormattedValue,
  formatDisplayDate,
  isDateInBetween,
} from '../utils/helpers';
import useRenewToken from '../hooks/useRenewToken';
import ApprovalView from '../ui/approval/ApprovalView';
import ApprovalEdit from '../ui/approval/ApprovalEdit';
import {
  createCheckSharepointFolderIfExist,
  autoApproveFolder,
  moveFileToFolder,
} from './upload/services';
import { useApprovalStore } from '../store/approval-store';
import { useShallow } from 'zustand/react/shallow';
import { FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE } from '../const/common';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const timezoneData_ = await import(
  `../Data/timezone-resort-${process.env.REACT_APP_ENV}.json`
);
const timezoneResort = timezoneData_?.default;

const termsData_ = await import(
  `../Data/terms-${process.env.REACT_APP_ENV}.json`
);
const termsData = termsData_?.default;

const termsMapCTData_ = await import(
  `../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTData = termsMapCTData_?.default;

const ignoredKeys = [
  'File Extension',
  'RevisionNumber',
  'ShortDescription',
  'DrawingNumber',
  termsMapCTData['Drawing Date'],
  termsMapCTData['Drawing Received Date'],
  'Title',
  'Author',
];

const drawingMappedObject = [
  'DrawingNumber',
  'Title',
  'RevisionNumber',
  'Gate',
  'Drawing Set Name',
  'Drawing Area',
  'Confidentiality',
  'Author',
  termsMapCTData['Drawing Date'],
  termsMapCTData['Drawing Received Date'],
  'ShortDescription',
];

const ViewEditComponent = ({
  // setIsInProgressMinorVersionList,
  setSelectedSavedConfig,
  getPendingDraftVersions,
  minorVersionsResortTarget,
  // accessibleResorts,
  accessibleResortsSanitized,
  // minorVersionIframePropRaw,
  setMinorVersionIframePropRaw,
  // minorVersionIframeProp,
  setMinorVersionIframeProp,
  isMinorVersionCommentsOpen,
  setIsMinorVersionCommentsOpen,
  // draftCommentTextInput,
  // handleMinorVersionResortActionClick,
  handleRejectModalOpen,
  handleRejectModalClose,
  rejectReason,
  handleChangeReason,
  openRejectModal,
  // minorVersionComments,
  // setMinorVersions,
  // minorVersions,
  // setMinorVersionsRaw,
  setMinorVersionIframeSrc,
  // setMinorVersionIframeSrcTitle,
  // termsGuidToLabel,
  // minorVersionsRaw,
  setIsErrorMinorVersions,
  setIsMinorVersionUpdated,
  setIsError,
}) => {
  const {
    selectedStatus,
    rowDetails,
    isEdit,
    setIsEdit,
    approvalList,
    setApprovalList,
    setRowDetails,
    setSnackbar,
  } = useApprovalStore(
    useShallow((state) => ({
      selectedStatus: state.selectedStatus,
      rowDetails: state.rowDetails,
      isEdit: state.isEdit,
      setIsEdit: state.setIsEdit,
      approvalList: state.approvalList,
      setApprovalList: state.setApprovalList,
      setRowDetails: state.setRowDetails,
      setSnackbar: state.setSnackbar,
    })),
  );

  const draftCommentTextInput = useRef(null);
  const [inputDates, setInputDates] = useState(false);
  const [metadatas, setMetadatas] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoApproveAvailable, setIsAutoApproveAvailable] = useState(false);

  const [disabled, setDisabled] = useState({
    villa: false,
    building: false,
    discipline: false,
    drawingArea: false,
    drawingSetName: false,
    drawingNumber: false,
    drawingDate: false,
    drawingReceivedDate: false,
    revision: false,
  });

  const { getAccessToken } = useRenewToken();

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState,
    reset,
    resetField,
  } = useForm();

  const handleIsEditOpen = () => setIsEdit(true);
  const handleIsEditClose = () => setIsEdit(false);

  const objDirtyFields = Object.keys(formState.dirtyFields);

  const title = watch('Title');
  const shortDescription = watch('ShortDescription');
  const business = watch('Business');
  const resort = watch('Resort');
  const department = watch('Department');
  const building = watch('Building');
  const docType = watch('Document Type');
  const villa = watch('Villa');
  const revisionNumber = watch('RevisionNumber');
  const discipline = watch('Discipline');
  const drawingSetName = watch('Drawing Set Name');
  const drawingNumber = watch('DrawingNumber');
  const drawingArea = watch('Drawing Area');
  const gate = watch('Gate');
  const parkStage = watch('Park Stage');
  const confidentiality = watch('Confidentiality');
  const drawingDate = watch(termsMapCTData['Drawing Date']);
  const drawingReceivedDate = watch(termsMapCTData['Drawing Received Date']);

  const [siteNameUrl] = accessibleResortsSanitized.filter(
    (item) => item?.Sitename === minorVersionsResortTarget,
  );

  const path = rowDetails?.FileRef;
  const simpleDocType = docType ? String(docType).split('|')[0] : '';

  const isDocDrawing = simpleDocType === 'Drawing';

  useEffect(() => {
    if (isEdit) {
      setIsValid(false);
    }
  }, [isEdit]);

  // TRIGGER RESET WHEN DIRTY BACK TO DEFAULT VALUES
  useEffect(() => {
    if (objDirtyFields.length > 0) {
      objDirtyFields.forEach((field) => {
        const drawingDate = termsMapCTData['Drawing Date'];
        const drawingReceivedDate = termsMapCTData['Drawing Received Date'];
        const apiDate = new Date(rowDetails?.[field]);
        const existingDate = new Date(watch(field));
        const details = apiDate.toLocaleString();
        const existing = existingDate.toLocaleString();

        if ([drawingDate, drawingReceivedDate].includes(field)) {
          if (details === existing) {
            resetField(field, {
              defaultValue: rowDetails?.[field],
            });
          }
        }

        if (
          field === 'ShortDescription' &&
          rowDetails?.[field] === null &&
          watch(field) === ''
        ) {
          console.log('short description here', rowDetails?.[field]);
          resetField(field, {
            defaultValue: null,
          });
        }

        if (!ignoredKeys.includes(field)) {
          if (
            termsData['DMS Terms'][field][rowDetails?.[field]] === watch(field)
          ) {
            resetField(field, {
              defaultValue: rowDetails?.[field],
            });
          }
        }

        if (rowDetails?.[field] === watch(field)) {
          resetField(field, {
            defaultValue: rowDetails?.[field],
          });
        }
      });
    }
  }, [objDirtyFields, rowDetails, selectedStatus]);

  const drawingDateValid = isDateInBetween(
    drawingDate,
    dayjs().year('2016').month(0).date(1),
    dayjs(drawingReceivedDate),
  );

  const drawingReceivedDateValid = isDateInBetween(
    drawingReceivedDate,
    dayjs(drawingDate),
    dayjs(),
  );

  useEffect(() => {
    // validations for NON-DRAWING
    const requiredFieldIsEmpty = [
      title,
      business,
      resort,
      department,
      docType,
    ].every(Boolean);

    // validations for DRAWING
    const isDrawingFieldValid = [
      revisionNumber,
      drawingArea,
      drawingSetName,
      drawingNumber,
      drawingDate,
      drawingReceivedDate,
      drawingDateValid,
      drawingReceivedDateValid,
    ].every(Boolean);

    console.log('objDirtyFields TEST', objDirtyFields);

    if (objDirtyFields.length > 0) {
      if (isDocDrawing) {
        setIsValid(isDrawingFieldValid && requiredFieldIsEmpty);
      } else {
        setIsValid(requiredFieldIsEmpty);
      }
    } else {
      setIsValid(false);
      return;
    }
  }, [
    objDirtyFields,
    title,
    shortDescription,
    business,
    resort,
    department,
    docType,
    building,
    villa,
    discipline,
    gate,
    parkStage,
    confidentiality,
    drawingSetName,
    drawingArea,
    drawingNumber,
    gate,
    parkStage,
    confidentiality,
  ]);

  const initializeForm = () => {
    termsDataObject.filter(Boolean).map((key) => {
      const value = rowDetails?.[key];
      if (ignoredKeys.includes(key)) {
        setValue(key, value || '');
      } else {
        setValue(key, value ? termsData['DMS Terms'][key][value] : undefined);
      }
    });
    drawingMappedObject.filter(Boolean).map((key) => {
      const value = rowDetails?.[key];
      if (['Title', 'Author', 'ShortDescription'].includes(key)) {
        const mapValue = {
          Title: rowDetails?.Title,
          ShortDescription: rowDetails?.ShortDescription || '',
        };
        setValue(key, mapValue[key]);
      } else if (ignoredKeys.includes(key)) {
        if (
          [
            termsMapCTData['Drawing Date'],
            termsMapCTData['Drawing Received Date'],
          ].includes(key)
        ) {
          const resValue = dateFormattedValue(value);
          setValue(key, resValue || '');
        }
        setValue(key, value || '');
      } else {
        setValue(key, termsData['DMS Terms'][key][value]);
      }
    });
  };

  useEffect(() => {
    initializeForm();

    setError(false);

    return () => {
      setInputDates(false);
      reset();
    };

    // approveReject('TEST');
  }, [setSelectedSavedConfig, rowDetails, selectedStatus]);

  const siteCheckerForAutoApproval = async () => {
    const accessToken = await getAccessToken();
    if (minorVersionsResortTarget) {
      const siteUrl_ = accessibleResortsSanitized.filter(
        (accessibleResort) =>
          accessibleResort?.Sitename.toUpperCase() ===
          minorVersionsResortTarget.toUpperCase(),
      );
      const siteUrl = siteUrl_[0]?.SiteURL;
      const siteName = siteUrl_[0]?.Sitename;
      checkForAutoApproval({
        siteUrl,
        siteName,
        callback: (e) => {
          setIsAutoApproveAvailable(e);
        },
        accessToken,
      });
    }
  };

  useEffect(() => {
    siteCheckerForAutoApproval();
  }, [rowDetails]);

  const handleDatePicker = (key) => (valueDate) => {
    setInputDates(true);
    setMetadatas((prev) => ({
      ...prev,
      [key]: valueDate,
    }));
    setValue(key, valueDate, {
      shouldDirty: true,
    });
  };

  const handleTextValue = (key) => (e) => {
    e.preventDefault();
    const value = e.target.value;
    setMetadatas((prev) => ({
      ...prev,
      [key]: value,
    }));
    setValue(key, value, {
      shouldDirty: true,
    });
  };

  const getTimezoneByResort = ({ isLocal = false }) => {
    const resort = String(watch('Resort')).split('|')[0];
    const localTimezone = dayjs.tz.guess();
    const siteTimezone = timezoneResort[resort];
    if (isLocal) {
      return localTimezone;
    } else {
      return siteTimezone;
    }
  };

  const getDateValue = (key) => {
    const value = watch(key);
    if (!value) return null;

    let result;

    const siteTimezone = getTimezoneByResort({ isLocal: false });

    if (inputDates) {
      result = value;
    }

    // Convert the value to a dayjs object in the site's timezone
    result = formatDisplayDate(value, siteTimezone);

    return result;
  };

  const getTextValue = (key) => {
    const value = watch(key);
    return value || '';
  };

  const isDisabled = (key) => {
    const mappedDisabled = {
      Building: disabled.building,
      Villa: disabled.villa,
      Discipline: disabled.discipline,
      'Drawing Area': disabled.drawingArea,
      'Drawing Set Name': disabled.drawingSetName,
      DrawingNumber: disabled.drawingNumber,
      RevisionNumber: disabled.revision,
      [termsMapCTData['Drawing Date']]: disabled.drawingDate,
      [termsMapCTData['Drawing Received Date']]: disabled.drawingReceivedDate,
    };
    const result = mappedDisabled[key] || false;
    return result;
  };
  const getOptions = (key) => {
    try {
      if (ignoredKeys.includes(key)) {
        return [];
      }
      if (key === 'Resort') {
        return Object.keys(termsData['DMS Terms'][key]).filter((option) =>
          accessibleResortsSanitized.some((y) => option.includes(y?.Sitename)),
        );
      }
      return Object.keys(termsData['DMS Terms'][key]).filter(
        (k) => k.toLowerCase() !== 'to be tagged',
      );
    } catch (error) {
      console.log('key', key);
    }
  };
  const getValue = (key) => {
    const value = watch(key);
    return value ? value.split('|')[0] : '';
  };
  const handleMetadataChange = (key) => async (e, value) => {
    const accessToken = await getAccessToken();
    setMetadatas((prev) => ({
      ...prev,
      [key]: value ? termsData['DMS Terms'][key][value] : undefined,
    }));
    setValue(key, value ? termsData['DMS Terms'][key][value] : undefined, {
      shouldDirty: true,
    });

    if (key === 'Resort') {
      const siteUrl_ = accessibleResortsSanitized?.filter(
        (accessibleResort) =>
          accessibleResort?.Sitename?.toUpperCase() ===
          termsData['DMS Terms'][key][value]?.split('|')[0].toUpperCase(),
      );
      const siteUrl = siteUrl_[0]?.SiteURL;
      const siteName = siteUrl_[0]?.Sitename;
      checkForAutoApproval({
        siteUrl,
        siteName,
        callback: (e) => {
          setIsAutoApproveAvailable(e);
        },
        accessToken,
      });
    }
  };

  const getFileName = (fileRef) => {
    if (!fileRef) return null;
    const arrFileRef = fileRef.split('/');
    const fileName = arrFileRef[arrFileRef.length - 1];
    return fileName;
  };

  const handleMinorVersionResortActionClick = async (
    event,
    mode,
    docId,
    FileDirRef,
    Title,
    Version,
    FileRef,
  ) => {
    const selectedSite = accessibleResortsSanitized.filter(
      (item) => item.Sitename === minorVersionsResortTarget,
    );
    const siteUrl = selectedSite[0].SiteURL;
    const accessToken = await getAccessToken();
    setIsLoading(true);
    if (mode == 2) {
      axios
        .post(
          `${siteUrl}/_api/web/GetFileByServerRelativePath(DecodedUrl=@a1)/Publish(@a2)?@a1='${FileRef}'&@a2='${draftCommentTextInput.current.value !== null && draftCommentTextInput.current.value !== '' ? draftCommentTextInput.current.value : '<no comment>'}'`,
          {},
          {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${accessToken}`,
            },
            maxBodyLength: Infinity,
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsErrorMinorVersions(res.data.errorMessage);
          } else {
            if (res.data) {
              setIsMinorVersionUpdated(
                `Request Approval Sent for File ${Title === null ? '<not specified>' : Title} with version v${Version}.`,
              );
              setIsMinorVersionCommentsOpen(false);
              draftCommentTextInput.current.value = '';
              getPendingDraftVersions();
            } else {
              setIsErrorMinorVersions(
                'Update error - unable to update file status.',
              );
            }
          }
          setIsLoading(false);
        })
        .catch((e) => {
          setIsLoading(false);
          setError(true);
          showSnackbar(e.message, 'error');
          setIsError(e.message);
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          }
        });
    } else {
      let data = JSON.stringify({
        itemIds: [docId],
        formValues: [
          {
            FieldName: '_ModerationStatus',
            FieldValue: `${mode}`,
          },
          {
            FieldName: '_ModerationComments',
            FieldValue: mode === 0 ? 'Approved' : (rejectReason ?? 'Denied'),
          },
        ],
        folderPath: '',
      });
      axios
        .post(
          `${siteUrl}/_api/web/GetListUsingPath(DecodedUrl=@a1)/BulkValidateUpdateListItems()?@a1='${FileDirRef}'`,
          data,
          {
            headers: {
              Accept: 'application/json;odata=verbose',
              'Content-Type': 'application/json;odata=verbose;charset=utf-8',
              Authorization: `Bearer ${accessToken}`,
            },
            maxBodyLength: Infinity,
          },
        )
        .then((res) => {
          if (res.data.error === true) {
            setIsErrorMinorVersions(res.data.errorMessage);
          } else {
            if (res.data) {
              if (res.data?.d?.BulkValidateUpdateListItems?.results) {
                let isMinorVersionActionSuccess = true;
                for (
                  let i = 0;
                  i < res.data?.d?.BulkValidateUpdateListItems?.results.length;
                  i++
                ) {
                  const errorRes =
                    res.data?.d?.BulkValidateUpdateListItems?.results[i];
                  if (errorRes?.ErrorMessage !== null) {
                    isMinorVersionActionSuccess = false;
                    setIsErrorMinorVersions(errorRes?.ErrorMessage);
                    break;
                  }
                }

                if (isMinorVersionActionSuccess) {
                  // setIsMinorVersionUpdated(
                  //   `File ${Title === null ? '<not specified>' : Title} with version v${Version} was ${mode === 0 ? 'approved' : 'declined'}.`,
                  // );
                  getPendingDraftVersions();
                }
              }
            } else {
              setIsErrorMinorVersions(
                'Update error - unable to update file status.',
              );
            }
          }
          setIsLoading(false);
        })
        .catch((e) => {
          setIsLoading(false);
          setIsError(e.message);
          setError(true);
          showSnackbar(e.message, 'error');
          if (e.status === 401) {
            setTimeout(function () {
              localStorage.clear();
              window.location.href = '/';
            }, 1000);
          }
        });
    }

    let isAutoApproved = false;
    const siteName = selectedSite[0]?.Sitename;

    if (siteUrl && siteName) {
      checkForAutoApproval({
        siteUrl,
        siteName,
        callback: (e) => {
          isAutoApproved = e;
        },
        accessToken,
      });
    }

    try {
      const responseListItemAllFields = await getFileID({
        siteNameUrl: siteUrl,
        UniqueId: rowDetails.UniqueId,
        accessToken,
      });

      const fileDirRef = responseListItemAllFields.data?.d?.FileDirRef;
      const fileRef = responseListItemAllFields.data?.d?.FileRef;

      const fileRefArray = String(fileRef).split('/');
      const fileName = fileRefArray[fileRefArray.length - 1];

      const drawingAreaValue = rowDetails?.['Drawing Area'];

      const isDrawingDocType =
        String(rowDetails?.['Document Type']).toLowerCase() === 'drawing';

      const isExistDrawingFolder = String(fileDirRef).includes(
        `Drawings/${drawingAreaValue}`,
      );

      const baseSite =
        String(siteUrl).split('/')[String(siteUrl).split('/').length - 1];

      const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
      const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingAreaValue}`;

      if (isDrawingDocType) {
        if (!isExistDrawingFolder && drawingAreaValue) {
          await createCheckSharepointFolderIfExist(
            siteUrl,
            baseSite,
            ['Drawings', drawingAreaValue],
            accessToken,
          );
          if (isAutoApproved) {
            await autoApproveFolder(
              siteUrl,
              accessToken,
              rootFolderURL,
              responseListItemAllFields,
            );
            await autoApproveFolder(
              siteUrl,
              accessToken,
              folderURL,
              responseListItemAllFields,
            );
          }
        }

        if (isAutoApproved) {
          await moveFileToFolder(
            siteUrl,
            accessToken,
            `${fileDirRef}/${fileName}`,
            `${folderURL}/${fileName}`,
          );
        }
      }

      removeItemAndProceedNext();

      showSnackbar(
        `File ${Title === null ? getFileName(FileRef) : Title} with version v${Version} was ${mode === 0 ? 'approved' : 'declined'}.`,
      );
    } catch (e) {
      console.log('e', e.message);
      const notFound = String(e.message).includes('404');
      if (notFound) {
        showSnackbar(
          'This document is either already approved or removed.',
          'error',
        );
        removeItemAndProceedNext();
      }
    }
  };

  const payloadFormat = (values, valObj) => {
    return {
      formValues: values
        .filter((key) => key !== '')
        .map((key) => {
          return {
            __metadata: { type: 'SP.ListItemFormUpdateValue' },
            FieldName: termsMapCTData[key] || key,
            FieldValue: valObj[key],
          };
        }),
    };
  };

  const onCancel = () => {
    reset();
    initializeForm();
    handleIsEditClose();
  };

  const onSave = handleSubmit(async (data) => {
    const drawingDate = data[termsMapCTData['Drawing Date']];
    const drawingReceivedDate = data[termsMapCTData['Drawing Received Date']];

    const resort = String(data['Resort']).split('|')[0];
    const siteTimezone = timezoneResort[resort];

    const newDrawingDate = formatDisplayDate(
      drawingDate,
      siteTimezone,
      'MM/DD/YYYY',
    );
    const newDrawingReceivedDate = formatDisplayDate(
      drawingReceivedDate,
      siteTimezone,
      'MM/DD/YYYY',
    );
    const newData = {
      ...data,
      [termsMapCTData['Drawing Date']]: newDrawingDate,
      [termsMapCTData['Drawing Received Date']]: newDrawingReceivedDate,
    };
    setIsLoading(true);
    const libraryName = 'Documents';
    const accessToken = await getAccessToken();
    const { data: formDigest } = await getFormDigest(
      siteNameUrl.SiteURL,
      accessToken,
    );

    const formDigestValue =
      formDigest?.d?.GetContextWebInformation?.FormDigestValue.split(',')[0];
    const newPath = new URL(siteNameUrl.SiteURL);
    const relativeURL = new URL(newPath.origin + path);
    const fileServerRelativeUrl = relativeURL.pathname;

    try {
      // update metadata api call
      const responseListItemAllFields = await getFileID({
        siteNameUrl: siteNameUrl.SiteURL,
        UniqueId: rowDetails.UniqueId,
        accessToken,
      });

      const fileId = responseListItemAllFields.data?.d?.Id;
      const FileDirRef = responseListItemAllFields.data?.d?.FileDirRef;
      const fileRef = responseListItemAllFields.data?.d?.FileRef;
      const payload = payloadFormat([...Object.keys(newData)], newData);
      const uri = responseListItemAllFields.data?.d?.__metadata.uri;
      const listGuidMatch = uri.match(/guid'([^']+)'/);

      const fileRefArray = String(fileRef).split('/');
      const fileName = fileRefArray[fileRefArray.length - 1];

      const baseSite = String(siteNameUrl.SiteURL).split('/')[
        String(siteNameUrl.SiteURL).split('/').length - 1
      ];

      const drawingAreaValue = String(data?.['Drawing Area']).split('|')[0];
      const isDrawingDocType =
        String(data?.['Document Type']).split('|')[0].toLowerCase() ===
        'drawing';

      const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
      const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingAreaValue}`;

      const isExistDrawingFolder = String(FileDirRef).includes(
        `Drawings/${drawingAreaValue}`,
      );

      if (isDrawingDocType) {
        if (!isExistDrawingFolder && drawingAreaValue) {
          await createCheckSharepointFolderIfExist(
            siteNameUrl.SiteURL,
            baseSite,
            ['Drawings', drawingAreaValue],
            accessToken,
          );
          await autoApproveFolder(
            siteNameUrl.SiteURL,
            accessToken,
            rootFolderURL,
            responseListItemAllFields,
          );
          await autoApproveFolder(
            siteNameUrl.SiteURL,
            accessToken,
            folderURL,
            responseListItemAllFields,
          );
        }

        const hasWarningOrError = await moveFileToFolder(
          siteNameUrl.SiteURL,
          accessToken,
          `${FileDirRef}/${fileName}`,
          `${folderURL}/${fileName}`,
        );

        if (hasWarningOrError?.length > 0) {
          setError(true);
          showSnackbar(FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE);
        }
      }

      await updateMetadata({
        siteNameUrl: siteNameUrl.SiteURL,
        payload,
        fileId,
        formDigestValue,
        libraryName,
        fileServerRelativeUrl,
        FileDirRef,
        isAutoApproveAvailable,
        listGuid: listGuidMatch[1],
        UniqueId: rowDetails.UniqueId,
        callback: (e) => {
          console.log('error on update metadata');
          setError(true);
        },
        accessToken,
      });

      removeItemAndProceedNext();

      setIsLoading(false);
      setIsEdit(false);
      showSnackbar(
        `${data?.Title} updated successfully. Updated metadata will be searchable after a few minutes.`,
      );
    } catch (error) {
      setIsLoading(false);
      setIsEdit(false);
      console.log('error upon savings');
      showSnackbar(
        error?.response?.data?.error?.message?.value ||
          'Something went wrong please try again.',
        'error',
      );
      setError(true);
    }
  });

  const [hide, setHide] = useState({
    villa: false,
    building: false,
  });

  const termsDataObject = useMemo(() => {
    if (hide.building) {
      return [
        'Business',
        'Resort',
        'Park Stage',
        'Department',
        'Villa',
        '',
        'Document Type',
        'Discipline',
      ];
    }
    if (hide.villa) {
      return [
        'Business',
        'Resort',
        'Park Stage',
        'Department',
        'Building',
        '',
        'Document Type',
        'Discipline',
      ];
    }
    return [
      'Business',
      'Resort',
      'Park Stage',
      'Department',
      'Building',
      '',
      'Document Type',
      'Discipline',
    ];
  }, [hide]);

  useEffect(() => {
    const simpleDepartment = department ? String(department).split('|')[0] : '';
    const simpleDocType = docType ? String(docType).split('|')[0] : '';

    const isResidential = simpleDepartment === 'Residential';
    setHide((prev) => ({
      ...prev,
      building: isResidential,
      villa: !isResidential,
    }));

    // dirty fields
    if (objDirtyFields.includes('Department')) {
      if (isResidential) {
        setValue('Building', '');
      } else if (!isResidential) {
        setValue('Villa', '');
      } else {
        setValue('Building', '');
        setValue('Villa', '');
      }
    }

    if (objDirtyFields.includes('Document Type')) {
      if (simpleDocType != 'Drawing') {
        setValue('Drawing Set Name', '');
        setValue('Drawing Area', '');
        setValue('DrawingNumber', '');
        setValue(termsMapCTData['Drawing Date'], '');
        setValue(termsMapCTData['Drawing Received Date'], '');
        setValue('RevisionNumber', '');
        const drawingFields = [
          'Drawing Set Name',
          'Drawing Area',
          'DrawingNumber',
          termsMapCTData['Drawing Date'],
          termsMapCTData['Drawing Received Date'],
          'RevisionNumber',
        ];
        drawingFields.forEach((field) => {
          resetField(field, {
            keepDirty: false,
          });
        });
      }
    }

    if (simpleDocType === 'Drawing') {
      setDisabled((prev) => ({
        ...prev,
        discipline: false,
        drawingArea: false,
        drawingSetName: false,
        drawingNumber: false,
        drawingDate: false,
        drawingReceivedDate: false,
        revision: false,
      }));
    } else {
      setDisabled((prev) => ({
        ...prev,
        discipline: false,
        drawingArea: true,
        drawingSetName: true,
        drawingNumber: true,
        drawingDate: true,
        drawingReceivedDate: true,
        revision: true,
      }));
    }
  }, [department, docType]);

  const dateMinMax = (label) => {
    switch (label) {
      case termsMapCTData['Drawing Date']:
        return {
          minDate: dayjs('2016-01-01'),
          maxDate:
            getDateValue(termsMapCTData['Drawing Received Date']) != null
              ? dayjs(getDateValue(termsMapCTData['Drawing Received Date']))
              : dayjs(),
        };
      case termsMapCTData['Drawing Received Date']:
        return {
          minDate:
            getDateValue(termsMapCTData['Drawing Date']) != null
              ? dayjs(getDateValue(termsMapCTData['Drawing Date']))
              : dayjs('2016-01-01'),
          maxDate: dayjs(),
        };
      default:
        return;
    }
  };

  const showSnackbar = async (message = '', severity = 'success') => {
    setSnackbar({
      open: true,
      severity,
      message,
    });
  };

  const removeItemAndProceedNext = () => {
    const approvalList_ = approvalList.filter(
      (obj) => obj.UniqueId !== rowDetails?.UniqueId,
    );
    setApprovalList(approvalList_);
    const firstRow = approvalList_[0];
    setRowDetails(firstRow);
  };

  const errorApproveReject = (e) => {
    console.log('error on submit draft and approve');
    showSnackbar(
      'This document is either already approved or removed.',
      'error',
    );
    setIsLoading(false);
    setMinorVersionIframePropRaw(null);
    setMinorVersionIframeProp(null);
    setMinorVersionIframeSrc('test error');
  };

  const handleSubmitDraftApprove = async (e) => {
    const accessToken = await getAccessToken();
    setIsLoading(true);
    await approveReject({
      event: e,
      mode: 0,
      docId: rowDetails?.Id,
      FileDirRef: rowDetails?.FileDirRef,
      Title: rowDetails?.Title,
      Version: rowDetails?.OData__UIVersionString,
      FileRef: rowDetails?.FileRef,
      currentStatus: rowDetails?.OData__ModerationStatus,
      UniqueId: rowDetails?.UniqueId,
      siteNameUrlObj: siteNameUrl,
      getPendingDraftVersions,
      metadata: rowDetails?.__metadata,
      accessToken,
      errCallback: errorApproveReject,
    });

    const drawingAreaValue = rowDetails?.['Drawing Area'];
    const isDocTypeDrawing =
      String(rowDetails?.['Document Type']).toLowerCase() === 'drawing';
    const fileDirRef = rowDetails?.FileDirRef;
    const baseSite = String(siteNameUrl.SiteURL).split('/')[
      String(siteNameUrl.SiteURL).split('/').length - 1
    ];
    const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
    const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingAreaValue}`;
    const isExistDrawingFolder = String(fileDirRef).includes(
      `Drawings/${drawingAreaValue}`,
    );

    try {
      const responseListItemAllFields = await getFileID({
        siteNameUrl: siteNameUrl.SiteURL,
        UniqueId: rowDetails.UniqueId,
        accessToken,
      });

      const fileRef = responseListItemAllFields.data?.d?.FileRef;

      const fileRefArray = String(fileRef).split('/');
      const fileName = fileRefArray[fileRefArray.length - 1];

      if (isDocTypeDrawing) {
        if (!isExistDrawingFolder && drawingAreaValue) {
          await createCheckSharepointFolderIfExist(
            siteNameUrl.SiteURL,
            baseSite,
            ['Drawings', drawingAreaValue],
            accessToken,
          );
          await autoApproveFolder(
            siteNameUrl.SiteURL,
            accessToken,
            rootFolderURL,
            responseListItemAllFields,
          );
          await autoApproveFolder(
            siteNameUrl.SiteURL,
            accessToken,
            folderURL,
            responseListItemAllFields,
          );
        }

        const hasWarningOrError = await moveFileToFolder(
          siteNameUrl.SiteURL,
          accessToken,
          `${fileDirRef}/${fileName}`,
          `${folderURL}/${fileName}`,
        );

        if (hasWarningOrError?.length > 0) {
          showSnackbar(FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE, 'error');
          setError(true);
        }
      }

      setIsLoading(false);
      showSnackbar(
        `File ${rowDetails?.Title === null ? getFileName(rowDetails?.FileRef) : rowDetails?.Title} with version v${rowDetails?.OData__UIVersionString} was approved.`,
      );

      removeItemAndProceedNext();
    } catch (error) {
      console.log('e', error.message);
      const notFound = String(error.message).includes('404');
      if (notFound) {
        showSnackbar(
          'This document is either already approved or removed.',
          'error',
        );
        removeItemAndProceedNext();
      }
      setIsLoading(false);
    }
  };

  const renderFields = (label) => {
    if (label !== '') {
      const field = register(label);

      if (label === 'ShortDescription') {
        return (
          <TextField
            {...field}
            autoComplete="off"
            size="small"
            multiline
            rows={3}
            onChange={handleTextValue(label)}
            value={getTextValue(label)}
            disabled={isDisabled(label)}
            label="Short Description"
            variant="outlined"
            fullWidth
          />
        );
      }

      if (
        [
          termsMapCTData['Drawing Date'],
          termsMapCTData['Drawing Received Date'],
        ].includes(label)
      ) {
        const dateLabel =
          label === termsMapCTData['Drawing Date']
            ? 'Drawing Date'
            : 'Drawing Received Date';
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={`${dateLabel} ${isDocDrawing ? '*' : ''}`}
              disabled={isDisabled(label)}
              {...dateMinMax(label)}
              localeText={{
                fieldMonthPlaceholder: (params) =>
                  params.contentType === 'digit' ? 'MM' : params.format,
              }}
              onChange={handleDatePicker(label)}
              value={isDocDrawing ? getDateValue(label) : null}
              format="DD - MMM - YYYY"
              size="small"
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
              fullWidth
            />
          </LocalizationProvider>
        );
      }

      if (label === 'RevisionNumber') {
        return (
          <TextField
            {...field}
            autoComplete="off"
            size="small"
            onChange={handleTextValue(label)}
            value={getTextValue(label)}
            disabled={isDisabled(label)}
            label={`Revision Number ${isDocDrawing ? '*' : ''}`}
            variant="outlined"
            fullWidth
          />
        );
      }

      if (['Title', 'DrawingNumber'].includes(label)) {
        return (
          <TextField
            {...field}
            autoComplete="off"
            size="small"
            onChange={handleTextValue(label)}
            value={getTextValue(label)}
            disabled={isDisabled(label)}
            label={
              label +
              ` ${isDocDrawing ? '*' : ['Title'].includes(label) ? '*' : ''}`
            }
            variant="outlined"
            fullWidth
          />
        );
      }
      if (['Author'].includes(label)) {
        return (
          <Box key={label}>
            <Typography
              variant="caption"
              color="rgb(41, 152, 111)"
              sx={{
                fontWeight: 700,
              }}
            >
              Modified By
            </Typography>
            <Typography
              color="gray"
              sx={{ mb: 1, fontWeight: 800, fontSize: 14 }}
            >
              {rowDetails?.Editor?.Title}
            </Typography>
          </Box>
        );
      }

      return (
        <Autocomplete
          {...field}
          options={getOptions(label)}
          size="small"
          autoHighlight
          autoSelect
          disabled={isDisabled(label)}
          value={getValue(label)}
          onChange={handleMetadataChange(label)}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={
                  label +
                  ` ${['Business', 'Resort', 'Department', 'Document Type'].includes(label) ? '*' : isDocDrawing && ['Drawing Set Name', 'Drawing Area'].includes(label) ? '*' : ''}`
                }
                variant="outlined"
                fullWidth
              />
            );
          }}
          fullWidth
        />
      );
    }
    return;
  };

  if (isLoading) {
    return (
      <Box
        sx={{
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
      </Box>
    );
  }

  return (
    <React.Fragment>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            cursor: 'default',
            color: 'rgb(41, 152, 111)',
            fontWeight: 700,
          }}
        >
          Document tags
        </Typography>
        {!isEdit && (
          <Button
            disabled={error}
            onClick={handleIsEditOpen}
            sx={{ color: 'rgb(41, 152, 111)' }}
          >
            <EditIcon />
            Edit
          </Button>
        )}
      </Box>
      {isEdit ? (
        <ApprovalEdit
          termsDataObject={termsDataObject}
          renderFields={renderFields}
          drawingMappedObject={drawingMappedObject}
          isAutoApproveAvailable={isAutoApproveAvailable}
          onCancel={onCancel}
          isLoading={isLoading}
          onSave={onSave}
          isValid={isValid}
          error={error}
        />
      ) : (
        <ApprovalView
          isAutoApproveAvailable={isAutoApproveAvailable}
          error={error}
          isMinorVersionCommentsOpen={isMinorVersionCommentsOpen}
          handleSubmitDraftApprove={handleSubmitDraftApprove}
          draftCommentTextInput={draftCommentTextInput}
          setIsMinorVersionCommentsOpen={setIsMinorVersionCommentsOpen}
          handleMinorVersionResortActionClick={
            handleMinorVersionResortActionClick
          }
          handleRejectModalOpen={handleRejectModalOpen}
          openRejectModal={openRejectModal}
          handleRejectModalClose={handleRejectModalClose}
          rejectReason={rejectReason}
          handleChangeReason={handleChangeReason}
        />
      )}
    </React.Fragment>
  );
};

export default ViewEditComponent;
