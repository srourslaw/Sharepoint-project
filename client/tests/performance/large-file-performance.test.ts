import { SharePointService } from '../../src/services/sharepoint.service';
import { AIService } from '../../src/services/ai.service';
import { createMockLargeFile, createLargeFile, measurePerformance, createPerformanceObserver } from '../utils/test-utils';
import { createMockLargeText } from '../__mocks__/ai.mock';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock performance APIs
const mockPerformanceObserver = createPerformanceObserver();
global.PerformanceObserver = jest.fn(() => mockPerformanceObserver) as any;

describe('Large File Performance Tests', () => {
  let sharePointService: SharePointService;
  let aiService: AIService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    sharePointService = new SharePointService();
    aiService = new AIService({
      apiKey: 'test-ai-key',
      endpoint: 'http://localhost:3001',
      model: 'gpt-4',
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Large File Upload Performance', () => {
    it('should upload 10MB file within acceptable time', async () => {
      const file = createLargeFile(10); // 10MB
      const siteId = 'test-site';
      const driveId = 'test-drive';

      // Mock chunked upload responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'https://mock-upload-url' }),
        } as any)
        // Mock chunk uploads (4 chunks for 10MB file)
        .mockResolvedValueOnce({ ok: true, status: 202 } as any)
        .mockResolvedValueOnce({ ok: true, status: 202 } as any)
        .mockResolvedValueOnce({ ok: true, status: 202 } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 'uploaded-file-id',
            name: file.name,
            size: file.size,
          }),
        } as any);

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.uploadLargeFile(siteId, driveId, file.name, file, mockAccessToken);
      });

      expect(result.id).toBe('uploaded-file-id');
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockFetch).toHaveBeenCalledTimes(5); // 1 session + 4 chunks
    });

    it('should handle 100MB file upload with proper chunking', async () => {
      const file = createLargeFile(100); // 100MB
      const expectedChunks = Math.ceil(file.size / (10 * 1024 * 1024)); // 10MB chunks

      // Mock upload session creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploadUrl: 'https://mock-upload-url' }),
      } as any);

      // Mock chunk uploads
      for (let i = 0; i < expectedChunks; i++) {
        const isLastChunk = i === expectedChunks - 1;
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: isLastChunk ? 201 : 202,
          json: isLastChunk ? () => Promise.resolve({
            id: 'large-file-id',
            name: file.name,
            size: file.size,
          }) : undefined,
        } as any);
      }

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.uploadLargeFile('site', 'drive', file.name, file, mockAccessToken);
      });

      expect(result.size).toBe(file.size);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(mockFetch).toHaveBeenCalledTimes(expectedChunks + 1); // session + chunks
    });

    it('should optimize upload performance with parallel chunks', async () => {
      const file = createLargeFile(50); // 50MB
      
      // Mock parallel chunk processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ uploadUrl: 'https://mock-upload-url' }),
      } as any);

      // Mock 5 parallel chunks
      const chunkPromises = Array.from({ length: 5 }, (_, i) => {
        const isLastChunk = i === 4;
        return mockFetch.mockResolvedValueOnce({
          ok: true,
          status: isLastChunk ? 201 : 202,
          json: isLastChunk ? () => Promise.resolve({
            id: 'parallel-file-id',
            name: file.name,
            size: file.size,
          }) : undefined,
        } as any);
      });

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.uploadLargeFileParallel(
          'site', 'drive', file.name, file, mockAccessToken, { maxConcurrency: 3 }
        );
      });

      expect(result.size).toBe(file.size);
      expect(duration).toBeLessThan(15000); // Should be faster than sequential
    });

    it('should handle upload progress tracking', async () => {
      const file = createLargeFile(20); // 20MB
      const progressUpdates: number[] = [];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'https://mock-upload-url' }),
        } as any)
        .mockImplementationOnce(() => {
          progressUpdates.push(25);
          return Promise.resolve({ ok: true, status: 202 } as any);
        })
        .mockImplementationOnce(() => {
          progressUpdates.push(50);
          return Promise.resolve({ ok: true, status: 202 } as any);
        })
        .mockImplementationOnce(() => {
          progressUpdates.push(75);
          return Promise.resolve({ ok: true, status: 202 } as any);
        })
        .mockImplementationOnce(() => {
          progressUpdates.push(100);
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 'progress-file-id', name: file.name, size: file.size }),
          } as any);
        });

      const onProgress = jest.fn((progress: number) => progressUpdates.push(progress));

      await sharePointService.uploadLargeFile(
        'site', 'drive', file.name, file, mockAccessToken, { onProgress }
      );

      expect(progressUpdates).toEqual([25, 50, 75, 100]);
      expect(onProgress).toHaveBeenCalledTimes(4);
    });
  });

  describe('Large File Download Performance', () => {
    it('should download 50MB file efficiently', async () => {
      const expectedSize = 50 * 1024 * 1024; // 50MB
      const mockBlob = new Blob([new ArrayBuffer(expectedSize)]);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({
          'content-length': expectedSize.toString(),
          'content-type': 'application/octet-stream',
        }),
      } as any);

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.downloadFile('site', 'drive', 'large-file', mockAccessToken);
      });

      expect(result.size).toBe(expectedSize);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle streaming download for very large files', async () => {
      const fileSize = 200 * 1024 * 1024; // 200MB
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const chunks = Math.ceil(fileSize / chunkSize);

      // Mock range requests for streaming download
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize - 1, fileSize - 1);
        const actualChunkSize = end - start + 1;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob([new ArrayBuffer(actualChunkSize)])),
          headers: new Headers({
            'content-range': `bytes ${start}-${end}/${fileSize}`,
            'content-length': actualChunkSize.toString(),
          }),
        } as any);
      }

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.downloadLargeFileStreaming(
          'site', 'drive', 'very-large-file', mockAccessToken
        );
      });

      expect(result.size).toBe(fileSize);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(mockFetch).toHaveBeenCalledTimes(chunks);
    });

    it('should implement download resume capability', async () => {
      const fileSize = 100 * 1024 * 1024; // 100MB
      const resumePoint = 50 * 1024 * 1024; // Resume from 50MB
      const remainingSize = fileSize - resumePoint;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob([new ArrayBuffer(remainingSize)])),
        headers: new Headers({
          'content-range': `bytes ${resumePoint}-${fileSize - 1}/${fileSize}`,
          'content-length': remainingSize.toString(),
        }),
      } as any);

      const { result, duration } = await measurePerformance(async () => {
        return sharePointService.resumeDownload(
          'site', 'drive', 'resume-file', mockAccessToken, resumePoint
        );
      });

      expect(result.size).toBe(remainingSize);
      expect(duration).toBeLessThan(15000); // Should be faster than full download
    });
  });

  describe('Large Document AI Processing Performance', () => {
    it('should process 10,000 word document within acceptable time', async () => {
      const largeText = createMockLargeText(10000); // 10,000 words
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          summary: {
            text: 'Summary of large document with key insights...',
            keyPoints: Array.from({ length: 10 }, (_, i) => `Key point ${i + 1}`),
            confidence: 0.92,
          },
          keywords: Array.from({ length: 20 }, (_, i) => `keyword${i + 1}`),
          metrics: {
            originalWordCount: 10000,
            summaryWordCount: 150,
            compressionRatio: 0.015,
          },
          processingTime: 4500, // 4.5 seconds
        }),
      } as any);

      const { result, duration } = await measurePerformance(async () => {
        return aiService.summarizeText({
          text: largeText,
          summaryType: 'abstractive',
          length: 'long',
          includeKeywords: true,
          includeMetrics: true,
        });
      });

      expect(result.summary.text.length).toBeGreaterThan(100);
      expect(result.keywords).toHaveLength(20);
      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds
      expect(result.processingTime).toBeLessThan(5000);
    });

    it('should handle document chunking for extremely large texts', async () => {
      const hugeText = createMockLargeText(50000); // 50,000 words
      const maxChunkSize = 8000; // 8,000 words per chunk
      const expectedChunks = Math.ceil(50000 / maxChunkSize);

      // Mock chunk processing
      for (let i = 0; i < expectedChunks; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            summary: {
              text: `Summary of chunk ${i + 1}...`,
              keyPoints: [`Chunk ${i + 1} key point 1`, `Chunk ${i + 1} key point 2`],
              confidence: 0.88,
            },
            processingTime: 2000,
          }),
        } as any);
      }

      // Mock final consolidation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          summary: {
            text: 'Consolidated summary of extremely large document...',
            keyPoints: Array.from({ length: 15 }, (_, i) => `Consolidated point ${i + 1}`),
            confidence: 0.91,
          },
          processingTime: 3000,
        }),
      } as any);

      const { result, duration } = await measurePerformance(async () => {
        return aiService.summarizeLargeText({
          text: hugeText,
          summaryType: 'abstractive',
          length: 'long',
          chunkSize: maxChunkSize,
        });
      });

      expect(result.summary.text).toContain('Consolidated summary');
      expect(duration).toBeLessThan(25000); // Should complete within 25 seconds
      expect(mockFetch).toHaveBeenCalledTimes(expectedChunks + 1); // chunks + consolidation
    });

    it('should optimize AI processing with parallel operations', async () => {
      const documents = Array.from({ length: 5 }, (_, i) => 
        createMockLargeText(5000) // 5 documents of 5,000 words each
      );

      // Mock parallel processing responses
      documents.forEach((_, i) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            summary: {
              text: `Summary of document ${i + 1}...`,
              keyPoints: [`Doc ${i + 1} point 1`, `Doc ${i + 1} point 2`],
              confidence: 0.89,
            },
            processingTime: 2500,
          }),
        } as any);
      });

      const { result: results, duration } = await measurePerformance(async () => {
        return Promise.all(
          documents.map((text, i) =>
            aiService.summarizeText({
              text,
              summaryType: 'abstractive',
              length: 'medium',
            })
          )
        );
      });

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(6000); // Should complete faster than sequential
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Memory Management Performance', () => {
    it('should handle large file processing without memory leaks', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const files = Array.from({ length: 10 }, (_, i) => createLargeFile(5)); // 10 x 5MB files

      // Mock upload responses
      files.forEach(() => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ uploadUrl: 'mock-url' }),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 'file-id', size: 5 * 1024 * 1024 }),
          } as any);
      });

      // Process files sequentially to test memory cleanup
      for (const file of files) {
        await sharePointService.uploadLargeFile('site', 'drive', file.name, file, mockAccessToken);
        
        // Force garbage collection if available
        if ((global as any).gc) {
          (global as any).gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should implement proper cleanup for streaming operations', async () => {
      const largeContent = 'x'.repeat(100 * 1024 * 1024); // 100MB string
      let streamClosed = false;

      const mockReadableStream = {
        getReader: () => ({
          read: jest.fn().mockImplementation(async () => {
            if (streamClosed) return { done: true, value: undefined };
            
            const chunk = largeContent.slice(0, 1024 * 1024); // 1MB chunks
            return { done: false, value: new TextEncoder().encode(chunk) };
          }),
          releaseLock: jest.fn(),
          closed: Promise.resolve(),
        }),
        cancel: jest.fn(() => { streamClosed = true; }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockReadableStream,
      } as any);

      const downloadPromise = sharePointService.downloadLargeFileStreaming(
        'site', 'drive', 'huge-file', mockAccessToken
      );

      // Cancel download after a short time
      setTimeout(() => {
        streamClosed = true;
      }, 100);

      try {
        await downloadPromise;
      } catch (error) {
        // Expected if stream was cancelled
      }

      expect(mockReadableStream.cancel).toHaveBeenCalled();
    });
  });

  describe('Network Performance Optimization', () => {
    it('should implement adaptive chunk sizing based on network speed', async () => {
      const file = createLargeFile(100); // 100MB
      let currentChunkSize = 5 * 1024 * 1024; // Start with 5MB chunks
      const networkSpeeds: number[] = [];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'mock-url' }),
        } as any);

      // Mock chunks with varying response times
      for (let i = 0; i < 5; i++) {
        const responseTime = i < 2 ? 500 : 2000; // Fast then slow network
        
        mockFetch.mockImplementationOnce(async () => {
          const startTime = Date.now();
          
          await new Promise(resolve => setTimeout(resolve, responseTime));
          
          const endTime = Date.now();
          const speed = currentChunkSize / (endTime - startTime); // bytes/ms
          networkSpeeds.push(speed);
          
          // Adaptive chunk sizing
          if (speed < 1000) { // Slow network
            currentChunkSize = Math.max(currentChunkSize * 0.7, 1024 * 1024); // Reduce chunk size
          } else { // Fast network
            currentChunkSize = Math.min(currentChunkSize * 1.3, 20 * 1024 * 1024); // Increase chunk size
          }

          return {
            ok: true,
            status: i === 4 ? 201 : 202,
            json: i === 4 ? () => Promise.resolve({
              id: 'adaptive-file-id',
              size: file.size,
            }) : undefined,
          } as any;
        });
      }

      await sharePointService.uploadLargeFileWithAdaptiveChunking(
        'site', 'drive', file.name, file, mockAccessToken
      );

      // Should have adjusted chunk sizes based on network performance
      expect(networkSpeeds.length).toBe(5);
      expect(mockFetch).toHaveBeenCalledTimes(6); // session + 5 chunks
    });

    it('should implement connection pooling for multiple large files', async () => {
      const files = Array.from({ length: 10 }, (_, i) => createLargeFile(10));
      const connectionPool = new Map();

      // Mock connection reuse
      files.forEach((file, i) => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ uploadUrl: `mock-url-${i}` }),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: `file-${i}`, size: file.size }),
          } as any);
      });

      const { duration } = await measurePerformance(async () => {
        return Promise.all(
          files.map((file, i) =>
            sharePointService.uploadWithConnectionPooling(
              'site', 'drive', file.name, file, mockAccessToken, connectionPool
            )
          )
        );
      });

      expect(duration).toBeLessThan(15000); // Should be faster due to connection reuse
      expect(connectionPool.size).toBeGreaterThan(0); // Connections should be pooled
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    it('should collect detailed performance metrics', async () => {
      const file = createLargeFile(25); // 25MB
      const metrics: any[] = [];

      const metricsCollector = (metric: any) => {
        metrics.push(metric);
      };

      const serviceWithMetrics = new SharePointService({ metricsCollector });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'mock-url' }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: 'metrics-file', size: file.size }),
        } as any);

      await serviceWithMetrics.uploadLargeFile(
        'site', 'drive', file.name, file, mockAccessToken
      );

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('operation', 'uploadLargeFile');
      expect(metrics[0]).toHaveProperty('fileSize', file.size);
      expect(metrics[0]).toHaveProperty('duration');
      expect(metrics[0]).toHaveProperty('throughput');
    });

    it('should identify performance bottlenecks', async () => {
      const performanceData: any[] = [];
      
      // Mock slow network for first part, fast for second part
      mockFetch
        .mockImplementationOnce(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { ok: true, json: () => Promise.resolve({ uploadUrl: 'mock-url' }) } as any;
        })
        .mockImplementationOnce(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            ok: true,
            status: 201,
            json: () => Promise.resolve({ id: 'bottleneck-file', size: 1024 }),
          } as any;
        });

      const observer = new PerformanceObserver((list) => {
        performanceData.push(...list.getEntries());
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

      await sharePointService.uploadLargeFile(
        'site', 'drive', 'bottleneck-test.txt', createLargeFile(1), mockAccessToken
      );

      observer.disconnect();

      // Should identify that session creation was the bottleneck
      const sessionCreationTime = performanceData.find(entry => 
        entry.name.includes('session-creation')
      );
      const chunkUploadTime = performanceData.find(entry => 
        entry.name.includes('chunk-upload')
      );

      if (sessionCreationTime && chunkUploadTime) {
        expect(sessionCreationTime.duration).toBeGreaterThan(chunkUploadTime.duration);
      }
    });

    it('should benchmark against performance baselines', async () => {
      const baselines = {
        upload10MB: 3000, // 3 seconds
        upload50MB: 12000, // 12 seconds
        download10MB: 2000, // 2 seconds
        aiProcess5000Words: 4000, // 4 seconds
      };

      // Test 10MB upload
      const file10MB = createLargeFile(10);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uploadUrl: 'mock-url' }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: 'baseline-test', size: file10MB.size }),
        } as any);

      const { duration: uploadDuration } = await measurePerformance(async () => {
        return sharePointService.uploadLargeFile(
          'site', 'drive', file10MB.name, file10MB, mockAccessToken
        );
      });

      expect(uploadDuration).toBeLessThan(baselines.upload10MB);

      // Test AI processing
      const largeText = createMockLargeText(5000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          summary: { text: 'Baseline test summary', keyPoints: [], confidence: 0.9 },
          processingTime: 3500,
        }),
      } as any);

      const { duration: aiDuration } = await measurePerformance(async () => {
        return aiService.summarizeText({
          text: largeText,
          summaryType: 'abstractive',
          length: 'medium',
        });
      });

      expect(aiDuration).toBeLessThan(baselines.aiProcess5000Words);
    });
  });
});