# Google Gemini AI Integration Guide

Comprehensive Google Gemini AI integration with document analysis, question-answering, text summarization, and streaming capabilities.

## 🚀 **Complete Implementation**

The Gemini AI integration provides enterprise-grade AI capabilities:

✅ **Multi-Format Document Analysis** - Comprehensive analysis of text, PDFs, Office documents  
✅ **Advanced Summarization** - 6 different summary types with smart parameter selection  
✅ **Question-Answering** - Context-aware Q&A with multi-document support  
✅ **Interactive Chat** - Conversational AI with document context  
✅ **Streaming Responses** - Real-time AI interactions with progress tracking  
✅ **Rate Limiting** - Intelligent rate limiting with exponential backoff  
✅ **Error Handling** - Comprehensive error recovery and retry logic  
✅ **Usage Analytics** - Detailed metrics and cost tracking  
✅ **Security & Validation** - File validation and content filtering  

## 📁 **Architecture**

```
server/src/
├── services/
│   ├── geminiService.ts              # Core Gemini API service
│   ├── documentAnalysisService.ts    # Document analysis & insights
│   ├── questionAnswerService.ts      # Q&A and chat functionality
│   └── textSummarizationService.ts   # Advanced text summarization
├── types/
│   └── gemini.ts                     # TypeScript definitions
├── routes/
│   └── gemini.ts                     # REST API endpoints
└── utils/
    ├── advanced-file-processor.ts    # File processing integration
    └── file-validator.ts             # Security validation
```

## 🔧 **Core Services**

### **1. Gemini Service (`GeminiService`)**
The foundational service for Google Gemini API integration:

```typescript
import { GeminiService } from './services/geminiService';

const geminiService = new GeminiService({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',
  defaultOptions: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
    maxTokens: 2048
  },
  rateLimiting: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  streamingEnabled: true
});

// Basic text generation
const response = await geminiService.generateText({
  prompt: "Explain machine learning in simple terms",
  maxTokens: 200,
  temperature: 0.3
});
```

### **2. Document Analysis Service (`DocumentAnalysisService`)**
Comprehensive document analysis with multiple analysis types:

```typescript
import { DocumentAnalysisService, AnalysisType } from './services/documentAnalysisService';

const analysisService = new DocumentAnalysisService(geminiService);

// Comprehensive document analysis
const analysis = await analysisService.analyzeDocument({
  text: documentContent,
  analysisType: AnalysisType.COMPREHENSIVE,
  options: {
    includeMetrics: true,
    keywordCount: 10,
    confidenceThreshold: 0.8
  }
});

console.log('Summary:', analysis.summary?.text);
console.log('Keywords:', analysis.keywords?.map(k => k.text).join(', '));
console.log('Sentiment:', analysis.sentiment?.overall.label);
console.log('Topics:', analysis.topics?.map(t => t.name).join(', '));
```

### **3. Question-Answering Service (`QuestionAnswerService`)**
Context-aware Q&A and interactive chat:

```typescript
import { QuestionAnswerService } from './services/questionAnswerService';

const qaService = new QuestionAnswerService(geminiService);

// Ask questions about documents
const answer = await qaService.answerQuestion({
  question: "What are the key findings in this report?",
  context: documentContent,
  options: {
    answerFormat: 'detailed',
    includeConfidence: true,
    includeExplanation: true
  }
});

// Interactive chat with document
const chatResponse = await qaService.chatWithDocument({
  message: "Can you explain the methodology used?",
  sessionId: 'chat-session-123',
  context: documentContent,
  options: { includeHistory: true }
});
```

### **4. Text Summarization Service (`TextSummarizationService`)**
Advanced summarization with 6 different types:

```typescript
import { TextSummarizationService, SummaryType, SummaryLength } from './services/textSummarizationService';

const summaryService = new TextSummarizationService(geminiService);

// Different summary types
const summaryTypes = {
  EXTRACTIVE: 'Key sentences from original text',
  ABSTRACTIVE: 'Rewritten in new words',
  BULLET_POINTS: 'Organized bullet points',
  EXECUTIVE: 'Business-focused executive summary',
  TECHNICAL: 'Detailed technical summary',
  CREATIVE: 'Engaging and memorable summary'
};

const summary = await summaryService.summarizeText({
  text: documentContent,
  summaryType: SummaryType.EXECUTIVE,
  length: SummaryLength.MEDIUM,
  targetAudience: 'executives',
  includeKeyPoints: true
});

// Smart summarization with automatic parameters
const smartSummary = await summaryService.smartSummarize(
  documentContent,
  300, // target length
  'decision_making'
);
```

