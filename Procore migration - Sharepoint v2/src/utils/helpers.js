import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import getViewDataFromCells from '../hooks/view/useViewData';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const termsMapData_ = await import(
  `../Data/termKeyMapping-${process.env.REACT_APP_ENV}.json`
);
const termsMapData = termsMapData_?.default;

/**
 * Safely retrieves the value associated with a key from an array of values.
 * @param values - The array of key-value objects.
 * @param key - The key to search for.
 * @returns The value found or an empty string if not found.
 */
export const getKeyValue = (values, key) => {
  try {
    return values.find((cell) => cell && cell.Key === key).Value ?? null;
  } catch (error) {
    return '';
  }
};

/**
 * Extracts the text before the pipe character from a specific key in an object
 * @param {Object} data - Object containing pipe-delimited values
 * @param {string} key - The key to extract the value from
 * @returns {string|null} - The text before the pipe, or null if key doesn't exist
 */
export function getMetadataValueByKey(data, key) {
  // Check if data is a valid object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid input: expected an object');
  }

  // Check if key is valid
  if (typeof key !== 'string' || key === '') {
    throw new Error('Invalid key: expected a non-empty string');
  }

  // Check if the key exists in the data
  if (!(key in data)) {
    return null;
  }

  const value = data[key];

  // Check if the value is a string and contains a pipe
  if (typeof value === 'string' && value.includes('|')) {
    // Split by pipe and take the first part
    return value.split('|')[0];
  } else {
    // Return the original value if no pipe exists
    return value;
  }
}

export const normalizeCells = (cell) => {
  if (!cell || typeof cell !== 'object') return {};

  return {
    titleMetadata: getKeyValue(cell, 'Title'),
    authorMetadata: getKeyValue(cell, 'Author'),
    shortDescMetadata: getKeyValue(cell, termsMapData['Short Description']),
    siteNameUrl: getKeyValue(cell, 'SiteName'),
    path: getKeyValue(cell, 'Path'),
    filename: getKeyValue(cell, 'Filename'),
    parentLink: getKeyValue(cell, 'ParentLink'),
    documentType: getKeyValue(cell, termsMapData['Document Type']),
    uniqueId: getKeyValue(cell, 'UniqueId'),
    drawingNumberMetadata: getKeyValue(cell, termsMapData['Drawing Number']),
    revisionNumber: getKeyValue(cell, termsMapData['Revision Number']),
    businessMetadata: getKeyValue(cell, termsMapData['Business']),
    buildingMetadata: getKeyValue(cell, termsMapData['Building']),
    villaMetadata: getKeyValue(cell, termsMapData['Villa']),
    docTypeMetadata: getKeyValue(cell, termsMapData['Document Type']),
    resortMetadata: getKeyValue(cell, termsMapData['Resort']),
    departmentMetadata: getKeyValue(cell, termsMapData['Department']),
    disciplineMetadata: getKeyValue(cell, termsMapData['Discipline']),
    drawingAreaMetadata: getKeyValue(cell, termsMapData['Drawing Area']),
    parkStage: getKeyValue(cell, termsMapData['Park Stage']),
  };
};

export const standardDateFormat = 'YYYY-MM-DD HH:mm:ss';

export const dateFormattedValue = (value) => {
  const date = new Date(value);
  const timestampValid = !isNaN(date.getTime());
  if (value === null || value === undefined || !timestampValid) {
    return '';
  }
  // const fullDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 12:00:00`;
  const fullDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  return fullDate;
};

/**
 * Checks if a given date is valid and falls within the specified range.
 * @param date - The date to validate.
 * @param minDate - The minimum allowed date.
 * @param maxDate - The maximum allowed date.
 * @returns `true` if the date is valid and within range, otherwise `false`.
 */
export const isDateInBetween = (date, minDate, maxDate) => {
  if (!date) return false; // Return false if date is null/undefined

  const parsedDate = dayjs(date);
  return (
    parsedDate.isValid() && parsedDate.isBetween(minDate, maxDate, 'day', '[]')
  );
};

/**
 * Converts a given date to Brisbane timezone
 * @param {string|Date} value - The date value to convert
 * @returns {string} - The date formatted in Brisbane timezone, or empty string if invalid
 */
export const displayDateByTimezone = (value, timezone) => {
  if (!value) return '';

  const timeValue = dayjs().format('h:mm:ss');

  const date = dayjs(`${value} ${timeValue}`);
  if (!date.isValid()) return '';

  return date.tz(timezone).format(standardDateFormat);
};

export const formatDisplayDate = (sharePointDateStr, timezone, format) => {
  if (!sharePointDateStr) return '';

  if (typeof sharePointDateStr === 'object') {
    try {
      const dateStr = new Date(sharePointDateStr);
      if (format) {
        return dayjs.utc(dateStr).tz(timezone).format(format);
      }
      return dayjs.utc(dateStr).tz(timezone);
    } catch (error) {
      console.log('error in date format');
    }
  }
  const hasZ = sharePointDateStr.endsWith('Z');
  const dt_format = 'M/D/YYYY h:mm:ss A';
  let date = hasZ
    ? dayjs.utc(sharePointDateStr).tz(timezone)
    : dayjs.utc(sharePointDateStr, dt_format).tz(timezone); // no conversion if not UTC
  if (format) {
    return date.format(format); // e.g., 01-Feb-2024
  }
  return date;
};

export function getFileExtension(filename) {
  if (typeof filename !== 'string') return null;

  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : null;
}

export const fileNameSanitizeSoft = (filename) => {
  // Convert to camelCase (each word capitalized, space-separated)
  const words = filename.split(/[-_ ]+/);
  const sanitizedName = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return sanitizedName;
};

export const sanitizeFileName = (file) => {
  if (!file) return null;

  const filename = file.name;

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

export const formatUniqueId = (uniqueId) => {
  return uniqueId?.replace(/[{}]/g, '');
};

export function formatTitle(cells) {
  let titleArr = [];
  const {
    businessMetadata,
    resortMetadata,
    departmentMetadata,
    buildingMetadata,
    documentType,
    drawingNumberMetadata,
    titleMetadata,
    revisionNumber,
  } = getViewDataFromCells(cells);

  titleArr.push(
    businessMetadata,
    resortMetadata,
    departmentMetadata,
    buildingMetadata,
    documentType,
  );

  if (documentType === 'Drawing') {
    titleArr.push(drawingNumberMetadata);
  }

  titleArr.push(titleMetadata, revisionNumber);

  return titleArr.filter(Boolean).join(' – ');
}

export const convertUTCToLocal = (utcDateStr) => {
  const date = new Date(utcDateStr); // Parse the UTC date
  return date.toLocaleString(); // Convert to browser's local timezone
};

export const getLatestModifier = (values) => {
  if (!values) return null;
  const authors = String(values).split(';');
  return authors[authors.length - 1];
};

export const validateFileUpload = (file) => {
  // const fileName = file?.name.toLowerCase() || '';
  const isPDF = file?.type === 'application/pdf';
  // const isIFCorCAD = /\.(ifc|dwg|dxf|step|stp)$/.test(fileName);

  // if (isIFCorCAD) {
  //   return 'An IFC or CAD drawing should be loaded as a "Model".';
  // }
  if (!isPDF) {
    return `A drawing upload only accepts .pdf files\nAn IFC or CAD drawing should be loaded as a "Model"`;
  }

  return '';
};
