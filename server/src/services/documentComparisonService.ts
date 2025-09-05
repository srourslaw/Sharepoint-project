import { GeminiService } from './geminiService';
import { ContentExtractionService, ExtractionType } from './contentExtractionService';
import { DocumentAnalysisService } from './documentAnalysisService';
import { 
  DocumentAnalysisResult, 
  Keyword, 
  Entity, 
  AnalysisType,
  Summary 
} from '../types/gemini';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface DocumentComparisonRequest {
  documents: DocumentToCompare[];
  comparisonTypes: ComparisonType[];
  options: ComparisonOptions;
}

export interface DocumentToCompare {
  id: string;
  name: string;
  content: string;
  metadata?: Record<string, any>;
}

export enum ComparisonType {
  CONTENT_SIMILARITY = 'content_similarity',
  STRUCTURE_COMPARISON = 'structure_comparison',
  KEYWORD_OVERLAP = 'keyword_overlap',
  ENTITY_COMPARISON = 'entity_comparison',
  SENTIMENT_DIFFERENCE = 'sentiment_difference',
  TOPIC_ANALYSIS = 'topic_analysis',
  STYLE_COMPARISON = 'style_comparison',
  FACTUAL_CONSISTENCY = 'factual_consistency',
  COMPREHENSIVE = 'comprehensive'
}

export interface ComparisonOptions {
  includeDetails?: boolean;
  generateSummary?: boolean;
  identifyUniqueContent?: boolean;
  highlightDifferences?: boolean;
  calculateMetrics?: boolean;
  language?: string;
  confidenceThreshold?: number;
}

export interface DocumentComparisonResult {
  comparisonId: string;
  documents: DocumentToCompare[];
  comparisons: ComparisonResult[];
  overallSimilarity: OverallSimilarity;
  insights: ComparisonInsights;
  recommendations: string[];
  processingTime: number;
  timestamp: string;
}

export interface ComparisonResult {
  type: ComparisonType;
  score: number; // 0-100
  confidence: number;
  details: ComparisonDetails;
  highlights?: ComparisonHighlight[];
}

export interface ComparisonDetails {
  similarities: string[];
  differences: string[];
  uniqueToDoc1?: string[];
  uniqueToDoc2?: string[];
  commonElements?: string[];
  metrics?: Record<string, number>;
  explanation?: string;
}

export interface ComparisonHighlight {
  documentId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'similar' | 'different' | 'unique';
  score: number;
}

export interface OverallSimilarity {
  score: number; // 0-100
  confidence: number;
  interpretation: 'very_similar' | 'similar' | 'somewhat_similar' | 'different' | 'very_different';
  breakdown: {
    content: number;
    structure: number;
    style: number;
    topics: number;
  };
}

export interface ComparisonInsights {
  keyFindings: string[];
  strengthsOfEachDoc: Record<string, string[]>;
  areasOfOverlap: string[];
  uniqueContributions: Record<string, string[]>;
  recommendedActions: string[];
  potentialIssues: string[];
}

export interface MultiDocumentComparison {
  documentCount: number;
  pairwiseComparisons: Array<{
    doc1Id: string;
    doc2Id: string;
    similarity: number;
    keyDifferences: string[];
  }>;
  clusters: DocumentCluster[];
  outliers: string[];
  consensusTopics: string[];
  conflictingInformation: ConflictingInfo[];
}

export interface DocumentCluster {
  id: string;
  documents: string[];
  commonThemes: string[];
  averageSimilarity: number;
  representative?: string; // ID of most representative document
}

export interface ConflictingInfo {
  topic: string;
  conflictingStatements: Array<{
    documentId: string;
    statement: string;
    confidence: number;
  }>;
  resolution?: string;
}

export interface VersionComparisonResult {
  addedContent: ContentChange[];
  removedContent: ContentChange[];
  modifiedContent: ContentChange[];
  structuralChanges: StructuralChange[];
  significanceScore: number;
  changesSummary: string;
}

export interface ContentChange {
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  location: {
    section?: string;
    paragraph: number;
    approximate: boolean;
  };
  significance: 'major' | 'minor' | 'trivial';
  category?: string;
}