## 🎯 **API Endpoints**

### **Health & Service Management**

```http
# Service health check
GET /api/gemini/health
Response: {
  "success": true,
  "services": {
    "gemini": { "status": "healthy" },
    "rateLimit": { "remaining": 95, "limit": 100 },
    "usage": { "totalRequests": 1250, "errorRate": 0.02 }
  }
}
```

### **Text Generation**

```http
# Basic text generation
POST /api/gemini/generate
Content-Type: application/json
{
  "prompt": "Explain artificial intelligence",
  "maxTokens": 200,
  "temperature": 0.3,
  "context": "Previous conversation context"
}

Response: {
  "success": true,
  "data": {
    "text": "Artificial intelligence (AI) is...",
    "tokenCount": { "totalTokens": 145, "promptTokens": 25, "candidatesTokens": 120 },
    "finishReason": "STOP"
  }
}
```

### **Document Analysis**

```http
# Analyze text content
POST /api/gemini/analyze-text
Content-Type: application/json
{
  "text": "Document content to analyze...",
  "analysisType": "comprehensive",
  "options": {
    "includeMetrics": true,
    "keywordCount": 10
  }
}

# Analyze uploaded file
POST /api/gemini/analyze-file
Content-Type: multipart/form-data
file=@document.pdf
analysisType=summary

# Batch analyze multiple files
POST /api/gemini/analyze-batch
Content-Type: multipart/form-data
files=@doc1.pdf
files=@doc2.docx
analysisType=keywords

Response: {
  "success": true,
  "data": {
    "analysisType": "comprehensive",
    "summary": { "text": "...", "keyPoints": [...] },
    "keywords": [{ "text": "AI", "relevance": 0.95 }],
    "sentiment": { "overall": { "label": "positive", "score": 0.7 } },
    "metrics": { "readingTime": 5, "complexity": "moderate" }
  }
}
```

### **Question Answering**

```http
# Ask question about text
POST /api/gemini/question
Content-Type: application/json
{
  "question": "What are the main conclusions?",
  "context": "Document content...",
  "options": {
    "answerFormat": "detailed",
    "includeConfidence": true
  }
}

# Ask question about uploaded file
POST /api/gemini/question-file
Content-Type: multipart/form-data
file=@document.pdf
question=What are the key findings?

# Multi-document question answering
POST /api/gemini/multi-question
Content-Type: multipart/form-data
files=@doc1.pdf
files=@doc2.docx
question=What are the common themes?

Response: {
  "success": true,
  "data": {
    "question": "What are the main conclusions?",
    "answer": "The main conclusions are...",
    "confidence": 0.89,
    "answerType": "factual",
    "sourceReferences": [
      { "text": "relevant quote", "startIndex": 100, "relevance": 0.9 }
    ],
    "relatedQuestions": ["What methodology was used?"]
  }
}
```

### **Chat Functionality**

```http
# Start or continue chat session
POST /api/gemini/chat
Content-Type: application/json
{
  "message": "Can you explain the methodology?",
  "sessionId": "chat-123",
  "context": "Document content...",
  "options": { "includeHistory": true }
}

# List chat sessions
GET /api/gemini/chat/sessions

# Get specific session
GET /api/gemini/chat/sessions/{sessionId}

# Delete session
DELETE /api/gemini/chat/sessions/{sessionId}

Response: {
  "success": true,
  "data": {
    "message": { "role": "assistant", "content": "The methodology involves..." },
    "sessionId": "chat-123",
    "totalTokens": 156,
    "suggestions": ["What were the results?", "How was data collected?"]
  }
}
```

### **Text Summarization**

```http
# Summarize text
POST /api/gemini/summarize
Content-Type: application/json
{
  "text": "Long document content...",
  "summaryType": "executive",
  "length": "medium",
  "focusAreas": ["key findings", "recommendations"],
  "targetAudience": "executives"
}

# Summarize uploaded file
POST /api/gemini/summarize-file
Content-Type: multipart/form-data
file=@report.pdf
summaryType=bullet_points
length=short

# Smart summarization (auto parameters)
POST /api/gemini/smart-summarize
Content-Type: application/json
{
  "text": "Document content...",
  "targetLength": 200,
  "purpose": "decision_making"
}

# Batch summarize multiple files
POST /api/gemini/batch-summarize
Content-Type: multipart/form-data
files=@doc1.pdf
files=@doc2.docx
summaryType=abstractive
generateOverallSummary=true

Response: {
  "success": true,
  "data": {
    "summary": "Executive summary of the document...",
    "summaryType": "executive",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "wordCount": {
      "original": 2500,
      "summary": 250,
      "compressionRatio": 0.1
    },
    "readingTime": { "original": 10, "summary": 1 },
    "confidence": 0.92
  }
}
```

