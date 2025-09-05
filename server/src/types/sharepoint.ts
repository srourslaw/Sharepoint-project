// SharePoint Service Types and Interfaces

export interface SharePointSite {
  id: string;
  displayName: string;
  name: string;
  webUrl: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  siteCollection?: {
    hostname: string;
  };
  root?: {
    serverRelativeUrl: string;
  };
}

export interface DocumentLibrary {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  driveType: string;
  quota?: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  mimeType: string;
  file?: {
    hashes?: {
      sha1Hash?: string;
      quickXorHash?: string;
    };
  };
  folder?: {
    childCount: number;
  };
  parentReference: {
    driveId: string;
    path: string;
    siteId?: string;
  };
  createdBy: {
    user: {
      displayName: string;
      email?: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email?: string;
    };
  };
  downloadUrl?: string;
}

export interface SharePointFolder extends Omit<SharePointFile, 'mimeType' | 'file'> {
  folder: {
    childCount: number;
  };
  children?: SharePointItem[];
}

export type SharePointItem = SharePointFile | SharePointFolder;

export interface FileContent {
  content: Buffer | string;
  mimeType: string;
  size: number;
  encoding?: string;
  extractedText?: string;
  metadata?: Record<string, any>;
}

export interface UploadFileOptions {
  fileName: string;
  content: Buffer | string;
  mimeType?: string;
  conflictBehavior?: 'fail' | 'replace' | 'rename';
  chunkSize?: number; // For large file uploads
}

export class SharePointError extends Error {
  public code: string;
  public statusCode?: number;
  public innerError?: {
    code?: string;
    message?: string;
    'request-id'?: string;
    date?: string;
  };
  public retryAfter?: number;

  constructor(code: string, message: string, statusCode?: number, innerError?: any) {
    super(message);
    this.name = 'SharePointError';
    this.code = code;
    this.statusCode = statusCode;
    this.innerError = innerError;
  }
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  enabled: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface SharePointServiceConfig {
  retryOptions: RetryOptions;
  cacheOptions: CacheOptions;
  maxFileSize: number; // Maximum file size for operations (bytes)
  supportedMimeTypes: string[];
  textExtractionEnabled: boolean;
}

// API Response types
export interface SharePointApiResponse<T> {
  value?: T[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
}

export interface DriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  file?: {
    mimeType: string;
    hashes?: {
      sha1Hash?: string;
    };
  };
  folder?: {
    childCount: number;
  };
  parentReference?: {
    driveId: string;
    path: string;
  };
  createdBy?: {
    user: {
      displayName: string;
      email?: string;
    };
  };
  lastModifiedBy?: {
    user: {
      displayName: string;
      email?: string;
    };
  };
  '@microsoft.graph.downloadUrl'?: string;
}

// File type categories for different handling
export enum FileType {
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet', 
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  TEXT = 'text',
  IMAGE = 'image',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

export interface FileTypeInfo {
  type: FileType;
  mimeTypes: string[];
  extensions: string[];
  textExtractionSupported: boolean;
  maxSize?: number;
}

// Search and filtering
export interface SearchOptions {
  query?: string;
  fileType?: FileType;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  createdBy?: string;
  sizeMin?: number;
  sizeMax?: number;
  limit?: number;
  offset?: number;
}

export interface ListOptions {
  recursive?: boolean;
  includeHidden?: boolean;
  orderBy?: 'name' | 'lastModifiedDateTime' | 'size' | 'createdDateTime';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  filter?: string;
}

// Permission and sharing
export interface SharePointPermission {
  id: string;
  roles: string[];
  grantedTo?: {
    user?: {
      displayName: string;
      email: string;
    };
    group?: {
      displayName: string;
      email: string;
    };
  };
  inheritedFrom?: {
    driveId: string;
    id: string;
    path: string;
  };
}

// Batch operations
export interface BatchRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchResponse {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
}

// Upload session for large files
export interface UploadSession {
  uploadUrl: string;
  expirationDateTime: string;
  nextExpectedRanges: string[];
}

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed?: number; // bytes per second
  estimatedTimeRemaining?: number; // seconds
}

export interface ProcessingProgress {
  stage: 'reading' | 'parsing' | 'extracting' | 'formatting' | 'complete';
  percentage: number;
  message: string;
  bytesProcessed?: number;
  totalBytes?: number;
  currentItem?: string;
  itemsProcessed?: number;
  totalItems?: number;
}