export interface StructuralChange {
  type: 'section_added' | 'section_removed' | 'section_reordered' | 'heading_changed';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export class DocumentComparisonService {
  constructor(
    private geminiService: GeminiService,
    private contentExtractionService: ContentExtractionService,
    private analysisService: DocumentAnalysisService
  ) {}

  async compareDocuments(request: DocumentComparisonRequest): Promise<DocumentComparisonResult> {
    const startTime = Date.now();
    const comparisonId = `comp_${Date.now()}`;

    // Sanitize all document content
    const sanitizedDocs = request.documents.map(doc => ({
      ...doc,
      content: this.sanitizeInput(doc.content)
    }));

    const comparisons: ComparisonResult[] = [];

    // Perform each requested comparison type
    for (const comparisonType of request.comparisonTypes) {
      try {
        const comparisonResult = await this.performComparison(
          sanitizedDocs,
          comparisonType,
          request.options
        );
        comparisons.push(comparisonResult);
      } catch (error: any) {
        console.error(`Error in ${comparisonType} comparison:`, error);
        
        // Add error result
        comparisons.push({
          type: comparisonType,
          score: 0,
          confidence: 0,
          details: {
            similarities: [],
            differences: [`Error occurred: ${error.message}`],
            explanation: 'Comparison failed due to processing error'
          }
        });
      }
    }

    // Calculate overall similarity
    const overallSimilarity = this.calculateOverallSimilarity(comparisons);

    // Generate insights
    const insights = await this.generateComparisonInsights(sanitizedDocs, comparisons, request.options);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallSimilarity, insights, comparisons);

    const processingTime = Date.now() - startTime;

    return {
      comparisonId,
      documents: sanitizedDocs,
      comparisons,
      overallSimilarity,
      insights,
      recommendations,
      processingTime,
      timestamp: new Date().toISOString()
    };
  }

