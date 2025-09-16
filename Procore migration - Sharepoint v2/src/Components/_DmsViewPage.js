import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  useCallback,
} from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Typography,
  Tooltip,
  Alert,
  IconButton,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import DMSUploadPage from './_UploadPage';
import UpdateFieldsForm from '../ui/UpdateFieldsForm';
import api from '../apis';
import useAuth from '../hooks/useAuth';
import getViewDataFromCells from '../hooks/view/useViewData';
import useRenewToken from '../hooks/useRenewToken';
import {
  getKeyValue,
  formatDisplayDate,
  isDateInBetween,
  formatUniqueId,
  getLatestModifier,
} from '../utils/helpers';
import CustomTooltip from '../ui/CustomTooltip';
import { useForm } from 'react-hook-form';
import useNavButtons from '../hooks/view/useNavButtons';
import SendEmailDialog from '../ui/SendEmailDialog';
import { PropertyContext } from '../context/PropertyProvider';
import {
  getFileID,
  getFormDigest,
  checkForAutoApproval,
  moveFile,
  updateMetadata,
} from '../apis/services/viewServices';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useNavigate } from 'react-router-dom';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  createCheckSharepointFolderIfExist,
  autoApproveFolder,
  moveFileToFolder,
} from './upload/services';
import { FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE } from '../const/common';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const standardDateFormat = 'YYYY-MM-DD HH:mm:ss A';

const timezoneData = await import(
  `../Data/timezone-resort-${process.env.REACT_APP_ENV}.json`
);
const timezoneResort = timezoneData?.default;

const termsData_ = await import(
  `../Data/terms-${process.env.REACT_APP_ENV}.json`
);
const termsData = termsData_?.default;

const termsMapCTData_ = await import(
  `../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTData = termsMapCTData_?.default;

const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const termsMapCTDataVersioning_ = await import(
  `../Data/termKeyMappingVersioning-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTDataVersioning = termsMapCTDataVersioning_?.default;

const approvalTextMapper = {
  0: 'Approved',
  1: 'Rejected',
  2: 'Pending',
  3: 'Draft',
  4: 'Scheduled',
};

const getApprovalStatusText = (version) => {
  const moderationStatus = version.OData__x005f_ModerationStatus;
  if (approvalTextMapper[moderationStatus]) {
    return <small>&nbsp;({approvalTextMapper[moderationStatus]})</small>;
  } else return null;
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

const RevisionCounter = ({ revisions }) => {
  if (!revisions?.length) return null;

  const status = revisions[0].OData__x005f_ModerationStatus;

  if ([0, 1, 4].includes(status)) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        color: 'red',
      }}
    >
      <small>
        There is a new version with status:&nbsp;{approvalTextMapper[status]}
      </small>
    </div>
  );
};

