import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';

// SharePoint API service based on successful DMS project
export class SharePointService {
  private msalInstance: PublicClientApplication;
  private apiCache: Map<string, AxiosInstance> = new Map();

  constructor(msalInstance: PublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  // Create axios instance for SharePoint site - matching DMS pattern
  private createApiInstance(siteUrl: string, token: string): AxiosInstance {
    const cacheKey = `${siteUrl}_${token.substring(0, 10)}`;

    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey)!;
    }

    const instance = axios.create({
      baseURL: siteUrl,
      headers: {
        'Content-Type': 'application/json;odata=verbose', // Critical DMS pattern
        'Accept': 'application/json;odata=verbose',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 30000,
    });

    // Add request interceptor for debugging
    instance.interceptors.request.use((config) => {
      console.log(`SharePoint API: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('SharePoint API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    this.apiCache.set(cacheKey, instance);
    return instance;
  }

  // Get access token for SharePoint API calls
  private async getAccessToken(): Promise<string> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No authenticated accounts found');
      }

      const silentRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
        account: accounts[0],
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  // Get form digest for write operations - critical DMS pattern
  private async getFormDigest(siteUrl: string, token: string): Promise<string> {
    const api = this.createApiInstance(siteUrl, token);

    try {
      const response = await api.post('/_api/contextinfo');
      return response.data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error('Failed to get form digest:', error);
      throw error;
    }
  }

  // Get SharePoint sites - using Graph API like DMS
  async getSites(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await graphApi.get('/sites?search=*');
      return response.data.value || [];
    } catch (error) {
      console.error('Failed to get sites:', error);
      throw error;
    }
  }

  // Get document libraries for a site
  async getDocumentLibraries(siteId: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await graphApi.get(`/sites/${siteId}/drives`);
      return response.data.value || [];
    } catch (error) {
      console.error('Failed to get document libraries:', error);
      throw error;
    }
  }

  // Get files from a drive/library
  async getFiles(siteId: string, driveId: string, folderId?: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const endpoint = folderId
        ? `/sites/${siteId}/drives/${driveId}/items/${folderId}/children`
        : `/sites/${siteId}/drives/${driveId}/root/children`;

      const response = await graphApi.get(endpoint);
      return response.data.value || [];
    } catch (error) {
      console.error('Failed to get files:', error);
      throw error;
    }
  }

  // Get file content preview
  async getFileContent(siteId: string, driveId: string, itemId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Get file metadata and preview URL
      const response = await graphApi.get(`/sites/${siteId}/drives/${driveId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw error;
    }
  }

  // Search files across SharePoint - DMS pattern
  async searchFiles(query: string, siteId?: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const searchQuery = {
        requests: [
          {
            entityTypes: ['driveItem'],
            query: {
              queryString: query,
            },
            from: 0,
            size: 25,
          },
        ],
      };

      const response = await graphApi.post('/search/query', searchQuery);
      return response.data.value?.[0]?.hitsContainers?.[0]?.hits || [];
    } catch (error) {
      console.error('Failed to search files:', error);
      throw error;
    }
  }

  // Upload file to SharePoint - following DMS pattern
  async uploadFile(
    siteId: string,
    driveId: string,
    fileName: string,
    file: File,
    parentId?: string
  ): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const graphApi = axios.create({
        baseURL: 'https://graph.microsoft.com/v1.0',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      const uploadPath = parentId
        ? `/sites/${siteId}/drives/${driveId}/items/${parentId}:/${fileName}:/content`
        : `/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`;

      const response = await graphApi.put(uploadPath, file);
      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}

// Export singleton instance
let sharepointService: SharePointService | null = null;

export const getSharePointService = (msalInstance: PublicClientApplication): SharePointService => {
  if (!sharepointService) {
    sharepointService = new SharePointService(msalInstance);
  }
  return sharepointService;
};