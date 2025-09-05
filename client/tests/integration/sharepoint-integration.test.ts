import { SharePointService } from '../../src/services/sharepoint.service';
import { AuthService } from '../../src/services/auth.service';
import { mockTokenResponse, mockGraphApiResponses } from '../__mocks__/sharepoint.mock';
import { createMockFile, waitFor } from '../utils/test-utils';

// Integration tests that test the full flow of SharePoint operations
describe('SharePoint Integration Tests', () => {
  let sharePointService: SharePointService;
  let authService: AuthService;
  let accessToken: string;

  beforeAll(async () => {
    // Initialize services
    sharePointService = new SharePointService();
    authService = new AuthService({
      clientId: process.env.REACT_APP_SHAREPOINT_CLIENT_ID!,
      tenantId: process.env.REACT_APP_SHAREPOINT_TENANT_ID!,
      redirectUri: 'http://localhost:3000',
    });

    // Mock authentication for integration tests
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue('mock-access-token');
    accessToken = await authService.getAccessToken();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Complete SharePoint Workflow', () => {
    it('should perform a complete site-to-file workflow', async () => {
      // Mock the entire API chain
      global.fetch = jest.fn()
        // Get sites
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.sites),
        } as any)
        // Get drives for first site
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.drives),
        } as any)
        // Get files from first drive
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.files),
        } as any)
        // Get content of first file
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockGraphApiResponses.fileContent),
        } as any);

      // Step 1: Get all sites
      const sites = await sharePointService.getSites(accessToken);
      expect(sites).toHaveLength(2);
      expect(sites[0].name).toBe('Mock Site 1');

      // Step 2: Get libraries for the first site
      const siteId = sites[0].id;
      const libraries = await sharePointService.getLibraries(siteId, accessToken);
      expect(libraries).toHaveLength(1);
      expect(libraries[0].name).toBe('Documents');

      // Step 3: Get files from the first library
      const driveId = libraries[0].id;
      const files = await sharePointService.getFiles(siteId, driveId, accessToken);
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('document1.docx');

      // Step 4: Get content of the first file
      const fileId = files[0].id;
      const fileContent = await sharePointService.getFileContent(siteId, driveId, fileId, accessToken);
      expect(fileContent).toBe(mockGraphApiResponses.fileContent);

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle file upload and update workflow', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileName = 'integration-test.txt';
      const originalContent = 'Original content';
      const updatedContent = 'Updated content';

      const mockFile = createMockFile(fileName, originalContent, 'text/plain');
      const updatedBlob = new Blob([updatedContent], { type: 'text/plain' });

      global.fetch = jest.fn()
        // Upload file
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockGraphApiResponses.files.value[0],
            name: fileName,
          }),
        } as any)
        // Update file
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockGraphApiResponses.files.value[0],
            name: fileName,
            lastModifiedDateTime: new Date().toISOString(),
          }),
        } as any)
        // Get updated content
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(updatedContent),
        } as any)
        // Delete file
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        } as any);

      // Step 1: Upload file
      const uploadResult = await sharePointService.uploadFile(
        siteId,
        driveId,
        fileName,
        mockFile,
        accessToken
      );
      expect(uploadResult.name).toBe(fileName);

      // Step 2: Update file content
      const fileId = uploadResult.id;
      const updateResult = await sharePointService.updateFile(
        siteId,
        driveId,
        fileId,
        updatedBlob,
        accessToken
      );
      expect(updateResult.lastModifiedDateTime).toBeDefined();

      // Step 3: Verify updated content
      const retrievedContent = await sharePointService.getFileContent(
        siteId,
        driveId,
        fileId,
        accessToken
      );
      expect(retrievedContent).toBe(updatedContent);

      // Step 4: Clean up - delete file
      const deleteResult = await sharePointService.deleteFile(
        siteId,
        driveId,
        fileId,
        accessToken
      );
      expect(deleteResult).toBe(true);

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Search Integration', () => {
    it('should perform comprehensive search across sites', async () => {
      const searchQuery = 'artificial intelligence';
      const searchResults = {
        value: [
          {
            ...mockGraphApiResponses.files.value[0],
            name: 'AI Document.docx',
            snippet: 'This document discusses artificial intelligence applications...',
          },
          {
            ...mockGraphApiResponses.files.value[1],
            name: 'Machine Learning Guide.pptx',
            snippet: 'Comprehensive guide to machine learning and AI...',
          },
        ],
      };

      global.fetch = jest.fn()
        // Get sites for search
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.sites),
        } as any)
        // Search in first site
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResults),
        } as any)
        // Search in second site
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ value: [] }), // No results in second site
        } as any);

      // Get all sites first
      const sites = await sharePointService.getSites(accessToken);

      // Perform search across all sites
      const allResults = [];
      for (const site of sites) {
        const siteResults = await sharePointService.searchFiles(
          site.id,
          searchQuery,
          accessToken
        );
        allResults.push(...siteResults);
      }

      expect(allResults).toHaveLength(2);
      expect(allResults[0].name).toContain('AI');
      expect(allResults[1].name).toContain('Machine Learning');
    });
  });

  describe('Batch Operations', () => {
    it('should perform batch operations efficiently', async () => {
      const batchRequests = [
        { id: '1', method: 'GET', url: '/sites' },
        { id: '2', method: 'GET', url: '/me' },
        { id: '3', method: 'GET', url: '/sites/mock-site-1/drives' },
      ];

      const batchResponse = {
        responses: [
          { id: '1', status: 200, body: mockGraphApiResponses.sites },
          { id: '2', status: 200, body: mockGraphApiResponses.user },
          { id: '3', status: 200, body: mockGraphApiResponses.drives },
        ],
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(batchResponse),
      } as any);

      const results = await sharePointService.batchRequest(batchRequests, accessToken);

      expect(results).toHaveLength(3);
      expect(results[0].body).toEqual(mockGraphApiResponses.sites);
      expect(results[1].body).toEqual(mockGraphApiResponses.user);
      expect(results[2].body).toEqual(mockGraphApiResponses.drives);

      // Should only make one API call for the batch
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          // First two attempts fail with rate limit
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({
              error: { code: 'tooManyRequests', message: 'Rate limit exceeded' }
            }),
            headers: new Headers({ 'Retry-After': '1' }),
          } as any);
        } else {
          // Third attempt succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGraphApiResponses.sites),
          } as any);
        }
      });

      jest.useFakeTimers();

      // Start the request
      const promise = sharePointService.getSites(accessToken);

      // Fast-forward through retry delays
      jest.advanceTimersByTime(2000); // Wait for first retry
      jest.advanceTimersByTime(4000); // Wait for second retry

      const result = await promise;

      expect(result).toEqual(mockGraphApiResponses.sites.value);
      expect(attemptCount).toBe(3);

      jest.useRealTimers();
    });

    it('should handle network connectivity issues', async () => {
      let networkUp = false;

      global.fetch = jest.fn().mockImplementation(() => {
        if (!networkUp) {
          throw new Error('Network request failed');
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.sites),
        } as any);
      });

      // Initially network is down
      await expect(sharePointService.getSites(accessToken)).rejects.toThrow('Network request failed');

      // Network comes back up
      networkUp = true;
      const result = await sharePointService.getSites(accessToken);
      expect(result).toEqual(mockGraphApiResponses.sites.value);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent file operations', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileCount = 5;

      // Mock responses for multiple file uploads
      global.fetch = jest.fn();
      for (let i = 0; i < fileCount; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockGraphApiResponses.files.value[0],
            id: `file-${i}`,
            name: `concurrent-file-${i}.txt`,
          }),
        } as any);
      }

      // Create multiple files
      const files = Array.from({ length: fileCount }, (_, i) =>
        createMockFile(`concurrent-file-${i}.txt`, `Content ${i}`, 'text/plain')
      );

      // Upload files concurrently
      const uploadPromises = files.map((file, i) =>
        sharePointService.uploadFile(siteId, driveId, file.name, file, accessToken)
      );

      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(fileCount);
      results.forEach((result, i) => {
        expect(result.name).toBe(`concurrent-file-${i}.txt`);
      });

      expect(global.fetch).toHaveBeenCalledTimes(fileCount);
    });

    it('should handle concurrent requests with proper queuing', async () => {
      const requestCount = 10;
      const responses = Array.from({ length: requestCount }, (_, i) => ({
        ok: true,
        json: () => Promise.resolve({
          ...mockGraphApiResponses.sites.value[0],
          id: `site-${i}`,
        }),
      }));

      global.fetch = jest.fn();
      responses.forEach(response => {
        (global.fetch as jest.Mock).mockResolvedValueOnce(response as any);
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: requestCount }, (_, i) =>
        sharePointService.getSiteById(`site-${i}`, accessToken)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(requestCount);
      expect(global.fetch).toHaveBeenCalledTimes(requestCount);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data integrity during complex operations', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const fileName = 'integrity-test.json';
      
      const complexData = {
        id: '12345',
        title: 'Test Document',
        content: {
          sections: [
            { title: 'Introduction', text: 'This is the introduction' },
            { title: 'Body', text: 'This is the main content' },
            { title: 'Conclusion', text: 'This is the conclusion' },
          ],
        },
        metadata: {
          author: 'Test Author',
          created: new Date().toISOString(),
          tags: ['test', 'integration', 'data'],
        },
      };

      const jsonContent = JSON.stringify(complexData, null, 2);
      const file = createMockFile(fileName, jsonContent, 'application/json');

      global.fetch = jest.fn()
        // Upload
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockGraphApiResponses.files.value[0],
            name: fileName,
            id: 'integrity-file-id',
          }),
        } as any)
        // Download to verify
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(jsonContent),
        } as any);

      // Upload the file
      const uploadResult = await sharePointService.uploadFile(
        siteId,
        driveId,
        fileName,
        file,
        accessToken
      );

      // Download and verify the content
      const downloadedContent = await sharePointService.getFileContent(
        siteId,
        driveId,
        uploadResult.id,
        accessToken
      );

      const parsedData = JSON.parse(downloadedContent);

      expect(parsedData).toEqual(complexData);
      expect(parsedData.content.sections).toHaveLength(3);
      expect(parsedData.metadata.tags).toContain('integration');
    });
  });

  describe('Large File Handling', () => {
    it('should handle file upload with proper chunking', async () => {
      const siteId = 'mock-site-1';
      const driveId = 'mock-drive-1';
      const largeFileName = 'large-file.bin';
      
      // Create a mock large file (5MB)
      const largeContent = 'x'.repeat(5 * 1024 * 1024);
      const largeFile = createMockFile(largeFileName, largeContent, 'application/octet-stream');

      // Mock chunked upload responses
      global.fetch = jest.fn()
        // Create upload session
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://mock-upload-url',
          }),
        } as any)
        // Upload chunks (simulate 3 chunks)
        .mockResolvedValueOnce({
          ok: true,
          status: 202, // Accepted, more chunks expected
          headers: new Headers({
            'Range': 'bytes=0-1677721',
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 202,
          headers: new Headers({
            'Range': 'bytes=0-3355443',
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201, // Created, upload complete
          json: () => Promise.resolve({
            ...mockGraphApiResponses.files.value[0],
            name: largeFileName,
            size: largeFile.size,
          }),
        } as any);

      const result = await sharePointService.uploadLargeFile(
        siteId,
        driveId,
        largeFileName,
        largeFile,
        accessToken
      );

      expect(result.name).toBe(largeFileName);
      expect(result.size).toBe(largeFile.size);
      
      // Should have made 4 calls: create session + 3 chunk uploads
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Permissions and Security', () => {
    it('should handle permission-based access correctly', async () => {
      const restrictedSiteId = 'restricted-site';

      global.fetch = jest.fn()
        // First call succeeds (user has read access)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGraphApiResponses.sites.value[0]),
        } as any)
        // Second call fails (user lacks write access)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: { code: 'forbidden', message: 'Insufficient privileges' }
          }),
        } as any);

      // Can read site information
      const site = await sharePointService.getSiteById(restrictedSiteId, accessToken);
      expect(site).toBeDefined();

      // Cannot upload files
      const file = createMockFile('test.txt', 'content', 'text/plain');
      await expect(
        sharePointService.uploadFile(restrictedSiteId, 'drive-id', 'test.txt', file, accessToken)
      ).rejects.toThrow('Insufficient privileges');
    });
  });
});