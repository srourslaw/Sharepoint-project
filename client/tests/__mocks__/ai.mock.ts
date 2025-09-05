import { AIAnalysisResult, SummarizationResult, SentimentAnalysisResult, AIAnalysisType } from '../../src/types';

// Mock AI API responses
export const mockAiApiResponses = {
  summarization: {
    summary: {
      text: 'This is a mock summary of the document content. It contains the key points and main ideas from the original text.',
      keyPoints: [
        'Key point 1: Important information about the topic',
        'Key point 2: Supporting details and context',
        'Key point 3: Conclusions and recommendations',
      ],
      confidence: 0.92,
    },
    keywords: ['test', 'document', 'analysis', 'artificial intelligence'],
    metrics: {
      originalWordCount: 500,
      summaryWordCount: 75,
      compressionRatio: 0.15,
    },
    processingTime: 1250,
  },

  sentiment: {
    overallSentiment: {
      score: 0.65,
      label: 'positive' as const,
      confidence: 0.87,
    },
    emotionalTone: {
      joy: 0.4,
      sadness: 0.1,
      anger: 0.05,
      fear: 0.1,
      surprise: 0.2,
      disgust: 0.15,
    },
    processingTime: 850,
  },

  keywordExtraction: {
    keywords: [
      { word: 'artificial intelligence', confidence: 0.95, frequency: 8 },
      { word: 'machine learning', confidence: 0.92, frequency: 6 },
      { word: 'data analysis', confidence: 0.88, frequency: 5 },
      { word: 'automation', confidence: 0.85, frequency: 4 },
      { word: 'SharePoint', confidence: 0.90, frequency: 7 },
    ],
    processingTime: 650,
  },

  entityExtraction: {
    entities: [
      { text: 'Microsoft', type: 'Organization', confidence: 0.98 },
      { text: 'SharePoint', type: 'Product', confidence: 0.95 },
      { text: 'January 2024', type: 'DateTime', confidence: 0.92 },
      { text: 'United States', type: 'Location', confidence: 0.89 },
      { text: 'John Smith', type: 'Person', confidence: 0.94 },
    ],
    processingTime: 920,
  },

  translation: {
    translatedText: 'Este es un texto traducido como ejemplo para las pruebas.',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    confidence: 0.96,
    processingTime: 430,
  },

  comparison: {
    similarity: 0.73,
    differences: [
      'Document A contains additional information about implementation details',
      'Document B has more focus on business requirements',
      'Both documents share common themes about AI integration',
    ],
    commonTopics: ['AI', 'SharePoint', 'integration', 'business value'],
    processingTime: 1150,
  },

  chatResponse: {
    response: 'Based on the documents you\'ve shared, I can help you understand the key concepts related to AI integration with SharePoint. The main benefits include improved document discovery, automated content analysis, and enhanced user experience.',
    confidence: 0.89,
    sourceReferences: [
      {
        fileId: 'mock-file-1',
        fileName: 'document1.docx',
        snippet: 'AI integration provides automated content analysis capabilities...',
        pageNumber: 1,
        confidence: 0.92,
        relevanceScore: 0.88,
      },
      {
        fileId: 'mock-file-2',
        fileName: 'presentation.pptx',
        snippet: 'Enhanced user experience through intelligent search and recommendations...',
        pageNumber: 3,
        confidence: 0.85,
        relevanceScore: 0.82,
      },
    ],
    processingTime: 2340,
    tokenUsage: {
      promptTokens: 1200,
      completionTokens: 450,
      totalTokens: 1650,
    },
  },
};