### **Streaming**

```http
# Start streaming session
POST /api/gemini/stream
Content-Type: application/json
{
  "prompt": "Write a detailed explanation of...",
  "options": { "temperature": 0.5, "maxTokens": 500 }
}

Response: {
  "success": true,
  "data": { "sessionId": "stream-456" }
}

# Get streaming chunks
GET /api/gemini/stream/{sessionId}

Response: {
  "success": true,
  "data": {
    "sessionId": "stream-456",
    "isActive": true,
    "chunks": [
      { "text": "First chunk...", "isComplete": false },
      { "text": "Second chunk...", "isComplete": false },
      { "text": "", "isComplete": true, "finishReason": "STOP" }
    ]
  }
}

# Stop streaming
DELETE /api/gemini/stream/{sessionId}
```

## 🔍 **Analysis Types**

### **Document Analysis Types**
- **SUMMARY**: Comprehensive text summarization
- **KEYWORDS**: Key terms and phrases extraction
- **ENTITIES**: Named entity recognition (people, organizations, dates)
- **SENTIMENT**: Emotional tone and sentiment analysis
- **TOPICS**: Topic modeling and theme identification
- **STRUCTURE**: Document organization and structure analysis
- **COMPREHENSIVE**: All analysis types combined

### **Summary Types**
- **EXTRACTIVE**: Select key sentences from original text
- **ABSTRACTIVE**: Generate new summary text
- **BULLET_POINTS**: Organized bullet point format
- **EXECUTIVE**: Business-focused executive summary
- **TECHNICAL**: Detailed technical summary
- **CREATIVE**: Engaging and memorable summary

### **Summary Lengths**
- **SHORT**: 1-2 concise sentences
- **MEDIUM**: 1 paragraph (3-5 sentences)
- **LONG**: Multiple paragraphs with comprehensive coverage
- **CUSTOM**: Appropriate length for content

## ⚡ **Advanced Features**

### **Progressive Summarization**
Create multi-level summaries for long documents:

```typescript
const progressiveSummary = await summaryService.progressiveSummarization(
  longDocument,
  3 // number of levels
);

console.log('Level 1 (detailed):', progressiveSummary.levels[0].summary);
console.log('Level 2 (medium):', progressiveSummary.levels[1].summary);
console.log('Level 3 (brief):', progressiveSummary.levels[2].summary);
console.log('Final summary:', progressiveSummary.finalSummary);
```

### **Multi-Document Analysis**
Compare and analyze multiple documents:

```typescript
const comparison = await documentAnalysisService.compareDocuments(
  { text: doc1Content, name: 'Report A' },
  { text: doc2Content, name: 'Report B' }
);

console.log('Similarity score:', comparison.similarity);
console.log('Common themes:', comparison.commonThemes);
console.log('Key differences:', comparison.differences);
```

### **Streaming with Progress**
Real-time streaming with progress tracking:

```typescript
const session = await geminiService.generateStreamingText({
  prompt: "Write a comprehensive analysis of...",
  sessionId: 'analysis-stream'
});

session.emitter.on('chunk', (chunk) => {
  console.log('Received chunk:', chunk.text);
  updateProgressBar(chunk.tokenCount);
});

session.emitter.on('complete', (result) => {
  console.log('Streaming completed:', result.fullText);
});
```

### **Batch Processing**
Process multiple documents efficiently:

```typescript
// Batch analysis
const results = await documentAnalysisService.batchAnalyzeDocuments([
  { text: doc1, fileName: 'report1.pdf' },
  { text: doc2, fileName: 'report2.docx' }
]);

// Batch summarization
const summaries = await summaryService.batchSummarize({
  documents: [
    { text: doc1, title: 'Q1 Report' },
    { text: doc2, title: 'Q2 Report' }
  ],
  summaryType: SummaryType.EXECUTIVE,
  length: SummaryLength.MEDIUM,
  options: {
    generateOverallSummary: true,
    includeComparison: true
  }
});
```

## 🛡️ **Security & Validation**

### **File Validation**
Comprehensive file validation before processing:

