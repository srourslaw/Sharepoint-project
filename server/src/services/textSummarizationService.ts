import { GeminiService } from './geminiService';
import {
  GeminiRequest,
  GeminiError,
  GeminiErrorCode,
  Summary
} from '../types/gemini';

export interface SummarizationRequest {
  text: string;
  summaryType: SummaryType;
  length: SummaryLength;
  focusAreas?: string[];
  customInstructions?: string;
  preserveStructure?: boolean;
  includeKeyPoints?: boolean;
  targetAudience?: string;
  language?: string;
}

export enum SummaryType {
  EXTRACTIVE = 'extractive',     // Extract key sentences from original text
  ABSTRACTIVE = 'abstractive',   // Generate new summary text
  BULLET_POINTS = 'bullet_points', // Key points in bullet format
  EXECUTIVE = 'executive',        // Executive summary format
  TECHNICAL = 'technical',        // Technical/detailed summary
  CREATIVE = 'creative'          // Creative/engaging summary
}

export enum SummaryLength {
  SHORT = 'short',     // 1-2 sentences
  MEDIUM = 'medium',   // 1 paragraph
  LONG = 'long',       // Multiple paragraphs
  CUSTOM = 'custom'    // Custom length specified
}

export interface SummarizationResult {
  originalText: string;
  summary: string;
  summaryType: SummaryType;
  summaryLength: SummaryLength;
  keyPoints: string[];
  wordCount: {
    original: number;
    summary: number;
    compressionRatio: number;
  };
  readingTime: {
    original: number; // minutes
    summary: number;  // minutes
  };
  confidence: number;
  focusAreas?: string[];
  metadata: {
    processingTime: number;
    model: string;
    timestamp: string;
  };
}

export interface BatchSummarizationRequest {
  documents: Array<{
    text: string;
    title?: string;
    id?: string;
  }>;
  summaryType: SummaryType;
  length: SummaryLength;
  options: {
    includeComparison?: boolean;
    generateOverallSummary?: boolean;
    preserveIndividualSummaries?: boolean;
  };
}

export interface BatchSummarizationResult {
  individualSummaries: Array<{
    id?: string;
    title?: string;
    summary: string;
    keyPoints: string[];
  }>;
  overallSummary?: string;
  comparison?: {
    commonThemes: string[];
    differences: string[];
    recommendations: string[];
  };
  statistics: {
    totalDocuments: number;
    totalWordCount: number;
    averageCompressionRatio: number;
    processingTime: number;
  };
}

/**
 * Advanced text summarization service using Gemini AI
 */
