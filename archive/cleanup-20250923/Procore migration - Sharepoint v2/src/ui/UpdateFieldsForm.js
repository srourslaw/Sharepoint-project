import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Divider,
  TextField,
  Autocomplete,
  Box,
  Typography,
} from '@mui/material';
import useAuth from '../hooks/useAuth';
import getViewDataFromCells from '../hooks/view/useViewData';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  dateFormattedValue,
  formatDisplayDate,
  getKeyValue,
  getLatestModifier,
} from '../utils/helpers';
import useRenewToken from '../hooks/useRenewToken';
import axios from 'axios';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const termsData_ = await import(
  `../Data/terms-${process.env.REACT_APP_ENV}.json`
);
const termsData = termsData_?.default;

const timezoneData = await import(
  `../Data/timezone-resort-${process.env.REACT_APP_ENV}.json`
);
const timezoneResort = timezoneData?.default;

const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

const ignoredKeys = [
  'File Extension',
  'Revision Number',
  'Short Description',
  'Drawing Number',
  'Drawing Date',
  'Drawing Received Date',
  'Title',
  'Author',
];

const drawingMetadata = [
  'Drawing Number',
  'Title',
  'Revision Number',
  'Drawing Set Name',
  'Drawing Area',
  'Gate',
  'Author',
  'Confidentiality',
  'Drawing Date',
  'Drawing Received Date',
  'Short Description',
];

const getRevisionString = (selectedFileVersion) => {
  if (!selectedFileVersion) return 'N/A';

  const versionLabel = selectedFileVersion.VersionLabel || '';
  const revisionNumber = selectedFileVersion.RevisionNumber || '';

  return [versionLabel, revisionNumber].filter(Boolean).join('-');
};