const DmsViewPage = (props) => {
  const {
    userType,
    accessibleResortsSanitized,
    accessibleResorts,
    onOpenModal,
    onCloseModal,
    showModal,
    onNext,
    onPrev,
    isExistRight,
    isExistLeft,
    onPrevSection,
    onNextSection,
    isExistLeftSection,
    isExistRightSection,
    customTitle,
    ...fileDetails
  } = props;
  const [state, setState] = useState({
    details: [],
    isEdit: false,
    isLoading: false,
    isSuccess: false,
    isError: '',
    isVisitor: false,
    isAutoApproveAvailable: false,
    showBottomBtns: true,
    tappedBtn: false,
    responseThumbnail: null,
    selectedFileVersion: {},
    latestVersion: '',
    latestApprovedVersion: null,
    revisionNumbers: [],
    newTabVersions: [],
    selectedNewTabURL: '',
    disablededit: false,
    isSendEmail: false,
    inputVersion: '',
    uniqueID: '',
    metadataHeader: '',
    drawingInfoHeader: '',
    moveFileError: '',
  });
  const { openTags, setOpenTags } = useContext(PropertyContext);
  const { getAccessToken } = useRenewToken();
  const theme = useTheme();
  const [isDirty, setIsDirty] = useState(false);

  const [dates, setDates] = useState({
    'Drawing Date': '',
    'Drawing Received Date': '',
  });

  const {
    titleMetadata,
    authorMetadata,
    shortDescMetadata,
    drawingNumberMetadata,
    siteNameUrl,
    path,
    documentType,
    UniqueId,
    businessMetadata,
    resortMetadata,
    departmentMetadata,
    buildingMetadata,
    villaMetadata,
    docTypeMetadata,
    disciplineMetadata,
    revisionNumber,
    drawingAreaMetadata,
    drawingDateMetadata,
    drawingReceivedDateMetadata,
  } = getViewDataFromCells(fileDetails?.fileProperties?.Cells);

  const departmentDetails = getKeyValue(
    state.details,
    termsMapData['Department'],
  );

  const termsDataObject = useMemo(() => {
    if (departmentDetails === 'Residential') {
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
  }, [departmentDetails]);

  const drawingMetadata = [
    'Drawing Number',
    'Title',
    'custom',
    'Drawing Set Name',
    'Drawing Area',
    'Gate',
    'Author',
    'Confidentiality',
    'Short Description',
    'Drawing Date',
    'Drawing Received Date',
  ];

  const [triggerSectionBtns, setTriggerSectionBtns] = useState(false);
  const [editedData, setEditedData] = useState({});

  const handleShowBottomBtns = useCallback(() => {
    setState((prev) => ({ ...prev, showBottomBtns: true }));
  }, []);

  const handleTappedBtn = useCallback(
    (value) => () => {
      setState((prev) => ({ ...prev, tappedBtn: value }));
    },
    [],
  );

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (state.showBottomBtns && !state.tappedBtn) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, showBottomBtns: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.showBottomBtns, state.tappedBtn]);

  const form = useForm({
    defaultValues: useMemo(() => {
      return termsDataObject.reduce((prev, curr) => {
        prev[curr] = '';
        return prev;
      }, {});
    }, [termsDataObject]),
  });

  const objDirtyFields = Object.keys(form.formState.dirtyFields);

  const title = form.watch('Title');
  const shortDescription = form.watch('Short Description');
  const business = form.watch('Business');
  const resort = form.watch('Resort');
  const department = form.watch('Department');
  const building = form.watch('Building');
  const docType = form.watch('Document Type');
  const villa = form.watch('Villa');
  const discipline = form.watch('Discipline');
  const drawingSetName = form.watch('Drawing Set Name');
  const drawingNumber = form.watch('Drawing Number');
  const drawingArea = form.watch('Drawing Area');
  const gate = form.watch('Gate');
  const parkStage = form.watch('Park Stage');
  const confidentiality = form.watch('Confidentiality');
  const drawingDate = form.watch('Drawing Date');
  const drawingReceivedDate = form.watch('Drawing Received Date');

  useEffect(() => {
    const simpleDocType = docType ? String(docType).split('|')[0] : '';

    const mustRequiredFields = [title, business, resort, department, docType];
    const isBaseValid =
      mustRequiredFields.every(Boolean) && objDirtyFields.length > 0;

    let isValid = false;

    if (isBaseValid) {
      if (simpleDocType === 'Drawing') {
        const drawingFields = [
          drawingArea,
          drawingSetName,
          drawingNumber,
          drawingDate,
          drawingReceivedDate,
        ];
        const isDrawingFieldsValid = drawingFields.every(Boolean);

        if (isDrawingFieldsValid) {
          const drawingDateObj = dayjs(drawingDate);
          const drawingReceivedDateObj = dayjs(drawingReceivedDate);

          const drawingDateAfter2016 = drawingDateObj.isAfter(
            dayjs('2016-01-01'),
            'day',
          );
          const drawingDateBeforeOrSameAsReceived =
            drawingDateObj.isSameOrBefore(drawingReceivedDateObj, 'day');
          const drawingReceivedDateTodayOrBefore =
            drawingReceivedDateObj.isSameOrBefore(dayjs(), 'day');

          isValid =
            drawingDateAfter2016 &&
            drawingDateBeforeOrSameAsReceived &&
            drawingReceivedDateTodayOrBefore;
        } else {
          isValid = false;
        }
      } else {
        isValid = true;
      }
    }

    setState((prev) => ({ ...prev, isValid }));
  }, [
    title,
    shortDescription,
    business,
    resort,
    department,
    building,
    docType,
    villa,
    discipline,
    drawingSetName,
    drawingArea,
    drawingNumber,
    gate,
    parkStage,
    confidentiality,
    drawingDate,
    drawingReceivedDate,
  ]);

  useEffect(() => {
    form.setValue('Title', titleMetadata);
    form.setValue('Short Description', shortDescMetadata);
    form.setValue('Drawing Number', drawingNumberMetadata);
    form.setValue('Drawing Area', drawingAreaMetadata);
    form.setValue('Drawing Date', drawingDateMetadata);
    form.setValue('Drawing Received Date', drawingReceivedDateMetadata);
  }, []);

  useEffect(() => {
    const values = state.details;
    const filteredValues = values.filter(({ Key }) => {
      let termsKey = Object.keys(termsMapData).find(
        (key) => termsMapData[key] === Key,
      );

      if (['Title'].includes(Key)) {
        termsKey = 'Title';
      }

      return Object.keys(form.getValues()).includes(termsKey);
    });

    const normalizedValues = filteredValues.reduce((acc, curr) => {
      let key = Object.keys(termsMapData).find(
        (key) => termsMapData[key] === curr.Key,
      );

      if (['Title'].includes(curr.Key)) {
        key = 'Title';
      }

      if (!acc[key]) {
        acc[key] = curr.Value || '';
      }

      return acc;
    }, {});

    const equal = Object.entries(form.getValues())
      .filter(([formKey]) => Boolean(formKey))
      .every(([formKey, formValue]) => {
        // ignore author key
        if (formKey === 'Author') return true;
        if (
          formKey === 'Gate' &&
          !formValue &&
          normalizedValues[formKey] === 'Not set'
        ) {
          return true;
        }

        // convert null, undefined -> ""
        formValue ||= '';

        if (dayjs.isDayjs(formValue)) {
          const resort = form.getValues('Resort').split('|')[0];
          const siteTimezone = timezoneResort[resort];
          const date = formatDisplayDate(
            normalizedValues[formKey],
            siteTimezone,
            'M/D/YYYY',
          );

          return formValue.isSame(date, 'day');
        }

        if (formValue) {
          const convertedValue = formValue.split('|')[0];
          return normalizedValues[formKey] === convertedValue;
        }

        return normalizedValues[formKey] === formValue;
      });

    setIsDirty(!equal);
  }, [state.details, form.getValues()]);

  useAuth();

  const isDocTypeDrawing = documentType === 'Drawing';

  const formattedPathURL = path.split('/Shared')[0];

  const onEdit = () => {
    setState((prev) => ({ ...prev, isEdit: true }));
  };

  const onCancel = () => {
    form.reset();
    setState((prev) => ({ ...prev, isEdit: false }));
  };

  const onSave = form.handleSubmit(async (data) => {
    const drawingDate = data['Drawing Date'];
    const drawingReceivedDate = data['Drawing Received Date'];

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
      'Drawing Date': newDrawingDate,
      'Drawing Received Date': newDrawingReceivedDate,
    };
    setState((prev) => ({ ...prev, isLoading: true }));
    const libraryName = 'Documents';

    const accessToken = await getAccessToken();

    const { data: formDigest } = await getFormDigest(
      siteNameUrl,
      await getAccessToken(),
    );

    const formDigestValue =
      formDigest?.d?.GetContextWebInformation?.FormDigestValue.split(',')[0];
    try {
      // update metadata api call
      const responseListItemAllFields = await getFileID({
        siteNameUrl,
        UniqueId,
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

      const baseSite =
        String(siteNameUrl).split('/')[
          String(siteNameUrl).split('/').length - 1
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
            siteNameUrl,
            baseSite,
            ['Drawings', drawingAreaValue],
            accessToken,
          );
          if (state.isAutoApproveAvailable) {
            await autoApproveFolder(
              siteNameUrl,
              accessToken,
              rootFolderURL,
              responseListItemAllFields,
            );
            await autoApproveFolder(
              siteNameUrl,
              accessToken,
              folderURL,
              responseListItemAllFields,
            );
          }
        }

        if (state.isAutoApproveAvailable) {
          const hasWarningOrError = await moveFileToFolder(
            siteNameUrl,
            accessToken,
            `${FileDirRef}/${fileName}`,
            `${folderURL}/${fileName}`,
          );

          if (hasWarningOrError?.length > 0) {
            const moveFileError = hasWarningOrError.map(
              (item) => item.Message,
            )[0];
            setState((prev) => ({
              ...prev,
              isSuccess: false,
              isError: FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE,
              moveFileError,
            }));
          }
        }
      }

      await updateMetadata({
        siteNameUrl,
        payload,
        fileId,
        formDigestValue,
        libraryName,
        fileServerRelativeUrl: fileRef,
        FileDirRef,
        isAutoApproveAvailable: state.isAutoApproveAvailable,
        listGuid: listGuidMatch[1],
        UniqueId,
        callback: (e) => {
          setState((prev) => ({ ...prev, isError: e }));
        },
        accessToken,
      });

      const formResort = data['Resort'].split('|')[0];
      const isResortChanges = resortMetadata !== formResort;

      if (isResortChanges) {
        // get the form resort value based on accessibleResortsSanitized
        const destinationUrlPathname = accessibleResortsSanitized.find(
          ({ Sitename }) => Sitename === formResort,
        ).SiteURL;

        await moveFile({
          srcPathname: path,
          destSitePath: destinationUrlPathname,
          isAutoApproveAvailable: state.isAutoApproveAvailable,
          callback: (e) => {
            setState((prev) => ({ ...prev, isError: e }));
          },
          accessToken,
        });
      }

      const hasNoLookup = [
        'Drawing Number',
        'Title',
        'Drawing Date',
        'Drawing Received Date',
        'Short Description',
      ];

      const updatedData = Object.keys(editedData).map((key) => ({
        Key: termsMapData[key] || key,
        Value: hasNoLookup.includes(key)
          ? editedData[key]
          : editedData[key].split('|')[0],
      }));

      for (const data of updatedData) {
        const index = state.details.findIndex((item) => item.Key === data.Key);
        let detailsTmp = state.details;
        detailsTmp[index] = data;
        setState((prev) => ({
          ...prev,
          details: [...state.details, detailsTmp],
        }));
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        isEdit: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isEdit: false,
        isError:
          error?.response?.data?.error?.message?.value ||
          'Something went wrong please try again.',
      }));
    }
  });

  const handleClose = useCallback(() => {
    form.reset();
    onCloseModal();
    setState((prev) => ({
      ...prev,
      isEdit: false,
      isError: false,
      isLoading: false,
      isSuccess: false,
    }));
  }, [form, onCloseModal]);

  const latestThumbnail = `${formattedPathURL}/_layouts/15/embed.aspx?UniqueId=${UniqueId}`;

  const handleGetThumbnail = () => {
    setState((prev) => ({ ...prev, responseThumbnail: latestThumbnail }));
  };

  useEffect(() => {
    if (state.revisionNumbers && state.inputVersion) {
      const parsedValue =
        state.revisionNumbers &&
        state.revisionNumbers.find(
          (item) => item?.VersionLabel === state.inputVersion,
        );
      setState((prev) => ({ ...prev, selectedFileVersion: parsedValue }));
      const selectVersionURL = state.newTabVersions.find(
        (data) => data.VersionLabel === parsedValue.VersionLabel,
      );
      const newTabURL = `${formattedPathURL}/${selectVersionURL?.Url}`;
      setState((prev) => ({
        ...prev,
        selectedNewTabURL:
          selectVersionURL?.Url === undefined ? latestThumbnail : newTabURL,
      }));

      const mappedObject = termsDataObject
        .map((data) => {
          const mappedCTData = [...Object.keys(termsMapCTDataVersioning)];
          if (mappedCTData.includes(data)) {
            const key = termsMapCTDataVersioning[data];
            const keyTerms = termsMapData[data];
            const value = parsedValue ? parsedValue[key]?.Label : '';
            return {
              Key: keyTerms,
              Value: value,
            };
          }
        })
        .filter(Boolean);

      const drawingMappedObject = drawingMetadata
        .map((data) => {
          const mappedCTData = [...Object.keys(termsMapCTDataVersioning)];

          if (mappedCTData.includes(data)) {
            const key = termsMapCTDataVersioning[data];
            const keyTerms = termsMapData[data];
            const parsedObjectValue =
              typeof parsedValue[key] === 'object'
                ? parsedValue[key]?.Label
                : parsedValue[key];
            const value = parsedValue ? parsedObjectValue : '';
            return {
              Key: keyTerms,
              Value: value,
            };
          }
        })
        .filter(Boolean);

      setState((prev) => ({
        ...prev,
        details: [
          ...mappedObject,
          ...drawingMappedObject,
          {
            Key: 'Title',
            Value: titleMetadata,
          },
          {
            Key: 'Author',
            Value: getLatestModifier(authorMetadata),
          },
          {
            Key: 'Short Description',
            Value: parsedValue['ShortDescription'],
          },
          {
            Key: 'Path',
            Value:
              selectVersionURL?.Url === undefined ? latestThumbnail : newTabURL,
          },
        ],
      }));
    }
  }, [
    termsDataObject,
    state.revisionNumbers,
    state.inputVersion,
    state.newTabVersions,
  ]);

  const handleSelectVersion = (e) => {
    setState((prev) => ({ ...prev, inputVersion: e.target.value }));
  };

  useEffect(() => {
    if (fileDetails?.fileProperties?.Cells) {
      setState((prev) => ({
        ...prev,
        details: fileDetails?.fileProperties?.Cells,
      }));
    }
  }, [fileDetails?.fileProperties?.Cells]);

  const isOnLatestApprovedVersion = useMemo(() => {
    if (Object.keys(state.selectedFileVersion).length > 0) {
      return (
        state.selectedFileVersion.VersionLabel === state.latestApprovedVersion
      );
    }

    return false;
  }, [state.selectedFileVersion, state.revisionNumbers]);

  const hasPendingOrDraftVersions = useMemo(
    () =>
      [2, 3].includes(
        state.revisionNumbers?.[0]?.OData__x005f_ModerationStatus,
      ),
    [state.revisionNumbers],
  );

  useEffect(() => {
    if (Object.keys(state.selectedFileVersion).length > 0) {
      const isEditDisabled =
        hasPendingOrDraftVersions || !isOnLatestApprovedVersion;

      setState((prev) => ({
        ...prev,
        responseThumbnail: isOnLatestApprovedVersion ? latestThumbnail : null,
        disablededit: isEditDisabled,
      }));
    }
  }, [
    state.selectedFileVersion,
    state.revisionNumbers,
    state.latestApprovedVersion,
  ]);

  const checkIfPartOfOnwersOrAdmins = async (resort) => {
    setState((state) => ({
      ...state,
      isAutoApproveAvailable: false,
    }));

    const siteUrl_ = accessibleResortsSanitized.filter(
      (accessibleResort) =>
        accessibleResort?.Sitename.toUpperCase() === resort.toUpperCase(),
    );
    const siteUrl = siteUrl_[0]?.SiteURL;
    const siteName = siteUrl_[0]?.Sitename;

    if (siteUrl && siteName) {
      checkForAutoApproval({
        siteUrl,
        siteName,
        callback: (e) => {
          setState((state) => ({
            ...state,
            isAutoApproveAvailable: e,
          }));
        },
        accessToken: await getAccessToken(),
      });
    }
  };

  const handleClickOpen = () => {
    onOpenModal();
  };

  useEffect(() => {
    if (!showModal) {
      return;
    }

    if (typeof accessibleResortsSanitized !== 'undefined' && resortMetadata) {
      const resort = resortMetadata.split('|')[0];
      const isExist = accessibleResortsSanitized.filter(
        (item) => item?.Sitename === resort,
      );

      setState((state) => ({
        ...state,
        isVisitor: isExist.length === 0,
      }));

      checkIfPartOfOnwersOrAdmins(resort);
    }
  }, [showModal, accessibleResortsSanitized, resortMetadata]);

  useEffect(() => {
    if (resort) {
      checkIfPartOfOnwersOrAdmins(resort.split('|')[0]);
    }
  }, [state.isEdit, resort]);

  const handlePrev = () => {
    onPrev();
    setTriggerSectionBtns(!triggerSectionBtns);
  };

  const handleNext = () => {
    onNext();
    setTriggerSectionBtns(!triggerSectionBtns);
  };

  useEffect(() => {
    if (showModal) {
      handleGetThumbnail();
      handleGetVersion();
      setState((prev) => ({ ...prev, uniqueID: UniqueId }));
    }
  }, [showModal, triggerSectionBtns]);

  useEffect(() => {
    const isNotEmpty = (value) =>
      value !== '' && value !== undefined && value !== null;

    // Create array of all metadata values
    const metadataValues = [
      businessMetadata,
      resortMetadata,
      departmentMetadata,
      // Conditionally add villa or building metadata based on department
      departmentMetadata === 'Residential' ? villaMetadata : buildingMetadata,
      docTypeMetadata,
      disciplineMetadata,
    ];

    // Filter out empty values and join with separator
    setState((prev) => ({
      ...prev,
      metadataHeader: metadataValues.filter(isNotEmpty).join(' - '),
    }));
  }, [
    business, // Assuming 'business' is related to businessMetadata
    resortMetadata,
    departmentMetadata,
    villaMetadata,
    buildingMetadata,
    docTypeMetadata,
    disciplineMetadata,
  ]);

  useEffect(() => {
    const revNumber = state.selectedFileVersion?.RevisionNumber;
    const drawingNumber = getKeyValue(
      state.details,
      termsMapData['Drawing Number'],
    );

    let header = titleMetadata;

    if (isDocTypeDrawing) {
      const parts = [];

      if (drawingNumber) {
        parts.push(drawingNumber);
      }

      if (titleMetadata) {
        parts.push(titleMetadata);
      }

      parts.push(`Rev: ${revNumber || ''}`);
      header = parts.join(' - ');
    }

    setState((prev) => ({ ...prev, drawingInfoHeader: header }));
  }, [
    isDocTypeDrawing,
    titleMetadata,
    state.details,
    state.selectedFileVersion,
  ]);

  const handleGetVersion = async () => {
    try {
      const response = await api({
        baseURL: formattedPathURL,
        accessToken: await getAccessToken(),
      }).get(`/_api/web/GetFileById('${UniqueId}')/ListItemAllFields`);

      setDates({
        'Drawing Date': response.data?.d?.[termsMapCTData['Drawing Date']],
        'Drawing Received Date':
          response.data?.d?.[termsMapCTData['Drawing Received Date']],
      });

      const versionURL = response.data?.d?.Versions?.__deferred?.uri;
      const versionLabel = response?.data?.d?.OData__UIVersionString;

      setState((prev) => ({ ...prev, latestVersion: versionLabel }));

      const versions = await api({
        baseURL: versionURL,
        accessToken: await getAccessToken(),
      }).get();

      const versionLabels = versions.data?.d?.results || [];

      setState((prev) => ({ ...prev, revisionNumbers: versionLabels }));

      const latestApprovedVersions = versions.data?.d?.results.find(
        (result) => {
          return result.OData__x005f_ModerationStatus === 0;
        },
      );

      setState((prev) => ({
        ...prev,
        latestApprovedVersion: latestApprovedVersions?.VersionLabel,
        selectedFileVersion: {
          VersionLabel: latestApprovedVersions?.VersionLabel,
          RevisionNumber: latestApprovedVersions?.RevisionNumber,
        },
      }));

      const newTabVersions = await api({
        baseURL: `${formattedPathURL}/_api/web/GetFileById('${UniqueId}')/Versions`,
        accessToken: await getAccessToken(),
      }).get();

      const newTabVersionResults = newTabVersions.data?.d?.results;

      setState((prev) => ({ ...prev, newTabVersions: newTabVersionResults }));
    } catch (error) {
      setState((prev) => ({ ...prev, isError: 'Failed to fetch the file.' }));
    }
  };

  const ResponsiveFieldsForm = () => {
    return (
      <Grid container spacing={2}>
        {termsDataObject.map((key) => {
          const value = getKeyValue(state.details, termsMapData[key]);
          if (!key.includes('Short Description')) {
            return (
              <Grid item xs={6} sm={6} md={6} lg={4} key={key}>
                <Box>
                  <Typography
                    variant="caption"
                    color="rgb(41, 152, 111)"
                    sx={{ fontWeight: 700 }}
                  >
                    {key}
                    {key != '' &&
                    [
                      'Business',
                      'Resort',
                      'Department',
                      'Document Type',
                    ].includes(key)
                      ? '*'
                      : ''}
                  </Typography>
                  {value ? (
                    <Typography
                      variant="body1"
                      color="gray"
                      sx={{ mb: 1, fontWeight: 800 }}
                    >
                      {value}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body1"
                      color="gray"
                      sx={{ mb: 1, fontStyle: 'italic' }}
                    >
                      {key != '' && '-'}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          }
        })}
      </Grid>
    );
  };

  const { operationButtons } = useNavButtons({
    setIsSendEmail: (value) =>
      setState((prev) => ({ ...prev, isSendEmail: value })),
    thumbnailURL: state.selectedNewTabURL || latestThumbnail,
    pdfDownloadURL: getKeyValue(state.details, 'Path'),
  });

  const handleOpenTags = useCallback(() => {
    if (state.responseThumbnail !== null && !state.isError) {
      setOpenTags(!openTags);
      setState((prev) => ({ ...prev, isEdit: false }));
    }
  }, [state.responseThumbnail, state.isError, openTags, setOpenTags]);

  return (
    <>
      <div
        onClick={handleClickOpen}
        style={{
          display: 'flex',
          margin: '10px 10px 10px 10px',
          fontSize: '12px',
          padding: '5px',
          backgroundColor: '#f3f3f3',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          cursor: 'pointer',
          color: 'black',
        }}
      >
        <div
          style={{
            color: 'black',
            fontSize: '12px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {customTitle}
        </div>
        <div
          style={{
            fontSize: '8px',
            fontWeight: '600',
            width: '5%',
            alignContent: 'center',
          }}
        >
          <CustomTooltip
            building={state.details[4]?.Value}
            business={state.details[5]?.Value}
            department={state.details[6]?.Value}
            discipline={state.details[7]?.Value}
            documentType={state.details[8]?.Value}
            resort={state.details[10]?.Value}
            path={state.details[1]?.Value}
          />
        </div>
      </div>

      <Dialog open={showModal} fullScreen={isSmallScreen} maxWidth={false}>
        <DialogTitle
          sx={{
            backgroundColor: 'rgb(41, 152, 111)',
            color: 'white',
            fontWeight: '800',
            display: {
              xs: 'block',
              sm: 'flex',
              md: 'flex',
              lg: 'flex',
            },
            p: {
              xs: '10px',
              sm: '16px',
              md: '16px',
              lg: '16px',
            },
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'block',
                md: 'block',
                lg: 'block',
              },
            }}
          >
            <Typography sx={{ fontSize: 16 }}>
              {state.metadataHeader}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {state.drawingInfoHeader}
            </Typography>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent={{
              xs: 'end',
              sm: 'start',
              md: 'start',
              lg: 'start',
            }}
            gap={1}
          >
            {operationButtons.map(({ label, fnc, icon, isActive }, key) =>
              isActive ? (
                <Tooltip
                  key={key}
                  title={<Typography variant="caption">{label}</Typography>}
                >
                  <IconButton onClick={fnc}>{icon}</IconButton>
                </Tooltip>
              ) : null,
            )}
            <IconButton onClick={handleClose}>
              <CloseIcon sx={{ color: '#fff' }} />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: {
                xs: 'block',
                sm: 'none',
                md: 'none',
                lg: 'none',
              },
            }}
          >
            <Typography sx={{ fontSize: 16 }}>
              {state.metadataHeader}
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {state.drawingInfoHeader}
            </Typography>
          </Box>
        </DialogTitle>

        {state.isSuccess ? (
          <Alert
            severity="success"
            onClose={() => setState((prev) => ({ ...prev, isSuccess: false }))}
          >
            <strong>{titleMetadata}</strong> updated successfully. Updated
            metadata will be searchable after a few minutes.
          </Alert>
        ) : (
          <></>
        )}
        {state.isError ? (
          <Alert
            severity={'error'}
            onClose={() => setState((prev) => ({ ...prev, isError: false }))}
          >
            {state.isError}
          </Alert>
        ) : (
          <></>
        )}

        <DialogContent sx={{ padding: 0 }}>
          <Grid container spacing={2} sx={{ pt: '25px', px: '25px', pb: 0 }}>
            {openTags && (
              <>
                <Grid item lg={6} md={6} sm={12}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Minimize Document Tags">
                        <FilterListIcon
                          onClick={handleOpenTags}
                          sx={{
                            fontSize: '23px',
                            color: 'rgb(41, 152, 111)',
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
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
                    </Box>
                    <Box>
                      {!state.isVisitor && !state.isEdit && (
                        <Button
                          onClick={onEdit}
                          disabled={state.isSuccess || state.disablededit}
                          sx={{
                            color: 'rgb(41, 152, 111)',
                          }}
                        >
                          <EditIcon />
                          Edit
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {state.isEdit ? (
                    <UpdateFieldsForm
                      accessibleResortsSanitized={accessibleResortsSanitized}
                      values={state.details}
                      form={form}
                      fields={termsDataObject}
                      selectedFileVersion={state.selectedFileVersion}
                      setEditedData={setEditedData}
                      setIsDirty={setIsDirty}
                    />
                  ) : (
                    <React.Fragment>
                      <ResponsiveFieldsForm />
                      <Divider sx={{ mb: 2 }} />
                      <Grid container sx={{ mb: 2 }} spacing={2}>
                        {drawingMetadata.map((label, index) => {
                          let value;
                          let newValue;
                          if (label === 'Author') {
                            value = getLatestModifier(authorMetadata) || '-';
                          } else if (label === 'Title') {
                            value = titleMetadata || '-';
                          } else if (
                            ['Drawing Date', 'Drawing Received Date'].includes(
                              label,
                            )
                          ) {
                            const resort = getKeyValue(
                              state.details,
                              termsMapData['Resort'],
                            );
                            const localTimezone = dayjs.tz.guess();
                            const siteTimezone = timezoneResort[resort];

                            const result = getKeyValue(
                              state.details,
                              termsMapData[label],
                            );
                            if (isDocTypeDrawing) {
                              newValue = formatDisplayDate(
                                result,
                                localTimezone,
                                'DD - MMM - YYYY h:mm A',
                              );
                              value = formatDisplayDate(
                                result,
                                siteTimezone,
                                'DD - MMM - YYYY',
                              );
                            } else {
                              value = '-';
                            }
                          } else {
                            value = getKeyValue(
                              state.details,
                              termsMapData[label],
                            );
                          }
                          if (label === 'custom' && !state.isEdit) {
                            return (
                              <Grid
                                item
                                xs={6}
                                sm={6}
                                md={6}
                                lg={4}
                                key={index}
                              >
                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  gap={1}
                                >
                                  <FormControl
                                    size="small"
                                    sx={{ minWidth: '130px' }}
                                    id="Fileversion"
                                  >
                                    <InputLabel id="file-version">
                                      Revision
                                    </InputLabel>
                                    <Select
                                      labelId="file-version"
                                      id="file-version-select"
                                      disabled={!isDocTypeDrawing}
                                      onChange={handleSelectVersion}
                                      value={
                                        state.selectedFileVersion
                                          ?.VersionLabel || state.latestVersion
                                      }
                                      label="File Version"
                                      inputProps={{
                                        name: 'File Version',
                                        id: 'uncontrolled-native',
                                      }}
                                    >
                                      {state.revisionNumbers &&
                                        state.revisionNumbers.map(
                                          (item, key) => (
                                            <MenuItem
                                              key={key}
                                              value={item?.VersionLabel}
                                            >
                                              {item?.VersionLabel +
                                                (item?.RevisionNumber
                                                  ? ` - ${item?.RevisionNumber}`
                                                  : '')}
                                              {getApprovalStatusText(item)}
                                            </MenuItem>
                                          ),
                                        )}
                                    </Select>
                                    <RevisionCounter
                                      revisions={state.revisionNumbers}
                                    />
                                  </FormControl>
                                  {!state.isVisitor && (
                                    <DMSUploadPage
                                      isUploadRevisionDisabled={
                                        hasPendingOrDraftVersions
                                      }
                                      accessibleResorts={
                                        accessibleResortsSanitized
                                      }
                                      uploadType="viewSpecific"
                                      form={form}
                                      fieldValues={fileDetails?.fileProperties}
                                      groupingVal={JSON.stringify({})}
                                      filterVal={JSON.stringify({})}
                                    />
                                  )}
                                </Box>
                              </Grid>
                            );
                          }
                          return (
                            <Grid item xs={6} sm={6} md={6} lg={4} key={index}>
                              <Box key={label}>
                                <Typography
                                  variant="caption"
                                  color="rgb(41, 152, 111)"
                                  sx={{
                                    fontWeight: 700,
                                  }}
                                >
                                  {label === 'Author' ? 'Modified By' : label}
                                  {label != '' &&
                                  isDocTypeDrawing &&
                                  [
                                    'Drawing Area',
                                    'Drawing Number',
                                    'Title',
                                    'Drawing Set Name',
                                    'Drawing Date',
                                    'Drawing Received Date',
                                  ].includes(label)
                                    ? '*'
                                    : label != '' && ['Title'].includes(label)
                                      ? '*'
                                      : ''}
                                </Typography>
                                {[
                                  'Drawing Date',
                                  'Drawing Received Date',
                                ].includes(label) ? (
                                  <Tooltip
                                    title={
                                      <Typography variant="caption">
                                        {newValue}
                                      </Typography>
                                    }
                                  >
                                    <Typography
                                      variant="body1"
                                      color="gray"
                                      sx={{ mb: 1, fontWeight: 800 }}
                                    >
                                      {label != ''
                                        ? value
                                          ? value
                                          : '-'
                                        : null}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  <Typography
                                    variant="body1"
                                    color="gray"
                                    sx={{ mb: 1, fontWeight: 800 }}
                                  >
                                    {label != '' ? (value ? value : '-') : null}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </React.Fragment>
                  )}
                </Grid>
              </>
            )}
            <Grid
              item
              lg={!openTags ? 12 : 6}
              md={!openTags ? 12 : 6}
              sm={12}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '600px',
                width: '1200px',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  width: '100%',
                  border: '1px solid #cdcdcd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {state.responseThumbnail && !state.isError ? (
                  <iframe
                    onMouseEnter={handleShowBottomBtns}
                    src={`${state.responseThumbnail}`}
                    width="100%"
                    height="100%"
                    scrolling="no"
                    frameBorder="0"
                    title="SharePoint Document"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  ></iframe>
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: '#FFF',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: '40%',
                        borderRadius: '8px',
                        p: '28px',
                        bgcolor: 'rgb(255, 244, 229)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'rgb(102, 60, 0)',
                          textAlign: 'center',
                        }}
                      >
                        <strong>Warning</strong>: Unable to open thumbnail. You
                        can click new tab button instead.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {!openTags && (
                  <Tooltip
                    title="open document tags"
                    sx={{ position: 'absolute', zIndex: 2 }}
                  >
                    <IconButton
                      sx={{ bgcolor: '#fff' }}
                      onClick={handleOpenTags}
                    >
                      <FilterListIcon
                        sx={{
                          fontSize: '23px',
                          color: 'rgb(41, 152, 111)',
                          cursor: 'pointer',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {!openTags && (
                <Box
                  sx={{ position: 'absolute', zIndex: 2, top: 20, left: 20 }}
                >
                  <Tooltip
                    title={
                      <Typography variant="caption">
                        Expand Document Tags
                      </Typography>
                    }
                  >
                    <FilterListIcon
                      onClick={handleOpenTags}
                      sx={{
                        padding: 1,
                        bgcolor: 'rgb(41, 152, 111)',
                        color: '#FFF',
                        cursor: 'pointer',
                        width: 25,
                        height: 25,
                        borderRadius: 100,
                      }}
                    />
                  </Tooltip>
                </Box>
              )}
              {!openTags && state.showBottomBtns && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      zIndex: 2,
                      bottom: 10,
                      left: 30,
                    }}
                    onMouseMove={handleTappedBtn(true)}
                    onMouseLeave={handleTappedBtn(false)}
                  >
                    <Box display="flex" alignItems="center">
                      {isExistLeftSection && (
                        <Tooltip title="Previous Section" placement="top">
                          <IconButton onClick={onPrevSection}>
                            <KeyboardDoubleArrowLeftIcon
                              sx={{
                                padding: 1,
                                bgcolor: 'rgb(41, 152, 111)',
                                color: '#FFF',
                                cursor: 'pointer',
                                width: 25,
                                height: 25,
                                borderRadius: 100,
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isExistLeft && (
                        <Tooltip title="Previous Page" placement="top">
                          <Button
                            variant="contained"
                            onClick={() => handlePrev()}
                            startIcon={<KeyboardArrowLeftIcon />}
                            sx={{ bgcolor: 'rgb(41, 152, 111)' }}
                          >
                            Prev
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      zIndex: 2,
                      bottom: 10,
                      right: 10,
                    }}
                    onMouseMove={handleTappedBtn(true)}
                    onMouseLeave={handleTappedBtn(false)}
                  >
                    <Box display="flex" alignItems="center">
                      {isExistRight && (
                        <Tooltip title="Next Page" placement="top">
                          <Button
                            variant="contained"
                            endIcon={<KeyboardArrowRightIcon />}
                            onClick={() => handleNext()}
                            sx={{ bgcolor: 'rgb(41, 152, 111)' }}
                          >
                            Next
                          </Button>
                        </Tooltip>
                      )}
                      {isExistRightSection && (
                        <Tooltip title="Next Section" placement="top">
                          <IconButton onClick={onNextSection}>
                            <KeyboardDoubleArrowRightIcon
                              sx={{
                                padding: 1,
                                bgcolor: 'rgb(41, 152, 111)',
                                color: '#FFF',
                                cursor: 'pointer',
                                width: 25,
                                height: 25,
                                borderRadius: 100,
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <Box>
          {state.isEdit && (
            <Box
              sx={{ p: '0px 20px 5px 20px', mt: 2 }}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Button
                onClick={onCancel}
                loading={state.isLoading}
                disabled={state.isSuccess}
                sx={{ color: 'rgb(41, 152, 111)' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onSave}
                loading={state.isLoading}
                disabled={!isDirty || !state.isValid}
                sx={{ bgcolor: 'rgb(41, 152, 111)' }}
              >
                {state.isAutoApproveAvailable
                  ? 'Submit & Approve'
                  : 'Submit for Approval'}
              </Button>
            </Box>
          )}
          {openTags && !state.isEdit && (
            <Box
              sx={{ p: '0px 10px 5px 10px' }}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center">
                {isExistLeftSection && (
                  <Tooltip title="Previous Section" placement="top">
                    <IconButton onClick={onPrevSection}>
                      <KeyboardDoubleArrowLeftIcon
                        sx={{ color: 'rgb(41, 152, 111)' }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                {isExistLeft && (
                  <Button
                    onClick={() => handlePrev()}
                    sx={{ color: 'rgb(41, 152, 111)' }}
                  >
                    <KeyboardArrowLeftIcon />
                    Prev
                  </Button>
                )}
              </Box>
              <Box display="flex" alignItems="center">
                {isExistRight && (
                  <Button
                    onClick={() => handleNext()}
                    sx={{ color: 'rgb(41, 152, 111)' }}
                  >
                    Next
                    <KeyboardArrowRightIcon />
                  </Button>
                )}
                {isExistRightSection && (
                  <Tooltip title="Next Section" placement="top">
                    <IconButton onClick={onNextSection}>
                      <KeyboardDoubleArrowRightIcon
                        sx={{ color: 'rgb(41, 152, 111)' }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>

      <SendEmailDialog
        filePath={getKeyValue(state.details, 'Path')}
        siteName={getKeyValue(state.details, 'SiteName')}
        open={state.isSendEmail}
        onClose={() => setState((prev) => ({ ...prev, isSendEmail: false }))}
      />
    </>
  );
};

export default DmsViewPage;