export class TextSummarizationService {
  private geminiService: GeminiService;
  private summaryPrompts: Map<SummaryType, string> = new Map();

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.initializeSummaryPrompts();
  }

  /**
   * Initialize summary prompt templates
   */
  private initializeSummaryPrompts(): void {
    this.summaryPrompts.set(SummaryType.EXTRACTIVE, `
You are an expert text summarizer. Create an extractive summary by selecting and combining the most important sentences from the original text.

Instructions:
- Select key sentences that capture the main ideas
- Preserve the original wording and structure
- Maintain logical flow between selected sentences
- Target length: {{LENGTH}}
- Focus areas: {{FOCUS_AREAS}}

Text to summarize:
{{TEXT}}

Provide response in JSON format:
{
  "summary": "Extractive summary using original sentences",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "confidence": 0.9,
  "focusAreas": ["area1", "area2"]
}
`);

    this.summaryPrompts.set(SummaryType.ABSTRACTIVE, `
You are an expert text summarizer. Create an abstractive summary by understanding the content and rewriting it in your own words while preserving all key information.

Instructions:
- Rewrite the content in clear, concise language
- Capture all main ideas and important details
- Use your own words while maintaining accuracy
- Target length: {{LENGTH}}
- Target audience: {{AUDIENCE}}

Text to summarize:
{{TEXT}}

{{CUSTOM_INSTRUCTIONS}}

Provide response in JSON format:
{
  "summary": "Abstractive summary in new words",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "confidence": 0.9
}
`);

    this.summaryPrompts.set(SummaryType.BULLET_POINTS, `
You are an expert at creating structured summaries. Convert the following text into clear, organized bullet points that capture all essential information.

Instructions:
- Organize information into logical bullet points
- Use clear, concise language
- Group related points under categories if appropriate
- Target length: {{LENGTH}}
- Include sub-bullets for detailed information

Text to summarize:
{{TEXT}}

Provide response in JSON format:
{
  "summary": "• Main point 1\\n• Main point 2\\n  - Sub-point\\n• Main point 3",
  "keyPoints": ["Main point 1", "Main point 2", "Main point 3"],
  "confidence": 0.9
}
`);

    this.summaryPrompts.set(SummaryType.EXECUTIVE, `
You are a business executive's assistant. Create an executive summary suitable for senior leadership decision-making.

Instructions:
- Lead with the most critical information
- Focus on business impact, decisions needed, and key metrics
- Use formal business language
- Include actionable insights and recommendations
- Target length: {{LENGTH}}

Text to summarize:
{{TEXT}}

Provide response in JSON format:
{
  "summary": "Executive summary with business focus",
  "keyPoints": ["Critical point 1", "Decision needed", "Key metric", "Recommendation"],
  "confidence": 0.9
}
`);

    this.summaryPrompts.set(SummaryType.TECHNICAL, `
You are a technical writer specializing in detailed summaries. Create a comprehensive technical summary that preserves important details and technical accuracy.

Instructions:
- Maintain technical terminology and precision
- Include specific details, numbers, and processes
- Organize information logically
- Preserve technical relationships and dependencies
- Target length: {{LENGTH}}

Text to summarize:
{{TEXT}}

Provide response in JSON format:
{
  "summary": "Detailed technical summary",
  "keyPoints": ["Technical point 1", "Process detail", "Specification", "Requirement"],
  "confidence": 0.9
}
`);

    this.summaryPrompts.set(SummaryType.CREATIVE, `
You are a creative writer skilled at making complex information engaging and memorable. Create a summary that is both informative and engaging.

Instructions:
- Use engaging language and storytelling techniques
- Make complex information accessible
- Include relevant analogies or examples
- Maintain accuracy while improving readability
- Target length: {{LENGTH}}

Text to summarize:
{{TEXT}}

Provide response in JSON format:
{
  "summary": "Creative and engaging summary",
  "keyPoints": ["Engaging point 1", "Memorable insight", "Key takeaway"],
  "confidence": 0.9
}
`);
  }

  /**
   * Summarize single document
   */
  async summarizeText(request: SummarizationRequest): Promise<SummarizationResult> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateSummarizationRequest(request);

      // Calculate original metrics
      const originalWordCount = this.countWords(request.text);
      const originalReadingTime = Math.ceil(originalWordCount / 200); // 200 WPM

      // Build prompt
      const prompt = this.buildSummarizationPrompt(request);

      // Make request to Gemini
      const geminiRequest: GeminiRequest = {
        prompt,
        maxTokens: this.getMaxTokensForSummary(request.length),
        temperature: this.getTemperatureForSummaryType(request.summaryType),
        sessionId: `summary_${Date.now()}`
      };

      const geminiResponse = await this.geminiService.generateText(geminiRequest);

      // Parse response
      const parsedResult = await this.parseSummarizationResponse(geminiResponse.text);

      // Calculate summary metrics
      const summaryWordCount = this.countWords(parsedResult.summary);
      const summaryReadingTime = Math.ceil(summaryWordCount / 200);
      const compressionRatio = originalWordCount > 0 ? summaryWordCount / originalWordCount : 0;

      // Build result
      const result: SummarizationResult = {
        originalText: request.text,
        summary: parsedResult.summary,
        summaryType: request.summaryType,
        summaryLength: request.length,
        keyPoints: parsedResult.keyPoints || [],
        wordCount: {
          original: originalWordCount,
          summary: summaryWordCount,
          compressionRatio
        },
        readingTime: {
          original: originalReadingTime,
          summary: summaryReadingTime
        },
        confidence: parsedResult.confidence || 0.8,
        focusAreas: request.focusAreas,
        metadata: {
          processingTime: Date.now() - startTime,
          model: 'gemini-pro',
          timestamp: new Date().toISOString()
        }
      };

      return result;

    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      throw new GeminiError(
        GeminiErrorCode.UNKNOWN_ERROR,
        `Text summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Batch summarize multiple documents
   */
  async batchSummarize(request: BatchSummarizationRequest): Promise<BatchSummarizationResult> {
    const startTime = Date.now();

    try {
      const individualSummaries: BatchSummarizationResult['individualSummaries'] = [];
      let totalWordCount = 0;
      let totalCompressionRatio = 0;

      // Summarize each document individually
      for (const doc of request.documents) {
        const summaryRequest: SummarizationRequest = {
          text: doc.text,
          summaryType: request.summaryType,
          length: request.length
        };

        try {
          const result = await this.summarizeText(summaryRequest);
          
          individualSummaries.push({
            id: doc.id,
            title: doc.title,
            summary: result.summary,
            keyPoints: result.keyPoints
          });

          totalWordCount += result.wordCount.original;
          totalCompressionRatio += result.wordCount.compressionRatio;

        } catch (error) {
          // Add failed summary placeholder
          individualSummaries.push({
            id: doc.id,
            title: doc.title,
            summary: `[Summary failed: ${error instanceof Error ? error.message : 'Unknown error'}]`,
            keyPoints: []
          });
        }
      }

      const batchResult: BatchSummarizationResult = {
        individualSummaries,
        statistics: {
          totalDocuments: request.documents.length,
          totalWordCount,
          averageCompressionRatio: individualSummaries.length > 0 ? 
            totalCompressionRatio / individualSummaries.length : 0,
          processingTime: Date.now() - startTime
        }
      };

      // Generate overall summary if requested
      if (request.options.generateOverallSummary) {
        const combinedSummaries = individualSummaries
          .map(s => s.summary)
          .join('\n\n');

        const overallSummaryRequest: SummarizationRequest = {
          text: combinedSummaries,
          summaryType: SummaryType.ABSTRACTIVE,
          length: request.length,
          customInstructions: 'Create an overall summary that synthesizes the key themes across all documents.'
        };

        try {
          const overallResult = await this.summarizeText(overallSummaryRequest);
          batchResult.overallSummary = overallResult.summary;
        } catch (error) {
          batchResult.overallSummary = '[Overall summary generation failed]';
        }
      }

      // Generate comparison if requested
      if (request.options.includeComparison) {
        batchResult.comparison = await this.generateDocumentComparison(individualSummaries);
      }

      return batchResult;

    } catch (error) {
      throw new GeminiError(
        GeminiErrorCode.UNKNOWN_ERROR,
        `Batch summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Smart summarization with automatic parameter selection
   */
  async smartSummarize(
    text: string,
    targetLength?: number,
    purpose?: 'overview' | 'decision_making' | 'study' | 'presentation'
  ): Promise<SummarizationResult> {
    const wordCount = this.countWords(text);
    
    // Automatically determine best summarization approach
    let summaryType: SummaryType;
    let length: SummaryLength;
    let customInstructions = '';

    // Select type based on purpose and content
    if (purpose === 'decision_making' || purpose === 'presentation') {
      summaryType = SummaryType.EXECUTIVE;
      length = SummaryLength.MEDIUM;
    } else if (purpose === 'study') {
      summaryType = SummaryType.BULLET_POINTS;
      length = SummaryLength.LONG;
      customInstructions = 'Organize information for easy studying and review';
    } else if (wordCount > 2000) {
      summaryType = SummaryType.ABSTRACTIVE;
      length = SummaryLength.MEDIUM;
    } else if (wordCount > 500) {
      summaryType = SummaryType.EXTRACTIVE;
      length = SummaryLength.SHORT;
    } else {
      summaryType = SummaryType.BULLET_POINTS;
      length = SummaryLength.SHORT;
    }

    // Adjust length based on target
    if (targetLength) {
      if (targetLength < 100) {
        length = SummaryLength.SHORT;
      } else if (targetLength < 300) {
        length = SummaryLength.MEDIUM;
      } else {
        length = SummaryLength.LONG;
      }
    }

    const request: SummarizationRequest = {
      text,
      summaryType,
      length,
      customInstructions,
      includeKeyPoints: true
    };

    return await this.summarizeText(request);
  }

  /**
   * Progressive summarization (summary of summaries)
   */
  async progressiveSummarization(
    text: string,
    levels: number = 3
  ): Promise<{
    levels: Array<{
      level: number;
      summary: string;
      compressionRatio: number;
    }>;
    finalSummary: string;
  }> {
    const levels_results = [];
    let currentText = text;

    for (let i = 1; i <= levels; i++) {
      const summaryLength = i === 1 ? SummaryLength.LONG : 
                           i === 2 ? SummaryLength.MEDIUM : 
                           SummaryLength.SHORT;

      const request: SummarizationRequest = {
        text: currentText,
        summaryType: SummaryType.ABSTRACTIVE,
        length: summaryLength,
        customInstructions: `This is level ${i} of progressive summarization. ${
          i === 1 ? 'Preserve important details.' : 
          i === levels ? 'Focus on the most essential points only.' : 
          'Balance detail with conciseness.'
        }`
      };

      const result = await this.summarizeText(request);
      
      levels_results.push({
        level: i,
        summary: result.summary,
        compressionRatio: result.wordCount.compressionRatio
      });

      currentText = result.summary;
    }

    return {
      levels: levels_results,
      finalSummary: levels_results[levels_results.length - 1].summary
    };
  }

  /**
   * Validate summarization request
   */
  private validateSummarizationRequest(request: SummarizationRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Text to summarize is required',
        400
      );
    }

    if (request.text.length > 50000) { // 50K characters limit
      throw new GeminiError(
        GeminiErrorCode.CONTEXT_TOO_LONG,
        'Text is too long for summarization (max 50,000 characters)',
        400
      );
    }

    if (request.text.split(/\s+/).length < 10) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        'Text is too short to summarize meaningfully',
        400
      );
    }
  }

  /**
   * Build summarization prompt
   */
  private buildSummarizationPrompt(request: SummarizationRequest): string {
    const template = this.summaryPrompts.get(request.summaryType);
    if (!template) {
      throw new GeminiError(
        GeminiErrorCode.INVALID_REQUEST,
        `No prompt template for summary type: ${request.summaryType}`,
        400
      );
    }

    let prompt = template
      .replace('{{TEXT}}', request.text)
      .replace('{{LENGTH}}', this.getLengthDescription(request.length))
      .replace('{{AUDIENCE}}', request.targetAudience || 'general audience')
      .replace('{{FOCUS_AREAS}}', request.focusAreas?.join(', ') || 'all key topics')
      .replace('{{CUSTOM_INSTRUCTIONS}}', request.customInstructions || '');

    return prompt;
  }

  /**
   * Get length description for prompts
   */
  private getLengthDescription(length: SummaryLength): string {
    const descriptions = {
      [SummaryLength.SHORT]: '1-2 concise sentences',
      [SummaryLength.MEDIUM]: '1 paragraph (3-5 sentences)',
      [SummaryLength.LONG]: 'multiple paragraphs with comprehensive coverage',
      [SummaryLength.CUSTOM]: 'appropriate length for the content'
    };

    return descriptions[length];
  }

  /**
   * Get max tokens for summary length
   */
  private getMaxTokensForSummary(length: SummaryLength): number {
    const tokenLimits = {
      [SummaryLength.SHORT]: 200,
      [SummaryLength.MEDIUM]: 500,
      [SummaryLength.LONG]: 1000,
      [SummaryLength.CUSTOM]: 800
    };

    return tokenLimits[length];
  }

  /**
   * Get temperature for summary type
   */
  private getTemperatureForSummaryType(type: SummaryType): number {
    const temperatures = {
      [SummaryType.EXTRACTIVE]: 0.1,    // Low creativity for extraction
      [SummaryType.ABSTRACTIVE]: 0.3,   // Medium creativity for rewriting
      [SummaryType.BULLET_POINTS]: 0.2,  // Low-medium for structured format
      [SummaryType.EXECUTIVE]: 0.2,     // Formal business style
      [SummaryType.TECHNICAL]: 0.1,     // Precise technical language
      [SummaryType.CREATIVE]: 0.6       // Higher creativity for engagement
    };

    return temperatures[type];
  }

  /**
   * Parse summarization response
   */
  private async parseSummarizationResponse(responseText: string): Promise<{
    summary: string;
    keyPoints: string[];
    confidence: number;
  }> {
    try {
      const cleanedText = responseText.trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Fallback: treat entire response as summary
        return {
          summary: cleanedText,
          keyPoints: [],
          confidence: 0.7
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || cleanedText,
        keyPoints: parsed.keyPoints || [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
      };

    } catch (error) {
      return {
        summary: responseText,
        keyPoints: [],
        confidence: 0.6
      };
    }
  }

  /**
   * Generate document comparison
   */
  private async generateDocumentComparison(
    summaries: BatchSummarizationResult['individualSummaries']
  ): Promise<BatchSummarizationResult['comparison']> {
    const combinedSummaries = summaries
      .map((s, i) => `Document ${i + 1}${s.title ? ` (${s.title})` : ''}: ${s.summary}`)
      .join('\n\n');

    const prompt = `
Analyze these document summaries and identify common themes, key differences, and provide recommendations.

Summaries:
${combinedSummaries}

Provide response in JSON format:
{
  "commonThemes": ["Theme 1", "Theme 2"],
  "differences": ["Key difference 1", "Key difference 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 400,
        temperature: 0.3
      });

      return JSON.parse(response.text);
    } catch (error) {
      return {
        commonThemes: ['Unable to analyze common themes'],
        differences: ['Unable to identify differences'],
        recommendations: ['Unable to generate recommendations']
      };
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get summarization statistics
   */
  getSummarizationStats(): {
    supportedTypes: SummaryType[];
    supportedLengths: SummaryLength[];
    maxTextLength: number;
    averageProcessingTime: number;
  } {
    return {
      supportedTypes: Object.values(SummaryType),
      supportedLengths: Object.values(SummaryLength),
      maxTextLength: 50000,
      averageProcessingTime: 3000 // Estimated 3 seconds
    };
  }
}