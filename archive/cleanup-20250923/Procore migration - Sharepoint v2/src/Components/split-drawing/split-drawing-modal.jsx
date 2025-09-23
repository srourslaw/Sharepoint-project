import {
  Autocomplete,
  Box,
  Button,
  Grid2,
  keyframes,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useLocalStorage } from '@uidotdev/usehooks';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {
  ALERT_SEVERITY,
  COMMON_FIELDS_KEY,
  DRAWING_DATE_MIN_DATE,
  LOCAL_STORAGE_KEYS,
  SPECIFIC_FIELDS_KEY,
  TERMS_KEY,
  TERMS_KEY_MAPPING_CT,
  UPLOAD_MODE,
} from '../../const/common';
import useAuth from '../../hooks/useAuth';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { sanitizeFileName } from '../../utils/helpers';
import { useBulkUploadStore } from '../upload/bulk-upload-store';
import { ConfirmationRevisionDialog } from '../upload/confirmation-revision-dialog';
import {
  Cached,
  Cancel,
  Checklist,
  PendingActions,
  Upload,
} from '@mui/icons-material';
import { useSplitDrawing } from '../../hooks/useSplitDrawing';
import { useSnackbar } from '../../context/snackbar-provider';
import {
  pageEntrySchema,
  uploadSplitDrawingSchema,
} from '../../schemas/split-drawing.schema';
import { RevisionNumberField } from '../upload/revision-number-field';
import { useShallow } from 'zustand/react/shallow';
import { useUploadMutation } from '../upload/useUploadMutation';
import { useDialog } from '../../context/dialog-provider';
import { useParams } from 'react-router-dom';

// Import terms data dynamically
const termsData = await import(
  `../../Data/terms-${process.env.REACT_APP_ENV}.json`
).then((module) => module.default);

// Constants
const EXCLUDED_TERMS_KEY = 'to be tagged';

// Field definitions for better organization
const RESIDENTIAL_FIELDS = {
  RESIDENTIAL: [TERMS_KEY_MAPPING_CT.VILLA],
  NON_RESIDENTIAL: [TERMS_KEY_MAPPING_CT.BUILDING],
};

const DRAWING_FIELDS = [
  TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
  TERMS_KEY_MAPPING_CT.DRAWING_NUMBER,
  TERMS_KEY_MAPPING_CT.DRAWING_AREA,
  TERMS_KEY_MAPPING_CT.DRAWING_DATE,
  TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
];

// Helper Functions
const getModifiedLabel = (label, { required, disabled }) => {
  if (disabled) return `${label} <Not Applicable>`;
  if (!required) return `${label} <Optional>`;
  if (required) return `${label} *`;
  return label;
};

// Custom Hooks
const useResetFields = ({ setValue }) => {
  return useCallback(
    (fields, resetOptions = {}) => {
      fields.forEach((field) => {
        setValue(`${field}`, null, {
          shouldValidate: true,
          ...resetOptions,
        });
      });
    },
    [setValue],
  );
};

// Form Components
const FormAutocomplete = memo(function FormAutocomplete({
  name,
  label,
  options,
  required = false,
  size = { xs: 12, sm: 4 },
  disabled = false,
  modifyLabel = true,
}) {
  const modifiedLabel = getModifiedLabel(label, { required, disabled });

  return (
    <Controller
      name={name}
      render={({ field, fieldState: { error } }) => {
        const selectedOption = field.value
          ? options.find((option) => option.value === field.value) || null
          : null;

        return (
          <Grid2 size={size}>
            <Autocomplete
              autoHighlight
              autoComplete
              openOnFocus
              disableClearable={required}
              fullWidth
              disabled={disabled}
              size="small"
              value={selectedOption}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={modifyLabel ? modifiedLabel : label}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option?.value === value?.value
              }
              options={options}
              onChange={(_, value) => {
                field.onChange(value?.value ?? null);
              }}
              onBlur={field.onBlur}
              id={field.name}
            />
          </Grid2>
        );
      }}
    />
  );
});

export const FormTextField = memo(function FormTextField({
  name,
  label,
  required = false,
  size = { xs: 12, sm: 6 },
  disabled = false,
  endAdornment,
  children,
  modifyLabel,
}) {
  const modifiedLabel = getModifiedLabel(label, { required, disabled });

  return (
    <Controller
      name={name}
      render={({ field: { value, ...field }, fieldState: { error } }) => (
        <Grid2 size={size}>
          <TextField
            error={!!error}
            helperText={error?.message}
            fullWidth
            autoComplete="off"
            disabled={disabled}
            label={modifyLabel ? modifiedLabel : label}
            size="small"
            value={value ?? ''}
            slotProps={{
              input: {
                endAdornment,
              },
            }}
            {...field}
          />
          {children}
        </Grid2>
      )}
    />
  );
});

