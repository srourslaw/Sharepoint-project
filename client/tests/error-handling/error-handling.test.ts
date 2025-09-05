import { SharePointService } from '../../src/services/sharepoint.service';
import { AIService } from '../../src/services/ai.service';
import { AuthService } from '../../src/services/auth.service';
import { ErrorHandler } from '../../src/utils/error-handler';
import { mockSharePointApiResponses, mockAiErrors } from '../__mocks__/sharepoint.mock';
import { waitFor } from '../utils/test-utils';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods to avoid noise in test output
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handling Tests', () => {
  let sharePointService: SharePointService;
  let aiService: AIService;
  let authService: AuthService;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    sharePointService = new SharePointService();
    aiService = new AIService({
      apiKey: 'test-key',
      endpoint: 'http://localhost:3001',
      model: 'gpt-4',
    });
    authService = new AuthService({
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      redirectUri: 'http://localhost:3000',
    });
    errorHandler = new ErrorHandler();

    mockFetch.mockClear();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('Network Error Handling', () => {
    it('should handle network connectivity errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Network request failed');

      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network request failed')
      );
    });

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('getaddrinfo ENOTFOUND');
    });

    it('should handle connection timeouts', async () => {
      mockFetch.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      jest.useFakeTimers();
      
      const promise = sharePointService.getSites('mock-token');
      jest.advanceTimersByTime(150);
      
      await expect(promise).rejects.toThrow('Request timeout');
      
      jest.useRealTimers();
    });

    it('should retry network requests with exponential backoff', async () => {
      let attemptCount = 0;
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary network error'));
        }
        return Promise.resolve(mockSharePointApiResponses.success({ value: [] }) as any);
      });

      jest.useFakeTimers();
      
      const promise = sharePointService.getSites('mock-token');
      
      // Fast-forward through retry delays
      jest.advanceTimersByTime(5000);
      
      const result = await promise;
      expect(result).toEqual([]);
      expect(attemptCount).toBe(3);
      
      jest.useRealTimers();
    });
  });

  describe('HTTP Error Handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      mockFetch.mockResolvedValue(mockSharePointApiResponses.unauthorized() as any);

      await expect(
        sharePointService.getSites('invalid-token')
      ).rejects.toThrow('Access denied');
    });

    it('should handle 403 Forbidden errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: { code: 'forbidden', message: 'Insufficient privileges' }
        }),
      } as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Insufficient privileges');
    });

    it('should handle 404 Not Found errors', async () => {
      mockFetch.mockResolvedValue(mockSharePointApiResponses.notFound() as any);

      await expect(
        sharePointService.getSiteById('nonexistent-site', 'mock-token')
      ).rejects.toThrow('Item not found');
    });

    it('should handle 429 Rate Limiting with Retry-After', async () => {
      mockFetch
        .mockResolvedValueOnce(mockSharePointApiResponses.rateLimited() as any)
        .mockResolvedValueOnce(mockSharePointApiResponses.success({ value: [] }) as any);

      jest.useFakeTimers();
      
      const promise = sharePointService.getSites('mock-token');
      
      // Fast-forward past the retry delay
      jest.advanceTimersByTime(61000); // 61 seconds
      
      const result = await promise;
      expect(result).toEqual([]);
      
      jest.useRealTimers();
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue(mockSharePointApiResponses.serverError() as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Internal server error');
    });

    it('should handle 502 Bad Gateway errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.resolve({
          error: { code: 'badGateway', message: 'Bad gateway' }
        }),
      } as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Bad gateway');
    });

    it('should handle 503 Service Unavailable with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({
            error: { code: 'serviceUnavailable', message: 'Service temporarily unavailable' }
          }),
        } as any)
        .mockResolvedValueOnce(mockSharePointApiResponses.success({ value: [] }) as any);

      jest.useFakeTimers();
      
      const promise = sharePointService.getSites('mock-token');
      jest.advanceTimersByTime(2000);
      
      const result = await promise;
      expect(result).toEqual([]);
      
      jest.useRealTimers();
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle expired tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { 
            code: 'InvalidAuthenticationToken', 
            message: 'Access token has expired' 
          }
        }),
      } as any);

      const error = await sharePointService.getSites('expired-token').catch(e => e);
      
      expect(error.message).toContain('Access token has expired');
      expect(error.code).toBe('InvalidAuthenticationToken');
    });

    it('should handle invalid token format', async () => {
      await expect(
        sharePointService.getSites('invalid.token.format')
      ).rejects.toThrow('Invalid token format');
    });

    it('should handle missing scopes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: { 
            code: 'Forbidden', 
            message: 'Insufficient privileges to complete the operation.' 
          }
        }),
      } as any);

      await expect(
        sharePointService.getSites('insufficient-scope-token')
      ).rejects.toThrow('Insufficient privileges');
    });
  });

  describe('AI Service Error Handling', () => {
    it('should handle AI API rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve(mockAiErrors.rateLimitExceeded),
      } as any);

      await expect(
        aiService.summarizeText({
          text: 'test',
          summaryType: 'abstractive',
          length: 'short',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle content too long errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAiErrors.contentTooLong),
      } as any);

      await expect(
        aiService.summarizeText({
          text: 'x'.repeat(100000),
          summaryType: 'abstractive',
          length: 'short',
        })
      ).rejects.toThrow('Content exceeds maximum token limit');
    });

    it('should handle invalid API key errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockAiErrors.invalidApiKey),
      } as any);

      await expect(
        aiService.summarizeText({
          text: 'test',
          summaryType: 'abstractive',
          length: 'short',
        })
      ).rejects.toThrow('Invalid API key provided');
    });

    it('should handle unsupported language errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAiErrors.unsupportedLanguage),
      } as any);

      await expect(
        aiService.translateText('Hello', 'xyz')
      ).rejects.toThrow('Language not supported');
    });

    it('should handle service unavailable errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve(mockAiErrors.serviceUnavailable),
      } as any);

      await expect(
        aiService.summarizeText({
          text: 'test',
          summaryType: 'abstractive',
          length: 'short',
        })
      ).rejects.toThrow('AI service is temporarily unavailable');
    });
  });

  describe('File Processing Error Handling', () => {
    it('should handle corrupted file errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { code: 'invalidFile', message: 'File is corrupted or invalid' }
        }),
      } as any);

      await expect(
        sharePointService.getFileContent('site', 'drive', 'corrupted-file', 'token')
      ).rejects.toThrow('File is corrupted or invalid');
    });

    it('should handle file too large errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        json: () => Promise.resolve({
          error: { code: 'fileTooLarge', message: 'File size exceeds maximum limit' }
        }),
      } as any);

      const largeFile = new Blob(['x'.repeat(100 * 1024 * 1024)]); // 100MB
      
      await expect(
        sharePointService.uploadFile('site', 'drive', 'large.bin', largeFile, 'token')
      ).rejects.toThrow('File size exceeds maximum limit');
    });

    it('should handle unsupported file type errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { code: 'unsupportedFileType', message: 'File type not supported' }
        }),
      } as any);

      const unsupportedFile = new Blob(['test'], { type: 'application/x-evil' });
      
      await expect(
        sharePointService.uploadFile('site', 'drive', 'evil.exe', unsupportedFile, 'token')
      ).rejects.toThrow('File type not supported');
    });

    it('should handle storage quota exceeded errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 507,
        json: () => Promise.resolve({
          error: { code: 'insufficientStorage', message: 'Storage quota exceeded' }
        }),
      } as any);

      const file = new Blob(['test content']);
      
      await expect(
        sharePointService.uploadFile('site', 'drive', 'test.txt', file, 'token')
      ).rejects.toThrow('Storage quota exceeded');
    });
  });

  describe('Data Validation Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected token in JSON')),
        text: () => Promise.resolve('Invalid JSON response'),
      } as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Invalid response format');
    });

    it('should handle missing required fields in responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ incomplete: 'data' }),
      } as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Invalid response structure');
    });

    it('should handle type mismatches in API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          value: 'should be array', // Wrong type
        }),
      } as any);

      await expect(
        sharePointService.getSites('mock-token')
      ).rejects.toThrow('Invalid response type');
    });
  });

  describe('Concurrent Operation Error Handling', () => {
    it('should handle concurrent request failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error 1' } }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error 2' } }),
        } as any)
        .mockResolvedValueOnce(mockSharePointApiResponses.success({ value: [] }) as any);

      const promises = [
        sharePointService.getSites('token1').catch(e => e),
        sharePointService.getSites('token2').catch(e => e),
        sharePointService.getSites('token3'),
      ];

      const results = await Promise.allSettled(promises);

      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should handle partial failures in batch operations', async () => {
      const batchResponse = {
        responses: [
          { id: '1', status: 200, body: { value: [] } },
          { id: '2', status: 404, body: { error: { message: 'Not found' } } },
          { id: '3', status: 500, body: { error: { message: 'Server error' } } },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(batchResponse),
      } as any);

      const results = await sharePointService.batchRequest([
        { id: '1', method: 'GET', url: '/sites' },
        { id: '2', method: 'GET', url: '/sites/missing' },
        { id: '3', method: 'GET', url: '/sites/error' },
      ], 'mock-token');

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(404);
      expect(results[2].status).toBe(500);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should implement circuit breaker pattern', async () => {
      // Simulate repeated failures to trigger circuit breaker
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Server error' } }),
        } as any)
      );

      const circuitBreakerService = new SharePointService({ 
        circuitBreakerThreshold: 3,
        circuitBreakerTimeout: 1000,
      });

      // Make multiple requests to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreakerService.getSites('mock-token');
        } catch (error) {
          if (i >= 3) {
            expect(error.message).toContain('Circuit breaker is open');
          }
        }
      }
    });

    it('should implement graceful degradation', async () => {
      const fallbackData = [{ id: 'cached-site', name: 'Cached Site' }];
      
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const serviceWithFallback = new SharePointService({ 
        fallbackEnabled: true,
        fallbackData: { sites: fallbackData },
      });

      const result = await serviceWithFallback.getSites('mock-token');
      
      expect(result).toEqual(fallbackData);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback data')
      );
    });

    it('should handle cascading failures', async () => {
      // Simulate auth service failure leading to API failures
      mockFetch
        .mockRejectedValueOnce(new Error('Auth service down'))
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'Invalid token' }
          }),
        } as any);

      // First, auth fails
      await expect(
        authService.getAccessToken()
      ).rejects.toThrow('Auth service down');

      // Then, API call fails due to invalid token
      await expect(
        sharePointService.getSites('invalid-token')
      ).rejects.toThrow('Invalid token');
    });
  });

  describe('Error Reporting and Monitoring', () => {
    it('should collect error metrics', async () => {
      const metricsCollector = jest.fn();
      const serviceWithMetrics = new SharePointService({ 
        metricsCollector,
      });

      mockFetch.mockRejectedValue(new Error('Test error'));

      try {
        await serviceWithMetrics.getSites('mock-token');
      } catch (error) {
        // Error expected
      }

      expect(metricsCollector).toHaveBeenCalledWith({
        operation: 'getSites',
        error: 'Test error',
        timestamp: expect.any(Number),
        duration: expect.any(Number),
      });
    });

    it('should categorize errors correctly', () => {
      const errors = [
        new Error('Network request failed'),
        new Error('Rate limit exceeded'),
        new Error('Invalid token'),
        new Error('File not found'),
        new Error('Internal server error'),
      ];

      const categorizedErrors = errors.map(error => 
        errorHandler.categorizeError(error)
      );

      expect(categorizedErrors[0].category).toBe('NETWORK');
      expect(categorizedErrors[1].category).toBe('RATE_LIMIT');
      expect(categorizedErrors[2].category).toBe('AUTHENTICATION');
      expect(categorizedErrors[3].category).toBe('NOT_FOUND');
      expect(categorizedErrors[4].category).toBe('SERVER_ERROR');
    });

    it('should generate error reports', async () => {
      const errors = [
        { message: 'Error 1', timestamp: Date.now(), service: 'SharePoint' },
        { message: 'Error 2', timestamp: Date.now(), service: 'AI' },
        { message: 'Error 3', timestamp: Date.now(), service: 'Auth' },
      ];

      const report = errorHandler.generateErrorReport(errors);

      expect(report.totalErrors).toBe(3);
      expect(report.errorsByService.SharePoint).toBe(1);
      expect(report.errorsByService.AI).toBe(1);
      expect(report.errorsByService.Auth).toBe(1);
      expect(report.timeRange.start).toBeDefined();
      expect(report.timeRange.end).toBeDefined();
    });
  });

  describe('User-Facing Error Handling', () => {
    it('should provide user-friendly error messages', () => {
      const technicalErrors = [
        'XMLHttpRequest failed',
        'ECONNRESET',
        'InvalidAuthenticationToken',
        'HTTP 429 Too Many Requests',
      ];

      const friendlyMessages = technicalErrors.map(error => 
        errorHandler.getUserFriendlyMessage(error)
      );

      expect(friendlyMessages[0]).toBe('Connection problem. Please check your internet connection.');
      expect(friendlyMessages[1]).toBe('Connection was interrupted. Please try again.');
      expect(friendlyMessages[2]).toBe('Please sign in again to continue.');
      expect(friendlyMessages[3]).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should provide recovery suggestions', () => {
      const errors = [
        'Network request failed',
        'Access denied',
        'File too large',
        'Service unavailable',
      ];

      const suggestions = errors.map(error => 
        errorHandler.getRecoverySuggestions(error)
      );

      expect(suggestions[0]).toContain('Check your internet connection');
      expect(suggestions[1]).toContain('Contact your administrator');
      expect(suggestions[2]).toContain('Try a smaller file');
      expect(suggestions[3]).toContain('Try again later');
    });

    it('should track error resolution', async () => {
      const errorId = 'error-123';
      const resolution = 'Retried operation successfully';

      errorHandler.trackErrorResolution(errorId, resolution);

      const errorHistory = errorHandler.getErrorHistory(errorId);
      
      expect(errorHistory.resolved).toBe(true);
      expect(errorHistory.resolution).toBe(resolution);
      expect(errorHistory.resolvedAt).toBeDefined();
    });
  });
});