const UpdateFieldsForm = ({
  accessibleResortsSanitized,
  values,
  form,
  fields,
  setEditedData,
  selectedFileVersion,
}) => {
  const [inputDates, setInputDates] = useState(false);
  const navigate = useNavigate();

  const [hide, setHide] = useState({
    villa: false,
    building: false,
  });

  const editFields = useMemo(() => {
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
    return fields;
  }, [fields, hide]);

  const [disabled, setDisabled] = useState({
    villa: false,
    building: false,
    discipline: false,
    drawingArea: false,
    drawingSetName: false,
    drawingNumber: false,
    drawingDate: false,
    drawingReceivedDate: false,
    revision: true,
  });

  const { titleMetadata, authorMetadata, shortDescMetadata } =
    getViewDataFromCells(values);

  const termsDataObject = editFields;

  const { register, setValue, watch, formState, getValues } = form;

  const dirtyFields = formState.dirtyFields;

  const docType = watch('Document Type');
  const department = watch('Department');
  const simpleDocType = docType ? String(docType).split('|')[0] : '';

  const isDocDrawing = simpleDocType === 'Drawing';

  useEffect(() => {
    termsDataObject.map((key) => {
      if (key !== '') {
        const keyField = termsMapData[key];
        const value = getKeyValue(values, keyField);
        if (ignoredKeys.includes(key)) {
          setValue(key, value || '');
        } else {
          setValue(key, termsData['DMS Terms'][key][value]);
        }
      }
    });
    drawingMetadata.map((key) => {
      if (key !== '') {
        const keyField = termsMapData[key];
        const value = getKeyValue(values, keyField);
        if (['Title', 'Author', 'Short Description'].includes(key)) {
          const mapValue = {
            Title: titleMetadata,
            'Short Description': shortDescMetadata,
          };
          setValue(key, mapValue[key]);
        } else if (ignoredKeys.includes(key)) {
          if (['Drawing Date', 'Drawing Received Date'].includes(key)) {
            const resValue = dateFormattedValue(value);
            setValue(key, resValue || '');
          }
          setValue(key, value || '');
        } else {
          setValue(key, termsData['DMS Terms'][key][value]);
        }
      }
    });

    return () => {
      setInputDates(false);
    };
  }, []);

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
    if (dirtyFields?.['Department']) {
      if (isResidential) {
        setValue('Building', '');
      } else if (!isResidential) {
        setValue('Villa', '');
      } else {
        setValue('Building', '');
        setValue('Villa', '');
      }
    }

    if (dirtyFields?.['Document Type']) {
      if (simpleDocType !== 'Drawing') {
        setValue('Discipline', '');
        setValue('Drawing Set Name', '');
        setValue('Drawing Area', '');
        setValue('Drawing Number', '');
        setValue('Drawing Date', '');
        setValue('Drawing Received Date', '');
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
      }));
    }
  }, [department, docType]);

  const { isAuth, setErrorMsg } = useAuth();

  const { getAccessToken } = useRenewToken();

  const fetchQuery = async (payload) => {
    const accessToken = await getAccessToken();
    axios
      .post(
        `${process.env.REACT_APP_TOKEN_SCOPE.split('.')[0]}.sharepoint.com/sites/${process.env.REACT_APP_HUB_NAME}/_api/search/postquery`,
        payload,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=verbose;charset=utf-8',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .then((res) => {
        if (res.data.error === true) {
          setErrorMsg(res.data.errorMessage);
        } else {
          if (res) {
            setErrorMsg('');
          } else {
            setErrorMsg('Search error - unable to fetch sites.');
          }
        }
      })
      .catch((e) => {
        setErrorMsg(e.message);
        if (e.status === 401) {
          setTimeout(function () {
            localStorage.clear();
            navigate('/');
          }, 1000);
        }
        console.log(e);
      });
  };

  useEffect(() => {
    if (isAuth) {
      const payload = {
        request: {
          Querytext: `contentclass:STS_Site DepartmentId:{${process.env.REACT_APP_RELATEDHUBSITE}}`,
          SelectProperties: {
            results: [
              'Title',
              'Path',
              'Description',
              'SiteLogo',
              'SiteDescription',
              'SiteName',
              'SiteId',
              'WebId',
            ],
          },
          StartRow: 0,
          RowLimit: 100,
          ClientType: 'PnPModernSearch',
          __metadata: {
            type: 'Microsoft.Office.Server.Search.REST.SearchRequest',
          },
        },
      };

      fetchQuery(payload);
    }
  }, [isAuth]);

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

  const handleDateField = (key) => (valueDate) => {
    setInputDates(true);
    setEditedData((prev) => ({
      ...prev,
      [key]: valueDate,
    }));
    setValue(key, valueDate, { shouldDirty: true });
  };

  const handleTextValue = (key) => (e) => {
    e.preventDefault();
    const value = e.target.value;
    setEditedData((prev) => ({
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
    return isLocal ? localTimezone : siteTimezone;
  };

  const getDateValue = (key) => {
    const value = watch(key);
    if (!value) return null;

    const siteTimezone = getTimezoneByResort({ isLocal: false });

    const localDate = dayjs(value);
    if (!localDate.isValid()) return null;

    const dateStr = localDate.format('YYYY-MM-DD HH:mm:ss');
    const dateWithTimezone = dayjs.utc(dateStr).tz(siteTimezone);

    return dateWithTimezone;
  };

  const handleDateChange = (key) => {
    const value = watch(key);
    if (!value) return null;

    return dayjs(value);
  };

  useEffect(() => {
    const docType = watch('Document Type');
    const simpleDocType = docType ? String(docType).split('|')[0] : '';

    if (simpleDocType === 'Drawing') {
      const drawingDate = watch('Drawing Date');
      const drawingReceivedDate = watch('Drawing Received Date');

      if (drawingDate) {
        const updatedDrawingDate = getDateValue('Drawing Date');
        setValue('Drawing Date', updatedDrawingDate);
      }

      if (drawingReceivedDate) {
        const updatedDrawingReceivedDate = getDateValue(
          'Drawing Received Date',
        );
        setValue('Drawing Received Date', updatedDrawingReceivedDate);
      }
    }
  }, [watch('Document Type'), watch('Resort')]);

  const getTextValue = (key) => {
    const value = watch(key);
    return value || '';
  };

  const handleMetadataChange = (key) => (e, value) => {
    // Safely access the term value
    const termValue = value && termsData?.['DMS Terms']?.[key]?.[value];

    // Always use the actual selected value, even if it doesn't match a term
    const finalValue = termValue ?? value ?? '';

    // Update the edited data
    setEditedData((prev) => ({
      ...prev,
      [key]: finalValue,
    }));

    // Force the field to be marked as dirty regardless of the value
    // Force the field to be marked as dirty regardless of the value
    setValue(key, finalValue, {
      shouldDirty: true,
      shouldDirty: true,
    });

    // Explicitly mark the field as dirty in case setValue doesn't do it
    form.formState.dirtyFields[key] = true;
  };

  const getValue = (key) => {
    const value = getValues(key);
    return value ? value.split('|')[0] : '';
  };

  const isDisabled = (key) => {
    const mappedDisabled = {
      Building: disabled.building,
      Villa: disabled.villa,
      Discipline: disabled.discipline,
      'Drawing Area': disabled.drawingArea,
      'Drawing Set Name': disabled.drawingSetName,
      'Drawing Number': disabled.drawingNumber,
      'Revision Number': disabled.revision,
      'Drawing Date': disabled.drawingDate,
      'Drawing Received Date': disabled.drawingReceivedDate,
    };
    const result = mappedDisabled[key] || false;
    return result;
  };

  const dateMinMax = (label) => {
    switch (label) {
      case 'Drawing Date':
        return {
          minDate: dayjs('2016-01-01'),
          maxDate:
            getDateValue('Drawing Received Date') != null
              ? dayjs(getDateValue('Drawing Received Date'))
              : dayjs(),
        };
      case 'Drawing Received Date':
        return {
          minDate:
            getDateValue('Drawing Date') != null
              ? dayjs(getDateValue('Drawing Date'))
              : dayjs('2016-01-01'),
          maxDate: dayjs(),
        };
      default:
        return;
    }
  };

  const renderFields = (label) => {
    if (label !== '') {
      const field = register(label);

      if (label === 'Short Description') {
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
            label={label}
            variant="outlined"
            fullWidth
          />
        );
      }

      if (['Drawing Date', 'Drawing Received Date'].includes(label)) {
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={`${label} ${isDocDrawing ? '*' : ''}`}
              disabled={isDisabled(label)}
              {...dateMinMax(label)}
              localeText={{
                fieldMonthPlaceholder: (params) =>
                  params.contentType === 'digit' ? 'MM' : params.format,
              }}
              onChange={handleDateField(label)}
              value={isDocDrawing ? handleDateChange(label) : null}
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
              format="DD - MMM - YYYY"
              size="small"
              fullWidth
            />
          </LocalizationProvider>
        );
      }

      if (['Title', 'Drawing Number'].includes(label)) {
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
              variant="body1"
              color="gray"
              sx={{ mb: 1, fontWeight: 800 }}
            >
              {getLatestModifier(authorMetadata)}
            </Typography>
          </Box>
        );
      }

      if (label === 'Revision Number') {
        return (
          <TextField
            {...field}
            size="small"
            disabled={isDisabled(label)}
            value={getRevisionString(selectedFileVersion)}
            label="Revision"
            variant="outlined"
            fullWidth
          />
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

  return (
    <React.Fragment>
      <Grid container spacing={2} sx={{ my: 2 }}>
        {termsDataObject.map((label, key) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={key}>
            {renderFields(label)}
          </Grid>
        ))}
      </Grid>
      <Divider />
      <Grid container spacing={2} sx={{ my: 2 }}>
        {drawingMetadata.map((label, key) => {
          if (label === 'Short Description') {
            return (
              <Grid item xs={12} sm={12} md={12} lg={12} key={key}>
                {renderFields(label)}
              </Grid>
            );
          }
          return (
            <Grid item xs={12} sm={6} md={6} lg={4} key={key}>
              {renderFields(label)}
            </Grid>
          );
        })}
      </Grid>
    </React.Fragment>
  );
};

export default UpdateFieldsForm;
