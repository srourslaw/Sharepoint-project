import { GeminiService } from './geminiService';
import { DocumentAnalysisService } from './documentAnalysisService';
import { 
  Keyword, 
  Entity, 
  EntityType, 
  DocumentStructure, 
  DocumentSection,
  Heading,
  AnalysisType
} from '../types/gemini';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface ContentExtractionRequest {
  text: string;
  fileName?: string;
  extractionTypes: ExtractionType[];
  options: ExtractionOptions;
}

export enum ExtractionType {
  KEYWORDS = 'keywords',
  ENTITIES = 'entities',
  TOPICS = 'topics',
  HEADINGS = 'headings',
  SUMMARIES = 'summaries',
  QUOTES = 'quotes',
  NUMBERS = 'numbers',
  DATES = 'dates',
  URLS = 'urls',
  EMAILS = 'emails',
  PHONE_NUMBERS = 'phone_numbers',
  ADDRESSES = 'addresses',
  TECHNICAL_TERMS = 'technical_terms',
  ACTION_ITEMS = 'action_items',
  QUESTIONS = 'questions'
}

export interface ExtractionOptions {
  keywordCount?: number;
  minKeywordRelevance?: number;
  entityConfidenceThreshold?: number;
  includeContext?: boolean;
  language?: string;
  preserveFormatting?: boolean;
  groupSimilar?: boolean;
  rankByImportance?: boolean;
  extractMetadata?: boolean;
}

export interface ExtractedContent {
  type: ExtractionType;
  items: ExtractionItem[];
  confidence: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface ExtractionItem {
  text: string;
  type?: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  context?: string;
  metadata?: Record<string, any>;
  category?: string;
  importance?: number;
  frequency?: number;
}

export interface ContentExtractionResult {
  fileName?: string;
  extractedContent: ExtractedContent[];
  overallMetrics: {
    totalItems: number;
    processingTime: number;
    averageConfidence: number;
    textLength: number;
    extractionCoverage: number;
  };
  timestamp: string;
}

export interface KeywordCluster {
  mainKeyword: string;
  relatedKeywords: string[];
  frequency: number;
  importance: number;
  category?: string;
}

export interface ContentMap {
  sections: ContentSection[];
  keywordClusters: KeywordCluster[];
  entityNetwork: EntityNetwork;
  contentFlow: string[];
}

export interface ContentSection {
  title: string;
  content: string;
  keywords: string[];
  entities: string[];
  importance: number;
  startIndex: number;
  endIndex: number;
}

export interface EntityNetwork {
  entities: NetworkEntity[];
  relationships: EntityRelationship[];
}

export interface NetworkEntity {
  text: string;
  type: EntityType;
  frequency: number;
  importance: number;
  connections: string[];
}

export interface EntityRelationship {
  entity1: string;
  entity2: string;
  relationshipType: 'co-occurrence' | 'semantic' | 'hierarchical';
  strength: number;
}

export class ContentExtractionService {
  constructor(
    private geminiService: GeminiService,
    private analysisService: DocumentAnalysisService
  ) {}