  async compareMultipleDocuments(
    documents: DocumentToCompare[],
    options: ComparisonOptions = {}
  ): Promise<MultiDocumentComparison> {
    if (documents.length < 3) {
      throw new Error('Multi-document comparison requires at least 3 documents');
    }

    const pairwiseComparisons: MultiDocumentComparison['pairwiseComparisons'] = [];
    
    // Perform pairwise comparisons
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const comparison = await this.compareDocuments({
          documents: [documents[i], documents[j]],
          comparisonTypes: [ComparisonType.CONTENT_SIMILARITY, ComparisonType.KEYWORD_OVERLAP],
          options
        });

        pairwiseComparisons.push({
          doc1Id: documents[i].id,
          doc2Id: documents[j].id,
          similarity: comparison.overallSimilarity.score,
          keyDifferences: comparison.insights.keyFindings.slice(0, 3)
        });
      }
    }

    // Create clusters based on similarity
    const clusters = this.createDocumentClusters(documents, pairwiseComparisons);

    // Identify outliers
    const outliers = this.identifyOutliers(documents, pairwiseComparisons);

    // Find consensus topics
    const consensusTopics = await this.findConsensusTopics(documents);

    // Identify conflicting information
    const conflictingInformation = await this.identifyConflictingInformation(documents);

    return {
      documentCount: documents.length,
      pairwiseComparisons,
      clusters,
      outliers,
      consensusTopics,
      conflictingInformation
    };
  }

  async compareVersions(
    originalDocument: DocumentToCompare,
    revisedDocument: DocumentToCompare,
    options: ComparisonOptions = {}
  ): Promise<VersionComparisonResult> {
    const prompt = `Compare these two versions of a document and identify all changes:

    ORIGINAL VERSION:
    "${originalDocument.content}"

    REVISED VERSION:
    "${revisedDocument.content}"

    Identify and categorize:
    1. Added content (new text, sections, paragraphs)
    2. Removed content (deleted text, sections, paragraphs) 
    3. Modified content (edited text, rewording, restructuring)
    4. Structural changes (new sections, reordered content, changed headings)

    Return a detailed JSON object with this structure:
    {
      "addedContent": [
        {
          "type": "addition",
          "content": "new text that was added",
          "location": {"section": "Introduction", "paragraph": 2},
          "significance": "major",
          "category": "new_information"
        }
      ],
      "removedContent": [...],
      "modifiedContent": [...],
      "structuralChanges": [
        {
          "type": "section_added",
          "description": "Added new 'Methodology' section",
          "impact": "high"
        }
      ],
      "significanceScore": 75,
      "changesSummary": "Brief summary of overall changes"
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 3000,
      temperature: 0.2
    });

    return this.parseVersionComparisonResponse(response.text);
  }

  async findSimilarDocuments(
    targetDocument: DocumentToCompare,
    candidateDocuments: DocumentToCompare[],
    threshold: number = 70
  ): Promise<Array<{
    document: DocumentToCompare;
    similarity: number;
    keyMatches: string[];
  }>> {
    const results = [];

    for (const candidate of candidateDocuments) {
      if (candidate.id === targetDocument.id) continue;

      const comparison = await this.compareDocuments({
        documents: [targetDocument, candidate],
        comparisonTypes: [ComparisonType.CONTENT_SIMILARITY, ComparisonType.KEYWORD_OVERLAP],
        options: { generateSummary: false }
      });

      if (comparison.overallSimilarity.score >= threshold) {
        results.push({
          document: candidate,
          similarity: comparison.overallSimilarity.score,
          keyMatches: comparison.insights.areasOfOverlap.slice(0, 5)
        });
      }
    }

    // Sort by similarity score (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results;
  }

  async detectPlagiarism(
    sourceDocument: DocumentToCompare,
    suspectedDocument: DocumentToCompare,
    options: { sensitivityLevel?: 'high' | 'medium' | 'low' } = {}
  ): Promise<{
    plagiarismScore: number;
    suspiciousSegments: Array<{
      sourceText: string;
      suspectedText: string;
      similarity: number;
      startIndex: number;
      endIndex: number;
    }>;
    overallAssessment: 'high_risk' | 'medium_risk' | 'low_risk' | 'no_risk';
    recommendations: string[];
  }> {
    const sensitivity = options.sensitivityLevel || 'medium';
    const thresholds = {
      high: { segment: 85, overall: 70 },
      medium: { segment: 90, overall: 80 },
      low: { segment: 95, overall: 90 }
    };

    const prompt = `Analyze these two documents for potential plagiarism or unauthorized copying:

    SOURCE DOCUMENT:
    "${sourceDocument.content}"

    SUSPECTED DOCUMENT:
    "${suspectedDocument.content}"

    Perform detailed similarity analysis looking for:
    1. Identical or nearly identical passages
    2. Paraphrased content that maintains original structure
    3. Similar argument patterns or logical flow
    4. Reordered content with same key points
    5. Minor word substitutions in otherwise identical text

    Sensitivity Level: ${sensitivity}

    Return a JSON object:
    {
      "plagiarismScore": 85,
      "suspiciousSegments": [
        {
          "sourceText": "original passage",
          "suspectedText": "potentially copied passage", 
          "similarity": 92,
          "startIndex": 150,
          "endIndex": 300
        }
      ],
      "overallAssessment": "high_risk",
      "recommendations": ["Specific recommendations for addressing findings"]
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 2500,
      temperature: 0.1
    });

    return this.parsePlagiarismResponse(response.text);
  }

  private async performComparison(
    documents: DocumentToCompare[],
    comparisonType: ComparisonType,
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    switch (comparisonType) {
      case ComparisonType.CONTENT_SIMILARITY:
        return this.compareContentSimilarity(documents, options);
      
      case ComparisonType.STRUCTURE_COMPARISON:
        return this.compareStructure(documents, options);
      
      case ComparisonType.KEYWORD_OVERLAP:
        return this.compareKeywords(documents, options);
      
      case ComparisonType.ENTITY_COMPARISON:
        return this.compareEntities(documents, options);
      
      case ComparisonType.SENTIMENT_DIFFERENCE:
        return this.compareSentiment(documents, options);
      
      case ComparisonType.TOPIC_ANALYSIS:
        return this.compareTopics(documents, options);
      
      case ComparisonType.STYLE_COMPARISON:
        return this.compareStyle(documents, options);
      
      case ComparisonType.FACTUAL_CONSISTENCY:
        return this.compareFactualConsistency(documents, options);
      
      case ComparisonType.COMPREHENSIVE:
        return this.performComprehensiveComparison(documents, options);
      
      default:
        throw new Error(`Unsupported comparison type: ${comparisonType}`);
    }
  }

  private async compareContentSimilarity(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    const [doc1, doc2] = documents;
    
    const prompt = `Compare the content similarity between these two documents:

    DOCUMENT 1 (${doc1.name}):
    "${doc1.content}"

    DOCUMENT 2 (${doc2.name}):
    "${doc2.content}"

    Analyze:
    1. Overall thematic similarity
    2. Shared concepts and ideas
    3. Similar information or facts
    4. Common narrative elements
    5. Overlapping topics

    Return a JSON object:
    {
      "score": 75,
      "confidence": 90,
      "similarities": ["shared themes", "common topics"],
      "differences": ["unique aspects", "distinct perspectives"],
      "explanation": "Detailed explanation of similarity assessment"
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.3
    });

    const parsed = this.parseComparisonResponse(response.text);
    
    return {
      type: ComparisonType.CONTENT_SIMILARITY,
      score: parsed.score,
      confidence: parsed.confidence,
      details: {
        similarities: parsed.similarities,
        differences: parsed.differences,
        explanation: parsed.explanation
      }
    };
  }

  private async compareKeywords(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Extract keywords from both documents
    const [keywords1, keywords2] = await Promise.all(
      documents.map(doc => 
        this.contentExtractionService.extractContent({
          text: doc.content,
          extractionTypes: [ExtractionType.KEYWORDS],
          options: { keywordCount: 30, rankByImportance: true }
        })
      )
    );

    const keywordSet1 = new Set(
      keywords1.extractedContent[0]?.items.map(item => item.text.toLowerCase()) || []
    );
    const keywordSet2 = new Set(
      keywords2.extractedContent[0]?.items.map(item => item.text.toLowerCase()) || []
    );

    // Calculate overlap
    const intersection = new Set([...keywordSet1].filter(keyword => keywordSet2.has(keyword)));
    const union = new Set([...keywordSet1, ...keywordSet2]);
    
    const overlapScore = intersection.size > 0 ? (intersection.size / union.size) * 100 : 0;
    const uniqueToDoc1 = [...keywordSet1].filter(keyword => !keywordSet2.has(keyword));
    const uniqueToDoc2 = [...keywordSet2].filter(keyword => !keywordSet1.has(keyword));

    return {
      type: ComparisonType.KEYWORD_OVERLAP,
      score: overlapScore,
      confidence: 95,
      details: {
        similarities: [...intersection],
        differences: [`${uniqueToDoc1.length} unique to document 1`, `${uniqueToDoc2.length} unique to document 2`],
        uniqueToDoc1,
        uniqueToDoc2,
        commonElements: [...intersection],
        metrics: {
          overlapPercentage: overlapScore,
          totalUniqueKeywords: union.size,
          sharedKeywords: intersection.size
        }
      }
    };
  }

  private async compareEntities(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Extract entities from both documents
    const [entities1, entities2] = await Promise.all(
      documents.map(doc => 
        this.contentExtractionService.extractContent({
          text: doc.content,
          extractionTypes: [ExtractionType.ENTITIES],
          options: { entityConfidenceThreshold: options.confidenceThreshold || 0.7 }
        })
      )
    );

    const entitySet1 = new Set(
      entities1.extractedContent[0]?.items.map(item => item.text.toLowerCase()) || []
    );
    const entitySet2 = new Set(
      entities2.extractedContent[0]?.items.map(item => item.text.toLowerCase()) || []
    );

    const intersection = new Set([...entitySet1].filter(entity => entitySet2.has(entity)));
    const union = new Set([...entitySet1, ...entitySet2]);
    
    const overlapScore = intersection.size > 0 ? (intersection.size / union.size) * 100 : 0;

    return {
      type: ComparisonType.ENTITY_COMPARISON,
      score: overlapScore,
      confidence: 88,
      details: {
        similarities: [...intersection],
        differences: [`Document 1 has ${entitySet1.size} entities`, `Document 2 has ${entitySet2.size} entities`],
        uniqueToDoc1: [...entitySet1].filter(entity => !entitySet2.has(entity)),
        uniqueToDoc2: [...entitySet2].filter(entity => !entitySet1.has(entity)),
        commonElements: [...intersection],
        metrics: {
          entityOverlap: overlapScore,
          totalEntities: union.size,
          sharedEntities: intersection.size
        }
      }
    };
  }

  private async compareStructure(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Analyze structure of both documents
    const [structure1, structure2] = await Promise.all(
      documents.map(doc =>
        this.analysisService.analyzeDocument({
          text: doc.content,
          analysisType: AnalysisType.STRUCTURE,
          options: { includeMetrics: true }
        })
      )
    );

    const struct1 = structure1.structure;
    const struct2 = structure2.structure;

    if (!struct1 || !struct2) {
      return {
        type: ComparisonType.STRUCTURE_COMPARISON,
        score: 0,
        confidence: 50,
        details: {
          similarities: [],
          differences: ['Unable to analyze document structure'],
          explanation: 'Structure analysis failed for one or both documents'
        }
      };
    }

    // Compare structural elements
    const similarities: string[] = [];
    const differences: string[] = [];
    let structureScore = 0;

    // Compare section counts
    if (Math.abs(struct1.sections.length - struct2.sections.length) <= 1) {
      similarities.push(`Similar section count (${struct1.sections.length} vs ${struct2.sections.length})`);
      structureScore += 25;
    } else {
      differences.push(`Different section counts (${struct1.sections.length} vs ${struct2.sections.length})`);
    }

    // Compare paragraph counts
    const paragraphDiff = Math.abs(struct1.paragraphs - struct2.paragraphs);
    if (paragraphDiff <= struct1.paragraphs * 0.2) {
      similarities.push(`Similar paragraph count (${struct1.paragraphs} vs ${struct2.paragraphs})`);
      structureScore += 25;
    } else {
      differences.push(`Different paragraph counts (${struct1.paragraphs} vs ${struct2.paragraphs})`);
    }

    // Compare heading levels
    const headings1 = struct1.headings?.map(h => h.level) || [];
    const headings2 = struct2.headings?.map(h => h.level) || [];
    
    if (this.arraysAreSimilar(headings1, headings2)) {
      similarities.push('Similar heading structure');
      structureScore += 25;
    } else {
      differences.push('Different heading structures');
    }

    // Compare readability scores if available
    if (struct1.readabilityScore && struct2.readabilityScore) {
      const readabilityDiff = Math.abs(struct1.readabilityScore - struct2.readabilityScore);
      if (readabilityDiff <= 10) {
        similarities.push(`Similar readability (${struct1.readabilityScore.toFixed(1)} vs ${struct2.readabilityScore.toFixed(1)})`);
        structureScore += 25;
      } else {
        differences.push(`Different readability levels (${struct1.readabilityScore.toFixed(1)} vs ${struct2.readabilityScore.toFixed(1)})`);
      }
    }

    return {
      type: ComparisonType.STRUCTURE_COMPARISON,
      score: structureScore,
      confidence: 85,
      details: {
        similarities,
        differences,
        metrics: {
          sectionsDoc1: struct1.sections.length,
          sectionsDoc2: struct2.sections.length,
          paragraphsDoc1: struct1.paragraphs,
          paragraphsDoc2: struct2.paragraphs,
          structuralSimilarity: structureScore
        }
      }
    };
  }

  private async compareSentiment(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Analyze sentiment of both documents
    const [sentiment1, sentiment2] = await Promise.all(
      documents.map(doc =>
        this.analysisService.analyzeDocument({
          text: doc.content,
          analysisType: AnalysisType.SENTIMENT,
          options: {}
        })
      )
    );

    const sent1 = sentiment1.sentiment?.overall;
    const sent2 = sentiment2.sentiment?.overall;

    if (!sent1 || !sent2) {
      return {
        type: ComparisonType.SENTIMENT_DIFFERENCE,
        score: 0,
        confidence: 50,
        details: {
          similarities: [],
          differences: ['Unable to analyze sentiment'],
          explanation: 'Sentiment analysis failed'
        }
      };
    }

    // Calculate sentiment similarity
    const scoreDiff = Math.abs(sent1.score - sent2.score);
    const magnitudeDiff = Math.abs(sent1.magnitude - sent2.magnitude);
    
    const similarityScore = Math.max(0, 100 - (scoreDiff * 50 + magnitudeDiff * 25));
    
    const similarities: string[] = [];
    const differences: string[] = [];

    if (sent1.label === sent2.label) {
      similarities.push(`Both documents have ${sent1.label} sentiment`);
    } else {
      differences.push(`Different sentiment: ${sent1.label} vs ${sent2.label}`);
    }

    if (scoreDiff < 0.3) {
      similarities.push('Similar sentiment intensity');
    } else {
      differences.push(`Different sentiment intensity (${sent1.score.toFixed(2)} vs ${sent2.score.toFixed(2)})`);
    }

    return {
      type: ComparisonType.SENTIMENT_DIFFERENCE,
      score: similarityScore,
      confidence: 82,
      details: {
        similarities,
        differences,
        metrics: {
          doc1Sentiment: sent1.score,
          doc2Sentiment: sent2.score,
          doc1Magnitude: sent1.magnitude,
          doc2Magnitude: sent2.magnitude,
          sentimentSimilarity: similarityScore
        }
      }
    };
  }

  private async compareTopics(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Analyze topics in both documents
    const [topics1, topics2] = await Promise.all(
      documents.map(doc =>
        this.analysisService.analyzeDocument({
          text: doc.content,
          analysisType: AnalysisType.TOPICS,
          options: {}
        })
      )
    );

    const topicSet1 = new Set(topics1.topics?.map(t => t.name.toLowerCase()) || []);
    const topicSet2 = new Set(topics2.topics?.map(t => t.name.toLowerCase()) || []);

    const intersection = new Set([...topicSet1].filter(topic => topicSet2.has(topic)));
    const union = new Set([...topicSet1, ...topicSet2]);
    
    const overlapScore = intersection.size > 0 ? (intersection.size / union.size) * 100 : 0;

    return {
      type: ComparisonType.TOPIC_ANALYSIS,
      score: overlapScore,
      confidence: 87,
      details: {
        similarities: [...intersection],
        differences: [`Topics unique to each document: ${union.size - intersection.size}`],
        uniqueToDoc1: [...topicSet1].filter(topic => !topicSet2.has(topic)),
        uniqueToDoc2: [...topicSet2].filter(topic => !topicSet1.has(topic)),
        commonElements: [...intersection],
        metrics: {
          topicOverlap: overlapScore,
          totalTopics: union.size,
          sharedTopics: intersection.size
        }
      }
    };
  }

  private async compareStyle(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    const [doc1, doc2] = documents;
    
    const prompt = `Compare the writing style and tone between these two documents:

    DOCUMENT 1:
    "${doc1.content}"

    DOCUMENT 2:
    "${doc2.content}"

    Analyze and compare:
    1. Tone (formal, informal, academic, conversational, etc.)
    2. Writing style (descriptive, analytical, narrative, etc.)
    3. Sentence structure and complexity
    4. Vocabulary level and word choice
    5. Use of technical language or jargon
    6. Overall readability and accessibility

    Return a JSON object:
    {
      "score": 75,
      "confidence": 85,
      "similarities": ["Both use formal tone", "Similar sentence complexity"],
      "differences": ["Document 1 more technical", "Document 2 more accessible"],
      "explanation": "Style comparison details"
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1200,
      temperature: 0.3
    });

    const parsed = this.parseComparisonResponse(response.text);
    
    return {
      type: ComparisonType.STYLE_COMPARISON,
      score: parsed.score,
      confidence: parsed.confidence,
      details: {
        similarities: parsed.similarities,
        differences: parsed.differences,
        explanation: parsed.explanation
      }
    };
  }

  private async compareFactualConsistency(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    const [doc1, doc2] = documents;
    
    const prompt = `Compare these documents for factual consistency and accuracy:

    DOCUMENT 1:
    "${doc1.content}"

    DOCUMENT 2:
    "${doc2.content}"

    Identify:
    1. Consistent facts and information between documents
    2. Contradicting or conflicting information
    3. Complementary information that supports each other
    4. Facts mentioned in one but not the other
    5. Potential accuracy concerns

    Return a JSON object:
    {
      "score": 80,
      "confidence": 90,
      "similarities": ["Consistent facts found"],
      "differences": ["Contradicting claims identified"],
      "explanation": "Detailed factual consistency analysis"
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    const parsed = this.parseComparisonResponse(response.text);
    
    return {
      type: ComparisonType.FACTUAL_CONSISTENCY,
      score: parsed.score,
      confidence: parsed.confidence,
      details: {
        similarities: parsed.similarities,
        differences: parsed.differences,
        explanation: parsed.explanation
      }
    };
  }

  private async performComprehensiveComparison(
    documents: DocumentToCompare[],
    options: ComparisonOptions
  ): Promise<ComparisonResult> {
    // Perform multiple comparison types and aggregate results
    const comparisonTypes = [
      ComparisonType.CONTENT_SIMILARITY,
      ComparisonType.KEYWORD_OVERLAP,
      ComparisonType.STRUCTURE_COMPARISON,
      ComparisonType.TOPIC_ANALYSIS
    ];

    const results = await Promise.all(
      comparisonTypes.map(type => this.performComparison(documents, type, options))
    );

    // Aggregate scores
    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    const avgConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;

    // Combine insights
    const allSimilarities = results.flatMap(r => r.details.similarities);
    const allDifferences = results.flatMap(r => r.details.differences);

    return {
      type: ComparisonType.COMPREHENSIVE,
      score: avgScore,
      confidence: avgConfidence,
      details: {
        similarities: [...new Set(allSimilarities)].slice(0, 10),
        differences: [...new Set(allDifferences)].slice(0, 10),
        explanation: `Comprehensive analysis across ${comparisonTypes.length} dimensions`,
        metrics: {
          avgSimilarityScore: avgScore,
          componentScores: results.map(r => ({ type: r.type, score: r.score })) as any
        }
      }
    };
  }

  private calculateOverallSimilarity(comparisons: ComparisonResult[]): OverallSimilarity {
    if (comparisons.length === 0) {
      return {
        score: 0,
        confidence: 0,
        interpretation: 'very_different',
        breakdown: { content: 0, structure: 0, style: 0, topics: 0 }
      };
    }

    const avgScore = comparisons.reduce((sum, comp) => sum + comp.score, 0) / comparisons.length;
    const avgConfidence = comparisons.reduce((sum, comp) => sum + comp.confidence, 0) / comparisons.length;

    // Create breakdown
    const breakdown = {
      content: this.getScoreForType(comparisons, ComparisonType.CONTENT_SIMILARITY),
      structure: this.getScoreForType(comparisons, ComparisonType.STRUCTURE_COMPARISON),
      style: this.getScoreForType(comparisons, ComparisonType.STYLE_COMPARISON),
      topics: this.getScoreForType(comparisons, ComparisonType.TOPIC_ANALYSIS)
    };

    // Determine interpretation
    let interpretation: OverallSimilarity['interpretation'];
    if (avgScore >= 80) interpretation = 'very_similar';
    else if (avgScore >= 60) interpretation = 'similar';
    else if (avgScore >= 40) interpretation = 'somewhat_similar';
    else if (avgScore >= 20) interpretation = 'different';
    else interpretation = 'very_different';

    return {
      score: avgScore,
      confidence: avgConfidence,
      interpretation,
      breakdown
    };
  }

  private async generateComparisonInsights(
    documents: DocumentToCompare[],
    comparisons: ComparisonResult[],
    options: ComparisonOptions
  ): Promise<ComparisonInsights> {
    // Extract key findings from comparison results
    const keyFindings: string[] = [];
    const strengthsOfEachDoc: Record<string, string[]> = {};
    const areasOfOverlap: string[] = [];
    const uniqueContributions: Record<string, string[]> = {};

    // Initialize document-specific arrays
    documents.forEach(doc => {
      strengthsOfEachDoc[doc.id] = [];
      uniqueContributions[doc.id] = [];
    });

    // Analyze comparison results
    for (const comparison of comparisons) {
      keyFindings.push(...comparison.details.similarities.slice(0, 2));
      areasOfOverlap.push(...(comparison.details.commonElements || []).slice(0, 3));
      
      if (comparison.details.uniqueToDoc1) {
        uniqueContributions[documents[0].id].push(...comparison.details.uniqueToDoc1.slice(0, 2));
      }
      
      if (comparison.details.uniqueToDoc2) {
        uniqueContributions[documents[1].id].push(...comparison.details.uniqueToDoc2.slice(0, 2));
      }
    }

    // Generate recommendations and identify issues
    const recommendedActions = this.generateActionRecommendations(comparisons);
    const potentialIssues = this.identifyPotentialIssues(comparisons);

    return {
      keyFindings: [...new Set(keyFindings)].slice(0, 5),
      strengthsOfEachDoc,
      areasOfOverlap: [...new Set(areasOfOverlap)].slice(0, 5),
      uniqueContributions,
      recommendedActions,
      potentialIssues
    };
  }

  private generateRecommendations(
    overallSimilarity: OverallSimilarity,
    insights: ComparisonInsights,
    comparisons: ComparisonResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations on similarity level
    switch (overallSimilarity.interpretation) {
      case 'very_similar':
        recommendations.push('Documents are highly similar - consider consolidating or clarifying unique purposes');
        recommendations.push('Review for potential redundancy and opportunities to merge content');
        break;
      
      case 'similar':
        recommendations.push('Documents share common themes - ensure complementary rather than competing purposes');
        recommendations.push('Highlight unique contributions of each document more clearly');
        break;
      
      case 'somewhat_similar':
        recommendations.push('Documents have some overlap - consider cross-referencing between them');
        recommendations.push('Ensure consistent terminology and approach across documents');
        break;
      
      case 'different':
        recommendations.push('Documents serve different purposes - ensure they complement each other effectively');
        recommendations.push('Consider adding cross-references where topics intersect');
        break;
      
      case 'very_different':
        recommendations.push('Documents are quite different - verify they serve intended distinct purposes');
        recommendations.push('Ensure consistent branding and style if part of the same document set');
        break;
    }

    // Add specific recommendations based on comparison results
    const lowScoreComparisons = comparisons.filter(c => c.score < 40);
    if (lowScoreComparisons.length > 0) {
      recommendations.push('Consider improving alignment in areas with low similarity scores');
    }

    return recommendations.slice(0, 4);
  }

  // Helper methods
  private getScoreForType(comparisons: ComparisonResult[], type: ComparisonType): number {
    const comparison = comparisons.find(c => c.type === type);
    return comparison ? comparison.score : 0;
  }

  private generateActionRecommendations(comparisons: ComparisonResult[]): string[] {
    const actions: string[] = [];
    
    // Low content similarity
    if (this.hasLowScore(comparisons, ComparisonType.CONTENT_SIMILARITY)) {
      actions.push('Review content alignment and consider adding bridging information');
    }
    
    // Low structural similarity
    if (this.hasLowScore(comparisons, ComparisonType.STRUCTURE_COMPARISON)) {
      actions.push('Consider standardizing document structure and organization');
    }
    
    return actions;
  }

  private identifyPotentialIssues(comparisons: ComparisonResult[]): string[] {
    const issues: string[] = [];
    
    // Check for inconsistencies
    if (this.hasLowScore(comparisons, ComparisonType.FACTUAL_CONSISTENCY)) {
      issues.push('Potential factual inconsistencies detected between documents');
    }
    
    // Check for style mismatches
    if (this.hasLowScore(comparisons, ComparisonType.STYLE_COMPARISON)) {
      issues.push('Significant style differences may confuse readers');
    }
    
    return issues;
  }

  private hasLowScore(comparisons: ComparisonResult[], type: ComparisonType): boolean {
    const comparison = comparisons.find(c => c.type === type);
    return comparison ? comparison.score < 40 : false;
  }

  private createDocumentClusters(
    documents: DocumentToCompare[],
    pairwiseComparisons: MultiDocumentComparison['pairwiseComparisons']
  ): DocumentCluster[] {
    // Simple clustering based on similarity threshold
    const clusters: DocumentCluster[] = [];
    const processed = new Set<string>();
    
    for (const doc of documents) {
      if (processed.has(doc.id)) continue;
      
      const similarDocs = pairwiseComparisons
        .filter(comp => 
          (comp.doc1Id === doc.id || comp.doc2Id === doc.id) && 
          comp.similarity >= 60
        )
        .map(comp => comp.doc1Id === doc.id ? comp.doc2Id : comp.doc1Id)
        .filter(id => !processed.has(id));

      if (similarDocs.length > 0) {
        const clusterDocs = [doc.id, ...similarDocs];
        clusterDocs.forEach(id => processed.add(id));
        
        const avgSimilarity = pairwiseComparisons
          .filter(comp => 
            clusterDocs.includes(comp.doc1Id) && clusterDocs.includes(comp.doc2Id)
          )
          .reduce((sum, comp) => sum + comp.similarity, 0) / pairwiseComparisons.length;

        clusters.push({
          id: `cluster_${clusters.length + 1}`,
          documents: clusterDocs,
          commonThemes: [], // Would be populated with actual theme analysis
          averageSimilarity: avgSimilarity,
          representative: doc.id
        });
      } else {
        processed.add(doc.id);
      }
    }

    return clusters;
  }

  private identifyOutliers(
    documents: DocumentToCompare[],
    pairwiseComparisons: MultiDocumentComparison['pairwiseComparisons']
  ): string[] {
    const outliers: string[] = [];
    
    for (const doc of documents) {
      const avgSimilarity = pairwiseComparisons
        .filter(comp => comp.doc1Id === doc.id || comp.doc2Id === doc.id)
        .reduce((sum, comp) => sum + comp.similarity, 0) / (documents.length - 1);
      
      if (avgSimilarity < 30) {
        outliers.push(doc.id);
      }
    }
    
    return outliers;
  }

  private async findConsensusTopics(documents: DocumentToCompare[]): Promise<string[]> {
    // Extract topics from all documents and find common ones
    const allTopicsResults = await Promise.all(
      documents.map(doc =>
        this.analysisService.analyzeDocument({
          text: doc.content,
          analysisType: AnalysisType.TOPICS,
          options: {}
        })
      )
    );

    const topicCounts = new Map<string, number>();
    
    allTopicsResults.forEach(result => {
      result.topics?.forEach(topic => {
        const topicName = topic.name.toLowerCase();
        topicCounts.set(topicName, (topicCounts.get(topicName) || 0) + 1);
      });
    });

    // Return topics mentioned in at least half the documents
    const threshold = Math.ceil(documents.length / 2);
    return Array.from(topicCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([topic, _]) => topic)
      .slice(0, 10);
  }

  private async identifyConflictingInformation(
    documents: DocumentToCompare[]
  ): Promise<ConflictingInfo[]> {
    // This would require more sophisticated analysis
    // For now, return empty array as placeholder
    return [];
  }

  private parseComparisonResponse(responseText: string): {
    score: number;
    confidence: number;
    similarities: string[];
    differences: string[];
    explanation?: string;
  } {
    try {
      const parsed = JSON.parse(responseText);
      return {
        score: parsed.score || 0,
        confidence: parsed.confidence || 0,
        similarities: parsed.similarities || [],
        differences: parsed.differences || [],
        explanation: parsed.explanation
      };
    } catch (error: any) {
      console.error('Error parsing comparison response:', error);
      return {
        score: 0,
        confidence: 0,
        similarities: [],
        differences: ['Parsing error occurred'],
        explanation: 'Unable to parse comparison results'
      };
    }
  }

  private parseVersionComparisonResponse(responseText: string): VersionComparisonResult {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing version comparison response:', error);
      return {
        addedContent: [],
        removedContent: [],
        modifiedContent: [],
        structuralChanges: [],
        significanceScore: 0,
        changesSummary: 'Error parsing comparison results'
      };
    }
  }

  private parsePlagiarismResponse(responseText: string) {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing plagiarism response:', error);
      return {
        plagiarismScore: 0,
        suspiciousSegments: [],
        overallAssessment: 'no_risk' as const,
        recommendations: ['Unable to complete plagiarism analysis']
      };
    }
  }

  private arraysAreSimilar<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    if (arr1.length === 0) return true;
    
    // Simple similarity check - at least 70% of elements match
    const matches = arr1.filter((item, index) => item === arr2[index]).length;
    return matches / arr1.length >= 0.7;
  }

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
}