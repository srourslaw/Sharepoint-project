// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.REACT_APP_SHAREPOINT_CLIENT_ID = 'test-client-id';
process.env.REACT_APP_SHAREPOINT_TENANT_ID = 'test-tenant-id';
process.env.REACT_APP_AI_API_ENDPOINT = 'http://localhost:3001';
process.env.REACT_APP_AI_API_KEY = 'test-api-key';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;