import { SharePointSite, SharePointFile, SharePointLibrary, User } from '../../src/types';

// Mock SharePoint Graph API responses
export const mockGraphApiResponses = {
  sites: {
    value: [
      {
        id: 'mock-site-1',
        name: 'Mock Site 1',
        webUrl: 'https://tenant.sharepoint.com/sites/mocksite1',
        description: 'Mock site for testing',
        displayName: 'Mock Site 1',
        createdDateTime: '2023-01-01T00:00:00Z',
        lastModifiedDateTime: '2023-01-01T12:00:00Z',
      },
      {
        id: 'mock-site-2',
        name: 'Mock Site 2',
        webUrl: 'https://tenant.sharepoint.com/sites/mocksite2',
        description: 'Another mock site',
        displayName: 'Mock Site 2',
        createdDateTime: '2023-01-02T00:00:00Z',
        lastModifiedDateTime: '2023-01-02T12:00:00Z',
      },
    ],
  },
  drives: {
    value: [
      {
        id: 'mock-drive-1',
        name: 'Documents',
        displayName: 'Documents',
        description: 'Document library',
        webUrl: 'https://tenant.sharepoint.com/sites/mocksite1/Documents',
      },
    ],
  },
  files: {
    value: [
      {
        id: 'mock-file-1',
        name: 'document1.docx',
        size: 1024000,
        webUrl: 'https://tenant.sharepoint.com/sites/mocksite1/Documents/document1.docx',
        file: {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        createdDateTime: '2023-01-01T00:00:00Z',
        lastModifiedDateTime: '2023-01-01T12:00:00Z',
        createdBy: {
          user: {
            id: 'user1',
            displayName: 'John Doe',
            email: 'john@example.com',
          },
        },
        lastModifiedBy: {
          user: {
            id: 'user1',
            displayName: 'John Doe',
            email: 'john@example.com',
          },
        },
        parentReference: {
          path: '/drives/mock-drive-1/root:/Documents',
        },
      },
      {
        id: 'mock-file-2',
        name: 'presentation.pptx',
        size: 2048000,
        webUrl: 'https://tenant.sharepoint.com/sites/mocksite1/Documents/presentation.pptx',
        file: {
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
        createdDateTime: '2023-01-02T00:00:00Z',
        lastModifiedDateTime: '2023-01-02T12:00:00Z',
        createdBy: {
          user: {
            id: 'user2',
            displayName: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
        lastModifiedBy: {
          user: {
            id: 'user2',
            displayName: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
        parentReference: {
          path: '/drives/mock-drive-1/root:/Documents',
        },
      },
    ],
  },
  fileContent: 'Mock file content for testing purposes. This is a sample document with some text.',
  user: {
    id: 'current-user',
    displayName: 'Current User',
    mail: 'current@example.com',
    userPrincipalName: 'current@example.com',
  },
};

// Mock MSAL token response
export const mockTokenResponse = {
  accessToken: 'mock-access-token-12345',
  idToken: 'mock-id-token-12345',
  scopes: ['Sites.Read.All', 'Files.Read.All'],
  expiresOn: new Date(Date.now() + 3600000), // 1 hour from now
  account: {
    homeAccountId: 'mock-home-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'mock-tenant-id',
    username: 'test@example.com',
    localAccountId: 'mock-local-account-id',
    name: 'Test User',
  },
};

// Mock SharePoint service functions
export const createMockSharePointService = () => ({
  getSites: jest.fn().mockResolvedValue(mockGraphApiResponses.sites.value),
  getSiteById: jest.fn().mockResolvedValue(mockGraphApiResponses.sites.value[0]),
  getLibraries: jest.fn().mockResolvedValue(mockGraphApiResponses.drives.value),
  getFiles: jest.fn().mockResolvedValue(mockGraphApiResponses.files.value),
  getFileById: jest.fn().mockResolvedValue(mockGraphApiResponses.files.value[0]),
  downloadFile: jest.fn().mockResolvedValue(new Blob([mockGraphApiResponses.fileContent])),
  getFileContent: jest.fn().mockResolvedValue(mockGraphApiResponses.fileContent),
  uploadFile: jest.fn().mockResolvedValue(mockGraphApiResponses.files.value[0]),
  updateFile: jest.fn().mockResolvedValue(mockGraphApiResponses.files.value[0]),
  deleteFile: jest.fn().mockResolvedValue(true),
  searchFiles: jest.fn().mockResolvedValue(mockGraphApiResponses.files.value),
  getCurrentUser: jest.fn().mockResolvedValue(mockGraphApiResponses.user),
});

// Mock authentication service
export const createMockAuthService = () => ({
  login: jest.fn().mockResolvedValue(mockTokenResponse),
  logout: jest.fn().mockResolvedValue(undefined),
  getAccessToken: jest.fn().mockResolvedValue(mockTokenResponse.accessToken),
  isAuthenticated: jest.fn().mockReturnValue(true),
  getCurrentUser: jest.fn().mockResolvedValue(mockGraphApiResponses.user),
  handleRedirectPromise: jest.fn().mockResolvedValue(mockTokenResponse),
});

// Mock fetch responses for different scenarios
export const mockSharePointApiResponses = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  }),
  
  notFound: () => ({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: { code: 'itemNotFound', message: 'Item not found' } }),
    text: () => Promise.resolve('{"error":{"code":"itemNotFound","message":"Item not found"}}'),
  }),
  
  unauthorized: () => ({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: { code: 'unauthorized', message: 'Access denied' } }),
    text: () => Promise.resolve('{"error":{"code":"unauthorized","message":"Access denied"}}'),
  }),
  
  rateLimited: () => ({
    ok: false,
    status: 429,
    json: () => Promise.resolve({ error: { code: 'tooManyRequests', message: 'Rate limit exceeded' } }),
    text: () => Promise.resolve('{"error":{"code":"tooManyRequests","message":"Rate limit exceeded"}}'),
    headers: new Headers({
      'Retry-After': '60',
    }),
  }),
  
  serverError: () => ({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ error: { code: 'internalServerError', message: 'Internal server error' } }),
    text: () => Promise.resolve('{"error":{"code":"internalServerError","message":"Internal server error"}}'),
  }),
};

// Mock large file for performance testing
export const createMockLargeFile = (sizeInMB: number): File => {
  const content = 'a'.repeat(sizeInMB * 1024 * 1024);
  return new File([content], `large-file-${sizeInMB}mb.txt`, {
    type: 'text/plain',
    lastModified: Date.now(),
  });
};

// Mock SharePoint API endpoints
export const mockEndpoints = {
  sites: 'https://graph.microsoft.com/v1.0/sites',
  drives: (siteId: string) => `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
  files: (siteId: string, driveId: string) => `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`,
  fileContent: (siteId: string, driveId: string, fileId: string) => `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${fileId}/content`,
  upload: (siteId: string, driveId: string, fileName: string) => `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`,
  search: (siteId: string) => `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/search`,
};