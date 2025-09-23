import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import LinearProgress from '@mui/material/LinearProgress';
import useAuth from '../hooks/useAuth';
import SplitScreenPage from './SplitScreenPage';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import useFileRevisions from '../hooks/useFileRevisions';
import { ConfirmationRevisionDialog } from './upload/confirmation-revision-dialog';
import {
  dateFormattedValue,
  getMetadataValueByKey,
  isDateInBetween,
} from '../utils/helpers';
import useRenewToken from '../hooks/useRenewToken';
import {
  createCheckSharepointFolderIfExist,
  autoApproveFolder,
  moveFileToFolder,
} from './upload/services';
import { BulkUploadDialog } from './upload/bulk-upload-dialog';
import { Add } from '@mui/icons-material';
import { useDialog } from '../context/dialog-provider';
import { FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE } from '../const/common';

const standardDateFormat = 'YYYY-MM-DD HH:mm:ss';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const termsData_ = await import(
  `../Data/terms-${process.env.REACT_APP_ENV}.json`
);
const termsData = termsData_?.default;

const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const termsMapCTData_ = await import(
  `../Data/termKeyMappingCT-${process.env.REACT_APP_ENV}.json`
);
const termsMapCTData = termsMapCTData_?.default;

const fields = [
  'Business',
  'Resort',
  'Park Stage',
  'Department',
  'Building',
  'Villa',
  'Document Type',
  'Discipline',
  'Gate',
  'Drawing Set Name',
  'Drawing Area',
  'Confidentiality',
  'Drawing Date',
  'Drawing Received Date',
];