```typescript
import { QuickFileValidator } from './utils/file-validator';

// Validate uploaded file
const validation = QuickFileValidator.validateForUpload(
  fileBuffer,
  mimeType,
  fileName
);

if (!validation.isValid) {
  throw new Error(`File validation failed: ${validation.message}`);
}
```

### **Content Filtering**
Built-in safety settings and content filtering:

```typescript
const geminiService = new GeminiService({
  // ... other config
  defaultOptions: {
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
      // ... other safety settings
    ]
  }
});
```

### **Rate Limiting**
Intelligent rate limiting with user-specific limits:

```typescript
// Check rate limit status
const rateStatus = await geminiService.getRateLimitStatus(userId);
console.log(`Remaining: ${rateStatus.remaining}/${rateStatus.limit}`);

// Rate limits are automatically enforced
try {
  const response = await geminiService.generateText(request);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log(`Rate limited. Retry after: ${error.retryAfter} seconds`);
  }
}
```

## 📊 **Usage Analytics**

### **Comprehensive Metrics**
Track usage, performance, and costs:

```typescript
const metrics = geminiService.getUsageMetrics();
console.log(`
Usage Summary:
- Total Requests: ${metrics.totalRequests}
- Total Tokens: ${metrics.totalTokens}
- Average Response Time: ${metrics.averageResponseTime}ms
- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%
- Estimated Cost: $${metrics.costEstimate.toFixed(4)}
- Most Used Features: ${metrics.mostUsedFeatures.join(', ')}
`);
```

### **Session Statistics**
Monitor chat and Q&A sessions:

```typescript
const sessionStats = questionAnswerService.getSessionStats();
console.log(`
Session Statistics:
- Total Sessions: ${sessionStats.totalSessions}
- Active Sessions: ${sessionStats.activeSessions}
- Average Messages per Session: ${sessionStats.averageSessionLength}
`);
```

## 🔧 **Configuration**

### **Environment Variables**
```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional service configuration
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7
GEMINI_TOP_K=40
GEMINI_TOP_P=0.8

# Rate limiting
GEMINI_RATE_LIMIT=100
GEMINI_RATE_WINDOW=60000

# Feature flags
GEMINI_STREAMING_ENABLED=true
GEMINI_CACHING_ENABLED=true
```

### **Service Configuration**
```typescript
const config: GeminiServiceConfig = {
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-pro',
  defaultOptions: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
    maxTokens: 2048,
    safetySettings: [
      // Safety configuration
    ]
  },
  rateLimiting: {
    maxRequests: 100,
    windowMs: 60 * 1000
  },
  retryOptions: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      GeminiErrorCode.RATE_LIMIT_EXCEEDED,
      GeminiErrorCode.MODEL_OVERLOADED
    ]
  },
  cachingEnabled: true,
  streamingEnabled: true
};
```

## 💻 **Usage Examples**

### **Complete Document Analysis Workflow**
```typescript
import { 
  GeminiService, 
  DocumentAnalysisService, 
  QuestionAnswerService,
  TextSummarizationService 
} from './services';
import { AdvancedFileProcessor } from './utils/advanced-file-processor';

async function analyzeDocument(filePath: string) {
  // Initialize services
  const geminiService = new GeminiService(config);
  const analysisService = new DocumentAnalysisService(geminiService);
  const qaService = new QuestionAnswerService(geminiService);
  const summaryService = new TextSummarizationService(geminiService);
  const fileProcessor = new AdvancedFileProcessor();

  // Process uploaded file
  const fileBuffer = fs.readFileSync(filePath);
  const processedFile = await fileProcessor.processFileWithProgress(
    fileBuffer,
    'application/pdf',
    'document.pdf',
    true
  );

  if (!processedFile.extractedText) {
    throw new Error('Could not extract text from file');
  }

  // 1. Get analysis suggestions
  const suggestions = await analysisService.getAnalysisSuggestions(
    processedFile.extractedText
  );
  console.log('Recommended analyses:', suggestions.suggestedAnalyses);

  // 2. Perform comprehensive analysis
  const analysis = await analysisService.analyzeDocument({
    text: processedFile.extractedText,
    analysisType: AnalysisType.COMPREHENSIVE,
    options: { includeMetrics: true },
    fileName: 'document.pdf'
  });

  // 3. Generate executive summary
  const summary = await summaryService.summarizeText({
    text: processedFile.extractedText,
    summaryType: SummaryType.EXECUTIVE,
    length: SummaryLength.MEDIUM,
    targetAudience: 'executives'
  });

  // 4. Set up interactive Q&A
  console.log('Document ready for questions...');
  const qaSession = await qaService.chatWithDocument({
    message: "What are the key findings in this document?",
    context: processedFile.extractedText,
    options: { includeHistory: false }
  });

  return {
    fileInfo: {
      name: 'document.pdf',
      size: fileBuffer.length,
      type: 'application/pdf',
      processingTime: processedFile.metadata?.processingTimeMs
    },
    analysis,
    summary,
    initialQA: qaSession,
    suggestions
  };
}
```

