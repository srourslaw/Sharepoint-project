import { GeminiService } from './geminiService';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string; // Auto-detect if not provided
  targetLanguage: string;
  preserveFormatting?: boolean;
  includeAlternatives?: boolean;
  contextHint?: string;
  translationStyle?: TranslationStyle;
  fileName?: string;
}

export enum TranslationStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  LITERARY = 'literary',
  BUSINESS = 'business',
  ACADEMIC = 'academic',
  CONVERSATIONAL = 'conversational'
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  alternatives?: string[];
  metadata: TranslationMetadata;
  processingTime: number;
  timestamp: string;
}

export interface TranslationMetadata {
  wordCount: number;
  characterCount: number;
  detectedLanguageConfidence?: number;
  preservedFormatting: boolean;
  translationStyle: TranslationStyle;
  qualityScore: number;
  complexityLevel: 'simple' | 'moderate' | 'complex';
  domainDetected?: string;
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLanguage?: string;
  targetLanguage: string;
  options: Partial<TranslationRequest>;
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  overallMetrics: {
    totalTexts: number;
    totalWords: number;
    averageConfidence: number;
    totalProcessingTime: number;
    successRate: number;
  };
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
  writingSystem: 'ltr' | 'rtl';
  complexityLevel: 'simple' | 'moderate' | 'complex';
}