const FormDateField = memo(function FormDateField({
  name,
  label,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  size = { xs: 12, sm: 4 },
}) {
  const modifiedLabel = getModifiedLabel(label, { required, disabled });

  return (
    <Grid2 size={size}>
      <Controller
        name={name}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            format="DD - MMM - YYYY"
            disabled={disabled}
            label={modifiedLabel}
            minDate={minDate}
            maxDate={maxDate}
            localeText={{
              fieldMonthPlaceholder: (params) =>
                params.contentType === 'digit' ? 'MM' : params.format,
            }}
            slotProps={{
              field: {
                clearable: true,
              },
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
            onChange={(value) => {
              field.onChange(value);
            }}
            value={field.value}
          />
        )}
      />
    </Grid2>
  );
});

// Specialized Form Components
const ResortAutocomplete = memo(function ResortAutocomplete({ getOptions }) {
  const [accessibleResorts] = useLocalStorage(
    LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS_WITH_EDIT,
    [],
  );

  const resortOptions = useMemo(() => {
    const options = getOptions(TERMS_KEY.RESORT);
    return options.filter(({ label }) =>
      accessibleResorts.some(({ Sitename }) => Sitename === label),
    );
  }, [accessibleResorts, getOptions]);

  return (
    <FormAutocomplete
      required
      name={TERMS_KEY_MAPPING_CT.RESORT}
      label="Resort"
      options={resortOptions}
    />
  );
});

const AuthorField = memo(function AuthorField() {
  const { authInfo } = useAuth();
  const authorName = authInfo?.account?.name ?? '';

  return (
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField
        fullWidth
        disabled
        size="small"
        value={authorName}
        label="Author"
      />
    </Grid2>
  );
});

const UploadButton = ({
  pageKey,
  pageStatus,
  docDetails,
  mode,
  isLoading,
  setLoadingKey,
  handleSave,
  confirmationDialogText,
}) => {
  const { getValues, trigger } = useFormContext();
  const theme = useTheme();
  const { fileVersions } = useBulkUploadStore(
    useShallow((state) => ({
      fileVersions: state.fileVersions,
    })),
  );
  const { openDialog } = useDialog();
  const { mutateAsync } = useUploadMutation();
  const { updatePageStatus, docName, deleteUploadedFile, handleCloseSplit } =
    useSplitDrawing();
  const { showSnackbar } = useSnackbar();

  const canUpload = pageStatus === 'READY' && !!docDetails[pageKey];

  const isProcessed = pageStatus === 'PROCESSED';

  const uniqueFields = useWatch({ name: `pages.${pageKey}` });

  const commonFields = useWatch({ name: COMMON_FIELDS_KEY });

  const memoizedCommonFields = useMemo(() => {
    return COMMON_FIELDS_KEY.reduce((acc, key, index) => {
      acc[key] = commonFields[index];
      return acc;
    }, {});
  }, [commonFields]);

  const requiredFields = useMemo(
    () => [
      `pages.${pageKey}.Title`,
      `pages.${pageKey}.${TERMS_KEY_MAPPING_CT.DRAWING_NUMBER}`,
      `pages.${pageKey}.${TERMS_KEY_MAPPING_CT.REVISION_NUMBER}`,
      `pages.${pageKey}.${TERMS_KEY_MAPPING_CT.DRAWING_DATE}`,
      `pages.${pageKey}.${TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE}`,
      TERMS_KEY_MAPPING_CT.BUSINESS,
      TERMS_KEY_MAPPING_CT.DEPARTMENT,
      TERMS_KEY_MAPPING_CT.RESORT,
      TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE,
      TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
      TERMS_KEY_MAPPING_CT.DRAWING_AREA,
    ],
    [pageKey],
  );

  const isVisuallyValid = useMemo(() => {
    const values = getValues();
    return requiredFields.every((field) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], values);
      return value !== undefined && value !== null && value !== '';
    });
  }, [uniqueFields, commonFields, getValues, requiredFields]);

  const processUpload = async (data) => {
    const handleSuccess = async () => setLoadingKey(null);
    const handleError = () => setLoadingKey(null);

    const { UniqueId } = await mutateAsync(
      { data, mode },
      { onSuccess: handleSuccess, onError: handleError },
    );
    await updatePageStatus(
      docName,
      pageKey.split('_')[1],
      'PROCESSED',
      UniqueId,
    );
    await handleSave(false, false);
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    setLoadingKey(pageKey);

    const isValid = await trigger(requiredFields);
    if (!isValid) {
      setLoadingKey(null);
      return;
    }

    const file = new File(
      [docDetails[pageKey].file],
      `${uniqueFields.Title}.pdf`,
      {
        type: 'application/pdf',
      },
    );

    const data = {
      ...memoizedCommonFields,
      ...uniqueFields,
      file,
    };
    delete data.pages;

    if (fileVersions) {
      openDialog({
        title: 'Please confirm version overwrite',
        description: confirmationDialogText,
        onConfirm: async () => {
          await processUpload(data);
        },
        onClose: () => {
          setLoadingKey(null);
        },
      });
    } else {
      await processUpload(data);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleClick}
      disabled={!canUpload || isProcessed}
      loading={isLoading}
      sx={{
        width: '100px',
        marginTop: '2px',
        bgcolor:
          !canUpload || !isVisuallyValid || isProcessed
            ? theme.palette.action.disabledBackground
            : 'rgb(41, 152, 111)',
        color:
          !canUpload || !isVisuallyValid || isProcessed
            ? theme.palette.action.disabled
            : 'white',
        '&:hover': {
          bgcolor:
            !canUpload || !isVisuallyValid || isProcessed
              ? theme.palette.action.disabledBackground
              : 'rgb(30, 130, 95)',
        },
      }}
    >
      {isProcessed ? 'Uploaded' : 'Upload'}
    </Button>
  );
};

