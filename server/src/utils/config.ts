import dotenv from 'dotenv';
import { AuthConfig } from '../types/auth';

dotenv.config();

export const authConfig: AuthConfig = {
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_TENANT_ID || '',
  redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3001/auth/callback',
  scopes: [
    'openid',
    'profile',
    'email',
    'User.Read',
    'Sites.Read.All',
    'Files.Read.All',
    'offline_access'
  ]
};

export const serverConfig = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-change-in-production'
};

export const graphConfig = {
  apiEndpoint: process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0'
};

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || ''
};

export const sharepointConfig = {
  cacheOptions: {
    ttl: parseInt(process.env.SHAREPOINT_CACHE_TTL || '300000'), // 5 minutes default
    maxSize: parseInt(process.env.SHAREPOINT_CACHE_SIZE || '1000'), // 1000 items default
    enabled: process.env.SHAREPOINT_CACHE_ENABLED !== 'false' // enabled by default
  },
  retryOptions: {
    maxRetries: parseInt(process.env.SHAREPOINT_RETRY_MAX || '3'),
    baseDelay: parseInt(process.env.SHAREPOINT_RETRY_BASE_DELAY || '1000'),
    maxDelay: parseInt(process.env.SHAREPOINT_RETRY_MAX_DELAY || '10000'),
    backoffMultiplier: parseFloat(process.env.SHAREPOINT_RETRY_BACKOFF || '2'),
    retryableStatusCodes: [429, 500, 502, 503, 504],
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET']
  },
  maxFileSize: parseInt(process.env.SHAREPOINT_MAX_FILE_SIZE || '104857600'), // 100MB default
  textExtractionEnabled: process.env.SHAREPOINT_TEXT_EXTRACTION !== 'false', // enabled by default
  supportedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'application/json',
    'text/csv'
  ]
};

// Validation function to ensure all required config is present
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AZURE_TENANT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`- ${varName}`);
    });
    throw new Error('Configuration validation failed. Please check your .env file.');
  }

  console.log('Configuration validated successfully');
};