import { SharePointService } from '../../src/services/sharepoint.service';
import { mockGraphApiResponses, mockSharePointApiResponses, mockEndpoints } from '../__mocks__/sharepoint.mock';
import { createMockSharePointSite, createMockSharePointFile } from '../utils/test-utils';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SharePointService', () => {
  let service: SharePointService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    service = new SharePointService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSites', () => {
    it('should fetch and return SharePoint sites', async () => {
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.sites) as any
      );

      const sites = await service.getSites(mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(mockEndpoints.sites, {
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(sites).toEqual(mockGraphApiResponses.sites.value);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.unauthorized() as any
      );

      await expect(service.getSites(mockAccessToken)).rejects.toThrow('Access denied');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getSites(mockAccessToken)).rejects.toThrow('Network error');
    });
  });

  describe('getSiteById', () => {
    it('should fetch a specific site by ID', async () => {
      const siteId = 'mock-site-1';
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.sites.value[0]) as any
      );

      const site = await service.getSiteById(siteId, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoints.sites}/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(site).toEqual(mockGraphApiResponses.sites.value[0]);
    });

    it('should handle site not found', async () => {
      const siteId = 'non-existent-site';
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.notFound() as any
      );

      await expect(service.getSiteById(siteId, mockAccessToken)).rejects.toThrow('Item not found');
    });
  });

  describe('getLibraries', () => {
    it('should fetch libraries for a site', async () => {
      const siteId = 'mock-site-1';
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.drives) as any
      );

      const libraries = await service.getLibraries(siteId, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(mockEndpoints.drives(siteId), {
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(libraries).toEqual(mockGraphApiResponses.drives.value);
    });
  });

  describe('getFiles', () => {
    it('should fetch files from a library', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.files) as any
      );

      const files = await service.getFiles(siteId, driveId, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(mockEndpoints.files(siteId, driveId), {
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(files).toEqual(mockGraphApiResponses.files.value);
    });

    it('should handle pagination', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const paginatedResponse = {
        ...mockGraphApiResponses.files,
        '@odata.nextLink': `${mockEndpoints.files(siteId, driveId)}?$skip=100`,
      };

      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(paginatedResponse) as any
      );

      const files = await service.getFiles(siteId, driveId, mockAccessToken);

      expect(files).toEqual(mockGraphApiResponses.files.value);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('getFileContent', () => {
    it('should fetch file content as text', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileId = 'mock-file-1';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockGraphApiResponses.fileContent),
      } as any);

      const content = await service.getFileContent(siteId, driveId, fileId, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        mockEndpoints.fileContent(siteId, driveId, fileId),
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
      expect(content).toBe(mockGraphApiResponses.fileContent);
    });

    it('should handle binary file downloads', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileId = 'mock-file-1';
      const mockBlob = new Blob(['binary content'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as any);

      const blob = await service.downloadFile(siteId, driveId, fileId, mockAccessToken);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/octet-stream');
    });
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileName = 'test-upload.txt';
      const fileContent = new Blob(['test content'], { type: 'text/plain' });
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.files.value[0]) as any
      );

      const result = await service.uploadFile(siteId, driveId, fileName, fileContent, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        mockEndpoints.upload(siteId, driveId, fileName),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'text/plain',
          },
          body: fileContent,
        }
      );
      expect(result).toEqual(mockGraphApiResponses.files.value[0]);
    });

    it('should handle upload errors', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileName = 'test-upload.txt';
      const fileContent = new Blob(['test content'], { type: 'text/plain' });
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.serverError() as any
      );

      await expect(
        service.uploadFile(siteId, driveId, fileName, fileContent, mockAccessToken)
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('searchFiles', () => {
    it('should search for files with query', async () => {
      const siteId = 'mock-site-1';
      const query = 'test document';
      const searchResults = {
        value: mockGraphApiResponses.files.value.filter(file => 
          file.name.toLowerCase().includes('document')
        ),
      };
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(searchResults) as any
      );

      const results = await service.searchFiles(siteId, query, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockEndpoints.search(siteId)}(q='${query}')`,
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(results).toEqual(searchResults.value);
    });

    it('should handle empty search results', async () => {
      const siteId = 'mock-site-1';
      const query = 'nonexistent';
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success({ value: [] }) as any
      );

      const results = await service.searchFiles(siteId, query, mockAccessToken);

      expect(results).toEqual([]);
    });
  });

  describe('updateFile', () => {
    it('should update file content', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileId = 'mock-file-1';
      const newContent = new Blob(['updated content'], { type: 'text/plain' });
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.files.value[0]) as any
      );

      const result = await service.updateFile(siteId, driveId, fileId, newContent, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockEndpoints.fileContent(siteId, driveId, fileId)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'text/plain',
          },
          body: newContent,
        }
      );
      expect(result).toEqual(mockGraphApiResponses.files.value[0]);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileId = 'mock-file-1';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as any);

      const result = await service.deleteFile(siteId, driveId, fileId, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileId = 'mock-file-1';
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.notFound() as any
      );

      await expect(
        service.deleteFile(siteId, driveId, fileId, mockAccessToken)
      ).rejects.toThrow('Item not found');
    });
  });

  describe('rate limiting', () => {
    it('should handle rate limit responses', async () => {
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.rateLimited() as any
      );

      await expect(service.getSites(mockAccessToken)).rejects.toThrow('Rate limit exceeded');
    });

    it('should retry after rate limit with exponential backoff', async () => {
      // First call gets rate limited
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.rateLimited() as any
      );
      
      // Second call succeeds
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.sites) as any
      );

      // Mock timer for retry delay
      jest.useFakeTimers();
      
      const promise = service.getSites(mockAccessToken);
      
      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(1000);
      
      const result = await promise;
      
      expect(result).toEqual(mockGraphApiResponses.sites.value);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user information', async () => {
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(mockGraphApiResponses.user) as any
      );

      const user = await service.getCurrentUser(mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(user).toEqual(mockGraphApiResponses.user);
    });
  });

  describe('batch operations', () => {
    it('should support batch requests for multiple operations', async () => {
      const batchRequests = [
        { method: 'GET', url: '/sites' },
        { method: 'GET', url: '/me' },
      ];
      
      const batchResponse = {
        responses: [
          { id: '1', status: 200, body: mockGraphApiResponses.sites },
          { id: '2', status: 200, body: mockGraphApiResponses.user },
        ],
      };
      
      mockFetch.mockResolvedValueOnce(
        mockSharePointApiResponses.success(batchResponse) as any
      );

      const results = await service.batchRequest(batchRequests, mockAccessToken);

      expect(mockFetch).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/$batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: batchRequests }),
      });
      expect(results).toEqual(batchResponse.responses);
    });
  });
});