### **Streaming Analysis with Progress**
```typescript
async function streamingAnalysis(text: string) {
  const geminiService = new GeminiService(config);
  
  // Start streaming analysis
  const session = await geminiService.generateStreamingText({
    prompt: `Provide a detailed analysis of this document: ${text}`,
    options: { temperature: 0.3, maxTokens: 1000 },
    sessionId: `analysis_${Date.now()}`
  });

  let fullAnalysis = '';
  
  // Handle streaming chunks
  session.emitter.on('chunk', (chunk) => {
    fullAnalysis += chunk.text;
    console.log(`Progress: ${chunk.tokenCount} tokens received`);
    // Update UI with streaming text
    updateAnalysisDisplay(fullAnalysis);
  });

  session.emitter.on('complete', (result) => {
    console.log('Analysis completed:', {
      totalTokens: result.totalTokens,
      duration: result.duration,
      chunkCount: result.chunkCount
    });
    
    finalizeAnalysisDisplay(result.fullText);
  });

  session.emitter.on('error', (error) => {
    console.error('Streaming error:', error);
    showErrorMessage(error.message);
  });

  return session;
}
```

### **Multi-Document Intelligence**
```typescript
async function multiDocumentIntelligence(documents: string[]) {
  const geminiService = new GeminiService(config);
  const qaService = new QuestionAnswerService(geminiService);
  const summaryService = new TextSummarizationService(geminiService);

  // Process multiple documents
  const docObjects = documents.map((text, index) => ({
    text,
    title: `Document ${index + 1}`,
    source: `doc_${index + 1}.pdf`
  }));

  // Multi-document Q&A
  const insights = await qaService.answerFromMultipleDocuments(
    "What are the common themes and key differences across these documents?",
    docObjects,
    { includeSourceReferences: true }
  );

  // Batch summarization with comparison
  const batchSummary = await summaryService.batchSummarize({
    documents: docObjects,
    summaryType: SummaryType.ABSTRACTIVE,
    length: SummaryLength.MEDIUM,
    options: {
      generateOverallSummary: true,
      includeComparison: true,
      preserveIndividualSummaries: true
    }
  });

  return {
    insights,
    individualSummaries: batchSummary.individualSummaries,
    overallSummary: batchSummary.overallSummary,
    comparison: batchSummary.comparison,
    statistics: batchSummary.statistics
  };
}
```

## 🚀 **Performance & Optimization**

### **Caching Strategy**
Intelligent caching for improved performance:

```typescript
// Enable caching in service configuration
const config: GeminiServiceConfig = {
  // ... other config
  cachingEnabled: true,
  // Responses are cached based on prompt hash and parameters
};
```

### **Batch Processing**
Optimize for multiple documents:

```typescript
// Process multiple files efficiently
const results = await Promise.all([
  analysisService.analyzeDocument(doc1Request),
  analysisService.analyzeDocument(doc2Request),
  analysisService.analyzeDocument(doc3Request)
]);

// Or use dedicated batch methods
const batchResults = await analysisService.batchAnalyzeDocuments([
  doc1Request, doc2Request, doc3Request
]);
```

### **Error Recovery**
Robust error handling with retries:

```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    GeminiErrorCode.RATE_LIMIT_EXCEEDED,
    GeminiErrorCode.MODEL_OVERLOADED,
    GeminiErrorCode.NETWORK_ERROR
  ]
};
```

## 📈 **Monitoring & Troubleshooting**

### **Health Monitoring**
```http
GET /api/gemini/health
```

### **Usage Tracking**
```http
GET /api/gemini/usage?period=today
```

### **Common Error Codes**
- `API_KEY_INVALID`: Invalid or missing API key
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `QUOTA_EXCEEDED`: API quota exceeded  
- `CONTENT_FILTERED`: Content blocked by safety filters
- `CONTEXT_TOO_LONG`: Input text exceeds limits
- `MODEL_OVERLOADED`: Gemini service overloaded

The Google Gemini AI integration provides enterprise-grade AI capabilities with comprehensive document analysis, intelligent summarization, and interactive Q&A features! 🤖✨