// Mock AI service functions
export const createMockAiService = () => ({
  summarizeText: jest.fn().mockResolvedValue(mockAiApiResponses.summarization),
  analyzeSentiment: jest.fn().mockResolvedValue(mockAiApiResponses.sentiment),
  extractKeywords: jest.fn().mockResolvedValue(mockAiApiResponses.keywordExtraction),
  extractEntities: jest.fn().mockResolvedValue(mockAiApiResponses.entityExtraction),
  translateText: jest.fn().mockResolvedValue(mockAiApiResponses.translation),
  compareDocuments: jest.fn().mockResolvedValue(mockAiApiResponses.comparison),
  chatWithDocuments: jest.fn().mockResolvedValue(mockAiApiResponses.chatResponse),
  
  // Streaming responses for chat
  streamChatResponse: jest.fn().mockImplementation(async function* () {
    const chunks = mockAiApiResponses.chatResponse.response.split(' ');
    for (const chunk of chunks) {
      yield { content: chunk + ' ', done: false };
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    yield { content: '', done: true };
  }),
});

// Mock AI model configurations for testing
export const mockAiModels = [
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    provider: 'openai' as const,
    model: 'gpt-4',
    apiKey: 'mock-openai-key',
    endpoint: 'https://api.openai.com/v1',
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stopSequences: [],
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      dailyLimit: 1000000,
    },
    costTracking: {
      inputCostPerToken: 0.03,
      outputCostPerToken: 0.06,
      currency: 'USD',
    },
    isDefault: true,
    capabilities: ['text', 'analysis', 'chat', 'summarization'],
    contextWindow: 8192,
    supportedFeatures: [
      'SUMMARIZATION',
      'SENTIMENT',
      'KEYWORD_EXTRACTION',
      'ENTITY_EXTRACTION',
      'TRANSLATION',
      'COMPARISON',
    ],
  },
  {
    id: 'azure-gpt35',
    name: 'Azure GPT-3.5 Turbo',
    provider: 'azure' as const,
    model: 'gpt-35-turbo',
    apiKey: 'mock-azure-key',
    endpoint: 'https://mock-resource.openai.azure.com',
    parameters: {
      temperature: 0.5,
      maxTokens: 1024,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      stopSequences: [],
    },
    rateLimits: {
      requestsPerMinute: 120,
      tokensPerMinute: 120000,
      dailyLimit: 2000000,
    },
    costTracking: {
      inputCostPerToken: 0.0015,
      outputCostPerToken: 0.002,
      currency: 'USD',
    },
    isDefault: false,
    capabilities: ['text', 'analysis', 'chat'],
    contextWindow: 4096,
    supportedFeatures: [
      'SUMMARIZATION',
      'SENTIMENT',
      'KEYWORD_EXTRACTION',
    ],
  },
];

// Mock performance data for AI operations
export const mockAiPerformanceData = {
  processingTimes: {
    summarization: { min: 800, max: 2000, avg: 1250 },
    sentiment: { min: 500, max: 1200, avg: 850 },
    keywordExtraction: { min: 400, max: 900, avg: 650 },
    entityExtraction: { min: 600, max: 1500, avg: 920 },
    translation: { min: 200, max: 800, avg: 430 },
    comparison: { min: 800, max: 2500, avg: 1150 },
    chat: { min: 1500, max: 5000, avg: 2340 },
  },
  
  tokenUsage: {
    small: { prompt: 100, completion: 50, total: 150 },
    medium: { prompt: 500, completion: 200, total: 700 },
    large: { prompt: 2000, completion: 800, total: 2800 },
    extraLarge: { prompt: 5000, completion: 1500, total: 6500 },
  },
  
  costs: {
    gpt4: { input: 0.03, output: 0.06 },
    gpt35: { input: 0.0015, output: 0.002 },
    claude: { input: 0.008, output: 0.024 },
  },
};

// Mock error scenarios
export const mockAiErrors = {
  rateLimitExceeded: {
    code: 'rate_limit_exceeded',
    message: 'Rate limit exceeded. Please try again later.',
    type: 'rate_limit_error',
    retryAfter: 60,
  },
  
  invalidApiKey: {
    code: 'invalid_api_key',
    message: 'Invalid API key provided',
    type: 'authentication_error',
  },
  
  contentTooLong: {
    code: 'content_too_long',
    message: 'Content exceeds maximum token limit',
    type: 'invalid_request_error',
    maxTokens: 8192,
  },
  
  serviceUnavailable: {
    code: 'service_unavailable',
    message: 'AI service is temporarily unavailable',
    type: 'service_error',
  },
  
  unsupportedLanguage: {
    code: 'unsupported_language',
    message: 'Language not supported for this operation',
    type: 'invalid_request_error',
    supportedLanguages: ['en', 'es', 'fr', 'de'],
  },
};

// Mock streaming response for testing
export const createMockStreamingResponse = (text: string, delay: number = 50) => {
  const chunks = text.split(' ');
  let index = 0;
  
  return {
    [Symbol.asyncIterator]: async function* () {
      while (index < chunks.length) {
        yield { content: chunks[index] + ' ', done: false };
        index++;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      yield { content: '', done: true };
    },
  };
};

// Mock large text for performance testing
export const createMockLargeText = (wordCount: number): string => {
  const words = [
    'artificial', 'intelligence', 'machine', 'learning', 'data', 'analysis',
    'SharePoint', 'Microsoft', 'integration', 'automation', 'document',
    'content', 'management', 'system', 'cloud', 'computing', 'technology',
    'business', 'process', 'workflow', 'collaboration', 'productivity',
    'efficiency', 'innovation', 'digital', 'transformation', 'enterprise',
    'solution', 'platform', 'service', 'application', 'software', 'tool',
  ];
  
  const result = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }
  
  return result.join(' ') + '.';
};