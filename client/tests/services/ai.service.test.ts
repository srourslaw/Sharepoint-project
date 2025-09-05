import { AIService } from '../../src/services/ai.service';
import { mockAiApiResponses, mockAiErrors, createMockLargeText, mockAiPerformanceData } from '../__mocks__/ai.mock';
import { AIAnalysisType, SummarizationRequest } from '../../src/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AIService', () => {
  let service: AIService;
  const mockApiKey = 'mock-ai-api-key';
  const mockEndpoint = 'http://localhost:3001';

  beforeEach(() => {
    service = new AIService({
      apiKey: mockApiKey,
      endpoint: mockEndpoint,
      model: 'gpt-4',
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('summarizeText', () => {
    const mockRequest: SummarizationRequest = {
      text: 'This is a long document that needs to be summarized for testing purposes.',
      summaryType: 'abstractive',
      length: 'medium',
      includeKeywords: true,
      includeMetrics: true,
    };

    it('should summarize text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      const result = await service.summarizeText(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoint}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockAiApiResponses.summarization);
    });

    it('should handle different summary types', async () => {
      const bulletPointsRequest = { ...mockRequest, summaryType: 'bullet_points' as const };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockAiApiResponses.summarization,
          summary: {
            ...mockAiApiResponses.summarization.summary,
            text: '• Point 1\n• Point 2\n• Point 3',
          },
        }),
      } as any);

      const result = await service.summarizeText(bulletPointsRequest);

      expect(result.summary.text).toContain('•');
    });

    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve(mockAiErrors.rateLimitExceeded),
      } as any);

      await expect(service.summarizeText(mockRequest)).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle content too long errors', async () => {
      const longTextRequest = {
        ...mockRequest,
        text: createMockLargeText(10000), // Very long text
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAiErrors.contentTooLong),
      } as any);

      await expect(service.summarizeText(longTextRequest)).rejects.toThrow('Content exceeds maximum token limit');
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment successfully', async () => {
      const text = 'This is a wonderful document with positive content!';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.sentiment),
      } as any);

      const result = await service.analyzeSentiment(text);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoint}/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify({ text }),
      });
      expect(result.overallSentiment.label).toBe('positive');
      expect(result.overallSentiment.score).toBeGreaterThan(0);
    });

    it('should handle negative sentiment', async () => {
      const text = 'This is terrible and disappointing content.';
      const negativeSentiment = {
        ...mockAiApiResponses.sentiment,
        overallSentiment: {
          score: -0.8,
          label: 'negative' as const,
          confidence: 0.92,
        },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(negativeSentiment),
      } as any);

      const result = await service.analyzeSentiment(text);

      expect(result.overallSentiment.label).toBe('negative');
      expect(result.overallSentiment.score).toBeLessThan(0);
    });

    it('should handle neutral sentiment', async () => {
      const text = 'This is a factual document with neutral information.';
      const neutralSentiment = {
        ...mockAiApiResponses.sentiment,
        overallSentiment: {
          score: 0.1,
          label: 'neutral' as const,
          confidence: 0.85,
        },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(neutralSentiment),
      } as any);

      const result = await service.analyzeSentiment(text);

      expect(result.overallSentiment.label).toBe('neutral');
      expect(Math.abs(result.overallSentiment.score)).toBeLessThan(0.5);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords successfully', async () => {
      const text = 'This document discusses artificial intelligence and machine learning applications in SharePoint.';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.keywordExtraction),
      } as any);

      const result = await service.extractKeywords(text);

      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords[0]).toHaveProperty('word');
      expect(result.keywords[0]).toHaveProperty('confidence');
    });

    it('should handle empty text', async () => {
      const text = '';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ keywords: [], processingTime: 100 }),
      } as any);

      const result = await service.extractKeywords(text);

      expect(result.keywords).toEqual([]);
    });
  });

  describe('extractEntities', () => {
    it('should extract entities successfully', async () => {
      const text = 'Microsoft SharePoint was released in January 2024 by John Smith in the United States.';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.entityExtraction),
      } as any);

      const result = await service.extractEntities(text);

      expect(result.entities).toBeInstanceOf(Array);
      expect(result.entities.length).toBeGreaterThan(0);
      
      const organizationEntity = result.entities.find(e => e.type === 'Organization');
      expect(organizationEntity).toBeDefined();
      expect(organizationEntity?.text).toBe('Microsoft');
    });
  });

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      const text = 'Hello, how are you today?';
      const targetLanguage = 'es';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.translation),
      } as any);

      const result = await service.translateText(text, targetLanguage);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoint}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage: 'auto',
        }),
      });
      expect(result.targetLanguage).toBe('es');
      expect(result.translatedText).toBeDefined();
    });

    it('should handle unsupported language errors', async () => {
      const text = 'Hello world';
      const targetLanguage = 'xyz'; // Unsupported language
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAiErrors.unsupportedLanguage),
      } as any);

      await expect(service.translateText(text, targetLanguage)).rejects.toThrow('Language not supported');
    });
  });

  describe('compareDocuments', () => {
    it('should compare two documents successfully', async () => {
      const doc1 = 'First document content about AI integration.';
      const doc2 = 'Second document content about AI implementation.';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.comparison),
      } as any);

      const result = await service.compareDocuments(doc1, doc2);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoint}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify({
          document1: doc1,
          document2: doc2,
        }),
      });
      expect(result.similarity).toBeGreaterThan(0);
      expect(result.commonTopics).toBeInstanceOf(Array);
    });
  });

  describe('chatWithDocuments', () => {
    it('should generate chat response with document context', async () => {
      const message = 'What are the main benefits of AI integration?';
      const documentIds = ['doc1', 'doc2'];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.chatResponse),
      } as any);

      const result = await service.chatWithDocuments(message, documentIds);

      expect(mockFetch).toHaveBeenCalledWith(`${mockEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`,
        },
        body: JSON.stringify({
          message,
          documentIds,
          includeReferences: true,
        }),
      });
      expect(result.response).toBeDefined();
      expect(result.sourceReferences).toBeInstanceOf(Array);
    });

    it('should handle streaming responses', async () => {
      const message = 'Explain the document content';
      const documentIds = ['doc1'];
      
      // Mock streaming response
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"content":"Hello "}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"content":"world!"}\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
          }),
        },
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse as any);

      const stream = service.streamChatResponse(message, documentIds);
      const chunks = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
        if (chunk.done) break;
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].done).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(service.summarizeText({
        text: 'test',
        summaryType: 'abstractive',
        length: 'short',
      })).rejects.toThrow('Network connection failed');
    });

    it('should handle invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockAiErrors.invalidApiKey),
      } as any);

      await expect(service.summarizeText({
        text: 'test',
        summaryType: 'abstractive',
        length: 'short',
      })).rejects.toThrow('Invalid API key provided');
    });

    it('should handle service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve(mockAiErrors.serviceUnavailable),
      } as any);

      await expect(service.summarizeText({
        text: 'test',
        summaryType: 'abstractive',
        length: 'short',
      })).rejects.toThrow('AI service is temporarily unavailable');
    });
  });

  describe('performance monitoring', () => {
    it('should track processing times', async () => {
      const startTime = Date.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAiApiResponses.summarization),
      } as any);

      const result = await service.summarizeText({
        text: 'test document',
        summaryType: 'abstractive',
        length: 'short',
      });

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(actualDuration).toBeGreaterThanOrEqual(result.processingTime);
    });

    it('should handle timeout scenarios', async () => {
      jest.setTimeout(5000);
      
      // Simulate a slow response
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockAiApiResponses.summarization),
          } as any), 10000) // 10 second delay
        )
      );

      const timeoutService = new AIService({
        apiKey: mockApiKey,
        endpoint: mockEndpoint,
        model: 'gpt-4',
        timeout: 3000, // 3 second timeout
      });

      await expect(timeoutService.summarizeText({
        text: 'test',
        summaryType: 'abstractive',
        length: 'short',
      })).rejects.toThrow('Request timeout');
    }, 10000);
  });

  describe('token counting', () => {
    it('should estimate token usage', () => {
      const text = 'This is a test document with some content to analyze.';
      const estimatedTokens = service.estimateTokens(text);

      expect(estimatedTokens).toBeGreaterThan(0);
      expect(estimatedTokens).toBeLessThan(text.length); // Should be less than character count
    });

    it('should handle empty text for token counting', () => {
      const tokens = service.estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should track token usage in responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockAiApiResponses.chatResponse,
          tokenUsage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
          },
        }),
      } as any);

      const result = await service.chatWithDocuments('test message', ['doc1']);

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage!.totalTokens).toBe(150);
    });
  });

  describe('configuration management', () => {
    it('should update service configuration', () => {
      const newConfig = {
        apiKey: 'new-key',
        endpoint: 'https://new-endpoint.com',
        model: 'gpt-3.5-turbo',
      };

      service.updateConfig(newConfig);

      expect(service.getConfig()).toEqual(expect.objectContaining(newConfig));
    });

    it('should validate configuration', () => {
      expect(() => {
        new AIService({
          apiKey: '',
          endpoint: 'invalid-url',
          model: 'gpt-4',
        });
      }).toThrow('Invalid configuration');
    });
  });
});