const UploadPage = (props) => {
  const {
    uploadType,
    groupingVal,
    filterVal,
    fieldValues,
    form,
    isUploadRevisionDisabled,
    accessibleResorts = [],
    filter = {},
  } = props;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [isAuth, setIsAuth] = useState(false);
  const [open, setOpen] = useState(false);
  const [isInprogress, setInprogress] = useState(false);
  const [isInprogressVer, setInprogressVer] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isError, setIsError] = useState('');
  const [metadatas, setMetadatas] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploadedWarn, setIsUploadedWarn] = useState(false);
  const [fileVers, setFileVers] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState('');

  const revisionNumberTextInput = useRef(null);
  const [revisionNumber, setRevisionNumber] = useState(null);
  const shortDescriptionTextInput = useRef(null);
  const [shortDescription, setShortDescription] = useState(null);
  const titleTextInput = useRef(null);

  const drawingDateTextInput = useRef(null);
  const drawingReceivedDateTextInput = useRef(null);

  const [splitScreenOpen, setSplitScreenOpen] = useState(false);

  const [uploadError, setUploadError] = useState('');

  const { authInfo } = useAuth();

  const { openDialog, closeDialog } = useDialog();

  const { getAccessToken } = useRenewToken();

  const [isRevisionNumberTextWarn, setIsRevisionNumberTextWarn] =
    useState(false);
  const [fieldContext, setFieldContext] = useState([]);
  const setFieldRulesTargets = ['Department', 'Document Type'];
  const fieldRules = {
    Required: ['Business', 'Resort', 'Department', 'Document Type'],
    Optional: [
      'Gate',
      'Park Stage',
      'Confidentiality',
      'Short Description',
      'Revision Number',
      'Building',
      'Discipline',
    ],
    Residential: [
      'Business',
      'Resort',
      'Department',
      'Building~', // inverse to not required
      'Document Type',
      'Villa^', // inverse to optional
    ],
    Drawing: [
      'Business',
      'Resort',
      'Department',
      'Drawing Area',
      'Document Type',
      'Drawing Set Name',
      'Drawing Number',
      'Revision Number',
      'Drawing Date',
      'Drawing Received Date',
    ],
  };

  const [isInValidForm, setisInValidForm] = useState(true);
  const [revisionSuggestionText, setRevisionSuggestionText] = useState(null);

  const [isAutoApproveAvailable, setIsAutoApproveAvailable] = useState(false);

  const getAuthCheck = async () => {
    const authToken = window.localStorage.getItem('authToken');
    if (authToken !== null) {
      const authTokenObj = JSON.parse(authToken);
      const accessToken = await getAccessToken();
      setIsAuth({
        ...authTokenObj,
        accessToken,
      });
      setInprogress(false);
    } else {
      setIsError('Unauthorized access. Redirecting to landing page...');
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    }
  };

  useEffect(() => {
    getAuthCheck();
  }, []);

  const getValueByCell = (cellKey) => {
    return (
      fieldValues.Cells.find((cell) => cell.Key === cellKey)?.Value || null
    );
  };

  const populateFormRevision = () => {
    console.log('props.fieldValues', props.fieldValues);
    [...Object.keys(termsData['DMS Terms'])].map((key) => {
      const mapKey = [...Object.keys(termsMapData)].find((val) => val === key);
      const value = getValueByCell(termsMapData[mapKey]);
      setMetadatas((prev) => ({
        ...prev,
        [mapKey]: termsData['DMS Terms'][mapKey][value] || null,
      }));
    });

    const title = getValueByCell('Title');
    setSelectedFileName(title);
    setRevisionNumber(null);
    const drawingNumberView = getValueByCell(termsMapData['Drawing Number']);
    const shortDescriptionView = getValueByCell(
      termsMapData['Short Description'],
    );
    setShortDescription(shortDescriptionView);

    setMetadatas((prev) => ({
      ...prev,
      'Drawing Number': drawingNumberView,
      'Drawing Received Date': null,
      'Drawing Date': null,
    }));
  };

  useEffect(() => {
    if (open && fieldValues) {
      // drawing number
      const drawingNumberView = fieldValues.Cells.find(
        (cell) => cell.Key === termsMapData['Drawing Number'],
      )?.Value;

      setMetadatas((prev) => ({
        ...prev,
        'Drawing Number': drawingNumberView,
      }));

      const preselectedResort = fieldValues.Cells.find(
        (cell) => cell.Key === termsMapData['Resort'],
      )?.Value;

      if (termsData['DMS Terms']['Resort'][preselectedResort])
        handleMetadataChange('Resort', preselectedResort);
    }
  }, [open, form, fieldValues]);

  useEffect(() => {
    // pre-defined metadata
    if (open) {
      if (groupingVal !== '' && groupingVal !== '{}') {
        const parsedPreDefinedMetadata = JSON.parse(groupingVal);
        if (Object.keys(parsedPreDefinedMetadata).length > 0) {
          for (let key in parsedPreDefinedMetadata) {
            let value = parsedPreDefinedMetadata[key];

            if (key == 'Resort') {
              // remove resort if current user dont have edit access
              if (!accessibleResorts.some((obj) => obj.Sitename === value))
                continue;
            }

            setMetadatas((prev) => ({
              ...prev,
              [key]: `${termsData['DMS Terms'][key][value]}`,
            }));
          }
        }
      }

      if (filterVal !== '' && filterVal !== '{}') {
        // pre-defined metadata from filter selected only 1
        const parsedPreDefinedMetadata_ = JSON.parse(filterVal);
        const keysWithOneValue = Object.keys(parsedPreDefinedMetadata_).filter(
          (key) => parsedPreDefinedMetadata_[key].length === 1,
        );
        if (keysWithOneValue) {
          for (const key in keysWithOneValue) {
            if (groupingVal !== '' && groupingVal !== '{}') {
              const parsedPreDefinedMetadata = JSON.parse(groupingVal);
              if (keysWithOneValue[key] in parsedPreDefinedMetadata) continue;
            }

            let value = parsedPreDefinedMetadata_[keysWithOneValue[key]][0];

            if (keysWithOneValue.includes('Resort')) {
              // remove resort if current user dont have edit access
              if (
                !accessibleResorts.some(
                  (obj) => obj.Sitename === value.split('|')[0],
                )
              )
                continue;
            }
            setMetadatas((prev) => ({
              ...prev,
              [keysWithOneValue[key]]:
                `${termsData['DMS Terms'][keysWithOneValue[key]][value.split('|')[0]]}`,
            }));
          }
        }
      }

      if (fieldValues) {
        populateFormRevision();
      }
    }
  }, [open, form]);

  const handleOnDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleOnDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleOnDragOver = (e) => {
    e.preventDefault();
  };

  const fileNameSanitizeV2 = (filename) => {
    // Remove file extension
    const nameWithoutExtension = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/'/g, '');

    // Convert to camelCase (each word capitalized, space-separated)
    const words = nameWithoutExtension.split(/[-_ ]+/);
    const sanitizedName = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return sanitizedName;
  };

  const fileNameSanitizeSoft = (filename) => {
    // Convert to camelCase (each word capitalized, space-separated)
    const words = filename.split(/[-_ ]+/);
    const sanitizedName = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return sanitizedName;
  };

  const handleOnDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    setIsDragging(false);

    const file = droppedFiles[0];
    const documentType = getMetadataValueByKey(metadatas, 'Document Type');
    const error = validateFileUpload(file, documentType);

    if (error) {
      setUploadError(error);
      setFiles([]);
      setSelectedFileName('');
      return;
    }

    setUploadError('');
    setFiles([file]);
    setSelectedFileName(fileNameSanitizeV2(file?.name));
  };

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const file = uploadedFiles[0];
    const documentType = getMetadataValueByKey(metadatas, 'Document Type');
    const error = validateFileUpload(file, documentType);

    if (error) {
      setUploadError(error);
      setFiles([]);
      setSelectedFileName('');
      return;
    }

    setUploadError('');
    setFiles([file]);
    setSelectedFileName(fileNameSanitizeV2(file?.name));
  };

  const validateFileUpload = (file, documentType) => {
    const fileName = file?.name.toLowerCase() || '';
    const isPDF = file?.type === 'application/pdf';
    const isIFCorCAD = /\.(ifc|dwg|dxf|step|stp)$/.test(fileName);

    if (documentType === 'Drawing') {
      if (isIFCorCAD) {
        return 'An IFC or CAD drawing should be loaded as a "Model".';
      }
      if (!isPDF) {
        return `A drawing upload only accepts .pdf files`;
      }
    }

    return '';
  };

  useEffect(() => {
    if (files.length === 0) {
      if (!fieldValues) {
        setSelectedFileName(null);
      }
    } else {
      setSelectedFileName(fileNameSanitizeV2(files[0]?.name));
    }
    setFileVers([]);
  }, [files]);

  useEffect(() => {
    // for checking - removes value from fields that are not required
    Object.keys(metadatas).forEach((key) => {
      const isRequired = isRequiredFieldRule(key);
      if (isRequired === false) {
        setMetadatas((prevState) => {
          const newVal = { ...prevState }; // Create a copy of the state
          delete newVal[key]; // Remove the key
          return newVal; // Update the state with the new object
        });
      }
    });
  }, [fieldContext]);

  useEffect(() => {
    // form validation
    setisInValidForm(isInvalidFormField());
  }, [metadatas, selectedFileName, fieldContext, files]);

  const { updateFieldContext } = useFileRevisions({
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
    termsMapData,
    setAlertText,
  });

  useEffect(() => {
    updateFieldContext();
  }, [metadatas, selectedFileName]);

  useEffect(() => {
    if (metadatas && metadatas?.Resort) {
      const siteUrl_ = accessibleResorts.filter(
        (accessibleResort) =>
          accessibleResort?.Sitename.toUpperCase() ===
          metadatas?.Resort.split('|')[0].toUpperCase(),
      );
      const siteUrl = siteUrl_[0]?.SiteURL;
      const siteName = siteUrl_[0]?.Sitename;
      checkIfPartOfOnwersOrAdmins(siteUrl, siteName);
    }
  }, [metadatas?.Resort]);

  const isRequiredFieldRule = (key) => {
    // setFieldContext Eval
    let evalRes = false; // optional
    let requiredOverides = [];
    let optionalOverides = [];

    if (fieldRules?.Optional?.includes(key)) evalRes = 0; // optional

    if (fieldRules?.Required?.includes(key)) evalRes = true;

    for (let i = 0; i < fieldContext.length; i++) {
      if (fieldRules?.[fieldContext[i]]) {
        const inverseVal = fieldRules?.[fieldContext[i]].filter((value) =>
          value.includes('~'),
        ); // look for overides

        if (inverseVal.length > 0) {
          const inverseValPayload = inverseVal.map((item) =>
            item.replace(/~/g, ''),
          );
          requiredOverides = requiredOverides.concat(inverseValPayload);
        }

        if (fieldRules?.[fieldContext[i]].includes(key)) evalRes = true;

        // ------ //

        const inverseValOptional = fieldRules?.[fieldContext[i]].filter(
          (value) => value.includes('^'),
        ); // look for overides

        if (inverseValOptional.length > 0) {
          const inverseValPayloadOptional = inverseValOptional.map((item) =>
            item.replace('^', ''),
          );
          optionalOverides = optionalOverides.concat(inverseValPayloadOptional);
        }
      }
    }

    if (requiredOverides.includes(key)) {
      // inverse
      evalRes = 0;
      if (key.toLowerCase() === 'building') {
        evalRes = false;
      }
    }

    if (optionalOverides.includes(key)) {
      // inverse optional
      evalRes = 0;
    }

    // 0 = optional
    // false = not required
    // true = required

    return evalRes;
  };

  const isInvalidFormField = () => {
    // Check for basic validation issues
    if (!selectedFileName || files.length === 0) {
      return true;
    }

    // Validate required fields based on context
    let isFieldValidationFailed = false;

    if (fieldContext.length > 0) {
      // Check fields from context
      isFieldValidationFailed = !validateFieldsFromContext();
    } else {
      // Check required fields when no context is provided
      isFieldValidationFailed = !validateRequiredFields();
    }

    if (isFieldValidationFailed) {
      return true;
    }

    // Special validation for Drawing document type
    const documentType = getMetadataValueByKey(metadatas, 'Document Type');
    if (documentType === 'Drawing') {
      return !validateDrawingDates();
    }

    return false;

    function validateFieldsFromContext() {
      for (const context of fieldContext) {
        const rules = fieldRules?.[context];
        if (!rules) continue;

        for (const rule of rules) {
          // Skip special rule types
          if (rule.includes('~') || rule.includes('^')) {
            continue;
          }

          if (!(rule in metadatas)) {
            return false;
          }
        }
      }
      return true;
    }

    function validateRequiredFields() {
      const requiredRules = fieldRules?.Required || [];
      for (const rule of requiredRules) {
        if (!(rule in metadatas)) {
          return false;
        }
      }
      return true;
    }

    function validateDrawingDates() {
      const drawingDate = getMetadataValueByKey(metadatas, 'Drawing Date');
      const drawingReceivedDate = getMetadataValueByKey(
        metadatas,
        'Drawing Received Date',
      );

      if (!drawingDate || !drawingReceivedDate) {
        return false;
      }

      const minDate = dayjs().year('2016').month(0).date(1);
      const drawingDateValid = isDateInBetween(
        drawingDate,
        minDate,
        dayjs(drawingReceivedDate),
      );
      const drawingReceivedDateValid = isDateInBetween(
        drawingReceivedDate,
        drawingDate,
        dayjs(),
      );

      return drawingDateValid && drawingReceivedDateValid;
    }
  };

  const handleFileRemove = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    // initClear();
    if (!fieldValues) {
      setSelectedFileName(null);
    }
    setFiles([]);
    setFileVers([]);
    if (titleTextInput.current) {
      titleTextInput.current.value = '';
    }
  };

  const handleCloseClick = () => {
    initClear();
    setOpen(false);
  };

  const checkIfPartOfOnwersOrAdmins = async (siteUrl, siteName) => {
    setIsAutoApproveAvailable(false);
    setInprogressVer(true);
    axios
      .get(
        `${siteUrl}/_api/web/currentuser?$select=*,IsShareByEmailGuestUser`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            Accept: 'application/json;',
          },
        },
      )
      .then((res) => {
        if (res.data.error === true) {
          setIsError(
            res?.data?.errorMessage
              ? res?.data?.errorMessage
              : 'something went wrong',
          );
        } else {
          if (res) {
            setIsError('');
            if (res.data?.IsSiteAdmin === true) {
              setIsAutoApproveAvailable(true);
            }
          } else {
            setIsError('Search error - unable to fetch sites.');
          }
        }
        setInprogressVer(false);
      })
      .catch((e) => {
        setInprogressVer(false);
        setIsError(
          e?.response?.data?.error?.message?.value
            ? e?.response?.data?.error?.message?.value
            : 'something went wrong',
        );
        if (e.status === 401) {
          setTimeout(function () {
            localStorage.clear();
            window.location.href = '/';
          }, 1000);
        }
      });

    axios
      .get(`${siteUrl}/_api/web/currentuser/groups`, {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          Accept: 'application/json;',
        },
      })
      .then((res) => {
        if (res.data.error === true) {
          setIsError(
            res?.data?.errorMessage
              ? res?.data?.errorMessage
              : 'something went wrong',
          );
        } else {
          if (res) {
            setIsError('');
            if (res.data?.value && res.data?.value.length > 0) {
              for (let i = 0; i < res.data?.value.length; i++) {
                const groupName = res.data?.value[i]?.Title;
                if (
                  groupName.toLowerCase() === `${siteName.toLowerCase()} owners`
                ) {
                  setIsAutoApproveAvailable(true);
                }
              }
            }
          } else {
            setIsError('Search error - unable to fetch sites.');
          }
        }
        setInprogressVer(false);
      })
      .catch((e) => {
        setInprogressVer(false);
        setIsError(
          e?.response?.data?.error?.message?.value
            ? e?.response?.data?.error?.message?.value
            : 'something went wrong',
        );
        if (e.status === 401) {
          setTimeout(function () {
            localStorage.clear();
            window.location.href = '/';
          }, 1000);
        }
      });
  };

  const handleMetadataChange = (key, value) => {
    if (value) {
      setMetadatas((prev) => ({
        ...prev,
        [key]: `${termsData['DMS Terms'][key][value]}`,
      }));

      if (key == 'Resort') {
        const siteUrl_ = accessibleResorts.filter(
          (accessibleResort) =>
            accessibleResort?.Sitename.toUpperCase() ===
            termsData['DMS Terms'][key][value].split('|')[0].toUpperCase(),
        );
        const siteUrl = siteUrl_[0]?.SiteURL;
        const siteName = siteUrl_[0]?.Sitename;
        checkIfPartOfOnwersOrAdmins(siteUrl, siteName);
      }
    } else {
      setMetadatas((prevState) => {
        const newVal = { ...prevState }; // Create a copy of the state
        delete newVal[key]; // Remove the key
        return newVal; // Update the state with the new object
      });
    }
  };

  const handlemetadataTextFieldInputChange = (event, type) => {
    switch (type) {
      case 'title':
        if (
          titleTextInput?.current?.value !== null &&
          titleTextInput?.current?.value !== ''
        ) {
          setSelectedFileName(titleTextInput?.current?.value);
        } else {
          setSelectedFileName(null);
        }
        break;
      case 'revisionNumber':
        const RevisionNumberCTKey = 'Revision Number'; // key mapped prior backend post request
        if (
          revisionNumberTextInput?.current?.value !== null &&
          revisionNumberTextInput?.current?.value !== ''
        ) {
          setRevisionNumber(revisionNumberTextInput?.current?.value);
          setMetadatas((prev) => ({
            ...prev,
            [RevisionNumberCTKey]: revisionNumberTextInput?.current?.value,
          }));
          setIsRevisionNumberTextWarn(
            revisionNumberTextInput?.current?.value.length > 4,
          );
        } else {
          setRevisionNumber(null);
          setIsRevisionNumberTextWarn(false);
          setMetadatas((prevState) => {
            const newVal = { ...prevState }; // Create a copy of the state
            delete newVal[RevisionNumberCTKey]; // Remove the key
            return newVal; // Update the state with the new object
          });
        }
        break;
      case 'shortDescription':
        const ShortDescriptionCTKey = 'Short Description'; // key mapped prior backend post request
        if (
          shortDescriptionTextInput?.current?.value !== null &&
          shortDescriptionTextInput?.current?.value !== ''
        ) {
          setShortDescription(shortDescriptionTextInput?.current?.value);
          setMetadatas((prev) => ({
            ...prev,
            [ShortDescriptionCTKey]: shortDescriptionTextInput?.current?.value,
          }));
        } else {
          setShortDescription(null);
          setMetadatas((prevState) => {
            const newVal = { ...prevState }; // Create a copy of the state
            delete newVal[ShortDescriptionCTKey]; // Remove the key
            return newVal; // Update the state with the new object
          });
        }
        break;
      case 'drawingNumber':
        const DrawingNumberCTKey = 'Drawing Number'; // key mapped prior backend post request
        if (event.target.value) {
          setMetadatas((prev) => ({
            ...prev,
            [DrawingNumberCTKey]: event.target.value,
          }));
        } else {
          setMetadatas((prev) => {
            const { [DrawingNumberCTKey]: _, ...rest } = prev;
            return rest;
          });
        }
        break;
    }
  };

  const uploadFilesToSharePointClick = async (
    isForApproval = false,
    preApprove = false,
  ) => {
    setInprogress(true);
    try {
      const accessToken = await getAccessToken();
      // filter SiteURL based on Resort
      const siteUrl_ = accessibleResorts.filter(
        (accessibleResort) =>
          accessibleResort?.Sitename.toUpperCase() ===
          metadatas?.Resort.split('|')[0].toUpperCase(),
      );
      const siteUrl = siteUrl_[0]?.SiteURL;
      const libraryName = 'Documents';

      // get form digest value
      const responseGetFormdigest = await axios.post(
        `${siteUrl}/_api/contextinfo`,
        null,
        {
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const formDigestValue =
        responseGetFormdigest.data?.d?.GetContextWebInformation?.FormDigestValue.split(
          ',',
        )[0];

      let UniqueId;
      let listGuid;
      // upload revisions

      const safeFileName = fileNameSanitizeSoft(files[0]?.name).replace(
        /'/g,
        '%27',
      );
      if (fieldValues) {
        // get unique id
        const uniqueIdObj = fieldValues.Cells.find(
          (cell) => cell.Key === 'UniqueId',
        );
        UniqueId = uniqueIdObj ? uniqueIdObj.Value : null;

        // get ListItemAllFields
        const responseListItemAllFieldsPre = await axios.get(
          `${siteUrl}/_api/web/GetFileById('${UniqueId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef`,
          {
            headers: {
              'Content-Type': 'application/json;odata=verbose',
              Accept: 'application/json;odata=verbose',
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const fileDirRef = responseListItemAllFieldsPre.data?.d?.FileDirRef;
        const fileLeafRef = responseListItemAllFieldsPre.data?.d?.FileLeafRef;

        const baseSite =
          String(siteUrl).split('/')[String(siteUrl).split('/').length - 1];

        const drawingAreaValue = String(metadatas?.['Drawing Area']).split(
          '|',
        )[0];
        const isDrawingDocType =
          String(metadatas?.['Document Type']).split('|')[0].toLowerCase() ===
          'drawing';

        const rootFolderURL = `/sites/${baseSite}/Shared Documents/Drawings`;
        const folderURL = `/sites/${baseSite}/Shared Documents/Drawings/${drawingAreaValue}`;

        const isExistDrawingFolder = String(fileDirRef).includes(
          `Drawings/${drawingAreaValue}`,
        );

        if (isDrawingDocType) {
          if (!isExistDrawingFolder && drawingAreaValue) {
            await createCheckSharepointFolderIfExist(
              siteUrl,
              baseSite,
              ['Drawings', drawingAreaValue],
              accessToken,
            );
            if (isAutoApproveAvailable) {
              if (isForApproval) {
                console.log('submit for approval or pre-approve');
                await autoApproveFolder(
                  siteUrl,
                  accessToken,
                  rootFolderURL,
                  responseListItemAllFieldsPre,
                );
                await autoApproveFolder(
                  siteUrl,
                  accessToken,
                  folderURL,
                  responseListItemAllFieldsPre,
                );
              }
            }
          }

          if (isAutoApproveAvailable && isForApproval) {
            const hasWarningOrError = await moveFileToFolder(
              siteUrl,
              accessToken,
              `${fileDirRef}/${fileLeafRef}`,
              `${folderURL}/${fileLeafRef}`,
            );

            if (hasWarningOrError?.length > 0) {
              setIsUploaded(false);
              setIsUploadedWarn(false);
              setIsError(FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE);
            }
          }
        }

        const uri = responseListItemAllFieldsPre.data?.d?.__metadata.uri;
        listGuid = uri.match(/guid'([^']+)'/)[1];

        await axios.put(
          `${siteUrl}/_api/web/GetFileById('${UniqueId}')/$value`,
          files[0],
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/octet-stream',
              'X-RequestDigest': `${formDigestValue}`,
            },
          },
        );

        try {
          const responseRename = await axios.post(
            uri,
            {
              FileLeafRef: safeFileName,
              Title: selectedFileName,
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json;odata=nometadata',
                'Content-Type': 'application/json;odata=nometadata',
                'X-RequestDigest': `${formDigestValue}`,
                'IF-MATCH': '*',
                'X-HTTP-Method': 'MERGE',
              },
            },
          );
        } catch (res) {
          if (res?.response?.data && 'odata.error' in res.response.data) {
            setIsError(
              res?.response?.data?.['odata.error']?.message?.value
                ? res?.response?.data?.['odata.error']?.message?.value.includes(
                    'already exists',
                  )
                  ? `The file name ${safeFileName} of your upload already exist for this Resort - but the metadata does not match for a revision update. To upload the same file as a new drawing please change the file name or locate the original drawing and use the "Upload Revision" button to perform a revision update.`
                  : res?.response?.data?.['odata.error']?.message?.value
                : 'something went wrong',
            );
            setInprogress(false);
            return;
            // responseRename
          }
        }
      }

      try {
        const responseListItemAllFields = await axios.get(
          `${siteUrl}/_api/web/GetFileById('${UniqueId}')/ListItemAllFields?$select=*,FileDirRef,FileLeafRef,Id`,
          {
            headers: {
              'Content-Type': 'application/json;odata=verbose',
              Accept: 'application/json;odata=verbose',
              Authorization: `Bearer ${await getAccessToken()}`,
            },
          },
        );

        const FileId = responseListItemAllFields.data?.d?.Id;

        let data = { formValues: [] };
        Object.keys(metadatas).forEach((key) => {
          const isDate = ['Drawing Date', 'Drawing Received Date'].includes(
            key,
          );
          data['formValues'].push({
            __metadata: { type: 'SP.ListItemFormUpdateValue' },
            FieldName: termsMapCTData[key] || key, //Resort
            FieldValue: isDate
              ? dateFormattedValue(metadatas[key])
              : metadatas[key], //"GEMLIFE-DEV-RESORT-A|a2aa1f0b-36f5-49c6-8ac1-f766fb1c375c",
          });
        });

        // explicit file type setting
        if (files[0] && files[0]?.name) {
          const dotIndex = files[0]?.name.lastIndexOf('.');
          if (dotIndex > 0 && dotIndex < files[0]?.name.length - 1) {
            data.formValues.push({
              __metadata: { type: 'SP.ListItemFormUpdateValue' },
              FieldName: 'File_x0020_Type',
              FieldValue: files[0]?.name.split('.').pop(),
            });
          }
        }

        // 1024 reverted
        data.formValues.push({
          __metadata: { type: 'SP.ListItemFormUpdateValue' },
          FieldName: 'Title',
          FieldValue: selectedFileName, //`${metadatas?.Business.split('|')[0]} ${metadatas?.Resort.split('|')[0]} ${metadatas?.Department.split('|')[0]} ${metadatas?.Building ? metadatas?.Building.split('|')[0] : ""} ${metadatas?.['Document Type'].split('|')[0]}`,
        });

        axios
          .post(
            `${siteUrl}/_api/web/lists/GetByTitle('${libraryName}')/items(${FileId})/validateUpdateListItem`,
            data,
            {
              headers: {
                'Content-Type': 'application/json;odata=verbose',
                Accept: 'application/json;odata=verbose',
                Authorization: `Bearer ${await getAccessToken()}`,
                'X-RequestDigest': `${formDigestValue}`,
                // "IF-MATCH": "*", // For updates; use "*" to update regardless of version
                // "X-HTTP-Method": "MERGE", // Use MERGE to update fields
              },
              maxBodyLength: Infinity,
            },
          )
          .then(async (res) => {
            if (res.data.error === true) {
              setIsError(
                res?.data?.errorMessage
                  ? res?.data?.errorMessage
                  : 'something went wrong',
              );
              setInprogress(false);
            } else {
              if (res.data) {
                setIsError('');
                setIsUploaded(true);
                setInprogress(false);

                const filteredResWarn =
                  res.data?.d?.ValidateUpdateListItem?.results.filter(
                    (item) => item.ErrorCode !== 0,
                  );
                if (filteredResWarn.length > 0) {
                  setIsUploadedWarn(
                    `${filteredResWarn[0]?.FieldName} - ${filteredResWarn[0]?.ErrorMessage}`,
                  );
                }

                // const FileServerRelativeUrl = response.data?.ServerRelativeUrl;
                const PropertiesUri =
                  responseListItemAllFields.data?.d?.Properties?.__deferred
                    ?.uri;
                const autoApproveUri = PropertiesUri.split('_api')[0];

                if (isForApproval) {
                  const approvalRequest = await axios.post(
                    `${autoApproveUri}_api/web/GetFileById('${UniqueId}')/Publish('For Approval (automated)')`,
                    {},
                    {
                      headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                        Accept: 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': `${formDigestValue}`,
                      },
                    },
                  );
                }

                if (preApprove) {
                  const autoApproveData = {
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
                  };

                  let listTarget = `/GetByTitle('Documents')`;

                  if (listGuid) {
                    listTarget = `(guid'${listGuid}')`;
                  }
                  const autoApprove = await axios.post(
                    `${autoApproveUri}_api/web/lists${listTarget}/BulkValidateUpdateListItems()`,
                    autoApproveData,
                    {
                      headers: {
                        Authorization: `Bearer ${await getAccessToken()}`,
                        Accept: 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose',
                        'X-RequestDigest': `${formDigestValue}`,
                      },
                    },
                  );
                }
              } else {
                setIsError(
                  res?.data?.errorMessage
                    ? res?.data?.errorMessage
                    : 'something went wrong',
                );
                setInprogress(false);
              }
            }
          })
          .catch((e) => {
            setIsError(e.message);
            if (e.status === 401) {
              setTimeout(function () {
                localStorage.clear();
                window.location.href = '/';
              }, 1000);
            }
            setInprogress(false);
          });
      } catch (error) {
        setIsError(
          error?.response?.data?.error?.message?.value
            ? error?.response?.data?.error?.message?.value
            : 'something went wrong',
        );
        setInprogress(false);
      }
    } catch (error) {
      // setIsError(
      //   error?.response?.data?.error?.message?.value
      //     ? error?.response?.data?.error?.message?.value
      //     : 'something went wrong',
      // );
      setInprogress(false);
    }
  };

  const handleRetryRevision = () => {
    populateFormRevision();
    setFiles([]);
    setIsError('');
    setIsDragging(false);
    setIsUploaded(false);
    setIsRevisionNumberTextWarn(false);
    setIsUploadedWarn(false);
    setFileVers([]);
    setInprogressVer(false);

    if (revisionNumberTextInput.current) {
      revisionNumberTextInput.current.value = '';
    }
    if (shortDescriptionTextInput.current) {
      shortDescriptionTextInput.current.value = '';
    }
    if (titleTextInput.current) {
      titleTextInput.current.value = '';
    }
  };

  const initClear = () => {
    // if (!fieldValues) {
    setSelectedFileName(null);
    setMetadatas({});
    // }
    setInprogress(false);
    setFiles([]);
    setIsError('');
    setIsDragging(false);
    setIsUploaded(false);
    setIsRevisionNumberTextWarn(false);
    setIsUploadedWarn(false);
    setFileVers([]);
    setInprogressVer(false);
    setFieldContext([]);
    setisInValidForm(true);
    setRevisionNumber(null);
    setShortDescription(null);
    setRevisionSuggestionText(null);

    if (revisionNumberTextInput.current) {
      revisionNumberTextInput.current.value = '';
    }
    if (shortDescriptionTextInput.current) {
      shortDescriptionTextInput.current.value = '';
    }
    if (titleTextInput.current) {
      titleTextInput.current.value = '';
    }
  };

  const openModal = () => {
    if (isUploadRevisionDisabled) {
      // show popup
      openDialog({
        description:
          'To upload a new revision, please complete the approval of the previous edited changes',
        closeText: null,
        confirmText: 'OK',
        onConfirm: () => {
          closeDialog();
        },
      });
      return;
    }

    setOpen(true);
    initClear();
  };

  const uploadButton = useMemo(() => {
    if (uploadType === 'uploadSpecific') {
      return (
        <BulkUploadDialog
          icon={<Add sx={{ color: 'white' }} />}
          group={groupingVal}
        />
      );
    }
    if (uploadType === 'viewSpecific') {
      return (
        <Button
          onClick={openModal}
          variant="outlined"
          sx={{
            border: '1px solid',
            borderColor: isUploadRevisionDisabled
              ? 'rgba(0, 0 , 0, 0.26)'
              : 'rgb(41, 152, 111)',
            overflow: 'hidden',
            height: 40,
            color: isUploadRevisionDisabled
              ? 'rgba(0, 0 , 0, 0.26)'
              : 'rgb(41, 152, 111)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
              Upload a Revision
            </Typography>
            <DescriptionOutlinedIcon
              sx={{
                height: 30,
                width: 30,
                color: 'inherit',
              }}
            />
          </Box>
        </Button>
      );
    }
    return (
      <Tooltip title="Upload new file">
        <UploadFileIcon
          onClick={openModal}
          sx={{
            borderLeft: '1px solid gray',
            paddingLeft: '8px',
            cursor: 'pointer',
          }}
        />
      </Tooltip>
    );
  }, [uploadType, setOpen, isUploadRevisionDisabled]);

  const selectedValueAutoCompleteTop = (options, state, key) => {
    if (Object.keys(filter).length > 0 && filter?.[key]) {
      return [
        ...options.filter((item) =>
          filter[key].some((str) => str.includes(item)),
        ),
        ...options.filter(
          (item) => !filter[key].some((str) => str.includes(item)),
        ),
      ];
    }
    return options;
  };

  function handleSubmitAndApprove() {
    if (fileVers.length) {
      setIsAlertOpen(true);
    } else {
      uploadFilesToSharePointClick(true, true);
    }
  }

  function handleSubmitForApproval() {
    if (fileVers.length) {
      setIsAlertOpen(true);
    } else {
      uploadFilesToSharePointClick(true);
    }
  }

  return (
    <>
      {uploadButton}
      <ConfirmationRevisionDialog
        alertText={alertText}
        open={isAlertOpen}
        setOpen={setIsAlertOpen}
        onSubmit={() => {
          uploadFilesToSharePointClick(true, isAutoApproveAvailable);
        }}
      />

      <Dialog
        onClose={handleCloseClick}
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            maxWidth: { xs: '100%', sm: '80%', md: '65%', lg: '50%' },
          },
        }}
      >
        <DialogTitle
          textAlign="center"
          sx={{
            backgroundColor: 'rgb(41, 152, 111)',
            color: 'white',
            fontWeight: '800',
            fontSize: '16px',
            height: '18px',
            padding: '10px 0px 15px 0px',
          }}
        >
          File Upload
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
            }}
          >
            <CloseIcon
              onClick={handleCloseClick}
              sx={{
                color: '#fff',
                cursor: 'pointer',
              }}
            />
          </Box>
        </DialogTitle>

        {isUploaded ? (
          <Alert severity="success">
            File <strong>{selectedFileName}</strong> uploaded successfully.
            Metadata will be searchable after a few minutes.
          </Alert>
        ) : (
          <></>
        )}
        {isError && (
          <Alert severity="error">
            {isError}{' '}
            <span
              style={{
                cursor: 'pointer',
                fontWeight: '800',
                textDecoration: 'underline',
              }}
              onClick={handleRetryRevision}
            >
              retry
            </span>
          </Alert>
        )}
        {isUploadedWarn ? (
          <Alert severity="warning">{isUploadedWarn}</Alert>
        ) : (
          <></>
        )}
        {isInprogress || isInprogressVer ? (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: '9999',
              textAlign: 'center',
              color: 'white',
              fontWeight: '800',
              justifyContent: 'center',
            }}
          >
            <LinearProgress sx={{ width: '15%', margin: '0 auto' }} />
          </div>
        ) : (
          <></>
        )}

        <DialogContent sx={{ padding: '0px 0px 0px 0px', overflow: 'auto' }}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            bgcolor="#f4f6f8"
            padding={2}
          >
            {isUploaded || isError ? (
              <></>
            ) : (
              <>
                {files.length === 0 ? (
                  <Box
                    sx={{
                      mb: '15px',
                      overflow: 'hidden',
                      borderRadius: 0,
                      border: `2px dashed ${isDragging ? '#4caf50' : '#bdbdbd'}`,
                      textAlign: 'center',
                      bgcolor: isDragging ? '#e8f5e9' : '#ffffff',
                      transition: 'background-color 0.3s, border-color 0.3s',
                      width: '100%',
                      display: {
                        xs: 'block',
                        sm: 'flex',
                        md: 'flex',
                        lg: 'flex',
                      },
                      gap: 2,
                      padding: {
                        xs: '10px',
                        sm: '10px',
                        md: '20px',
                        lg: '20px',
                      },
                      justifyContent: 'center',
                      alignItems: 'center',
                      // height: '100px',
                      height: {
                        xs: '180px',
                        sm: '100px',
                        md: '100px',
                        lg: '100px',
                      },
                      boxSizing: 'border-box',
                    }}
                    onDragEnter={handleOnDragEnter}
                    onDragLeave={handleOnDragLeave}
                    onDragOver={handleOnDragOver}
                    onDrop={handleOnDrop}
                  >
                    <CloudUploadIcon sx={{ fontSize: 50, color: '#81c784' }} />
                    <Typography variant="h6" sx={{ color: '#388e3c' }}>
                      Drag and Drop a file here
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                      or
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      sx={{
                        backgroundColor: 'rgb(41, 152, 111)',
                        width: '150px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      Browse a file
                      <input
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                        accept="*"
                      />
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mb: '15px',
                      overflow: 'hidden',
                      borderRadius: 0,
                      border: `2px dashed ${isDragging ? '#4caf50' : '#bdbdbd'}`,
                      textAlign: 'center',
                      bgcolor: isDragging ? '#e8f5e9' : '#ffffff',
                      transition: 'background-color 0.3s, border-color 0.3s',
                      width: '100%',
                      display: {
                        xs: 'block',
                        sm: 'flex',
                        md: 'flex',
                        lg: 'flex',
                      },
                      gap: 2,
                      padding: {
                        xs: '10px',
                        sm: '10px',
                        md: '20px',
                        lg: '20px',
                      },
                      justifyContent: 'center',
                      alignItems: 'center',
                      // height: '100px',
                      height: {
                        xs: '180px',
                        sm: '100px',
                        md: '100px',
                        lg: '100px',
                      },
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'rgb(41, 152, 111)' }}
                      >
                        Selected File: &nbsp;
                      </Typography>
                      {files.map((file, index) => (
                        <Fragment key={index}>
                          <Typography
                            sx={{
                              flexGrow: 0,
                              color: 'rgb(41, 152, 111)',
                              display: 'flex',
                            }}
                          >
                            {file.name} &nbsp;
                          </Typography>
                          {isUploaded ? (
                            <></>
                          ) : (
                            <CloseIcon
                              sx={{ cursor: 'pointer', color: 'gray' }}
                              onClick={() => handleFileRemove(index)}
                            />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </Box>
                )}
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{
                    float: 'right',
                    width: '100%',
                    margin: '-10px -10px -10px 0px',
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                  }}
                >
                  Please fill out document tags:{' '}
                </Typography>
              </>
            )}

            <Grid container spacing={2} sx={{ margin: '10px 20px 10px 0px' }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  inputProps={{
                    maxLength: 255, // Set the max character limit
                  }}
                  autoComplete="off"
                  inputRef={titleTextInput}
                  onChange={
                    (e) => handlemetadataTextFieldInputChange(e, 'title') // requires inline function
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={selectedFileName || ''}
                  label="Title *"
                  variant="outlined"
                  fullWidth
                  disabled={isInprogress || isUploaded || isError !== ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="off"
                  inputProps={{
                    maxLength: 255, // Set the max character limit
                  }}
                  size="small"
                  inputRef={shortDescriptionTextInput}
                  onChange={
                    (e) =>
                      handlemetadataTextFieldInputChange(e, 'shortDescription') // requires inline function
                  }
                  InputLabelProps={{ shrink: true }}
                  value={shortDescription || ''}
                  label="Short description <Optional>"
                  variant="outlined"
                  fullWidth
                  disabled={isInprogress || isUploaded || isError !== ''}
                  multiline
                  row={3}
                />
              </Grid>
              {fields.map((key) => {
                return key in termsData['DMS Terms'] ? (
                  <React.Fragment key={key}>
                    <Grid item xs={12} sm={4}>
                      <Autocomplete
                        size="small"
                        autoHighlight
                        autoSelect
                        disabled={
                          isInprogress ||
                          isUploaded ||
                          isError ||
                          (isRequiredFieldRule(key) === true
                            ? false
                            : isRequiredFieldRule(key) === 0
                              ? false
                              : true &&
                                !isInprogress &&
                                !isUploaded &&
                                !isError) ||
                          (key === 'Drawing Set Name' &&
                            !fieldContext.includes('Drawing'))
                        }
                        options={
                          key === 'Resort' && accessibleResorts.length > 0
                            ? Object.keys(termsData['DMS Terms'][key]).filter(
                                (option) =>
                                  accessibleResorts.some((y) =>
                                    option.includes(y?.Sitename),
                                  ),
                              )
                            : Object.keys(termsData['DMS Terms'][key]).filter(
                                (k) => k.toLowerCase() !== 'to be tagged',
                              )
                        }
                        value={
                          isRequiredFieldRule(key) !== false
                            ? metadatas[key]
                              ? metadatas[key].split('|')[0]
                              : ''
                            : ''
                        }
                        filterOptions={(options, state) =>
                          selectedValueAutoCompleteTop(options, state, key)
                        }
                        onChange={(e, newValue) =>
                          handleMetadataChange(key, newValue)
                        } // requires inline function
                        clearIcon={null} // Conditionally render the clear icon
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`${key.charAt(0).toUpperCase() + key.slice(1)}
                                    ${
                                      isRequiredFieldRule(key) === true
                                        ? '*'
                                        : isRequiredFieldRule(key) === 0
                                          ? key === 'Drawing Set Name' &&
                                            !fieldContext.includes('Drawing')
                                            ? '<not applicable>'
                                            : '<optional>'
                                          : '<not applicable>'
                                    }`}
                            // (key === 'Drawing Set Name' && !fieldContext.includes('Drawing'))
                            variant="outlined"
                            fullWidth
                            disabled={
                              isInprogress ||
                              isUploaded ||
                              isError ||
                              (isRequiredFieldRule(key) === true
                                ? false
                                : isRequiredFieldRule(key) === 0
                                  ? false
                                  : true &&
                                    !isInprogress &&
                                    !isUploaded &&
                                    !isError) ||
                              (key === 'Drawing Set Name' &&
                                !fieldContext.includes('Drawing'))
                            }
                          />
                        )}
                      />
                      {key === 'Document Type' && uploadError && (
                        <FormHelperText
                          sx={{
                            color: 'red',
                            fontStyle: 'italic',
                            fontSize: 10,
                          }}
                        >
                          {uploadError}
                        </FormHelperText>
                      )}
                    </Grid>
                    {key === 'Drawing Set Name' ? (
                      <>
                        <Grid key={key} item xs={12} sm={4}>
                          <TextField
                            disabled={
                              isInprogress ||
                              isUploaded ||
                              isError ||
                              !fieldContext.includes('Drawing')
                            }
                            autoComplete="off"
                            inputProps={{
                              maxLength: 255, // Set the max character limit
                            }}
                            size="small"
                            onChange={
                              (e) =>
                                handlemetadataTextFieldInputChange(
                                  e,
                                  'drawingNumber',
                                ) // requires inline function
                            }
                            value={metadatas?.['Drawing Number'] || ''}
                            label={`Drawing number ${!fieldContext.includes('Drawing') ? '<not applicable>' : '*'}`}
                            variant="outlined"
                            fullWidth
                            multiline
                            row={3}
                          />
                        </Grid>
                        <Grid key={key} item xs={12} sm={4}>
                          <TextField
                            InputProps={{
                              endAdornment:
                                fileVers.length > 0 ? (
                                  <InputAdornment position="end">
                                    <Tooltip
                                      placement="right"
                                      title={
                                        <>
                                          <div
                                            style={{ whiteSpace: 'pre-line' }}
                                          >
                                            <strong>
                                              Matching Files and it's versions
                                            </strong>
                                          </div>
                                          <div>&nbsp;</div>
                                          {fileVers.map(function (
                                            {
                                              version,
                                              revision,
                                              DrawingNumber,
                                              fileName,
                                            },
                                            i,
                                          ) {
                                            return (
                                              <React.Fragment key={i}>
                                                <div
                                                  style={{
                                                    whiteSpace: 'pre-line',
                                                  }}
                                                >
                                                  &nbsp;&nbsp;
                                                  <strong>
                                                    Revision:{' '}
                                                  </strong>{' '}
                                                  {DrawingNumber} - {fileName} –{' '}
                                                  {version} – {revision}
                                                </div>
                                              </React.Fragment>
                                            );
                                          })}
                                        </>
                                      }
                                    >
                                      {fieldContext.includes('Drawing') ? (
                                        <span
                                          style={{
                                            cursor: 'pointer',
                                            margin: '2px -5px 0px -5px',
                                            backgroundColor:
                                              'rgb(41, 152, 111)',
                                            color: 'white',
                                            padding: '0px 5px 0px 5px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            borderRadius: '5px',
                                          }}
                                        >
                                          previous revision
                                        </span>
                                      ) : (
                                        <></>
                                      )}
                                    </Tooltip>
                                  </InputAdornment>
                                ) : (
                                  <></>
                                ),
                            }}
                            autoComplete="off"
                            size="small"
                            inputRef={revisionNumberTextInput}
                            onChange={(e) =>
                              handlemetadataTextFieldInputChange(
                                e,
                                'revisionNumber',
                              )
                            } // requires inline function
                            // InputLabelProps={{
                            //   shrink: fieldContext.includes('Drawing'),
                            // }}
                            label={`Revision number ${fieldContext.includes('Drawing') ? '*' : '<optional>'}`}
                            disabled={Boolean(
                              isInprogress || isUploaded || isError,
                            )}
                            variant="outlined"
                            fullWidth
                            value={revisionNumber || ''}
                          />
                          {revisionSuggestionText ? (
                            <FormHelperText
                              sx={{ color: 'blue', fontStyle: 'italic' }}
                            >
                              {revisionSuggestionText}
                            </FormHelperText>
                          ) : (
                            <></>
                          )}
                          {isRevisionNumberTextWarn && (
                            <FormHelperText sx={{ color: 'orange' }}>
                              Version is too long!
                            </FormHelperText>
                          )}
                        </Grid>
                      </>
                    ) : (
                      <React.Fragment key={key}></React.Fragment>
                    )}
                  </React.Fragment>
                ) : (
                  <></>
                );
              })}
              <Grid item xs={12} sm={4}>
                <TextField
                  disabled={true}
                  autoComplete="off"
                  size="small"
                  value={authInfo?.account?.name}
                  label={'Author'}
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  ref={drawingDateTextInput}
                  format="DD - MMM - YYYY"
                  minDate={dayjs()
                    .set('year', 2016)
                    .set('month', 0)
                    .set('date', 1)}
                  maxDate={
                    metadatas?.['Drawing Received Date'] !== null
                      ? dayjs(metadatas?.['Drawing Received Date'])
                      : dayjs()
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: () => delete metadatas?.['Drawing Date'],
                    },
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                  localeText={{
                    fieldMonthPlaceholder: (params) =>
                      params.contentType === 'digit' ? 'MM' : params.format,
                  }}
                  value={metadatas?.['Drawing Date']}
                  onChange={(e) => {
                    setMetadatas((prev) => ({
                      ...prev,
                      ['Drawing Date']: e,
                    }));
                  }}
                  label={`Drawing Date ${
                    isRequiredFieldRule('Drawing Date') === true
                      ? '*'
                      : isRequiredFieldRule('Drawing Date') === 0
                        ? !fieldContext.includes('Drawing')
                          ? '<not applicable>'
                          : '<optional>'
                        : '<not applicable>'
                  }`}
                  size="small"
                  disabled={
                    isInprogress ||
                    isUploaded ||
                    isError ||
                    (isRequiredFieldRule('Drawing Date') === true
                      ? false
                      : isRequiredFieldRule('Drawing Date') === 0
                        ? false
                        : true && !isInprogress && !isUploaded && !isError) ||
                    !fieldContext.includes('Drawing')
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  ref={drawingReceivedDateTextInput}
                  format="DD - MMM - YYYY"
                  minDate={
                    metadatas?.['Drawing Date'] ??
                    dayjs().set('year', 2016).set('month', 0).set('date', 1)
                  }
                  maxDate={dayjs()}
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: () =>
                        delete metadatas?.['Drawing Received Date'],
                    },
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                  localeText={{
                    fieldMonthPlaceholder: (params) =>
                      params.contentType === 'digit' ? 'MM' : params.format,
                  }}
                  value={metadatas?.['Drawing Received Date']}
                  onChange={(e) => {
                    setMetadatas((prev) => ({
                      ...prev,
                      ['Drawing Received Date']: e,
                    }));
                  }}
                  label={`Drawing Received Date ${
                    isRequiredFieldRule('Drawing Received Date') === true
                      ? '*'
                      : isRequiredFieldRule('Drawing Received Date') === 0
                        ? !fieldContext.includes('Drawing')
                          ? '<not applicable>'
                          : '<optional>'
                        : '<not applicable>'
                  }`}
                  size="small"
                  disabled={
                    isInprogress ||
                    isUploaded ||
                    isError ||
                    (isRequiredFieldRule('Drawing Received Date') === true
                      ? false
                      : isRequiredFieldRule('Drawing Received Date') === 0
                        ? false
                        : true && !isInprogress && !isUploaded && !isError) ||
                    !fieldContext.includes('Drawing')
                  }
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box
              display={{
                xs: 'block',
                sm: 'flex',
                md: 'flex',
                lg: 'flex',
              }}
              justifyContent="space-between"
              sx={{ width: '100%', margin: '0px 0px 0px 0px' }}
            >
              <Button
                sx={{ color: 'red' }}
                onClick={handleCloseClick}
                fullWidth={isSmallScreen}
              >
                {isUploaded ? 'Close' : 'Cancel'}
              </Button>
              {isUploaded || isError ? (
                <></>
              ) : (
                <Box
                  display={{
                    xs: 'block',
                    sm: 'flex',
                    md: 'flex',
                    lg: 'flex',
                  }}
                  alignItems="center"
                >
                  <Button
                    disabled={isInValidForm}
                    onClick={() => {
                      uploadFilesToSharePointClick(false);
                    }}
                    fullWidth={isSmallScreen}
                  >
                    Save as Draft
                  </Button>
                  {isAutoApproveAvailable ? (
                    <Button
                      disabled={isInValidForm}
                      onClick={() => {
                        handleSubmitAndApprove();
                      }}
                      fullWidth={isSmallScreen}
                      sx={{ fontWeight: '800' }}
                    >
                      Submit & Approve
                    </Button>
                  ) : (
                    <Button
                      disabled={isInValidForm}
                      onClick={() => {
                        handleSubmitForApproval();
                      }}
                      fullWidth={isSmallScreen}
                      sx={{ fontWeight: '800' }}
                    >
                      Submit for Approval
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <SplitScreenPage
        open={splitScreenOpen}
        onClose={() => setSplitScreenOpen(false)}
        onBack={() => {
          setSplitScreenOpen(false);
          setOpen(true);
        }}
      />
    </>
  );
};

export default UploadPage;