// Main Component
export const SplitDrawingModal = memo(function SplitDrawingModal() {
  const [loadingKey, setLoadingKey] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const formValues = useBulkUploadStore((state) => state.formValues);
  // const setFormValues = useBulkUploadStore((state) => state.setFormValues);
  const selectedFile = useBulkUploadStore((state) => state.selectedFile);
  const resetStore = useBulkUploadStore((state) => state.resetStore);

  const { showSnackbar } = useSnackbar();
  const {
    startPdfSplit,
    docName,
    pollingGetPdfSplitStatus,
    status,
    isLoading,
    uploadPDFFile,
    docDetails,
    setDocName,
    getUploadedFileNames,
    savePageMetadata,
    getSavedMetadataFields,
    savedMetadataFields,
    handleCloseSplit,
    updatePageStatus,
    deleteUploadedFile,
  } = useSplitDrawing();

  const params = useParams();

  const form = useForm({
    resolver: zodResolver(uploadSplitDrawingSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    values: formValues,
  });

  const {
    setValue,
    reset,
    control,
    getValues,
    watch,
    formState: { errors, isValid },
  } = form;

  // useEffect(() => {
  //   const subscription = watch((values) => {
  //     setFormValues(values);
  //   });
  //   return () => subscription.unsubscribe();
  // }, [watch, setFormValues]);

  // State management
  const [confirmationDialogState, setConfirmationDialogState] = useState({
    open: false,
  });

  // Store access
  const fileVersions = useBulkUploadStore((state) => state.fileVersions);
  const [confirmationDialogText, setConfirmationDialogText] = useState(null);

  // Custom hooks
  const resetFields = useResetFields({ setValue });

  // Watch form values
  const [department, documentType] = useWatch({
    control,
    name: [TERMS_KEY_MAPPING_CT.DEPARTMENT, TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE],
  });

  // Computed values
  const isResidential = useMemo(() => {
    return department ? department.includes('Residential') : false;
  }, [department]);

  const isDrawing = useMemo(() => {
    return documentType ? documentType.includes('Drawing') : false;
  }, [documentType]);

  // Options generator
  const getOptions = useCallback((termsKey) => {
    const terms = termsData['DMS Terms'][termsKey];
    if (!terms) return [];

    return Object.entries(terms)
      .map(([key, value]) => ({
        label: key.toString(),
        value,
      }))
      .filter(({ label }) => label.toLowerCase() !== EXCLUDED_TERMS_KEY);
  }, []);

  const [drawingDate, drawingReceivedDate] = useWatch({
    control,
    name: [
      TERMS_KEY_MAPPING_CT.DRAWING_DATE,
      TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
    ],
  });

  const today = dayjs();

  // Effect to update title when file changes
  useEffect(() => {
    if (selectedFile) {
      setValue('file', selectedFile.file, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('Title', sanitizeFileName(selectedFile.file), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      reset();
    }
  }, [selectedFile, setValue, reset]);

  // Effect for residential/non-residential field toggling
  useEffect(() => {
    if (isResidential) {
      resetFields(RESIDENTIAL_FIELDS.NON_RESIDENTIAL);
    } else {
      resetFields(RESIDENTIAL_FIELDS.RESIDENTIAL);
    }
  }, [isResidential, resetFields]);

  const initiatePdfSplit = async (docName) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await startPdfSplit(docName);
    } catch (error) {
      console.error('Error starting PDF split:', error);
    } finally {
      await pollingGetPdfSplitStatus(docName);
    }
  };

  const continuePdfSplit = async (docName) => {
    try {
      const uploadedFileNames = await getUploadedFileNames();
      const docFound = uploadedFileNames.find((item) => item === docName);
      if (!docFound)
        throw new Error(
          'The document does not exist. Please upload a new document.',
        );
      await getSavedMetadataFields(docName);
      await pollingGetPdfSplitStatus(docName);
    } catch (error) {
      console.error('Error starting PDF split:', error);
      showSnackbar({
        message: error?.response?.data?.detail || error?.message,
        severity: ALERT_SEVERITY.ERROR,
      });
    }
  };

  const initiateUpload = async (selectedFile) => {
    try {
      await uploadPDFFile(selectedFile);
    } catch (error) {
      if (
        error?.response?.data?.detail ===
        'Doc already exists. Consider continuting with that version or completing first before trying the same doc again.'
      ) {
        error.response.data.detail =
          'The original file already exists, and this is a continuation of the previous upload. If you want to upload another file with the same name, you should update the file name and retry.';
        const uploadedFileNames = await getUploadedFileNames();
        const docName = selectedFile.file.name.split('.pdf')[0];
        await getSavedMetadataFields(docName);
        setDocName(uploadedFileNames.find((item) => item === docName));
        showSnackbar({
          message: error?.response?.data?.detail,
          severity: ALERT_SEVERITY.INFO,
        });
      } else {
        showSnackbar({
          message: error?.response?.data?.detail || 'Error uploading file',
          severity: ALERT_SEVERITY.ERROR,
        });
      }
    }
  };

  useEffect(() => {
    if (docName) {
      if (
        params?.docName &&
        window.location.pathname.includes('/split-drawing')
      ) {
        continuePdfSplit(docName);
      } else {
        initiatePdfSplit(docName);
      }
    }
  }, [docName]);

  useEffect(() => {
    if (
      params?.docName &&
      window.location.pathname.includes('/split-drawing')
    ) {
      setTimeout(() => {
        setValue('Title', params?.docName);
        setValue(
          TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE,
          termsData['DMS Terms']['Document Type']['Drawing'],
        );
      }, 0);
    }
  }, [params?.docName]);

  useEffect(() => {
    if (selectedFile) {
      initiateUpload(selectedFile);
    }
  }, [selectedFile]);

  const pageEntries =
    status?.pages && Object.keys(status.pages).length > 0
      ? Object.entries(status.pages)
      : [];

  const pageStatusCount = () => {
    const statusCount = {
      processing: 0,
      ready: 0,
      pending: 0,
      uploaded: 0,
      ignore: 0,
    };

    pageEntries.forEach(([_, page]) => {
      if (page.status === 'NEW') {
        statusCount.pending += 1;
      } else if (page.status === 'PROCESSED') {
        statusCount.uploaded += 1;
      } else if (page.status === 'IGNORE') {
        statusCount.ignore += 1;
      } else if (
        page.status === 'SPLIT' ||
        page.status === 'IN OCR' ||
        !docDetails[`page_${page.page}`]
      ) {
        statusCount.processing += 1;
      } else if (page.status === 'READY' && docDetails[`page_${page.page}`]) {
        statusCount.ready += 1;
      }
    });

    return statusCount;
  };

  const reverseSpin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  `;

  const [openKey, setOpenKey] = useState(null);
  const boxRefs = useRef({});
  const isTogglingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isTogglingRef.current) {
        isTogglingRef.current = false;
        return;
      }

      const isOutsideAll = Object.entries(boxRefs.current).every(
        ([key, ref]) => {
          if (key === openKey && ref) {
            return !ref.contains(event.target);
          }
          return true;
        },
      );

      if (isOutsideAll) {
        setOpenKey(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openKey]);

  const handleOpenBox = async (e, key, page) => {
    if (
      (page.status === 'READY' || page.status === 'IGNORE') &&
      docDetails[key]
    ) {
      e.stopPropagation();
      isTogglingRef.current = true;
      setOpenKey(key);
    }
  };

  const getSuggestions = (data, key) => {
    return data?.[key]?.[0]?.values?.map((v) => v.text) || [];
  };

  const getWidth = (fraction) => `${(fraction / 13) * 100}%`;

  const handleSave = async (showNotification = true, showLoading = true) => {
    try {
      if (showLoading) setLoadingSave(true);
      const values = getValues();

      const commonFields = COMMON_FIELDS_KEY.reduce((acc, key) => {
        const value = values[key];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const pageEntries = values.pages
        ? Object.entries(values.pages)
            .map(([key, pageData]) => {
              const pageNumberMatch = key.match(/page_(\d+)/);
              const pageNumber = pageNumberMatch
                ? parseInt(pageNumberMatch[1], 10)
                : null;

              if (pageNumber == null) return null;

              const filteredFieldData = Object.entries(pageData).reduce(
                (acc, [fieldKey, fieldValue]) => {
                  if (
                    fieldValue !== undefined &&
                    fieldValue !== null &&
                    fieldValue !== ''
                  ) {
                    acc[fieldKey] = fieldValue;
                  }
                  return acc;
                },
                {},
              );

              return {
                page: pageNumber,
                field_data: filteredFieldData,
              };
            })
            .filter(Boolean)
        : [];

      await savePageMetadata(docName, {
        field_data: commonFields,
        pages: pageEntries,
      });
      if (showLoading) setLoadingSave(false);
      if (showNotification) {
        showSnackbar({
          message: 'Progress saved successfully',
          severity: ALERT_SEVERITY.SUCCESS,
        });
      }
    } catch (error) {
      if (showNotification) {
        showSnackbar({
          message: error?.response?.data?.detail || 'Error saving progress',
          severity: ALERT_SEVERITY.ERROR,
        });
      }
    }
  };

  useEffect(() => {
    if (savedMetadataFields) {
      if (savedMetadataFields.field_data) {
        COMMON_FIELDS_KEY.forEach((key) => {
          const label = key.replaceAll('_', ' ');
          const value = savedMetadataFields.field_data[label];
          if (value) {
            switch (label) {
              case 'Drawing Date':
              case 'Drawing Received Date':
                setValue(key, dayjs(value));
                break;
              default:
                setValue(key, value);
            }
          }
        });
      }

      if (savedMetadataFields.pages) {
        Object.entries(savedMetadataFields.pages).forEach(
          ([pageKey, pageData]) => {
            const fieldData = pageData.field_data;
            if (!fieldData) return;

            SPECIFIC_FIELDS_KEY.forEach((key) => {
              const label = key.replaceAll('_', ' ');
              const value = fieldData[label];

              if (!value) return;

              switch (label) {
                case 'Drawing Date':
                case 'Drawing Received Date':
                  setValue(`pages.${pageKey}.${key}`, dayjs(value));
                  break;
                default:
                  setValue(`pages.${pageKey}.${key}`, value);
              }
            });
          },
        );
      }
    }
  }, [savedMetadataFields, setValue]);

  const handleSaveAndContinueLater = async () => {
    await handleSave();
    handleCloseSplit();
  };

  const isSkipDisabledForPage = (pageFields) => {
    return (
      !!pageFields?.Title ||
      !!pageFields?.[TERMS_KEY_MAPPING_CT.DRAWING_NUMBER] ||
      !!pageFields?.[TERMS_KEY_MAPPING_CT.REVISION_NUMBER] ||
      !!pageFields?.[TERMS_KEY_MAPPING_CT.DRAWING_DATE]
    );
  };

  const handleSkipPage = async (pageKey) => {
    setOpenKey(null);
    try {
      await updatePageStatus(docName, pageKey.split('_')[1], 'IGNORE');
    } catch (error) {
      showSnackbar({
        message: error?.response?.data?.detail || 'Error skipping page',
        severity: ALERT_SEVERITY.ERROR,
      });
    }
  };

  const handleReEnterPage = async (pageKey) => {
    setOpenKey(null);
    await updatePageStatus(docName, pageKey.split('_')[1], 'READY');
  };

  const { openDialog } = useDialog();

  const handleDeleteDocument = async () => {
    openDialog({
      title: 'Are you sure you want to delete this document?',
      description: 'This action cannot be undone.',
      onConfirm: async () => {
        await deleteUploadedFile(docName);
        showSnackbar({
          message: 'Document deleted successfully',
          severity: ALERT_SEVERITY.SUCCESS,
        });
        resetStore();
        handleCloseSplit();
      },
    });
  };

  const lastSyncedDatesRef = useRef({
    drawingDate: null,
    drawingReceivedDate: null,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (drawingDate !== lastSyncedDatesRef.current.drawingDate) {
        pageEntries.forEach(([key]) => {
          const fieldPath = `pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_DATE}`;
          if (
            getValues(fieldPath) === undefined ||
            getValues(fieldPath) === null ||
            getValues(fieldPath) === ''
          ) {
            setValue(fieldPath, drawingDate, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        });
        lastSyncedDatesRef.current.drawingDate = drawingDate;
      }
      if (
        drawingReceivedDate !== lastSyncedDatesRef.current.drawingReceivedDate
      ) {
        pageEntries.forEach(([key]) => {
          const fieldPath = `pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE}`;
          if (
            getValues(fieldPath) === undefined ||
            getValues(fieldPath) === null ||
            getValues(fieldPath) === ''
          ) {
            setValue(fieldPath, drawingReceivedDate, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        });
        lastSyncedDatesRef.current.drawingReceivedDate = drawingReceivedDate;
      }
    }, 100);

    return () => clearTimeout(handler);
  }, [drawingDate, drawingReceivedDate, pageEntries, setValue]);

  return (
    <FormProvider {...form}>
      <form>
        <Box display={'flex'} flexDirection={'column'} gap={3}>
          <Box
            display="flex"
            justifyContent={'space-between'}
            alignItems={'center'}
            gap={1}
          >
            <Box display="flex" alignItems="center" gap={1} width={'100%'}>
              <Typography
                variant="h6"
                color="textSecondary"
                sx={{
                  float: 'right',
                  fontWeight: '800',
                  color: 'rgb(41, 152, 111)',
                }}
              >
                Please fill out document tags (common terms) for:
              </Typography>
              <FormTextField
                name="Title"
                label="Document Name"
                size={{ xs: 12, sm: 8 }}
                disabled
                modifyLabel={false}
              />
            </Box>
            {pageStatusCount().uploaded + pageStatusCount().ignore ===
            status?.page_count ? (
              <Button
                variant="contained"
                sx={{ bgcolor: 'rgb(41, 152, 111)', width: '300px' }}
                onClick={handleDeleteDocument}
              >
                Delete Document
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ bgcolor: 'rgb(41, 152, 111)', width: '300px' }}
                onClick={handleSaveAndContinueLater}
                loading={loadingSave}
              >
                Save and Continue Later
              </Button>
            )}
          </Box>
          <Stack spacing={2}>
            <ConfirmationRevisionDialog
              alertText={confirmationDialogText}
              open={confirmationDialogState.open}
              setOpen={(open) => {
                setConfirmationDialogState((prev) => ({
                  ...prev,
                  open,
                }));
              }}
            />

            <Grid2 container spacing={2}>
              <FormAutocomplete
                required
                label="Business"
                options={getOptions(TERMS_KEY.BUSINESS)}
                name={TERMS_KEY_MAPPING_CT.BUSINESS}
              />

              <ResortAutocomplete getOptions={getOptions} />

              <FormAutocomplete
                label="Park Stage"
                options={getOptions(TERMS_KEY.PARK_STAGE)}
                name={TERMS_KEY_MAPPING_CT.PARK_STAGE}
              />

              <FormAutocomplete
                required
                label="Department"
                options={getOptions(TERMS_KEY.DEPARTMENT)}
                name={TERMS_KEY_MAPPING_CT.DEPARTMENT}
              />

              <FormAutocomplete
                label="Building"
                options={getOptions('Building')}
                name={TERMS_KEY_MAPPING_CT.BUILDING}
                disabled={isResidential}
              />

              <FormAutocomplete
                label="Villa"
                options={getOptions(TERMS_KEY.VILLA)}
                name={TERMS_KEY_MAPPING_CT.VILLA}
                disabled={!isResidential}
              />

              <FormAutocomplete
                required
                label="Document Type"
                options={getOptions(TERMS_KEY.DOCUMENT_TYPE)}
                name={TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE}
                disabled
                modifyLabel={false}
              />

              <FormAutocomplete
                label="Discipline"
                options={getOptions(TERMS_KEY.DISCIPLINE)}
                name={TERMS_KEY_MAPPING_CT.DISCIPLINE}
              />

              <FormAutocomplete
                label="Gate"
                options={getOptions(TERMS_KEY.GATE)}
                name={TERMS_KEY_MAPPING_CT.GATE}
              />

              <FormAutocomplete
                required={isDrawing}
                disabled={!isDrawing}
                label="Drawing Set Name"
                options={getOptions(TERMS_KEY.DRAWING_SET_NAME)}
                name={TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME}
              />

              <FormAutocomplete
                required={isDrawing}
                disabled={!isDrawing}
                label="Drawing Area"
                options={getOptions(TERMS_KEY.DRAWING_AREA)}
                name={TERMS_KEY_MAPPING_CT.DRAWING_AREA}
              />

              <FormAutocomplete
                label="Confidentiality"
                options={getOptions(TERMS_KEY.CONFIDENTIALITY)}
                name={TERMS_KEY_MAPPING_CT.CONFIDENTIALITY}
              />

              <AuthorField />

              <FormDateField
                name={TERMS_KEY_MAPPING_CT.DRAWING_DATE}
                label="Drawing Date"
                disabled={!isDrawing}
                minDate={DRAWING_DATE_MIN_DATE}
                maxDate={drawingReceivedDate ?? today}
              />

              <FormDateField
                name={TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE}
                label="Drawing Received Date"
                disabled={!isDrawing}
                minDate={drawingDate}
                maxDate={today}
              />
            </Grid2>
          </Stack>
          {isLoading ? (
            <Box
              height={'38vh'}
              display="flex"
              alignItems="center"
              flexDirection={'column'}
              width={'100%'}
              gap={2}
            >
              <LinearProgress sx={{ width: '5%', margin: '0 auto' }} />
              <Typography variant="h6" color="textSecondary">
                {params?.docName &&
                window.location.pathname.includes('/split-drawing')
                  ? `Searching for ${params?.docName}...`
                  : `Your file is being uploaded, split and OCR. Once the first page is done, it will start to list the files here.`}
              </Typography>
            </Box>
          ) : (
            <Box
              display="flex"
              flexDirection={'column'}
              gap={3}
              minHeight={'38vh'}
            >
              <Box
                display="flex"
                justifyContent={'center'}
                alignItems={'center'}
                gap={3}
                position={'relative'}
              >
                <Typography
                  color="textSecondary"
                  position={'absolute'}
                  left={0}
                  sx={{
                    float: 'right',
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  Page
                </Typography>
                <Typography
                  color="textSecondary"
                  sx={{
                    float: 'right',
                    fontWeight: '800',
                    color: 'rgb(41, 152, 111)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {status?.page_count} Pages:
                  <Box display="flex" alignItems={'center'} gap={0.5}>
                    <PendingActions />
                    {pageStatusCount().pending} Pending
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Cached
                      sx={
                        pageStatusCount().processing > 0
                          ? {
                              animation: `${reverseSpin} 2s linear infinite`,
                            }
                          : undefined
                      }
                    />
                    {pageStatusCount().processing} Processing
                  </Box>
                  <Box display="flex" alignItems={'center'} gap={0.5}>
                    <Checklist />
                    {pageStatusCount().ready} Ready
                  </Box>
                  <Box display="flex" alignItems={'center'} gap={0.5}>
                    <Upload />
                    {pageStatusCount().uploaded} Uploaded
                  </Box>
                  <Box display="flex" alignItems={'center'} gap={0.5}>
                    <Cancel />
                    {pageStatusCount().ignore} Skipped
                  </Box>
                </Typography>
              </Box>
              {pageEntries.map(([key, page], index) => {
                const pageFields = watch(`pages.${key}`);

                return (
                  <Box
                    key={key}
                    display="flex"
                    gap={1}
                    ref={(el) => (boxRefs.current[key] = el)}
                  >
                    <Typography
                      color="textSecondary"
                      sx={{
                        float: 'right',
                        fontWeight: '800',
                        color: 'rgb(41, 152, 111)',
                        marginRight: '5px',
                      }}
                    >
                      {index + 1}
                    </Typography>
                    {page?.status === 'IGNORE' && (
                      <Box display={'flex'} flexDirection={'column'} gap={1}>
                        <Typography
                          sx={{
                            color: docDetails[key]?.image ? 'blue' : 'gray',
                            cursor: docDetails[key]?.image ? 'pointer' : 'auto',
                          }}
                          onClick={(e) =>
                            docDetails[key]?.image &&
                            handleOpenBox(e, key, page)
                          }
                        >
                          This page has been skipped.
                        </Typography>
                        <Box
                          display="flex"
                          width="100%"
                          flexDirection="column"
                          gap={1}
                        >
                          {openKey === key && (
                            <Fragment>
                              {!docDetails[key] ? (
                                <Box
                                  height={'38vh'}
                                  display="flex"
                                  alignItems="center"
                                >
                                  <LinearProgress
                                    sx={{ width: '5%', margin: '0 auto' }}
                                  />
                                </Box>
                              ) : (
                                <Box
                                  display="flex"
                                  flexDirection="column"
                                  width="100%"
                                  gap={1}
                                  sx={{ border: '1px solid #ccc' }}
                                  borderRadius={1}
                                >
                                  <Box
                                    height="20vh"
                                    sx={{
                                      overflow: 'auto',
                                      border: '1px solid #ddd',
                                    }}
                                  >
                                    {docDetails[key]?.image && (
                                      <img
                                        src={docDetails[key].image}
                                        alt="Document Page"
                                        style={{
                                          display: 'block',
                                          maxWidth: '100%',
                                          maxHeight: 'none',
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Button
                                    variant="contained"
                                    sx={{
                                      bgcolor: 'rgb(41, 152, 111)',
                                      color: 'white',
                                    }}
                                    onClick={() => handleReEnterPage(key)}
                                  >
                                    re-enter data and submit
                                  </Button>
                                </Box>
                              )}
                            </Fragment>
                          )}
                        </Box>
                      </Box>
                    )}
                    {page?.status === 'PROCESSED' && (
                      <Box
                        display={'flex'}
                        flexDirection={'column'}
                        alignItems={'center'}
                        paddingBottom={1}
                      >
                        <Typography
                          onClick={() => {
                            if (page?.document_uri) {
                              window.open(
                                `/main${page.document_uri}`,
                                '_blank',
                              );
                            }
                          }}
                          sx={{
                            color: page?.document_uri ? 'blue' : 'inherit',
                            cursor: page?.document_uri ? 'pointer' : 'default',
                          }}
                        >
                          View uploaded page
                        </Typography>
                      </Box>
                    )}
                    {page?.status !== 'IGNORE' &&
                      page?.status !== 'PROCESSED' && (
                        <Fragment>
                          <Box
                            display="flex"
                            width="100%"
                            flexDirection="column"
                            gap={1}
                            onClick={(e) => handleOpenBox(e, key, page)}
                          >
                            <Box display="flex" gap={1}>
                              <FormTextField
                                name={`pages.${key}.Title`}
                                label="Title"
                                size={{ xs: 12, sm: 5 }}
                                disabled={
                                  page?.status !== 'READY' || !docDetails[key]
                                }
                                required
                              />
                              <FormTextField
                                name={`pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_NUMBER}`}
                                label="Drawing Number"
                                size={{ xs: 12, sm: 2 }}
                                disabled={
                                  page?.status !== 'READY' || !docDetails[key]
                                }
                                required
                              />
                              <RevisionNumberField
                                isDrawing={isDrawing}
                                name={`pages.${key}.${TERMS_KEY_MAPPING_CT.REVISION_NUMBER}`}
                                size={{ xs: 12, sm: 2 }}
                                disabled={
                                  page?.status !== 'READY' || !docDetails[key]
                                }
                                pageKey={key}
                                setConfirmationDialogText={
                                  setConfirmationDialogText
                                }
                              />
                              <FormDateField
                                name={`pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_DATE}`}
                                label="Drawing Date"
                                minDate={DRAWING_DATE_MIN_DATE}
                                maxDate={drawingReceivedDate ?? today}
                                size={{ xs: 12, sm: 2 }}
                                disabled={
                                  page?.status !== 'READY' || !docDetails[key]
                                }
                                required
                              />
                              <FormDateField
                                name={`pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE}`}
                                label="Drawing Received Date"
                                minDate={drawingDate}
                                maxDate={today}
                                size={{ xs: 12, sm: 2 }}
                                disabled={
                                  page?.status !== 'READY' || !docDetails[key]
                                }
                                required
                              />
                            </Box>
                            {openKey === key && (
                              <Fragment>
                                {!docDetails[key] ? (
                                  <Box
                                    height={'38vh'}
                                    display="flex"
                                    alignItems="center"
                                  >
                                    <LinearProgress
                                      sx={{ width: '5%', margin: '0 auto' }}
                                    />
                                  </Box>
                                ) : (
                                  <Box
                                    display="flex"
                                    flexDirection="column"
                                    width="100%"
                                    gap={1}
                                    sx={{ border: '1px solid #ccc' }}
                                    borderRadius={1}
                                  >
                                    <Box display="flex" gap={1} padding={2}>
                                      <Box
                                        width={{ xs: '100%', sm: getWidth(5) }}
                                      >
                                        {getSuggestions(
                                          docDetails[key],
                                          'TITLE',
                                        ).map((suggestion) => (
                                          <Typography
                                            key={suggestion}
                                            onClick={() =>
                                              setValue(
                                                `pages.${key}.Title`,
                                                suggestion,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                  shouldTouch: true,
                                                },
                                              )
                                            }
                                            sx={{
                                              cursor: 'pointer',
                                              color: 'blue',
                                              textDecoration: 'underline',
                                              marginTop: '4px',
                                            }}
                                          >
                                            {suggestion}
                                          </Typography>
                                        ))}
                                      </Box>

                                      <Box
                                        width={{ xs: '100%', sm: getWidth(2) }}
                                      >
                                        {getSuggestions(
                                          docDetails[key],
                                          'DRAWING NUMBER',
                                        ).map((suggestion) => (
                                          <Typography
                                            key={suggestion}
                                            onClick={() =>
                                              setValue(
                                                `pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_NUMBER}`,
                                                suggestion,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                  shouldTouch: true,
                                                },
                                              )
                                            }
                                            sx={{
                                              cursor: 'pointer',
                                              color: 'blue',
                                              textDecoration: 'underline',
                                              marginTop: '4px',
                                            }}
                                          >
                                            {suggestion}
                                          </Typography>
                                        ))}
                                      </Box>

                                      <Box
                                        width={{ xs: '100%', sm: getWidth(2) }}
                                      >
                                        {getSuggestions(
                                          docDetails[key],
                                          'REVISION',
                                        ).map((suggestion) => (
                                          <Typography
                                            key={suggestion}
                                            onClick={() =>
                                              setValue(
                                                `pages.${key}.${TERMS_KEY_MAPPING_CT.REVISION_NUMBER}`,
                                                suggestion,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                  shouldTouch: true,
                                                },
                                              )
                                            }
                                            sx={{
                                              cursor: 'pointer',
                                              color: 'blue',
                                              textDecoration: 'underline',
                                              marginTop: '4px',
                                            }}
                                          >
                                            {suggestion}
                                          </Typography>
                                        ))}
                                      </Box>

                                      <Box
                                        width={{ xs: '100%', sm: getWidth(2) }}
                                      >
                                        {getSuggestions(
                                          docDetails[key],
                                          'DATE',
                                        ).map((suggestion) => (
                                          <Typography
                                            key={suggestion}
                                            onClick={() =>
                                              setValue(
                                                `pages.${key}.${TERMS_KEY_MAPPING_CT.DRAWING_DATE}`,
                                                dayjs(suggestion),
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                  shouldTouch: true,
                                                },
                                              )
                                            }
                                            sx={{
                                              cursor: 'pointer',
                                              color: 'blue',
                                              textDecoration: 'underline',
                                              marginTop: '4px',
                                            }}
                                          >
                                            {suggestion}
                                          </Typography>
                                        ))}
                                      </Box>

                                      <Box
                                        width={{ xs: '100%', sm: getWidth(2) }}
                                      />
                                    </Box>

                                    <Box
                                      height="20vh"
                                      sx={{
                                        overflow: 'auto',
                                        border: '1px solid #ddd',
                                      }}
                                    >
                                      {docDetails[key]?.image && (
                                        <img
                                          src={docDetails[key].image}
                                          alt="Document Page"
                                          style={{
                                            display: 'block',
                                            maxWidth: '100%',
                                            maxHeight: 'none',
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                )}
                              </Fragment>
                            )}
                          </Box>
                          <Box display={'flex'} gap={1} height={'38px'}>
                            <UploadButton
                              pageKey={key}
                              pageStatus={page?.status}
                              docDetails={docDetails}
                              mode={UPLOAD_MODE.PRE_APPROVE}
                              isLoading={loadingKey === key}
                              setLoadingKey={setLoadingKey}
                              handleSave={handleSave}
                              confirmationDialogText={confirmationDialogText}
                            />
                            <Button
                              variant="contained"
                              sx={{
                                bgcolor: 'rgb(41, 152, 111)',
                                color: 'white',
                              }}
                              disabled={isSkipDisabledForPage(pageFields)}
                              onClick={() => handleSkipPage(key)}
                            >
                              Skip
                            </Button>
                          </Box>
                        </Fragment>
                      )}
                  </Box>
                );
              })}
            </Box>
          )}
          <Grid2
            container
            sx={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: {
                xs: 'column', // small screens
                sm: 'row',
              },
              gap: 2, // spacing between buttons
              justifyContent: 'space-between',
              alignItems: {
                xs: 'stretch',
                sm: 'center',
              },
            }}
          >
            <Button color="error" onClick={handleCloseSplit}>
              Back
            </Button>
          </Grid2>
        </Box>
      </form>
    </FormProvider>
  );
});