  async extractContent(request: ContentExtractionRequest): Promise<ContentExtractionResult> {
    const startTime = Date.now();
    const sanitizedText = this.sanitizeInput(request.text);
    
    const extractedContent: ExtractedContent[] = [];
    
    // Process each extraction type
    for (const extractionType of request.extractionTypes) {
      try {
        const extracted = await this.performExtraction(
          sanitizedText,
          extractionType,
          request.options
        );
        extractedContent.push(extracted);
      } catch (error: any) {
        console.error(`Error extracting ${extractionType}:`, error);
        
        // Add error result
        extractedContent.push({
          type: extractionType,
          items: [],
          confidence: 0,
          processingTime: 0,
          metadata: { error: true, errorMessage: error.message }
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    
    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(
      extractedContent,
      sanitizedText,
      totalProcessingTime
    );

    return {
      fileName: request.fileName,
      extractedContent,
      overallMetrics,
      timestamp: new Date().toISOString()
    };
  }

  async extractKeywordClusters(text: string, options: ExtractionOptions = {}): Promise<KeywordCluster[]> {
    const sanitizedText = this.sanitizeInput(text);
    
    // First extract keywords
    const keywordExtraction = await this.performExtraction(
      sanitizedText,
      ExtractionType.KEYWORDS,
      { ...options, keywordCount: 50 }
    );

    const keywords = keywordExtraction.items.map(item => ({
      text: item.text,
      frequency: item.frequency || 1,
      importance: item.importance || item.confidence
    }));

    // Group related keywords using AI
    const clusteringPrompt = this.buildClusteringPrompt(keywords);
    
    const response = await this.geminiService.generateText({
      prompt: clusteringPrompt,
      maxTokens: 1000,
      temperature: 0.3
    });

    return this.parseKeywordClusters(response.text, keywords);
  }

  async createContentMap(text: string): Promise<ContentMap> {
    const sanitizedText = this.sanitizeInput(text);
    
    // Extract structure and content
    const [structure, keywords, entities] = await Promise.all([
      this.analysisService.analyzeDocument({
        text: sanitizedText,
        analysisType: AnalysisType.STRUCTURE,
        options: { includeMetrics: true }
      }),
      this.performExtraction(sanitizedText, ExtractionType.KEYWORDS, { keywordCount: 30 }),
      this.performExtraction(sanitizedText, ExtractionType.ENTITIES, { entityConfidenceThreshold: 0.7 })
    ]);

    // Create content sections
    const sections = this.createContentSections(
      sanitizedText,
      structure.structure?.sections || [],
      keywords.items,
      entities.items
    );

    // Create keyword clusters
    const keywordClusters = await this.extractKeywordClusters(sanitizedText);

    // Build entity network
    const entityNetwork = this.buildEntityNetwork(entities.items);

    // Generate content flow
    const contentFlow = this.generateContentFlow(sections);

    return {
      sections,
      keywordClusters,
      entityNetwork,
      contentFlow
    };
  }

  async extractActionItems(text: string): Promise<ExtractionItem[]> {
    const sanitizedText = this.sanitizeInput(text);
    
    const prompt = `Extract all action items, tasks, and to-do items from the following text. 
    Look for:
    - Explicit action words (do, create, implement, review, etc.)
    - Deadline mentions
    - Responsibility assignments
    - Task descriptions

    Text:
    "${sanitizedText}"

    Return a JSON array with this format:
    [
      {
        "text": "Complete the quarterly report",
        "type": "task",
        "confidence": 90,
        "context": "surrounding text",
        "metadata": {
          "deadline": "end of quarter",
          "priority": "high",
          "assignee": "team lead"
        }
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return this.parseExtractionResponse(response.text, 'action_items');
  }

  async extractTechnicalTerms(text: string, domain?: string): Promise<ExtractionItem[]> {
    const sanitizedText = this.sanitizeInput(text);
    
    const prompt = `Extract technical terms, jargon, and specialized vocabulary from the following text.
    ${domain ? `Focus on terms related to: ${domain}` : 'Consider terms from any technical domain.'}

    Look for:
    - Technical abbreviations and acronyms
    - Specialized terminology
    - Industry-specific vocabulary
    - Technical processes and methods
    - Software/hardware names
    - Standards and protocols

    Text:
    "${sanitizedText}"

    Return a JSON array with this format:
    [
      {
        "text": "API",
        "type": "acronym",
        "confidence": 95,
        "context": "surrounding text",
        "metadata": {
          "fullForm": "Application Programming Interface",
          "domain": "software engineering",
          "definition": "brief definition"
        }
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return this.parseExtractionResponse(response.text, 'technical_terms');
  }

  async extractNumbers(text: string): Promise<ExtractionItem[]> {
    const sanitizedText = this.sanitizeInput(text);
    const numberPatterns = [
      /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g, // Numbers with commas
      /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g,   // Currency
      /\b\d+(?:\.\d+)?%\b/g,               // Percentages
      /\b\d+(?:\.\d+)?\s*(?:kg|km|lb|ft|m|cm|mm|g|oz)\b/gi, // Measurements
    ];

    const numbers: ExtractionItem[] = [];
    
    for (const pattern of numberPatterns) {
      let match;
      while ((match = pattern.exec(sanitizedText)) !== null) {
        const number = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + number.length;
        const context = this.getContext(sanitizedText, startIndex, 50);

        numbers.push({
          text: number,
          type: this.classifyNumber(number),
          confidence: 95,
          startIndex,
          endIndex,
          context,
          metadata: {
            pattern: pattern.source,
            numericValue: this.extractNumericValue(number)
          }
        });
      }
    }

    return this.deduplicateItems(numbers);
  }

  async extractStructuredData(text: string): Promise<{
    tables: ExtractionItem[];
    lists: ExtractionItem[];
    codeBlocks: ExtractionItem[];
  }> {
    const sanitizedText = this.sanitizeInput(text);
    
    const prompt = `Extract structured data elements from the following text:

    Text:
    "${sanitizedText}"

    Find and extract:
    1. Tables (including headers and data)
    2. Lists (bulleted, numbered, or structured lists)
    3. Code blocks or technical snippets

    Return a JSON object with this format:
    {
      "tables": [
        {
          "text": "table content",
          "confidence": 90,
          "metadata": {
            "rows": 5,
            "columns": 3,
            "hasHeaders": true
          }
        }
      ],
      "lists": [
        {
          "text": "list content",
          "confidence": 95,
          "metadata": {
            "listType": "bulleted",
            "itemCount": 5
          }
        }
      ],
      "codeBlocks": [
        {
          "text": "code content",
          "confidence": 85,
          "metadata": {
            "language": "javascript",
            "lineCount": 10
          }
        }
      ]
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 2000,
      temperature: 0.1
    });

    return this.parseStructuredDataResponse(response.text);
  }

  private async performExtraction(
    text: string,
    extractionType: ExtractionType,
    options: ExtractionOptions
  ): Promise<ExtractedContent> {
    const startTime = Date.now();

    let items: ExtractionItem[] = [];
    let confidence = 0;

    switch (extractionType) {
      case ExtractionType.KEYWORDS:
        items = await this.extractKeywords(text, options);
        confidence = 90;
        break;
        
      case ExtractionType.ENTITIES:
        items = await this.extractEntities(text, options);
        confidence = 85;
        break;
        
      case ExtractionType.NUMBERS:
        items = await this.extractNumbers(text);
        confidence = 95;
        break;

      case ExtractionType.DATES:
        items = await this.extractDates(text);
        confidence = 90;
        break;

      case ExtractionType.EMAILS:
        items = this.extractEmails(text);
        confidence = 98;
        break;

      case ExtractionType.URLS:
        items = this.extractURLs(text);
        confidence = 98;
        break;

      case ExtractionType.PHONE_NUMBERS:
        items = this.extractPhoneNumbers(text);
        confidence = 92;
        break;

      case ExtractionType.ACTION_ITEMS:
        items = await this.extractActionItems(text);
        confidence = 80;
        break;

      case ExtractionType.TECHNICAL_TERMS:
        items = await this.extractTechnicalTerms(text);
        confidence = 82;
        break;

      case ExtractionType.QUESTIONS:
        items = this.extractQuestions(text);
        confidence = 88;
        break;

      default:
        throw new Error(`Extraction type ${extractionType} not implemented`);
    }

    // Apply filtering and ranking
    items = this.filterAndRankItems(items, options);

    const processingTime = Date.now() - startTime;

    return {
      type: extractionType,
      items,
      confidence,
      processingTime,
      metadata: {
        itemCount: items.length,
        averageConfidence: items.reduce((sum, item) => sum + item.confidence, 0) / items.length
      }
    };
  }

  private async extractKeywords(text: string, options: ExtractionOptions): Promise<ExtractionItem[]> {
    const prompt = `Extract the most important keywords and key phrases from the following text.

    Text:
    "${text}"

    Requirements:
    - Extract ${options.keywordCount || 20} keywords/phrases
    - Focus on substantive terms (nouns, noun phrases, important concepts)
    - Include relevance score (0-100)
    - Avoid stop words and very common terms
    - Consider both single words and multi-word phrases

    Return a JSON array:
    [
      {
        "text": "machine learning",
        "confidence": 95,
        "frequency": 5,
        "category": "technology",
        "importance": 90
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.3
    });

    return this.parseExtractionResponse(response.text, 'keywords');
  }

  private async extractEntities(text: string, options: ExtractionOptions): Promise<ExtractionItem[]> {
    const prompt = `Extract named entities from the following text.

    Text:
    "${text}"

    Extract:
    - People (PERSON)
    - Organizations (ORGANIZATION)  
    - Locations (LOCATION)
    - Dates (DATE)
    - Money amounts (MONEY)
    - Other significant entities (OTHER)

    Return a JSON array:
    [
      {
        "text": "John Smith",
        "type": "PERSON",
        "confidence": 95,
        "context": "surrounding text"
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return this.parseExtractionResponse(response.text, 'entities');
  }

  private async extractDates(text: string): Promise<ExtractionItem[]> {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,           // MM/DD/YYYY
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,            // MM-DD-YYYY
      /\b\d{4}-\d{1,2}-\d{1,2}\b/g,              // YYYY-MM-DD
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, // Month DD, YYYY
      /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,   // DD Month YYYY
    ];

    const dates: ExtractionItem[] = [];
    
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + dateStr.length;
        const context = this.getContext(text, startIndex, 50);

        dates.push({
          text: dateStr,
          type: 'date',
          confidence: 90,
          startIndex,
          endIndex,
          context,
          metadata: {
            pattern: pattern.source,
            parsedDate: this.parseDate(dateStr)
          }
        });
      }
    }

    return this.deduplicateItems(dates);
  }

  private extractEmails(text: string): ExtractionItem[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails: ExtractionItem[] = [];
    
    let match;
    while ((match = emailPattern.exec(text)) !== null) {
      const email = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + email.length;
      const context = this.getContext(text, startIndex, 50);

      emails.push({
        text: email,
        type: 'email',
        confidence: 98,
        startIndex,
        endIndex,
        context,
        metadata: {
          domain: email.split('@')[1]
        }
      });
    }

    return emails;
  }

  private extractURLs(text: string): ExtractionItem[] {
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const urls: ExtractionItem[] = [];
    
    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      const url = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + url.length;
      const context = this.getContext(text, startIndex, 50);

      urls.push({
        text: url,
        type: 'url',
        confidence: 98,
        startIndex,
        endIndex,
        context,
        metadata: {
          domain: this.extractDomain(url),
          protocol: url.startsWith('https') ? 'https' : 'http'
        }
      });
    }

    return urls;
  }

  private extractPhoneNumbers(text: string): ExtractionItem[] {
    const phonePatterns = [
      /\b(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, // US format
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,                                // Simple format
    ];

    const phones: ExtractionItem[] = [];
    
    for (const pattern of phonePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const phone = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + phone.length;
        const context = this.getContext(text, startIndex, 50);

        phones.push({
          text: phone,
          type: 'phone',
          confidence: 92,
          startIndex,
          endIndex,
          context,
          metadata: {
            normalized: this.normalizePhoneNumber(phone)
          }
        });
      }
    }

    return this.deduplicateItems(phones);
  }

  private extractQuestions(text: string): ExtractionItem[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const questions: ExtractionItem[] = [];
    
    let currentIndex = 0;
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.endsWith('?') || 
          trimmedSentence.match(/^(?:what|who|when|where|why|how|which|can|could|would|will|should|do|does|did|is|are|was|were)/i)) {
        
        const startIndex = text.indexOf(sentence, currentIndex);
        const endIndex = startIndex + sentence.length;
        
        questions.push({
          text: trimmedSentence,
          type: 'question',
          confidence: 88,
          startIndex,
          endIndex,
          context: this.getContext(text, startIndex, 100),
          metadata: {
            questionType: this.classifyQuestion(trimmedSentence)
          }
        });
      }
      
      currentIndex += sentence.length;
    }

    return questions;
  }

  private parseExtractionResponse(responseText: string, extractionType: string): ExtractionItem[] {
    try {
      // First try to parse as JSON
      return JSON.parse(responseText).map((item: any) => ({
        text: item.text,
        type: item.type || extractionType,
        confidence: item.confidence || 85,
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        context: item.context,
        metadata: item.metadata || {},
        category: item.category,
        importance: item.importance || item.confidence,
        frequency: item.frequency || 1
      }));
    } catch (error: any) {
      console.error('Error parsing extraction response:', error);
      console.log('Response text was:', responseText.substring(0, 200) + '...');

      // If JSON parsing fails, try to extract meaningful content from the text response
      if (responseText && responseText.length > 0) {
        // Try to find JSON-like content in the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]).map((item: any) => ({
              text: item.text,
              type: item.type || extractionType,
              confidence: item.confidence || 85,
              startIndex: item.startIndex,
              endIndex: item.endIndex,
              context: item.context,
              metadata: item.metadata || {},
              category: item.category,
              importance: item.importance || item.confidence,
              frequency: item.frequency || 1
            }));
          } catch (jsonError) {
            console.warn('Could not parse extracted JSON:', jsonError);
          }
        }

        // As a last resort, create a basic extraction from the text response
        return [{
          text: responseText.substring(0, 100).trim() + '...',
          type: extractionType,
          confidence: 70,
          startIndex: 0,
          endIndex: 100,
          context: responseText.substring(0, 200),
          metadata: { source: 'ai_text_response' },
          category: 'ai_generated',
          importance: 70,
          frequency: 1
        }];
      }

      return [];
    }
  }

  private parseStructuredDataResponse(responseText: string) {
    try {
      const parsed = JSON.parse(responseText);
      return {
        tables: parsed.tables || [],
        lists: parsed.lists || [],
        codeBlocks: parsed.codeBlocks || []
      };
    } catch (error: any) {
      console.error('Error parsing structured data response:', error);
      return { tables: [], lists: [], codeBlocks: [] };
    }
  }

  private buildClusteringPrompt(keywords: Array<{text: string, frequency: number, importance: number}>): string {
    const keywordList = keywords.slice(0, 30).map(k => k.text).join(', ');
    
    return `Group these keywords into 3-5 meaningful clusters based on semantic similarity:

Keywords: ${keywordList}

Return a JSON array of clusters:
[
  {
    "mainKeyword": "artificial intelligence",
    "relatedKeywords": ["machine learning", "deep learning", "AI"],
    "category": "technology"
  }
]`;
  }

  private parseKeywordClusters(responseText: string, originalKeywords: any[]): KeywordCluster[] {
    try {
      const clusters = JSON.parse(responseText);
      return clusters.map((cluster: any) => ({
        mainKeyword: cluster.mainKeyword,
        relatedKeywords: cluster.relatedKeywords || [],
        frequency: this.calculateClusterFrequency(cluster, originalKeywords),
        importance: this.calculateClusterImportance(cluster, originalKeywords),
        category: cluster.category
      }));
    } catch (error: any) {
      console.error('Error parsing keyword clusters:', error);
      return [];
    }
  }

  private calculateClusterFrequency(cluster: any, keywords: any[]): number {
    const clusterKeywords = [cluster.mainKeyword, ...(cluster.relatedKeywords || [])];
    return clusterKeywords.reduce((total, keyword) => {
      const found = keywords.find(k => k.text.toLowerCase() === keyword.toLowerCase());
      return total + (found?.frequency || 0);
    }, 0);
  }

  private calculateClusterImportance(cluster: any, keywords: any[]): number {
    const clusterKeywords = [cluster.mainKeyword, ...(cluster.relatedKeywords || [])];
    const importanceScores = clusterKeywords.map(keyword => {
      const found = keywords.find(k => k.text.toLowerCase() === keyword.toLowerCase());
      return found?.importance || 0;
    });
    return importanceScores.reduce((sum, score) => sum + score, 0) / importanceScores.length;
  }

  private createContentSections(
    text: string, 
    structureSections: DocumentSection[], 
    keywords: ExtractionItem[], 
    entities: ExtractionItem[]
  ): ContentSection[] {
    if (structureSections.length === 0) {
      // Create sections based on paragraphs if no structure found
      const paragraphs = text.split(/\n\s*\n/);
      return paragraphs.map((paragraph, index) => ({
        title: `Section ${index + 1}`,
        content: paragraph.trim(),
        keywords: this.getRelevantItems(keywords, paragraph).map(k => k.text),
        entities: this.getRelevantItems(entities, paragraph).map(e => e.text),
        importance: this.calculateSectionImportance(paragraph, keywords, entities),
        startIndex: text.indexOf(paragraph),
        endIndex: text.indexOf(paragraph) + paragraph.length
      }));
    }

    return structureSections.map(section => ({
      title: section.title,
      content: section.content,
      keywords: this.getRelevantItems(keywords, section.content).map(k => k.text),
      entities: this.getRelevantItems(entities, section.content).map(e => e.text),
      importance: this.calculateSectionImportance(section.content, keywords, entities),
      startIndex: section.startIndex,
      endIndex: section.endIndex
    }));
  }

  private getRelevantItems(items: ExtractionItem[], text: string): ExtractionItem[] {
    return items.filter(item => 
      text.toLowerCase().includes(item.text.toLowerCase())
    );
  }

  private calculateSectionImportance(
    text: string, 
    keywords: ExtractionItem[], 
    entities: ExtractionItem[]
  ): number {
    const textLower = text.toLowerCase();
    let importance = 0;
    
    // Add points for each keyword/entity found
    keywords.forEach(keyword => {
      if (textLower.includes(keyword.text.toLowerCase())) {
        importance += (keyword.importance || keyword.confidence) * 0.1;
      }
    });
    
    entities.forEach(entity => {
      if (textLower.includes(entity.text.toLowerCase())) {
        importance += entity.confidence * 0.15;
      }
    });
    
    // Add points for section length (longer sections might be more important)
    importance += Math.min(text.length / 1000, 5);
    
    return Math.min(100, importance);
  }

  private buildEntityNetwork(entities: ExtractionItem[]): EntityNetwork {
    const networkEntities: NetworkEntity[] = entities.map(entity => ({
      text: entity.text,
      type: entity.type as EntityType || EntityType.OTHER,
      frequency: entity.frequency || 1,
      importance: entity.importance || entity.confidence,
      connections: []
    }));

    const relationships: EntityRelationship[] = [];
    
    // Build relationships based on co-occurrence
    for (let i = 0; i < networkEntities.length; i++) {
      for (let j = i + 1; j < networkEntities.length; j++) {
        const entity1 = networkEntities[i];
        const entity2 = networkEntities[j];
        
        // Simple co-occurrence relationship
        relationships.push({
          entity1: entity1.text,
          entity2: entity2.text,
          relationshipType: 'co-occurrence',
          strength: Math.min(entity1.importance, entity2.importance) / 100
        });
        
        // Update connections
        entity1.connections.push(entity2.text);
        entity2.connections.push(entity1.text);
      }
    }

    return { entities: networkEntities, relationships };
  }

  private generateContentFlow(sections: ContentSection[]): string[] {
    return sections
      .sort((a, b) => a.startIndex - b.startIndex)
      .map(section => section.title);
  }

  private filterAndRankItems(items: ExtractionItem[], options: ExtractionOptions): ExtractionItem[] {
    let filtered = [...items];

    // Filter by confidence threshold
    if (options.entityConfidenceThreshold) {
      filtered = filtered.filter(item => item.confidence >= options.entityConfidenceThreshold!);
    }

    if (options.minKeywordRelevance && filtered[0]?.importance !== undefined) {
      filtered = filtered.filter(item => (item.importance || 0) >= options.minKeywordRelevance!);
    }

    // Group similar items if requested
    if (options.groupSimilar) {
      filtered = this.groupSimilarItems(filtered);
    }

    // Rank by importance if requested
    if (options.rankByImportance) {
      filtered.sort((a, b) => (b.importance || b.confidence) - (a.importance || a.confidence));
    }

    // Limit results for keywords
    if (options.keywordCount && filtered.length > options.keywordCount) {
      filtered = filtered.slice(0, options.keywordCount);
    }

    return filtered;
  }

  private groupSimilarItems(items: ExtractionItem[]): ExtractionItem[] {
    const grouped: ExtractionItem[] = [];
    const processed = new Set<string>();

    for (const item of items) {
      if (processed.has(item.text.toLowerCase())) continue;
      
      const similar = items.filter(other => 
        other !== item && 
        !processed.has(other.text.toLowerCase()) &&
        this.calculateSimilarity(item.text, other.text) > 0.8
      );

      if (similar.length > 0) {
        // Merge similar items
        const mergedItem: ExtractionItem = {
          text: item.text,
          type: item.type,
          confidence: Math.max(item.confidence, ...similar.map(s => s.confidence)),
          frequency: (item.frequency || 1) + similar.reduce((sum, s) => sum + (s.frequency || 1), 0),
          importance: Math.max(item.importance || 0, ...similar.map(s => s.importance || 0)),
          metadata: {
            ...item.metadata,
            variants: similar.map(s => s.text)
          }
        };
        
        grouped.push(mergedItem);
        processed.add(item.text.toLowerCase());
        similar.forEach(s => processed.add(s.text.toLowerCase()));
      } else {
        grouped.push(item);
        processed.add(item.text.toLowerCase());
      }
    }

    return grouped;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private calculateOverallMetrics(
    extractedContent: ExtractedContent[], 
    originalText: string, 
    processingTime: number
  ) {
    const totalItems = extractedContent.reduce((sum, content) => sum + content.items.length, 0);
    const allConfidences = extractedContent.flatMap(content => 
      content.items.map(item => item.confidence)
    );
    const averageConfidence = allConfidences.length > 0 
      ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length 
      : 0;

    const extractionCoverage = this.calculateExtractionCoverage(extractedContent, originalText);

    return {
      totalItems,
      processingTime,
      averageConfidence,
      textLength: originalText.length,
      extractionCoverage
    };
  }

  private calculateExtractionCoverage(extractedContent: ExtractedContent[], originalText: string): number {
    const coveredPositions = new Set<number>();
    
    extractedContent.forEach(content => {
      content.items.forEach(item => {
        if (item.startIndex !== undefined && item.endIndex !== undefined) {
          for (let i = item.startIndex; i < item.endIndex; i++) {
            coveredPositions.add(i);
          }
        }
      });
    });

    return (coveredPositions.size / originalText.length) * 100;
  }

  // Utility methods
  private sanitizeInput(text: string): string {
    const sanitized = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    
    return sanitized
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000);
  }

  private getContext(text: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    return text.substring(start, end);
  }

  private deduplicateItems(items: ExtractionItem[]): ExtractionItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private classifyNumber(numberStr: string): string {
    if (numberStr.includes('$')) return 'currency';
    if (numberStr.includes('%')) return 'percentage';
    if (numberStr.match(/\b\d+(?:\.\d+)?\s*(?:kg|km|lb|ft|m|cm|mm|g|oz)\b/i)) return 'measurement';
    if (numberStr.includes(',') && numberStr.split(',').length > 2) return 'large_number';
    return 'number';
  }

  private extractNumericValue(numberStr: string): number {
    const cleaned = numberStr.replace(/[$,%]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseDate(dateStr: string): string | null {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return null;
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  private classifyQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.startsWith('what')) return 'what';
    if (lowerQuestion.startsWith('who')) return 'who';
    if (lowerQuestion.startsWith('when')) return 'when';
    if (lowerQuestion.startsWith('where')) return 'where';
    if (lowerQuestion.startsWith('why')) return 'why';
    if (lowerQuestion.startsWith('how')) return 'how';
    if (lowerQuestion.match(/^(?:can|could|would|will|should)/)) return 'modal';
    if (lowerQuestion.match(/^(?:is|are|was|were|do|does|did)/)) return 'yes_no';
    return 'other';
  }
}