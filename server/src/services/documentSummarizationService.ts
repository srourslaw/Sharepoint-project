import { GeminiService } from './geminiService';
import { DocumentAnalysisService } from './documentAnalysisService';
import { 
  SummarizationRequest, 
  SummarizationResult, 
  Summary,
  DocumentMetrics,
  GeminiRequest,
  AnalysisType 
} from '../types/gemini';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface EnhancedSummarizationRequest extends SummarizationRequest {
  fileId?: string;
  fileName?: string;
  includeMetrics?: boolean;
  includeKeywords?: boolean;
  includeStructure?: boolean;
  outputFormat?: 'text' | 'markdown' | 'json' | 'html';
  maxSentences?: number;
  preserveFormatting?: boolean;
}

export interface EnhancedSummarizationResult {
  summary: Summary;
  summaryType: SummarizationRequest['summaryType'];
  length: SummarizationRequest['length'];
  keyPoints: string[];
  confidence: number;
  processingTime: number;
  timestamp: string;
  fileName?: string;
  metrics?: DocumentMetrics;
  keywords?: string[];
  structure?: {
    sections: number;
    paragraphs: number;
    readabilityScore?: number;
  };
  originalWordCount: number;
  compressionRatio: number;
  readingTimeReduction: number;
  outputFormat?: string;
}

export class DocumentSummarizationService {
  constructor(
    private geminiService: GeminiService,
    private analysisService: DocumentAnalysisService
  ) {}

  async summarizeDocument(request: EnhancedSummarizationRequest): Promise<EnhancedSummarizationResult> {
    const startTime = Date.now();
    
    // Sanitize input
    const sanitizedText = this.sanitizeInput(request.text);
    const tokenCount = this.getTokenCount(sanitizedText);
    
    if (tokenCount > 30000) {
      return this.handleLongDocument(request);
    }

    // Build comprehensive prompt
    const prompt = this.buildSummarizationPrompt({
      ...request,
      text: sanitizedText
    });

    // Generate summary
    const geminiRequest: GeminiRequest = {
      prompt,
      maxTokens: this.calculateMaxTokens(request.length),
      temperature: this.getTemperatureForSummaryType(request.summaryType),
      sessionId: `summary_${Date.now()}`
    };

    const response = await this.geminiService.generateText(geminiRequest);
    
    // Parse and enhance result
    const summary = this.parseSummaryResponse(response.text, request);
    
    // Get additional metrics if requested
    let metrics: DocumentMetrics | undefined;
    let keywords: string[] | undefined;
    let structure: any | undefined;

    if (request.includeMetrics || request.includeKeywords || request.includeStructure) {
      const analysisResults = await this.getEnhancedMetrics(sanitizedText, request);
      metrics = analysisResults.metrics;
      keywords = analysisResults.keywords;
      structure = analysisResults.structure;
    }

    const processingTime = Date.now() - startTime;
    const originalWordCount = sanitizedText.split(/\s+/).length;
    const summaryWordCount = summary.text.split(/\s+/).length;

    return {
      summary,
      summaryType: request.summaryType,
      length: request.length,
      keyPoints: summary.keyPoints || [],
      confidence: this.calculateConfidence(summary, originalWordCount),
      processingTime,
      timestamp: new Date().toISOString(),
      fileName: request.fileName,
      metrics,
      keywords,
      structure,
      originalWordCount,
      compressionRatio: summaryWordCount / originalWordCount,
      readingTimeReduction: Math.max(0, (originalWordCount - summaryWordCount) * 0.2), // Approx reading time in minutes
      outputFormat: this.formatOutput(summary.text, request.outputFormat || 'text')
    };
  }

