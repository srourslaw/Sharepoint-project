import dayjs from 'dayjs';

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  ACCESSIBLE_RESORTS: 'accessibleResorts',
  ACCESSIBLE_RESORTS_WITH_EDIT: 'accessibleResorts_withEdit',
};

export const DOWNLOAD_TYPE = {
  INDIVIDUAL: 'individual',
  MERGED_PDF: 'pdf',
  ZIP: 'zip',
};

export const ALERT_SEVERITY = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

export const TERMS_KEY = {
  BUSINESS: 'Business',
  RESORT: 'Resort',
  DEPARTMENT: 'Department',
  BUILDING: 'Building',
  DOCUMENT_TYPE: 'Document Type',
  VILLA: 'Villa',
  DISCIPLINE: 'Discipline',
  DRAWING_SET_NAME: 'Drawing Set Name',
  DRAWING_AREA: 'Drawing Area',
  GATE: 'Gate',
  PARK_STAGE: 'Park Stage',
  CONFIDENTIALITY: 'Confidentiality',
};

export const TERMS_KEY_MAPPING_CT = {
  BUSINESS: 'Business',
  RESORT: 'Resort',
  DEPARTMENT: 'Department',
  BUILDING: 'Building',
  DOCUMENT_TYPE: 'Document Type',
  DISCIPLINE: 'Discipline',
  GATE: 'Gate',
  PARK_STAGE: 'Park Stage',
  DRAWING_SET_NAME: 'Drawing Set Name',
  DRAWING_AREA: 'Drawing Area',
  DRAWING_NUMBER: 'Drawing Number',
  VILLA: 'Villa',
  CONFIDENTIALITY: 'Confidentiality',
  REVISION_NUMBER: 'Revision Number',
  SHORT_DESCRIPTION: 'Short Description',
  DRAWING_DATE: 'Drawing Date',
  DRAWING_RECEIVED_DATE: 'Drawing Received Date',
};

export const DRAWING_DATE_MIN_DATE = dayjs()
  .set('year', 2016)
  .set('month', 0)
  .set('date', 1);

export const UPLOAD_MODE = {
  DRAFT: 'DRAFT',
  FOR_APPROVAL: 'FOR_APPROVAL',
  PRE_APPROVE: 'PRE_APPROVE',
};

export const COMMON_FIELDS_KEY = [
  TERMS_KEY_MAPPING_CT.BUSINESS,
  TERMS_KEY_MAPPING_CT.RESORT,
  TERMS_KEY_MAPPING_CT.PARK_STAGE,
  TERMS_KEY_MAPPING_CT.DEPARTMENT,
  TERMS_KEY_MAPPING_CT.BUILDING,
  TERMS_KEY_MAPPING_CT.VILLA,
  TERMS_KEY_MAPPING_CT.DOCUMENT_TYPE,
  TERMS_KEY_MAPPING_CT.DISCIPLINE,
  TERMS_KEY_MAPPING_CT.GATE,
  TERMS_KEY_MAPPING_CT.DRAWING_SET_NAME,
  TERMS_KEY_MAPPING_CT.DRAWING_AREA,
  TERMS_KEY_MAPPING_CT.CONFIDENTIALITY,
  TERMS_KEY_MAPPING_CT.DRAWING_DATE,
  TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
];

export const SPECIFIC_FIELDS_KEY = [
  'Title',
  TERMS_KEY_MAPPING_CT.DRAWING_NUMBER,
  TERMS_KEY_MAPPING_CT.REVISION_NUMBER,
  TERMS_KEY_MAPPING_CT.DRAWING_DATE,
  TERMS_KEY_MAPPING_CT.DRAWING_RECEIVED_DATE,
];

export const FILE_NAME_MAXIMUM_CHARACTERS_ERR_MESSAGE =
  'Something went wrong. Your file name has more than 400 characters.';
