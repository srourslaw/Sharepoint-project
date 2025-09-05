import { GeminiService } from './geminiService';
import {
  DocumentAnalysisRequest,
  DocumentAnalysisResult,
  AnalysisType,
  Summary,
  Keyword,
  Entity,
  EntityType,
  SentimentAnalysis,
  SentimentScore,
  Topic,
  DocumentStructure,
  DocumentMetrics,
  GeminiRequest,
  GeminiError,
  GeminiErrorCode
} from '../types/gemini';

/**
 * Document analysis service using Gemini AI
 */
export class DocumentAnalysisService {
  private geminiService: GeminiService;
  private analysisPrompts: Map<AnalysisType, string> = new Map();

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.initializePrompts();
  }

  /**
   * Initialize analysis prompts
   */
  private initializePrompts(): void {
    this.analysisPrompts.set(AnalysisType.SUMMARY, `
Please analyze the following document and provide a comprehensive summary.
Format your response as JSON with this structure:
{
  "summary": {
    "text": "Main summary text",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "confidence": 0.95
  }
}

Document:
{{DOCUMENT_TEXT}}

Respond with only the JSON, no additional text.
`);

    this.analysisPrompts.set(AnalysisType.KEYWORDS, `
Extract the most important keywords and key phrases from this document.
Format your response as JSON with this structure:
{
  "keywords": [
    {"text": "keyword", "relevance": 0.95, "frequency": 5, "category": "technology"},
    {"text": "key phrase", "relevance": 0.87, "frequency": 3, "category": "business"}
  ]
}

Document:
{{DOCUMENT_TEXT}}

Focus on {{KEYWORD_COUNT}} most relevant keywords. Respond with only the JSON.
`);

    this.analysisPrompts.set(AnalysisType.ENTITIES, `
Identify and extract named entities from this document.
Format your response as JSON with this structure:
{
  "entities": [
    {"text": "Entity Name", "type": "person", "confidence": 0.95},
    {"text": "Company Inc", "type": "organization", "confidence": 0.89}
  ]
}

Entity types: person, organization, location, date, email, url, phone, money, other

Document:
{{DOCUMENT_TEXT}}

Respond with only the JSON, no additional text.
`);

    this.analysisPrompts.set(AnalysisType.SENTIMENT, `
Analyze the sentiment and emotional tone of this document.
Format your response as JSON with this structure:
{
  "sentiment": {
    "overall": {
      "score": 0.3,
      "magnitude": 0.8,
      "label": "positive",
      "confidence": 0.92
    },
    "emotionalTone": {
      "joy": 0.4,
      "sadness": 0.1,
      "anger": 0.0,
      "fear": 0.1,
      "surprise": 0.2,
      "disgust": 0.0
    }
  }
}

Score range: -1 (negative) to 1 (positive)
Magnitude: 0 (neutral) to infinity (strong emotion)
Labels: positive, negative, neutral, mixed

Document:
{{DOCUMENT_TEXT}}

Respond with only the JSON, no additional text.
`);

    this.analysisPrompts.set(AnalysisType.TOPICS, `
Identify the main topics and themes discussed in this document.
Format your response as JSON with this structure:
{
  "topics": [
    {
      "name": "Topic Name",
      "confidence": 0.95,
      "keywords": ["related", "keywords"],
      "description": "Brief description of the topic"
    }
  ]
}

Document:
{{DOCUMENT_TEXT}}

Identify the top 5 most relevant topics. Respond with only the JSON.
`);

    this.analysisPrompts.set(AnalysisType.STRUCTURE, `
Analyze the structure and organization of this document.
Format your response as JSON with this structure:
{
  "structure": {
    "sections": [
      {
        "title": "Section Title",
        "content": "Section content summary",
        "level": 1,
        "startIndex": 0,
        "endIndex": 100
      }
    ],
    "headings": [
      {"text": "Heading Text", "level": 1, "position": 50}
    ],
    "paragraphs": 10,
    "sentences": 45,
    "words": 500
  }
}

Document:
{{DOCUMENT_TEXT}}

Respond with only the JSON, no additional text.
`);

    this.analysisPrompts.set(AnalysisType.COMPREHENSIVE, `
Provide a comprehensive analysis of this document including summary, keywords, entities, sentiment, topics, and structure.
Format your response as JSON with this structure:
{
  "summary": { "text": "...", "keyPoints": [...], "confidence": 0.95 },
  "keywords": [{"text": "...", "relevance": 0.9, "frequency": 3}],
  "entities": [{"text": "...", "type": "person", "confidence": 0.9}],
  "sentiment": { "overall": {"score": 0.3, "label": "positive", "confidence": 0.9} },
  "topics": [{"name": "...", "confidence": 0.9, "keywords": [...]}],
  "metrics": {
    "readingTime": 5,
    "complexity": "moderate",
    "wordCount": 500,
    "readabilityScore": 65
  }
}

Document:
{{DOCUMENT_TEXT}}

Respond with only the JSON, no additional text.
`);
  }

  /**
   * Analyze document
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateAnalysisRequest(request);

      // Prepare the analysis prompt
      const prompt = this.buildAnalysisPrompt(request);
      
      // Make request to Gemini
      const geminiRequest: GeminiRequest = {
        prompt,
        maxTokens: this.getMaxTokensForAnalysis(request.analysisType),
        temperature: 0.1, // Lower temperature for more consistent analysis
        sessionId: `analysis_${Date.now()}`
      };

      const geminiResponse = await this.geminiService.generateText(geminiRequest);
      
      // Parse the response
      const analysisResult = await this.parseAnalysisResponse(
        geminiResponse.text,
        request
      );

      // Add metadata
      analysisResult.timestamp = new Date().toISOString();
      analysisResult.processingTime = Date.now() - startTime;
      analysisResult.fileName = request.fileName;
      analysisResult.analysisType = request.analysisType;

      // Add basic metrics if not included
      if (!analysisResult.metrics) {
        analysisResult.metrics = this.calculateBasicMetrics(request.text);
      }

      return analysisResult;

    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      throw new GeminiError(
        GeminiErrorCode.UNKNOWN_ERROR,
        `Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Batch analyze multiple documents
   */
  async batchAnalyzeDocuments(
    requests: DocumentAnalysisRequest[]
  ): Promise<DocumentAnalysisResult[]> {
    const results: DocumentAnalysisResult[] = [];
    const errors: { index: number; error: any }[] = [];

    // Process documents sequentially to respect rate limits
    for (let i = 0; i < requests.length; i++) {
      try {
        const result = await this.analyzeDocument(requests[i]);
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error });
        // Add placeholder result for failed analysis
        results.push({
          analysisType: requests[i].analysisType,
          fileName: requests[i].fileName,
          timestamp: new Date().toISOString(),
          processingTime: 0,
          metrics: this.calculateBasicMetrics(requests[i].text)
        });
      }
    }

    // Log errors but don't throw - return partial results
    if (errors.length > 0) {
      console.warn(`${errors.length} documents failed analysis:`, errors);
    }

    return results;
  }

  /**
   * Get analysis suggestions based on document content
   */
  async getAnalysisSuggestions(text: string): Promise<{
    suggestedAnalyses: AnalysisType[];
    reasoning: string[];
  }> {
    const prompt = `
Analyze this document excerpt and suggest the most valuable types of analysis to perform.
Consider the content type, length, and apparent purpose.

Available analysis types:
- summary: Text summarization
- keywords: Key terms and phrases
- entities: Named entity recognition
- sentiment: Emotional tone analysis
- topics: Topic modeling
- structure: Document organization
- comprehensive: All of the above

Document excerpt (first 500 characters):
${text.substring(0, 500)}

Respond with JSON:
{
  "suggestedAnalyses": ["summary", "keywords", "entities"],
  "reasoning": ["Document appears to be a business report", "Contains many proper nouns suggesting entities"]
}
`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 200,
        temperature: 0.3
      });

      return JSON.parse(response.text);
    } catch (error) {
      // Fallback suggestions based on document length
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount < 100) {
        return {
          suggestedAnalyses: [AnalysisType.KEYWORDS, AnalysisType.ENTITIES],
          reasoning: ['Short document - focus on key terms and entities']
        };
      } else if (wordCount < 500) {
        return {
          suggestedAnalyses: [AnalysisType.SUMMARY, AnalysisType.KEYWORDS, AnalysisType.SENTIMENT],
          reasoning: ['Medium document - summary and sentiment analysis recommended']
        };
      } else {
        return {
          suggestedAnalyses: [AnalysisType.COMPREHENSIVE],
          reasoning: ['Long document - comprehensive analysis recommended']
        };
      }
    }
  }

  /**
   * Validate analysis request
   */
  private validateAnalysisRequest(request: DocumentAnalysisRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Document text is required',
        400
      );
    }

    if (request.text.length > 100000) { // 100K characters limit
      throw new GeminiError(
        GeminiErrorCode.CONTEXT_TOO_LONG,
        'Document text is too long (max 100,000 characters)',
        400
      );
    }

    if (!Object.values(AnalysisType).includes(request.analysisType)) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        `Invalid analysis type: ${request.analysisType}`,
        400
      );
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(request: DocumentAnalysisRequest): string {
    const template = this.analysisPrompts.get(request.analysisType);
    if (!template) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        `No prompt template for analysis type: ${request.analysisType}`,
        400
      );
    }

    let prompt = template.replace('{{DOCUMENT_TEXT}}', request.text);
    
    // Replace other placeholders
    if (request.options.keywordCount) {
      prompt = prompt.replace('{{KEYWORD_COUNT}}', request.options.keywordCount.toString());
    } else {
      prompt = prompt.replace('{{KEYWORD_COUNT}}', '10');
    }

    return prompt;
  }

  /**
   * Get max tokens for analysis type
   */
  private getMaxTokensForAnalysis(analysisType: AnalysisType): number {
    const tokenLimits = {
      [AnalysisType.SUMMARY]: 1000,
      [AnalysisType.KEYWORDS]: 500,
      [AnalysisType.ENTITIES]: 800,
      [AnalysisType.SENTIMENT]: 300,
      [AnalysisType.TOPICS]: 600,
      [AnalysisType.STRUCTURE]: 1200,
      [AnalysisType.COMPREHENSIVE]: 2000
    };

    return tokenLimits[analysisType] || 1000;
  }

  /**
   * Parse analysis response
   */
  private async parseAnalysisResponse(
    responseText: string,
    request: DocumentAnalysisRequest
  ): Promise<DocumentAnalysisResult> {
    try {
      // Clean the response text
      const cleanedText = responseText.trim();
      
      // Try to find JSON in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Create the result object
      const result: DocumentAnalysisResult = {
        analysisType: request.analysisType,
        fileName: request.fileName,
        timestamp: '',
        processingTime: 0
      };

      // Map the parsed data based on analysis type
      switch (request.analysisType) {
        case AnalysisType.SUMMARY:
          result.summary = parsed.summary;
          break;

        case AnalysisType.KEYWORDS:
          result.keywords = parsed.keywords;
          break;

        case AnalysisType.ENTITIES:
          result.entities = parsed.entities;
          break;

        case AnalysisType.SENTIMENT:
          result.sentiment = parsed.sentiment;
          break;

        case AnalysisType.TOPICS:
          result.topics = parsed.topics;
          break;

        case AnalysisType.STRUCTURE:
          result.structure = parsed.structure;
          break;

        case AnalysisType.COMPREHENSIVE:
          result.summary = parsed.summary;
          result.keywords = parsed.keywords;
          result.entities = parsed.entities;
          result.sentiment = parsed.sentiment;
          result.topics = parsed.topics;
          result.structure = parsed.structure;
          result.metrics = parsed.metrics;
          break;
      }

      return result;

    } catch (error) {
      // Fallback: create basic result with raw response
      console.warn('Failed to parse analysis response:', error);
      
      return {
        analysisType: request.analysisType,
        fileName: request.fileName,
        timestamp: '',
        processingTime: 0,
        // Add basic fallback data
        summary: request.analysisType === AnalysisType.SUMMARY ? {
          text: responseText.substring(0, 500),
          keyPoints: [responseText.substring(0, 100)],
          length: 'medium',
          confidence: 0.5
        } : undefined
      };
    }
  }

  /**
   * Calculate basic document metrics
   */
  private calculateBasicMetrics(text: string): DocumentMetrics {
    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;

    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(wordCount / 200);

    // Simple complexity calculation
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (averageWordsPerSentence > 20 || averageSentencesPerParagraph > 10) {
      complexity = 'complex';
    } else if (averageWordsPerSentence > 15 || averageSentencesPerParagraph > 5) {
      complexity = 'moderate';
    }

    // Simple readability score (Flesch Reading Ease approximation)
    const avgSentenceLength = averageWordsPerSentence;
    const avgSyllablesPerWord = this.estimateAverageSyllables(words);
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    ));

    return {
      readingTime,
      complexity,
      readabilityScore,
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence,
      averageSentencesPerParagraph
    };
  }

  /**
   * Estimate average syllables per word
   */
  private estimateAverageSyllables(words: string[]): number {
    if (words.length === 0) return 1;

    const totalSyllables = words.reduce((total, word) => {
      return total + this.countSyllables(word);
    }, 0);

    return totalSyllables / words.length;
  }

  /**
   * Count syllables in a word (simple approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllables = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllables++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e')) {
      syllables--;
    }

    return Math.max(1, syllables);
  }

  /**
   * Compare documents
   */
  async compareDocuments(
    doc1: { text: string; name?: string },
    doc2: { text: string; name?: string }
  ): Promise<{
    similarity: number;
    differences: string[];
    commonThemes: string[];
    uniqueToDoc1: string[];
    uniqueToDoc2: string[];
  }> {
    const prompt = `
Compare these two documents and analyze their similarities and differences.

Document 1 (${doc1.name || 'Document 1'}):
${doc1.text.substring(0, 2000)}

Document 2 (${doc2.name || 'Document 2'}):
${doc2.text.substring(0, 2000)}

Provide a JSON response with:
{
  "similarity": 0.75,
  "differences": ["Different focus areas", "Different writing styles"],
  "commonThemes": ["Business strategy", "Market analysis"],
  "uniqueToDoc1": ["Specific to first document"],
  "uniqueToDoc2": ["Specific to second document"]
}

Similarity should be a score from 0 to 1.
`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 800,
        temperature: 0.2
      });

      return JSON.parse(response.text);
    } catch (error) {
      // Basic fallback comparison
      const words1 = new Set(doc1.text.toLowerCase().split(/\s+/));
      const words2 = new Set(doc2.text.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      const similarity = intersection.size / union.size;

      return {
        similarity,
        differences: ['Unable to analyze differences'],
        commonThemes: ['Unable to identify themes'],
        uniqueToDoc1: ['Unable to analyze unique content'],
        uniqueToDoc2: ['Unable to analyze unique content']
      };
    }
  }
}