  async batchSummarize(requests: EnhancedSummarizationRequest[]): Promise<EnhancedSummarizationResult[]> {
    const results: EnhancedSummarizationResult[] = [];
    const batchSize = 3; // Process 3 documents at a time to avoid rate limits

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.summarizeDocument(request));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch summarization error:', result.reason);
            // Add error result
            results.push({
              summary: { text: 'Error processing document', keyPoints: [], confidence: 0, length: 'short' as const },
              summaryType: 'extractive' as const,
              length: 'short' as const,
              keyPoints: [],
              confidence: 0,
              processingTime: 0,
              timestamp: new Date().toISOString(),
              originalWordCount: 0,
              compressionRatio: 0,
              readingTimeReduction: 0,
              outputFormat: 'Error occurred during processing'
            });
          }
        }
      } catch (error) {
        console.error('Batch processing error:', error);
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.delay(2000);
      }
    }

    return results;
  }

  async compareDocumentSummaries(
    doc1: string, 
    doc2: string, 
    summaryType: SummarizationRequest['summaryType'] = 'abstractive'
  ): Promise<{
    doc1Summary: EnhancedSummarizationResult;
    doc2Summary: EnhancedSummarizationResult;
    comparison: {
      similarities: string[];
      differences: string[];
      overallSimilarity: number;
      recommendedAction: string;
    };
  }> {
    // Generate summaries for both documents
    const [summary1, summary2] = await Promise.all([
      this.summarizeDocument({
        text: doc1,
        summaryType,
        length: 'medium',
        includeMetrics: true,
        includeKeywords: true
      }),
      this.summarizeDocument({
        text: doc2,
        summaryType,
        length: 'medium',
        includeMetrics: true,
        includeKeywords: true
      })
    ]);

    // Generate comparison analysis
    const comparisonPrompt = this.buildComparisonPrompt(
      summary1.summary.text,
      summary2.summary.text,
      summary1.keywords || [],
      summary2.keywords || []
    );

    const comparisonResponse = await this.geminiService.generateText({
      prompt: comparisonPrompt,
      maxTokens: 1000,
      temperature: 0.3
    });

    const comparison = this.parseComparisonResponse(comparisonResponse.text);

    return {
      doc1Summary: summary1,
      doc2Summary: summary2,
      comparison
    };
  }

  private sanitizeInput(text: string): string {
    // Remove potential HTML/script content
    const sanitized = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    
    // Remove excessive whitespace and normalize
    return sanitized
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
      .substring(0, 100000); // Limit to reasonable size
  }

  private buildSummarizationPrompt(request: EnhancedSummarizationRequest): string {
    const basePrompts = {
      extractive: 'Extract the most important sentences and information',
      abstractive: 'Create a new, coherent summary using your own words',
      bullet_points: 'Organize key information into clear bullet points',
      executive: 'Write an executive summary focusing on key decisions and outcomes',
      technical: 'Create a technical summary preserving important details and terminology',
      creative: 'Write an engaging, narrative-style summary'
    };

    const lengthGuides = {
      short: '2-3 sentences (50-75 words)',
      medium: '1-2 paragraphs (150-250 words)',
      long: '2-3 paragraphs (300-500 words)',
      custom: request.maxSentences ? `${request.maxSentences} sentences` : 'medium length'
    };

    let prompt = `${basePrompts[request.summaryType]} that is ${lengthGuides[request.length]}.

Document to summarize:
"${request.text}"

Requirements:
- Summary type: ${request.summaryType}
- Length: ${lengthGuides[request.length]}`;

    if (request.focusAreas && request.focusAreas.length > 0) {
      prompt += `\n- Focus areas: ${request.focusAreas.join(', ')}`;
    }

    if (request.targetAudience) {
      prompt += `\n- Target audience: ${request.targetAudience}`;
    }

    if (request.customInstructions) {
      prompt += `\n- Additional instructions: ${request.customInstructions}`;
    }

    if (request.preserveStructure) {
      prompt += '\n- Preserve the original document structure and organization';
    }

    if (request.includeKeyPoints) {
      prompt += '\n- Include 3-5 key points as bullet points at the end';
    }

    prompt += `

Please provide:
1. The summary text
2. 3-5 key points (if requested)
3. Confidence level (0-100)

Format your response as JSON:
{
  "summary": "summary text here",
  "keyPoints": ["point 1", "point 2", ...],
  "confidence": 95
}`;

    return prompt;
  }

  private parseSummaryResponse(responseText: string, request: EnhancedSummarizationRequest): Summary {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText);
      return {
        text: parsed.summary || responseText,
        length: request.length,
        keyPoints: parsed.keyPoints || [],
        confidence: parsed.confidence || 85
      };
    } catch {
      // Fallback to text parsing
      const lines = responseText.split('\n').filter(line => line.trim());
      const summaryText = lines.find(line => !line.startsWith('•') && !line.startsWith('-')) || responseText;
      
      const keyPoints = lines
        .filter(line => line.startsWith('•') || line.startsWith('-'))
        .map(line => line.replace(/^[•\-]\s*/, ''))
        .slice(0, 5);

      return {
        text: summaryText.trim(),
        length: request.length,
        keyPoints: keyPoints.length > 0 ? keyPoints : this.extractKeyPoints(summaryText),
        confidence: 85
      };
    }
  }

  private extractKeyPoints(text: string): string[] {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    return sentences
      .slice(0, 3)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10);
  }

  private async handleLongDocument(request: EnhancedSummarizationRequest): Promise<EnhancedSummarizationResult> {
    // Split document into chunks
    const chunks = this.splitIntoChunks(request.text, 8000);
    const chunkSummaries: string[] = [];

    // Summarize each chunk
    for (const chunk of chunks) {
      const chunkRequest: EnhancedSummarizationRequest = {
        ...request,
        text: chunk,
        length: 'short'
      };
      
      const chunkResult = await this.summarizeDocument(chunkRequest);
      chunkSummaries.push(chunkResult.summary.text);
    }

    // Create final summary from chunk summaries
    const finalRequest: EnhancedSummarizationRequest = {
      ...request,
      text: chunkSummaries.join('\n\n')
    };

    return this.summarizeDocument(finalRequest);
  }

  private splitIntoChunks(text: string, maxTokens: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const word of words) {
      const wordTokens = this.getTokenCount(word);
      
      if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentTokens = wordTokens;
      } else {
        currentChunk.push(word);
        currentTokens += wordTokens;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  private async getEnhancedMetrics(text: string, request: EnhancedSummarizationRequest) {
    const promises: Promise<any>[] = [];

    if (request.includeMetrics) {
      promises.push(this.analysisService.analyzeDocument({
        text,
        analysisType: AnalysisType.STRUCTURE,
        options: { includeMetrics: true }
      }));
    }

    if (request.includeKeywords) {
      promises.push(this.analysisService.analyzeDocument({
        text,
        analysisType: AnalysisType.KEYWORDS,
        options: { keywordCount: 10 }
      }));
    }

    const results = await Promise.all(promises);
    
    return {
      metrics: results[0]?.metrics,
      keywords: results[1]?.keywords?.map((k: any) => k.text) || [],
      structure: results[0]?.structure ? {
        sections: results[0].structure.sections.length,
        paragraphs: results[0].structure.paragraphs,
        readabilityScore: results[0].structure.readabilityScore
      } : undefined
    };
  }

  private buildComparisonPrompt(summary1: string, summary2: string, keywords1: string[], keywords2: string[]): string {
    return `Compare these two document summaries and identify similarities, differences, and overall relationship.

Summary 1:
"${summary1}"
Keywords 1: ${keywords1.join(', ')}

Summary 2:
"${summary2}"
Keywords 2: ${keywords2.join(', ')}

Please provide a detailed comparison in JSON format:
{
  "similarities": ["list of similar themes or topics"],
  "differences": ["list of key differences"],
  "overallSimilarity": 85,
  "recommendedAction": "description of how these documents relate and suggested next steps"
}`;
  }

  private parseComparisonResponse(responseText: string) {
    try {
      return JSON.parse(responseText);
    } catch {
      return {
        similarities: ['Unable to parse comparison'],
        differences: ['Analysis error occurred'],
        overallSimilarity: 0,
        recommendedAction: 'Please retry the comparison'
      };
    }
  }

  private formatOutput(text: string, format: string): string {
    switch (format) {
      case 'markdown':
        return `# Document Summary\n\n${text}`;
      case 'html':
        return `<div class="document-summary"><h2>Document Summary</h2><p>${text.replace(/\n/g, '</p><p>')}</p></div>`;
      case 'json':
        return JSON.stringify({ summary: text }, null, 2);
      default:
        return text;
    }
  }

  private calculateMaxTokens(length: string): number {
    switch (length) {
      case 'short': return 150;
      case 'medium': return 400;
      case 'long': return 800;
      case 'custom': return 600;
      default: return 400;
    }
  }

  private getTemperatureForSummaryType(type: string): number {
    switch (type) {
      case 'creative': return 0.8;
      case 'abstractive': return 0.6;
      case 'technical': return 0.2;
      case 'executive': return 0.3;
      default: return 0.4;
    }
  }

  private calculateConfidence(summary: Summary, originalWordCount: number): number {
    let confidence = 85; // Base confidence

    // Adjust based on compression ratio
    const summaryWordCount = summary.text.split(/\s+/).length;
    const compressionRatio = summaryWordCount / originalWordCount;
    
    if (compressionRatio > 0.8) confidence -= 20; // Too little compression
    if (compressionRatio < 0.05) confidence -= 15; // Too much compression
    
    // Adjust based on key points
    if (summary.keyPoints && summary.keyPoints.length >= 3) confidence += 5;
    
    // Adjust based on summary length
    if (summary.text.length < 50) confidence -= 10;
    if (summary.text.length > 2000) confidence -= 5;

    return Math.max(0, Math.min(100, confidence));
  }

  private getTokenCount(text: string): number {
    try {
      return encode(text).length;
    } catch {
      return Math.ceil(text.length / 4); // Rough approximation
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}