export class TranslationService {
  private supportedLanguages: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', writingSystem: 'ltr', complexityLevel: 'simple' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', writingSystem: 'ltr', complexityLevel: 'simple' },
    { code: 'fr', name: 'French', nativeName: 'Français', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', writingSystem: 'rtl', complexityLevel: 'complex' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', writingSystem: 'ltr', complexityLevel: 'moderate' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', writingSystem: 'ltr', complexityLevel: 'complex' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', writingSystem: 'rtl', complexityLevel: 'complex' }
  ];

  constructor(private geminiService: GeminiService) {}

  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();
    
    // Sanitize input
    const sanitizedText = this.sanitizeInput(request.text);
    const tokenCount = this.getTokenCount(sanitizedText);
    
    if (tokenCount > 25000) {
      return this.translateLongText(request);
    }

    // Auto-detect source language if not provided
    let sourceLanguage = request.sourceLanguage;
    if (!sourceLanguage) {
      const detection = await this.detectLanguage(sanitizedText);
      sourceLanguage = detection.language;
    }

    // Validate language support
    this.validateLanguageSupport(sourceLanguage);
    this.validateLanguageSupport(request.targetLanguage);

    // Build translation prompt
    const prompt = this.buildTranslationPrompt({
      text: sanitizedText,
      sourceLanguage,
      targetLanguage: request.targetLanguage,
      preserveFormatting: request.preserveFormatting || false,
      translationStyle: request.translationStyle || TranslationStyle.FORMAL,
      contextHint: request.contextHint || ''
    });

    // Perform translation
    const geminiResponse = await this.geminiService.generateText({
      prompt,
      maxTokens: Math.min(tokenCount * 1.5, 4000),
      temperature: 0.3
    });

    // Parse and validate result
    const translatedText = this.parseTranslationResponse(geminiResponse.text);
    const quality = this.assessTranslationQuality(sanitizedText, translatedText, sourceLanguage, request.targetLanguage);

    const processingTime = Date.now() - startTime;
    const wordCount = sanitizedText.split(/\s+/).length;
    
    // Get alternatives if requested
    let alternatives: string[] | undefined;
    if (request.includeAlternatives) {
      alternatives = await this.generateAlternativeTranslations(request, translatedText);
    }

    return {
      originalText: sanitizedText,
      translatedText,
      sourceLanguage,
      targetLanguage: request.targetLanguage,
      confidence: quality.confidence,
      alternatives,
      metadata: {
        wordCount,
        characterCount: sanitizedText.length,
        preservedFormatting: request.preserveFormatting || false,
        translationStyle: request.translationStyle || TranslationStyle.FORMAL,
        qualityScore: quality.score,
        complexityLevel: this.assessTextComplexity(sanitizedText),
        domainDetected: quality.domain
      },
      processingTime,
      timestamp: new Date().toISOString()
    };
  }

  async translateBatch(request: BatchTranslationRequest): Promise<BatchTranslationResult> {
    const results: TranslationResult[] = [];
    const batchSize = 5; // Process 5 texts at a time
    let totalProcessingTime = 0;
    let successCount = 0;

    for (let i = 0; i < request.texts.length; i += batchSize) {
      const batch = request.texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => 
        this.translateText({
          text,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          ...request.options
        }).catch(error => {
          console.error('Batch translation error:', error);
          return {
            originalText: text,
            translatedText: 'Translation failed',
            sourceLanguage: request.sourceLanguage || 'unknown',
            targetLanguage: request.targetLanguage,
            confidence: 0,
            metadata: {
              wordCount: 0,
              characterCount: 0,
              preservedFormatting: false,
              translationStyle: TranslationStyle.FORMAL,
              qualityScore: 0,
              complexityLevel: 'simple' as const
            },
            processingTime: 0,
            timestamp: new Date().toISOString()
          };
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Count successful translations
      successCount += batchResults.filter(result => result.confidence > 0).length;
      totalProcessingTime += batchResults.reduce((sum, result) => sum + result.processingTime, 0);

      // Add delay between batches
      if (i + batchSize < request.texts.length) {
        await this.delay(1000);
      }
    }

    const totalWords = results.reduce((sum, result) => sum + result.metadata.wordCount, 0);
    const avgConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;

    return {
      results,
      overallMetrics: {
        totalTexts: request.texts.length,
        totalWords,
        averageConfidence: avgConfidence,
        totalProcessingTime,
        successRate: (successCount / request.texts.length) * 100
      }
    };
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const sanitizedText = this.sanitizeInput(text).substring(0, 1000); // Use first 1000 chars for detection
    
    const prompt = `Detect the language of the following text. Consider:
    - Script/writing system
    - Common words and phrases
    - Grammar patterns
    - Character frequency

    Text:
    "${sanitizedText}"

    Return a JSON object with this format:
    {
      "language": "en",
      "confidence": 95,
      "alternatives": [
        {"language": "en-US", "confidence": 90},
        {"language": "en-UK", "confidence": 85}
      ]
    }

    Language codes should be ISO 639-1 standard (e.g., "en", "es", "fr", "de").`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 300,
      temperature: 0.1
    });

    return this.parseLanguageDetectionResponse(response.text);
  }

  async translateDocument(
    documentContent: string,
    sourceLanguage: string | undefined,
    targetLanguage: string,
    preserveStructure: boolean = true
  ): Promise<TranslationResult> {
    // Handle structured documents by preserving formatting
    if (preserveStructure) {
      return this.translateWithStructurePreservation(
        documentContent,
        sourceLanguage,
        targetLanguage
      );
    }

    return this.translateText({
      text: documentContent,
      sourceLanguage,
      targetLanguage,
      preserveFormatting: true,
      translationStyle: TranslationStyle.FORMAL
    });
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  async getTranslationQuality(
    originalText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `Assess the quality of this translation:

    Original (${sourceLanguage}): "${originalText}"
    Translation (${targetLanguage}): "${translatedText}"

    Evaluate:
    1. Accuracy of meaning
    2. Grammar and fluency
    3. Cultural appropriateness
    4. Terminology consistency
    5. Style preservation

    Return a JSON object:
    {
      "score": 85,
      "issues": ["minor grammatical error in sentence 2"],
      "suggestions": ["consider using 'achieve' instead of 'accomplish' for better flow"]
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 500,
      temperature: 0.2
    });

    return this.parseQualityAssessmentResponse(response.text);
  }

  private async translateLongText(request: TranslationRequest): Promise<TranslationResult> {
    // Split long text into chunks
    const chunks = this.splitTextIntoChunks(request.text, 8000);
    const translatedChunks: string[] = [];
    let totalProcessingTime = 0;
    let avgConfidence = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunkRequest: TranslationRequest = {
        ...request,
        text: chunks[i]
      };

      const chunkResult = await this.translateText(chunkRequest);
      translatedChunks.push(chunkResult.translatedText);
      totalProcessingTime += chunkResult.processingTime;
      avgConfidence += chunkResult.confidence;

      // Add small delay between chunks
      if (i < chunks.length - 1) {
        await this.delay(500);
      }
    }

    const finalTranslation = translatedChunks.join('\n\n');
    avgConfidence = avgConfidence / chunks.length;

    return {
      originalText: request.text,
      translatedText: finalTranslation,
      sourceLanguage: request.sourceLanguage || 'auto',
      targetLanguage: request.targetLanguage,
      confidence: avgConfidence,
      metadata: {
        wordCount: request.text.split(/\s+/).length,
        characterCount: request.text.length,
        preservedFormatting: request.preserveFormatting || false,
        translationStyle: request.translationStyle || TranslationStyle.FORMAL,
        qualityScore: avgConfidence,
        complexityLevel: this.assessTextComplexity(request.text),
        domainDetected: undefined
      },
      processingTime: totalProcessingTime,
      timestamp: new Date().toISOString()
    };
  }

  private async translateWithStructurePreservation(
    content: string,
    sourceLanguage: string | undefined,
    targetLanguage: string
  ): Promise<TranslationResult> {
    // Extract structure elements (headings, lists, etc.)
    const structureElements = this.extractStructureElements(content);
    
    const prompt = `Translate the following structured document while preserving all formatting, markup, and structure:

    Source Language: ${sourceLanguage || 'auto-detect'}
    Target Language: ${targetLanguage}

    Document:
    ${content}

    Instructions:
    1. Preserve all HTML/Markdown formatting
    2. Keep bullet points, numbering, and indentation
    3. Maintain table structures
    4. Preserve code blocks unchanged
    5. Keep URLs and email addresses unchanged
    6. Translate only the actual content text

    Return only the translated document with preserved structure.`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: Math.min(content.length * 1.2, 8000),
      temperature: 0.2
    });

    const translatedContent = response.text;
    const quality = this.assessTranslationQuality(content, translatedContent, sourceLanguage || 'auto', targetLanguage);

    return {
      originalText: content,
      translatedText: translatedContent,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      confidence: quality.confidence,
      metadata: {
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        preservedFormatting: true,
        translationStyle: TranslationStyle.FORMAL,
        qualityScore: quality.score,
        complexityLevel: this.assessTextComplexity(content),
        domainDetected: quality.domain
      },
      processingTime: 0,
      timestamp: new Date().toISOString()
    };
  }

  private buildTranslationPrompt(request: Required<Omit<TranslationRequest, 'includeAlternatives' | 'fileName'>>): string {
    const sourceLanguage = this.getLanguageName(request.sourceLanguage);
    const targetLanguage = this.getLanguageName(request.targetLanguage);
    
    let prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}.

    Style: ${request.translationStyle}
    ${request.contextHint ? `Context: ${request.contextHint}` : ''}
    ${request.preserveFormatting ? 'Preserve all formatting, line breaks, and structure.' : ''}

    Text to translate:
    "${request.text}"

    Requirements:
    1. Provide accurate, natural translation
    2. Maintain the original meaning and tone
    3. Use appropriate ${request.translationStyle} style
    4. Consider cultural context and idioms
    5. Ensure grammatical correctness in target language`;

    if (request.translationStyle === TranslationStyle.TECHNICAL) {
      prompt += '\n6. Preserve technical terminology and industry-specific terms';
    } else if (request.translationStyle === TranslationStyle.LITERARY) {
      prompt += '\n6. Maintain literary devices, rhythm, and artistic expression';
    } else if (request.translationStyle === TranslationStyle.BUSINESS) {
      prompt += '\n6. Use professional business language and terminology';
    }

    prompt += '\n\nProvide only the translation, no explanations or additional text.';

    return prompt;
  }

  private parseTranslationResponse(responseText: string): string {
    // Remove any surrounding quotes or formatting
    let translation = responseText.trim();
    
    // Remove common prefixes that might be added
    const prefixes = ['Translation:', 'Translated text:', 'Result:'];
    for (const prefix of prefixes) {
      if (translation.startsWith(prefix)) {
        translation = translation.substring(prefix.length).trim();
      }
    }

    // Remove quotes if the entire response is quoted
    if ((translation.startsWith('"') && translation.endsWith('"')) ||
        (translation.startsWith("'") && translation.endsWith("'"))) {
      translation = translation.slice(1, -1);
    }

    return translation;
  }

  private parseLanguageDetectionResponse(responseText: string): LanguageDetectionResult {
    try {
      const parsed = JSON.parse(responseText);
      return {
        language: parsed.language || 'unknown',
        confidence: parsed.confidence || 0,
        alternatives: parsed.alternatives || []
      };
    } catch (error) {
      console.error('Error parsing language detection response:', error);
      return {
        language: 'unknown',
        confidence: 0,
        alternatives: []
      };
    }
  }

  private parseQualityAssessmentResponse(responseText: string) {
    try {
      const parsed = JSON.parse(responseText);
      return {
        score: parsed.score || 0,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('Error parsing quality assessment:', error);
      return {
        score: 0,
        issues: ['Unable to assess quality'],
        suggestions: []
      };
    }
  }

  private async generateAlternativeTranslations(
    request: TranslationRequest,
    primaryTranslation: string
  ): Promise<string[]> {
    const prompt = `Provide 2-3 alternative translations for this text:

    Original (${request.sourceLanguage}): "${request.text}"
    Primary translation (${request.targetLanguage}): "${primaryTranslation}"

    Generate alternatives that:
    1. Use different vocabulary choices
    2. Vary in formality level
    3. Maintain accuracy but offer stylistic variety

    Return a JSON array of alternative translations:
    ["alternative 1", "alternative 2", "alternative 3"]`;

    try {
      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 800,
        temperature: 0.6
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('Error generating alternatives:', error);
      return [];
    }
  }

  private assessTranslationQuality(
    originalText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): { confidence: number; score: number; domain?: string } {
    // Basic quality assessment based on text characteristics
    let confidence = 85; // Base confidence
    
    // Adjust based on text length
    if (originalText.length < 50) confidence += 10;
    if (originalText.length > 2000) confidence -= 10;
    
    // Adjust based on language complexity
    const sourceLang = this.supportedLanguages.find(lang => lang.code === sourceLanguage);
    const targetLang = this.supportedLanguages.find(lang => lang.code === targetLanguage);
    
    if (sourceLang?.complexityLevel === 'complex' || targetLang?.complexityLevel === 'complex') {
      confidence -= 15;
    }
    
    // Check for preserved structure elements
    const originalStructure = this.countStructureElements(originalText);
    const translatedStructure = this.countStructureElements(translatedText);
    
    if (Math.abs(originalStructure - translatedStructure) > 2) {
      confidence -= 10;
    }

    // Detect potential domain
    const domain = this.detectTextDomain(originalText);
    
    return {
      confidence: Math.max(0, Math.min(100, confidence)),
      score: Math.max(0, Math.min(100, confidence)),
      domain
    };
  }

  private assessTextComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const avgWordsPerSentence = this.getAverageWordsPerSentence(text);
    const uniqueWordRatio = this.getUniqueWordRatio(text);
    const technicalTerms = this.countTechnicalTerms(text);
    
    let complexityScore = 0;
    
    if (avgWordsPerSentence > 20) complexityScore += 2;
    else if (avgWordsPerSentence > 15) complexityScore += 1;
    
    if (uniqueWordRatio > 0.7) complexityScore += 2;
    else if (uniqueWordRatio > 0.5) complexityScore += 1;
    
    if (technicalTerms > text.split(/\s+/).length * 0.1) complexityScore += 2;
    
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  private splitTextIntoChunks(text: string, maxTokens: number): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.getTokenCount(sentence);
      
      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [sentence];
        currentTokens = sentenceTokens;
      } else {
        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  private extractStructureElements(content: string): Array<{
    type: string;
    content: string;
    position: number;
  }> {
    const elements: Array<{ type: string; content: string; position: number }> = [];
    
    // Extract headings (markdown style)
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      elements.push({
        type: 'heading',
        content: match[1],
        position: match.index
      });
    }

    // Extract lists
    const listRegex = /^[\s]*[\-\*\+]\s+(.+)$/gm;
    while ((match = listRegex.exec(content)) !== null) {
      elements.push({
        type: 'list_item',
        content: match[1],
        position: match.index
      });
    }

    return elements.sort((a, b) => a.position - b.position);
  }

  private countStructureElements(text: string): number {
    let count = 0;
    
    // Count markdown headings
    count += (text.match(/^#{1,6}\s+/gm) || []).length;
    
    // Count list items
    count += (text.match(/^[\s]*[\-\*\+]\s+/gm) || []).length;
    
    // Count numbered lists
    count += (text.match(/^[\s]*\d+\.\s+/gm) || []).length;
    
    return count;
  }

  private detectTextDomain(text: string): string | undefined {
    const domains = {
      technical: ['API', 'software', 'algorithm', 'database', 'server', 'application', 'development', 'programming'],
      medical: ['patient', 'diagnosis', 'treatment', 'medicine', 'hospital', 'doctor', 'therapy', 'clinical'],
      legal: ['contract', 'agreement', 'clause', 'legal', 'court', 'law', 'attorney', 'jurisdiction'],
      business: ['revenue', 'profit', 'strategy', 'market', 'customer', 'sales', 'business', 'company'],
      academic: ['research', 'study', 'analysis', 'theory', 'methodology', 'conclusion', 'hypothesis', 'abstract']
    };

    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let detectedDomain: string | undefined;

    for (const [domain, keywords] of Object.entries(domains)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (lowerText.split(keyword.toLowerCase()).length - 1);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain;
      }
    }

    return maxScore >= 3 ? detectedDomain : undefined;
  }

  private getAverageWordsPerSentence(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const totalWords = text.split(/\s+/).length;
    return totalWords / sentences.length;
  }

  private getUniqueWordRatio(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  private countTechnicalTerms(text: string): number {
    const technicalPatterns = [
      /\b[A-Z]{2,}\b/g,           // Acronyms
      /\w+\(\)/g,                 // Function calls
      /\b\w+\.\w+\b/g,           // Dotted notation
      /\b\d+\.\d+\.\d+\b/g,      // Version numbers
    ];

    let count = 0;
    for (const pattern of technicalPatterns) {
      count += (text.match(pattern) || []).length;
    }
    return count;
  }

  private validateLanguageSupport(languageCode: string): void {
    if (!this.isLanguageSupported(languageCode) && languageCode !== 'auto') {
      throw new Error(`Language '${languageCode}' is not supported`);
    }
  }

  private getLanguageName(code: string): string {
    if (code === 'auto') return 'Auto-detected';
    const language = this.supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  private sanitizeInput(text: string): string {
    const sanitized = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'], 
      ALLOWED_ATTR: [] 
    });
    
    return sanitized
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100000);
  }

  private getTokenCount(text: string): number {
    try {
      return encode(text).length;
    } catch {
      return Math.ceil(text.length / 4);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}