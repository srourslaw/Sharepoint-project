import { AIService } from '../../src/services/ai.service';
import { SharePointService } from '../../src/services/sharepoint.service';
import { mockAiApiResponses, mockAiModels, createMockLargeText } from '../__mocks__/ai.mock';
import { mockGraphApiResponses } from '../__mocks__/sharepoint.mock';
import { createMockFile, measurePerformance, waitFor } from '../utils/test-utils';
import { AIAnalysisType } from '../../src/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AI Integration Tests', () => {
  let aiService: AIService;
  let sharePointService: SharePointService;
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    aiService = new AIService({
      apiKey: 'test-ai-key',
      endpoint: 'http://localhost:3001',
      model: 'gpt-4',
    });

    sharePointService = new SharePointService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End AI Analysis Workflow', () => {
    it('should complete full document analysis workflow', async () => {
      const siteId = 'test-site-id';
      const driveId = 'test-drive-id';
      const fileId = 'test-file-id';

      // Mock SharePoint file retrieval
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockGraphApiResponses.fileContent),
        } as any)
        // Mock AI summarization
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.summarization),
        } as any)
        // Mock AI sentiment analysis
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.sentiment),
        } as any)
        // Mock keyword extraction
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.keywordExtraction),
        } as any);

      // Step 1: Get document content from SharePoint
      const fileContent = await sharePointService.getFileContent(
        siteId,
        driveId,
        fileId,
        mockAccessToken
      );

      expect(fileContent).toBe(mockGraphApiResponses.fileContent);

      // Step 2: Perform AI analysis
      const [summary, sentiment, keywords] = await Promise.all([
        aiService.summarizeText({
          text: fileContent,
          summaryType: 'abstractive',
          length: 'medium',
          includeKeywords: true,
        }),
        aiService.analyzeSentiment(fileContent),
        aiService.extractKeywords(fileContent),
      ]);

      // Verify all analyses completed successfully
      expect(summary.summary.text).toBeDefined();
      expect(summary.keywords).toHaveLength(4);
      expect(sentiment.overallSentiment.label).toBe('positive');
      expect(keywords.keywords).toHaveLength(5);

      // Verify all API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should handle multi-document comparison workflow', async () => {
      const doc1Content = 'First document about AI integration with SharePoint.';
      const doc2Content = 'Second document discussing AI implementation strategies.';

      mockFetch
        // Get first document
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(doc1Content),
        } as any)
        // Get second document
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(doc2Content),
        } as any)
        // Compare documents
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.comparison),
        } as any);

      // Get both documents
      const [content1, content2] = await Promise.all([
        sharePointService.getFileContent('site1', 'drive1', 'file1', mockAccessToken),
        sharePointService.getFileContent('site1', 'drive1', 'file2', mockAccessToken),
      ]);

      // Compare documents
      const comparison = await aiService.compareDocuments(content1, content2);

      expect(comparison.similarity).toBe(0.73);
      expect(comparison.commonTopics).toContain('AI');
      expect(comparison.differences).toHaveLength(3);
    });

    it('should handle chat with document context workflow', async () => {
      const documentIds = ['doc1', 'doc2', 'doc3'];
      const userMessage = 'What are the main themes in these documents?';

      // Mock document retrieval for context
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('Document 1 content about AI...'),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('Document 2 content about SharePoint...'),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('Document 3 content about integration...'),
        } as any)
        // Mock AI chat response
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.chatResponse),
        } as any);

      // Get document contents for context
      const documentContents = await Promise.all(
        documentIds.map((_, index) =>
          sharePointService.getFileContent('site1', 'drive1', `file${index + 1}`, mockAccessToken)
        )
      );

      // Send chat message with document context
      const chatResponse = await aiService.chatWithDocuments(userMessage, documentIds);

      expect(chatResponse.response).toContain('AI integration');
      expect(chatResponse.sourceReferences).toHaveLength(2);
      expect(chatResponse.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Large Document Processing', () => {
    it('should handle large document chunking and processing', async () => {
      const largeContent = createMockLargeText(5000); // 5000 words

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(largeContent),
        } as any)
        // Mock chunked processing responses
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            summary: {
              ...mockAiApiResponses.summarization.summary,
              text: 'Summary of chunk 1...',
            },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            summary: {
              ...mockAiApiResponses.summarization.summary,
              text: 'Summary of chunk 2...',
            },
          }),
        } as any)
        // Mock final consolidation
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            summary: {
              ...mockAiApiResponses.summarization.summary,
              text: 'Consolidated summary of large document...',
            },
          }),
        } as any);

      // Get large document
      const fileContent = await sharePointService.getFileContent(
        'site1',
        'drive1',
        'large-file',
        mockAccessToken
      );

      // Process in chunks
      const summary = await aiService.summarizeLargeText({
        text: fileContent,
        summaryType: 'abstractive',
        length: 'long',
        chunkSize: 2000,
        includeKeywords: true,
      });

      expect(summary.summary.text).toContain('Consolidated summary');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 for retrieval + 3 for processing
    });

    it('should handle processing timeouts gracefully', async () => {
      const largeContent = createMockLargeText(10000);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(largeContent),
        } as any)
        // Mock timeout response
        .mockImplementationOnce(() =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 1000)
          )
        );

      const fileContent = await sharePointService.getFileContent(
        'site1',
        'drive1',
        'timeout-file',
        mockAccessToken
      );

      await expect(
        aiService.summarizeText({
          text: fileContent,
          summaryType: 'abstractive',
          length: 'medium',
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Multi-Model AI Processing', () => {
    it('should handle fallback between AI models', async () => {
      const primaryAiService = new AIService(mockAiModels[0]); // GPT-4
      const fallbackAiService = new AIService(mockAiModels[1]); // GPT-3.5

      const testContent = 'Test document for multi-model processing.';

      mockFetch
        // Primary model fails
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: { code: 'rate_limit_exceeded', message: 'Rate limit exceeded' },
          }),
        } as any)
        // Fallback model succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.summarization),
        } as any);

      // Try primary model first
      let result;
      try {
        result = await primaryAiService.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'short',
        });
      } catch (error) {
        // Fallback to secondary model
        result = await fallbackAiService.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'short',
        });
      }

      expect(result.summary.text).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should compare results across different models', async () => {
      const testContent = 'Document for cross-model comparison testing.';

      // Mock responses for different models
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            summary: {
              ...mockAiApiResponses.summarization.summary,
              text: 'GPT-4 generated summary...',
            },
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            summary: {
              ...mockAiApiResponses.summarization.summary,
              text: 'GPT-3.5 generated summary...',
            },
          }),
        } as any);

      const gpt4Service = new AIService(mockAiModels[0]);
      const gpt35Service = new AIService(mockAiModels[1]);

      const [gpt4Result, gpt35Result] = await Promise.all([
        gpt4Service.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'medium',
        }),
        gpt35Service.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'medium',
        }),
      ]);

      expect(gpt4Result.summary.text).toContain('GPT-4');
      expect(gpt35Result.summary.text).toContain('GPT-3.5');
      expect(gpt4Result.processingTime).toBeGreaterThan(0);
      expect(gpt35Result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Real-time AI Processing', () => {
    it('should handle streaming AI responses', async () => {
      const message = 'Explain the document content in detail.';
      const documentIds = ['doc1'];

      // Mock streaming response
      const mockReadableStream = {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"content":"The document "}\n\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"content":"discusses AI "}\n\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"content":"integration."}\n\n'),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
        }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockReadableStream,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
      } as any);

      const stream = aiService.streamChatResponse(message, documentIds);
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk.content);
        if (chunk.done) break;
      }

      expect(chunks.join('')).toBe('The document discusses AI integration.');
    });

    it('should handle streaming errors gracefully', async () => {
      const message = 'Test streaming error handling.';

      const mockReadableStream = {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"content":"Starting response"}\n\n'),
            })
            .mockRejectedValueOnce(new Error('Stream interrupted')),
        }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockReadableStream,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
      } as any);

      const stream = aiService.streamChatResponse(message, []);

      try {
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk.content);
          if (chunk.done) break;
        }
      } catch (error) {
        expect(error.message).toBe('Stream interrupted');
      }
    });
  });

  describe('AI Performance and Optimization', () => {
    it('should optimize processing based on content type', async () => {
      const contentTypes = [
        { type: 'text', content: 'Plain text document content.' },
        { type: 'code', content: 'function hello() { return "world"; }' },
        { type: 'data', content: 'Name,Age,City\nJohn,30,NYC\nJane,25,LA' },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            processingTime: 800,
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            processingTime: 1200,
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            processingTime: 600,
          }),
        } as any);

      const results = await Promise.all(
        contentTypes.map(({ content }) =>
          aiService.summarizeText({
            text: content,
            summaryType: 'abstractive',
            length: 'short',
          })
        )
      );

      // Should have different processing times based on content complexity
      expect(results[0].processingTime).toBeLessThan(results[1].processingTime);
      expect(results[2].processingTime).toBeLessThan(results[0].processingTime);
    });

    it('should handle concurrent AI processing efficiently', async () => {
      const concurrentRequests = 10;
      const testContent = 'Concurrent processing test content.';

      // Mock all responses
      for (let i = 0; i < concurrentRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockAiApiResponses.summarization,
            processingTime: 1000 + Math.random() * 500,
          }),
        } as any);
      }

      const { result: results, duration } = await measurePerformance(async () => {
        return Promise.all(
          Array.from({ length: concurrentRequests }, () =>
            aiService.summarizeText({
              text: testContent,
              summaryType: 'abstractive',
              length: 'short',
            })
          )
        );
      });

      expect(results).toHaveLength(concurrentRequests);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockFetch).toHaveBeenCalledTimes(concurrentRequests);
    });

    it('should cache AI results appropriately', async () => {
      const testContent = 'Cacheable content for testing.';
      const cacheKey = aiService.generateCacheKey(testContent, {
        summaryType: 'abstractive',
        length: 'medium',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      // First request should hit the API
      const result1 = await aiService.summarizeText({
        text: testContent,
        summaryType: 'abstractive',
        length: 'medium',
      });

      // Second identical request should use cache
      const result2 = await aiService.summarizeText({
        text: testContent,
        summaryType: 'abstractive',
        length: 'medium',
      });

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call due to caching
    });
  });

  describe('AI Quality and Accuracy', () => {
    it('should validate AI response quality', async () => {
      const testContent = 'High-quality content that should produce good results.';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockAiApiResponses.summarization,
          summary: {
            ...mockAiApiResponses.summarization.summary,
            confidence: 0.95,
          },
        }),
      } as any);

      const result = await aiService.summarizeText({
        text: testContent,
        summaryType: 'abstractive',
        length: 'medium',
      });

      expect(result.summary.confidence).toBeGreaterThan(0.9);
      expect(result.summary.text.length).toBeGreaterThan(50);
      expect(result.keywords).toHaveLength(4);
    });

    it('should handle low-quality input gracefully', async () => {
      const poorContent = 'a b c d e f g h i j';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockAiApiResponses.summarization,
          summary: {
            text: 'Unable to generate meaningful summary.',
            keyPoints: [],
            confidence: 0.2,
          },
          keywords: [],
          processingTime: 500,
        }),
      } as any);

      const result = await aiService.summarizeText({
        text: poorContent,
        summaryType: 'abstractive',
        length: 'short',
      });

      expect(result.summary.confidence).toBeLessThan(0.5);
      expect(result.keywords).toHaveLength(0);
    });

    it('should provide consistent results for identical input', async () => {
      const testContent = 'Consistent processing test content.';

      // Mock identical responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.summarization),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAiApiResponses.summarization),
        } as any);

      const [result1, result2] = await Promise.all([
        aiService.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'medium',
        }),
        aiService.summarizeText({
          text: testContent,
          summaryType: 'abstractive',
          length: 'medium',
        }),
      ]);

      // Results should be identical for identical input
      expect(result1.summary.text).toBe(result2.summary.text);
      expect(result1.summary.confidence).toBe(result2.summary.confidence);
    });
  });

  describe('AI Security and Compliance', () => {
    it('should sanitize sensitive content before processing', async () => {
      const sensitiveContent = 'User email: john@example.com, SSN: 123-45-6789, Credit Card: 4111-1111-1111-1111';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      await aiService.summarizeText({
        text: sensitiveContent,
        summaryType: 'abstractive',
        length: 'short',
      });

      // Verify that sensitive data was sanitized in the request
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(requestBody.text).not.toContain('john@example.com');
      expect(requestBody.text).not.toContain('123-45-6789');
      expect(requestBody.text).not.toContain('4111-1111-1111-1111');
    });

    it('should handle data residency requirements', async () => {
      const regionSpecificService = new AIService({
        ...mockAiModels[0],
        region: 'eu-west-1',
        dataResidency: 'EU',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      await regionSpecificService.summarizeText({
        text: 'EU data residency test content.',
        summaryType: 'abstractive',
        length: 'short',
      });

      // Verify request was made to EU endpoint
      const requestUrl = mockFetch.mock.calls[0][0] as string;
      expect(requestUrl).toContain('eu-west-1');
    });

    it('should audit AI processing activities', async () => {
      const auditLogger = jest.fn();
      const auditService = new AIService({
        ...mockAiModels[0],
        auditLogger,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      await auditService.summarizeText({
        text: 'Audit test content.',
        summaryType: 'abstractive',
        length: 'short',
      });

      expect(auditLogger).toHaveBeenCalledWith({
        operation: 'summarize_text',
        timestamp: expect.any(String),
        inputSize: expect.any(Number),
        processingTime: expect.any(Number),
        success: true,
      });
    });
  });
});