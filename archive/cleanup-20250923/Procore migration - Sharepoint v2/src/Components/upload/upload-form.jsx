import { Autocomplete, FormHelperText, Grid2, TextField } from '@mui/material';
import { useLocalStorage } from '@uidotdev/usehooks';
import {
  Fragment,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  DRAWING_DATE_MIN_DATE,
  LOCAL_STORAGE_KEYS,
  TERMS_KEY,
  TERMS_KEY_MAPPING_CT,
} from '../../const/common';
import useAuth from '../../hooks/useAuth';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadSchema } from './schema';
import { UploadSubmitButtons } from './submit';
import { sanitizeFileName } from '../../utils/helpers';
import { useUploadMutation } from './useUploadMutation';
import { useBulkUploadStore } from './bulk-upload-store';
import { RevisionNumberField } from './revision-number-field';
import { useDialog } from '../../context/dialog-provider';
import { useShallow } from 'zustand/react/shallow';
import {
  getDefaultValuesFromFilter,
  getDefaultValuesFromGroup,
} from './helper';

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
  helperText,
}) {
  const isAllFileSuccessfullyUploaded = useBulkUploadStore(
    (state) => state.isAllFileSuccessfullyUploaded,
  );
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
              key={field.value === null ? 'reset' : 'set'}
              autoHighlight
              autoComplete
              openOnFocus
              autoSelect
              disableClearable={required}
              fullWidth
              disabled={isAllFileSuccessfullyUploaded || disabled}
              size="small"
              value={selectedOption}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={modifiedLabel}
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
            {helperText && (
              <FormHelperText
                sx={{
                  color: 'red',
                  fontStyle: 'italic',
                  fontSize: 10,
                  whiteSpace: 'pre-line',
                }}
              >
                {helperText}
              </FormHelperText>
            )}
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
}) {
  const isAllFileSuccessfullyUploaded = useBulkUploadStore(
    (state) => state.isAllFileSuccessfullyUploaded,
  );
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
            disabled={isAllFileSuccessfullyUploaded || disabled}
            label={modifiedLabel}
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
  const { trigger, getValues } = useFormContext();
  const isAllFileSuccessfullyUploaded = useBulkUploadStore(
    (state) => state.isAllFileSuccessfullyUploaded,
  );
  const modifiedLabel = getModifiedLabel(label, { required, disabled });

  return (
    <Grid2 size={size}>
      <Controller
        name={name}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            format="DD - MMM - YYYY"
            disabled={isAllFileSuccessfullyUploaded || disabled}
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
              // Always trigger validation on the current field
              trigger(field.name);

              const relatedFields = {
                [TERMS_KEY_MAPPING_CT.DRAWING_DATE]:
                  TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
                [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE]:
                  TERMS_KEY_MAPPING_CT.DRAWING_DATE,
              };

              // Get the related field for the current field (if any)
              const relatedField = relatedFields[field.name];

              // If the related field has a value, trigger validation on it
              if (getValues(relatedField)) {
                trigger(relatedField);
              }
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

const UploadDateField = memo(function UploadDateField({ isDrawing }) {
  const [drawingDate, drawingReceivedDate] = useWatch({
    name: [
      TERMS_KEY_MAPPING_CT.DRAWING_DATE,
      TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
    ],
  });

  const today = dayjs();

  return (
    <Fragment>
      <FormDateField
        name={TERMS_KEY_MAPPING_CT.DRAWING_DATE}
        label="Drawing Date"
        required={isDrawing}
        disabled={!isDrawing}
        minDate={DRAWING_DATE_MIN_DATE}
        maxDate={drawingReceivedDate ?? today}
      />

      <FormDateField
        name={TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE}
        label="Drawing Received Date"
        required={isDrawing}
        disabled={!isDrawing}
        minDate={drawingDate}
        maxDate={today}
      />
    </Fragment>
  );
});

// Main Component
export const UploadForm = memo(function UploadForm({ onSuccess }) {
  const {
    selectedFile,
    filter,
    fileVersions,
    setFormValues,
    uploadError,
    setSubmitMode,
    isAllFileSuccessfullyUploaded,
    group,
  } = useBulkUploadStore(
    useShallow((state) => ({
      selectedFile: state.selectedFile,
      filter: state.filter,
      fileVersions: state.fileVersions,
      setFormValues: state.setFormValues,
      uploadError: state.uploadError,
      setSubmitMode: state.setSubmitMode,
      isAllFileSuccessfullyUploaded: state.isAllFileSuccessfullyUploaded,
      group: state.group,
    })),
  );

  const [confirmationDialogText, setConfirmationDialogText] = useState(null);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (selectedFile && !isAllFileSuccessfullyUploaded) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedFile, isAllFileSuccessfullyUploaded]);

  // Form setup
  const form = useForm({
    resolver: zodResolver(uploadSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      file: selectedFile?.file,
      Title: sanitizeFileName(selectedFile?.file),
      [TERMS_KEY_MAPPING_CT.DRAWING_DATE]: null,
      [TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE]: null,
      ...getDefaultValuesFromFilter(filter),
      ...getDefaultValuesFromGroup(group),
    },
  });
  const { setValue, trigger, reset, getValues, handleSubmit, control, watch } =
    form;

  const { openDialog } = useDialog();

  // Upload mutation
  const { mutateAsync } = useUploadMutation();

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

  /**
   * Returns sorted options for a specific terms key
   * @param {string} termsKey - The key to retrieve terms for
   * @returns {Array} - Sorted options with filtered items first
   */
  const getOptions = useCallback(
    (termsKey) => {
      // Get terms for the specified key
      const terms = termsData?.['DMS Terms']?.[termsKey];
      if (!terms) return [];

      // Convert terms to options format
      const options = Object.entries(terms)
        .map(([key, value]) => ({
          label: key.toString(),
          value,
        }))
        .filter(({ label }) => label.toLowerCase() !== EXCLUDED_TERMS_KEY);

      // If no filter exists for this terms key, return unsorted options
      if (!filter || !filter[termsKey] || !Array.isArray(filter[termsKey])) {
        return options;
      }

      // Sort options to prioritize items included in the filter
      return options.toSorted((a, b) => {
        const aInFilter = filter[termsKey].includes(a.value);
        const bInFilter = filter[termsKey].includes(b.value);

        // If a is in filter but b is not, a comes first
        if (aInFilter && !bInFilter) {
          return -1;
        }
        // If b is in filter but a is not, b comes first
        if (!aInFilter && bInFilter) {
          return 1;
        }
        // If both or neither are in filter, maintain original order
        return 0;
      });
    },
    [filter, termsData, EXCLUDED_TERMS_KEY],
  );

  useEffect(() => {
    const subscription = watch((values) => {
      setFormValues(values);
    });
    return () => subscription.unsubscribe();
  }, [watch, setFormValues]);

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

  // Effect for drawing-related field toggling
  useEffect(() => {
    if (!isDrawing) {
      trigger(TERMS_KEY_MAPPING_CT.REVISION_NUMBER);
      resetFields(DRAWING_FIELDS);
    }
  }, [isDrawing, resetFields, trigger]);

  useEffect(() => {
    const subscription = watch((values) => {
      setFormValues(values);
    });
    return () => subscription.unsubscribe();
  }, [watch, setFormValues]);

  // Form submission handler
  const onSubmit = async (data, event) => {
    const submitter = event?.nativeEvent.submitter;
    const mode = submitter?.name;
    setSubmitMode(mode);

    const handleSuccess = () => {
      onSuccess();

      // Preserve selected form values
      const preservedKeys = [
        TERMS_KEY_MAPPING_CT.BUSINESS,
        TERMS_KEY_MAPPING_CT.RESORT,
        TERMS_KEY_MAPPING_CT.PARK_STAGE,
        TERMS_KEY_MAPPING_CT.DEPARTMENT,
        TERMS_KEY_MAPPING_CT.BUILDING,
        TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE,
        TERMS_KEY_MAPPING_CT.DISCIPLINE,
        TERMS_KEY_MAPPING_CT.GATE,
        TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
        TERMS_KEY_MAPPING_CT.DRAWING_AREA,
        TERMS_KEY_MAPPING_CT.DRAWING_DATE,
        TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
      ];

      const preservedValues = Object.fromEntries(
        preservedKeys.map((key) => [key, getValues(key)]),
      );

      reset(preservedValues);
    };

    if (fileVersions) {
      openDialog({
        title: 'Please confirm version overwrite',
        description: confirmationDialogText,
        onConfirm: async () => {
          await mutateAsync({ data, mode }, { onSuccess: handleSuccess });
        },
      });
    } else {
      await mutateAsync({ data, mode }, { onSuccess: handleSuccess });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid2 container spacing={2}>
          <FormTextField required name="Title" label="Title" />

          <FormTextField
            name={TERMS_KEY_MAPPING_CT.SHORT_DESCRIPTION}
            label="Short Description"
          />

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
            helperText={uploadError}
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

          <FormTextField
            required={isDrawing}
            disabled={!isDrawing}
            size={{ xs: 12, sm: 4 }}
            label="Drawing Number"
            name={TERMS_KEY_MAPPING_CT.DRAWING_NUMBER}
          />

          <RevisionNumberField
            isDrawing={isDrawing}
            setConfirmationDialogText={setConfirmationDialogText}
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

          <UploadDateField isDrawing={isDrawing} />
        </Grid2>

        <UploadSubmitButtons />
      </form>
    </FormProvider>
  );
});
