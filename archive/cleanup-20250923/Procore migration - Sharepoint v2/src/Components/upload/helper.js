import {
  LOCAL_STORAGE_KEYS,
  TERMS_KEY,
  TERMS_KEY_MAPPING_CT,
} from '../../const/common';

const termsData = await import(
  `../../Data/terms-${process.env.REACT_APP_ENV}.json`
).then((module) => module.default);

export const getDefaultValuesFromFilter = (filter = {}) => {
  if (!Object.keys(filter).length) {
    return {};
  }

  const accessibleResorts = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESSIBLE_RESORTS_WITH_EDIT),
  );

  const result = Object.entries(filter)
    // auto-select the form when filter key only contains 1 value.
    .filter(([_, filterValue]) => filterValue.length === 1)
    .reduce((acc, [key, value]) => {
      if (key === TERMS_KEY_MAPPING_CT.RESORT && value[0]) {
        const siteName = value[0].split('|')?.[0];
        const isResortEditable = accessibleResorts.find(
          (resort) => resort.Sitename.toLowerCase() === siteName.toLowerCase(),
        );

        if (!isResortEditable) return acc;
      }

      acc[key] = value[0];
      return acc;
    }, {});

  return result;
};

const EXCLUDED_GROUP_VALUE = 'znull';
export const getDefaultValuesFromGroup = (group) => {
  // Handle potential parsing errors
  let parsedGroup;
  try {
    parsedGroup = JSON.parse(group);
  } catch (error) {
    return {};
  }

  // Validate that parsedGroup contains entries
  if (
    !parsedGroup ||
    typeof parsedGroup !== 'object' ||
    Object.keys(parsedGroup).length === 0
  ) {
    return {};
  }

  // Extract first key-value pair
  const entries = Object.entries(parsedGroup);
  const [key, value] = entries[0];

  // Early return if excluded
  if (value === EXCLUDED_GROUP_VALUE) {
    return {};
  }

  // Define drawing-related keys for better maintainability
  const DRAWING_KEYS = [
    TERMS_KEY_MAPPING_CT.DRAWING_AREA,
    TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
    TERMS_KEY_MAPPING_CT.DRAWING_NUMBER,
  ];

  // Check if the key is drawing-related
  const isDrawing = DRAWING_KEYS.includes(key);

  // Initialize default values
  let defaultValues = {};

  // Safely access terms data with optional chaining
  const termsValue = termsData?.['DMS Terms']?.[key]?.[value];

  // Add term value if it exists
  if (termsValue) {
    defaultValues = { [key]: termsValue };
  }

  // Add document type for drawing-related keys
  if (isDrawing && termsData?.['DMS Terms']?.[TERMS_KEY.DOCUMENT_TYPE]) {
    defaultValues = {
      ...defaultValues,
      [TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE]:
        termsData['DMS Terms'][TERMS_KEY.DOCUMENT_TYPE]['Drawing'],
    };
  }

  return defaultValues;
};
