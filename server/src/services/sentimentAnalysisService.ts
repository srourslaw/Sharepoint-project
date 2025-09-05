import { GeminiService } from './geminiService';
import { 
  SentimentAnalysis, 
  SentimentScore, 
  EmotionalTone,
  DocumentAnalysisResult,
  AnalysisType 
} from '../types/gemini';
import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface SentimentAnalysisRequest {
  text: string;
  analysisTypes: SentimentAnalysisType[];
  options: SentimentAnalysisOptions;
  fileName?: string;
}

export enum SentimentAnalysisType {
  OVERALL_SENTIMENT = 'overall_sentiment',
  SENTENCE_LEVEL = 'sentence_level',
  PARAGRAPH_LEVEL = 'paragraph_level',
  EMOTION_DETECTION = 'emotion_detection',
  ASPECT_SENTIMENT = 'aspect_sentiment',
  COMPARATIVE_SENTIMENT = 'comparative_sentiment',
  TEMPORAL_SENTIMENT = 'temporal_sentiment',
  TOPIC_SENTIMENT = 'topic_sentiment'
}

export interface SentimentAnalysisOptions {
  language?: string;
  includeConfidence?: boolean;
  includeExplanation?: boolean;
  aspectTerms?: string[];
  sentimentThreshold?: number;
  includeNeutralSentiments?: boolean;
  granularityLevel?: 'coarse' | 'fine' | 'detailed';
  contextWindow?: number;
  includeSubjectivity?: boolean;
}

export interface EnhancedSentimentResult {
  fileName?: string;
  overallSentiment: SentimentScore;
  sentenceLevel?: SentimentScore[];
  paragraphLevel?: SentimentScore[];
  emotionalTone?: EmotionalTone;
  aspectSentiments?: AspectSentiment[];
  comparativeSentiments?: ComparativeSentiment[];
  temporalSentiments?: TemporalSentiment[];
  topicSentiments?: TopicSentiment[];
  insights: SentimentInsights;
  metadata: SentimentMetadata;
  processingTime: number;
  timestamp: string;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: SentimentScore;
  mentions: AspectMention[];
  significance: number;
}

export interface AspectMention {
  text: string;
  startIndex: number;
  endIndex: number;
  context: string;
  sentiment: SentimentScore;
}

export interface ComparativeSentiment {
  entity1: string;
  entity2: string;
  comparison: 'positive' | 'negative' | 'neutral';
  confidence: number;
  context: string;
  reasoning?: string;
}

export interface TemporalSentiment {
  timeFrame: string;
  sentiment: SentimentScore;
  textSegment: string;
  significantEvents?: string[];
}

export interface TopicSentiment {
  topic: string;
  sentiment: SentimentScore;
  relevantSentences: string[];
  keyPhrases: string[];
}

export interface SentimentInsights {
  dominantEmotion: string;
  emotionalIntensity: 'low' | 'moderate' | 'high' | 'extreme';
  sentimentConsistency: number; // 0-100
  polarityShifts: PolarityShift[];
  keyFindings: string[];
  riskIndicators: string[];
  positiveHighlights: string[];
  negativeHighlights: string[];
  neutralAreas: string[];
}

export interface PolarityShift {
  fromSentiment: 'positive' | 'negative' | 'neutral';
  toSentiment: 'positive' | 'negative' | 'neutral';
  location: string;
  significance: number;
  context: string;
}

export interface SentimentMetadata {
  textLength: number;
  sentenceCount: number;
  wordCount: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  confidenceLevel: number;
  languageDetected?: string;
  processingModel: string;
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
}

export interface SentimentTrend {
  timePoints: Array<{
    position: number; // Position in text (0-1)
    sentiment: SentimentScore;
    movingAverage?: number;
  }>;
  overallTrend: 'improving' | 'declining' | 'stable' | 'volatile';
  volatilityScore: number;
  significantChanges: Array<{
    position: number;
    change: number;
    description: string;
  }>;
}

export interface BatchSentimentRequest {
  texts: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
  options: SentimentAnalysisOptions;
}

export interface BatchSentimentResult {
  results: Array<{
    id: string;
    sentiment: EnhancedSentimentResult;
  }>;
  aggregatedInsights: {
    averageSentiment: SentimentScore;
    sentimentRange: {
      min: number;
      max: number;
    };
    commonEmotions: string[];
    outliers: string[];
  };
  processingStats: {
    totalTexts: number;
    successfulAnalyses: number;
    averageProcessingTime: number;
  };
}

export class SentimentAnalysisService {
  constructor(private geminiService: GeminiService) {}

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<EnhancedSentimentResult> {
    const startTime = Date.now();
    const sanitizedText = this.sanitizeInput(request.text);
    
    const results: Partial<EnhancedSentimentResult> = {
      fileName: request.fileName
    };

    // Perform each requested analysis type
    for (const analysisType of request.analysisTypes) {
      try {
        switch (analysisType) {
          case SentimentAnalysisType.OVERALL_SENTIMENT:
            results.overallSentiment = await this.analyzeOverallSentiment(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.SENTENCE_LEVEL:
            results.sentenceLevel = await this.analyzeSentenceLevel(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.PARAGRAPH_LEVEL:
            results.paragraphLevel = await this.analyzeParagraphLevel(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.EMOTION_DETECTION:
            results.emotionalTone = await this.analyzeEmotions(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.ASPECT_SENTIMENT:
            results.aspectSentiments = await this.analyzeAspectSentiment(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.COMPARATIVE_SENTIMENT:
            results.comparativeSentiments = await this.analyzeComparativeSentiment(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.TEMPORAL_SENTIMENT:
            results.temporalSentiments = await this.analyzeTemporalSentiment(sanitizedText, request.options);
            break;
            
          case SentimentAnalysisType.TOPIC_SENTIMENT:
            results.topicSentiments = await this.analyzeTopicSentiment(sanitizedText, request.options);
            break;
        }
      } catch (error: any) {
        console.error(`Error in ${analysisType}:`, error);
      }
    }

    // Ensure we have at least overall sentiment
    if (!results.overallSentiment) {
      results.overallSentiment = await this.analyzeOverallSentiment(sanitizedText, request.options);
    }

    // Generate insights
    results.insights = this.generateSentimentInsights(results as EnhancedSentimentResult, sanitizedText);
    
    // Generate metadata
    results.metadata = this.generateMetadata(sanitizedText, results as EnhancedSentimentResult, request.options);
    
    const processingTime = Date.now() - startTime;

    return {
      ...results,
      processingTime,
      timestamp: new Date().toISOString()
    } as EnhancedSentimentResult;
  }

  async analyzeBatchSentiment(request: BatchSentimentRequest): Promise<BatchSentimentResult> {
    const results: BatchSentimentResult['results'] = [];
    let successfulAnalyses = 0;
    let totalProcessingTime = 0;

    for (const textItem of request.texts) {
      try {
        const analysis = await this.analyzeSentiment({
          text: textItem.text,
          analysisTypes: [SentimentAnalysisType.OVERALL_SENTIMENT, SentimentAnalysisType.EMOTION_DETECTION],
          options: request.options
        });

        results.push({
          id: textItem.id,
          sentiment: analysis
        });

        successfulAnalyses++;
        totalProcessingTime += analysis.processingTime;

        // Add delay to avoid rate limits
        await this.delay(100);

      } catch (error: any) {
        console.error(`Error analyzing sentiment for ${textItem.id}:`, error);
      }
    }

    // Generate aggregated insights
    const aggregatedInsights = this.generateAggregatedInsights(results);

    return {
      results,
      aggregatedInsights,
      processingStats: {
        totalTexts: request.texts.length,
        successfulAnalyses,
        averageProcessingTime: successfulAnalyses > 0 ? totalProcessingTime / successfulAnalyses : 0
      }
    };
  }

  async analyzeSentimentTrend(text: string, windowSize: number = 10): Promise<SentimentTrend> {
    const sentences = this.splitIntoSentences(text);
    const timePoints: SentimentTrend['timePoints'] = [];
    
    // Analyze sentiment in sliding windows
    for (let i = 0; i < sentences.length - windowSize + 1; i++) {
      const window = sentences.slice(i, i + windowSize).join(' ');
      const sentiment = await this.analyzeOverallSentiment(window, {});
      
      timePoints.push({
        position: i / (sentences.length - windowSize),
        sentiment,
        movingAverage: this.calculateMovingAverage(timePoints, 3)
      });
    }

    // Calculate trend direction
    const overallTrend = this.calculateOverallTrend(timePoints);
    const volatilityScore = this.calculateVolatility(timePoints);
    const significantChanges = this.identifySignificantChanges(timePoints);

    return {
      timePoints,
      overallTrend,
      volatilityScore,
      significantChanges
    };
  }

  async detectEmotionalPatterns(text: string): Promise<{
    patterns: Array<{
      pattern: string;
      frequency: number;
      examples: string[];
      associatedEmotions: string[];
    }>;
    emotionalArcs: Array<{
      startEmotion: string;
      endEmotion: string;
      transitionPoints: number[];
      intensity: number;
    }>;
  }> {
    const prompt = `Analyze this text for emotional patterns and emotional arcs:

    Text:
    "${text}"

    Identify:
    1. Recurring emotional patterns (e.g., hope followed by disappointment)
    2. Emotional arcs throughout the text
    3. Transition points where emotions change
    4. Intensity levels of emotions

    Return a JSON object:
    {
      "patterns": [
        {
          "pattern": "anticipation-to-relief",
          "frequency": 3,
          "examples": ["example sentences"],
          "associatedEmotions": ["anticipation", "relief"]
        }
      ],
      "emotionalArcs": [
        {
          "startEmotion": "anxiety",
          "endEmotion": "calm",
          "transitionPoints": [0.3, 0.7],
          "intensity": 8
        }
      ]
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 2000,
      temperature: 0.3
    });

    return this.parseEmotionalPatternsResponse(response.text);
  }

  private async analyzeOverallSentiment(text: string, options: SentimentAnalysisOptions): Promise<SentimentScore> {
    const prompt = `Analyze the overall sentiment of this text:

    Text:
    "${text}"

    Provide detailed sentiment analysis including:
    1. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
    2. Magnitude (0 to infinity, indicating emotional intensity)
    3. Label (positive, negative, neutral, or mixed)
    4. Confidence level (0-100)
    ${options.includeSubjectivity ? '5. Subjectivity score (0-1, where 0 is objective, 1 is subjective)' : ''}

    Return a JSON object:
    {
      "score": 0.7,
      "magnitude": 0.8,
      "label": "positive",
      "confidence": 92${options.includeSubjectivity ? ',\n      "subjectivity": 0.6' : ''}
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 300,
      temperature: 0.1
    });

    return this.parseSentimentResponse(response.text);
  }

  private async analyzeSentenceLevel(text: string, options: SentimentAnalysisOptions): Promise<SentimentScore[]> {
    const sentences = this.splitIntoSentences(text);
    const results: SentimentScore[] = [];

    // Analyze in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      
      const prompt = `Analyze the sentiment of each sentence separately:

      Sentences:
      ${batch.map((sentence, index) => `${i + index + 1}. ${sentence}`).join('\n')}

      Return a JSON array of sentiment objects for each sentence:
      [
        {
          "sentenceNumber": 1,
          "score": 0.5,
          "magnitude": 0.3,
          "label": "positive",
          "confidence": 88
        }
      ]`;

      const response = await this.geminiService.generateText({
        prompt,
        maxTokens: 1000,
        temperature: 0.1
      });

      const batchResults = this.parseSentenceResultsResponse(response.text);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < sentences.length) {
        await this.delay(500);
      }
    }

    return results;
  }

  private async analyzeParagraphLevel(text: string, options: SentimentAnalysisOptions): Promise<SentimentScore[]> {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const results: SentimentScore[] = [];

    for (const paragraph of paragraphs) {
      const sentiment = await this.analyzeOverallSentiment(paragraph, options);
      results.push(sentiment);
      
      // Small delay between paragraphs
      await this.delay(200);
    }

    return results;
  }

  private async analyzeEmotions(text: string, options: SentimentAnalysisOptions): Promise<EmotionalTone> {
    const prompt = `Analyze the emotional tone of this text across multiple emotion dimensions:

    Text:
    "${text}"

    Rate each emotion from 0 to 1 (where 0 = not present, 1 = strongly present):
    - Joy/Happiness
    - Sadness
    - Anger
    - Fear/Anxiety
    - Surprise
    - Disgust

    Return a JSON object:
    {
      "joy": 0.7,
      "sadness": 0.1,
      "anger": 0.2,
      "fear": 0.3,
      "surprise": 0.4,
      "disgust": 0.0
    }`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 300,
      temperature: 0.2
    });

    return this.parseEmotionalToneResponse(response.text);
  }

  private async analyzeAspectSentiment(text: string, options: SentimentAnalysisOptions): Promise<AspectSentiment[]> {
    const aspectTerms = options.aspectTerms || this.extractDefaultAspects(text);
    
    if (aspectTerms.length === 0) {
      return [];
    }

    const prompt = `Analyze sentiment towards specific aspects/entities in this text:

    Text:
    "${text}"

    Aspects to analyze: ${aspectTerms.join(', ')}

    For each aspect found in the text, provide:
    1. Sentiment score and label
    2. All mentions with context
    3. Significance/importance of the aspect in the text

    Return a JSON array:
    [
      {
        "aspect": "customer service",
        "sentiment": {
          "score": 0.8,
          "magnitude": 0.6,
          "label": "positive",
          "confidence": 90
        },
        "mentions": [
          {
            "text": "excellent customer service",
            "context": "The company provides excellent customer service to all clients",
            "sentiment": {
              "score": 0.9,
              "label": "positive",
              "confidence": 95
            }
          }
        ],
        "significance": 0.8
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 2500,
      temperature: 0.2
    });

    return this.parseAspectSentimentResponse(response.text);
  }

  private async analyzeComparativeSentiment(text: string, options: SentimentAnalysisOptions): Promise<ComparativeSentiment[]> {
    const prompt = `Identify and analyze comparative sentiments in this text:

    Text:
    "${text}"

    Find comparisons between entities, products, services, or concepts and determine:
    1. What is being compared
    2. Which entity is viewed more positively/negatively
    3. The confidence in this assessment
    4. The context of the comparison

    Return a JSON array:
    [
      {
        "entity1": "Product A",
        "entity2": "Product B",
        "comparison": "positive",
        "confidence": 85,
        "context": "Product A is much better than Product B",
        "reasoning": "Text explicitly states superiority"
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return this.parseComparativeSentimentResponse(response.text);
  }

  private async analyzeTemporalSentiment(text: string, options: SentimentAnalysisOptions): Promise<TemporalSentiment[]> {
    const prompt = `Identify temporal/time-based sentiment changes in this text:

    Text:
    "${text}"

    Look for:
    1. References to different time periods (past, present, future)
    2. Temporal indicators (before, after, now, then, etc.)
    3. How sentiment changes across time references
    4. Significant events or milestones mentioned

    Return a JSON array:
    [
      {
        "timeFrame": "past",
        "sentiment": {
          "score": -0.5,
          "label": "negative",
          "confidence": 80
        },
        "textSegment": "relevant text segment",
        "significantEvents": ["event1", "event2"]
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 1500,
      temperature: 0.2
    });

    return this.parseTemporalSentimentResponse(response.text);
  }

  private async analyzeTopicSentiment(text: string, options: SentimentAnalysisOptions): Promise<TopicSentiment[]> {
    const prompt = `Identify major topics in the text and analyze sentiment towards each:

    Text:
    "${text}"

    For each major topic/theme:
    1. Identify the topic
    2. Determine sentiment towards that topic
    3. Find relevant sentences that discuss the topic
    4. Extract key phrases related to the topic

    Return a JSON array:
    [
      {
        "topic": "customer experience",
        "sentiment": {
          "score": 0.6,
          "label": "positive",
          "confidence": 88
        },
        "relevantSentences": ["sentences about this topic"],
        "keyPhrases": ["key phrases"]
      }
    ]`;

    const response = await this.geminiService.generateText({
      prompt,
      maxTokens: 2000,
      temperature: 0.3
    });

    return this.parseTopicSentimentResponse(response.text);
  }

  private generateSentimentInsights(result: EnhancedSentimentResult, text: string): SentimentInsights {
    const insights: SentimentInsights = {
      dominantEmotion: 'neutral',
      emotionalIntensity: 'low',
      sentimentConsistency: 0,
      polarityShifts: [],
      keyFindings: [],
      riskIndicators: [],
      positiveHighlights: [],
      negativeHighlights: [],
      neutralAreas: []
    };

    // Determine dominant emotion
    if (result.emotionalTone) {
      const emotions = Object.entries(result.emotionalTone);
      const dominantEmotionEntry = emotions.reduce((max, current) => 
        current[1] > max[1] ? current : max
      );
      insights.dominantEmotion = dominantEmotionEntry[0];
      
      // Determine emotional intensity
      const maxEmotionValue = dominantEmotionEntry[1];
      if (maxEmotionValue > 0.7) insights.emotionalIntensity = 'extreme';
      else if (maxEmotionValue > 0.5) insights.emotionalIntensity = 'high';
      else if (maxEmotionValue > 0.3) insights.emotionalIntensity = 'moderate';
    }

    // Calculate sentiment consistency
    if (result.sentenceLevel && result.sentenceLevel.length > 1) {
      const scores = result.sentenceLevel.map(s => s.score);
      const variance = this.calculateVariance(scores);
      insights.sentimentConsistency = Math.max(0, 100 - variance * 100);
    }

    // Generate key findings
    insights.keyFindings.push(`Overall sentiment is ${result.overallSentiment.label} (${result.overallSentiment.score.toFixed(2)})`);
    
    if (result.overallSentiment.magnitude > 0.7) {
      insights.keyFindings.push('High emotional intensity detected');
    }

    // Identify risk indicators
    if (result.overallSentiment.score < -0.5) {
      insights.riskIndicators.push('Strongly negative sentiment detected');
    }
    
    if (result.emotionalTone && result.emotionalTone.anger > 0.6) {
      insights.riskIndicators.push('High anger levels detected');
    }

    // Generate highlights
    if (result.aspectSentiments) {
      result.aspectSentiments.forEach(aspect => {
        if (aspect.sentiment.score > 0.6) {
          insights.positiveHighlights.push(`Positive sentiment towards ${aspect.aspect}`);
        } else if (aspect.sentiment.score < -0.6) {
          insights.negativeHighlights.push(`Negative sentiment towards ${aspect.aspect}`);
        } else {
          insights.neutralAreas.push(aspect.aspect);
        }
      });
    }

    return insights;
  }

  private generateMetadata(
    text: string, 
    result: EnhancedSentimentResult, 
    options: SentimentAnalysisOptions
  ): SentimentMetadata {
    const sentences = this.splitIntoSentences(text);
    const words = text.split(/\s+/);
    
    // Calculate sentiment distribution
    let positive = 0, negative = 0, neutral = 0;
    
    if (result.sentenceLevel) {
      result.sentenceLevel.forEach(sentiment => {
        if (sentiment.score > 0.1) positive++;
        else if (sentiment.score < -0.1) negative++;
        else neutral++;
      });
    } else {
      // Use overall sentiment
      if (result.overallSentiment.score > 0.1) positive = 1;
      else if (result.overallSentiment.score < -0.1) negative = 1;
      else neutral = 1;
    }

    const total = positive + negative + neutral;
    
    return {
      textLength: text.length,
      sentenceCount: sentences.length,
      wordCount: words.length,
      sentimentDistribution: {
        positive: total > 0 ? (positive / total) * 100 : 0,
        negative: total > 0 ? (negative / total) * 100 : 0,
        neutral: total > 0 ? (neutral / total) * 100 : 0
      },
      confidenceLevel: result.overallSentiment.confidence,
      languageDetected: options.language,
      processingModel: 'gemini-pro',
      analysisDepth: this.determineAnalysisDepth(result)
    };
  }

  private generateAggregatedInsights(results: BatchSentimentResult['results']): BatchSentimentResult['aggregatedInsights'] {
    if (results.length === 0) {
      return {
        averageSentiment: { score: 0, magnitude: 0, label: 'neutral', confidence: 0 },
        sentimentRange: { min: 0, max: 0 },
        commonEmotions: [],
        outliers: []
      };
    }

    const scores = results.map(r => r.sentiment.overallSentiment.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const avgMagnitude = results.reduce((sum, r) => sum + r.sentiment.overallSentiment.magnitude, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.sentiment.overallSentiment.confidence, 0) / results.length;

    // Determine average label
    const avgLabel = avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral';

    // Find outliers (scores more than 1.5 standard deviations from mean)
    const stdDev = this.calculateStandardDeviation(scores);
    const outliers = results.filter(r => 
      Math.abs(r.sentiment.overallSentiment.score - avgScore) > 1.5 * stdDev
    ).map(r => r.id);

    // Find common emotions
    const emotionCounts = new Map<string, number>();
    results.forEach(r => {
      if (r.sentiment.emotionalTone) {
        Object.entries(r.sentiment.emotionalTone).forEach(([emotion, value]) => {
          if (value > 0.5) {
            emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
          }
        });
      }
    });

    const commonEmotions = Array.from(emotionCounts.entries())
      .filter(([_, count]) => count >= results.length * 0.3)
      .map(([emotion, _]) => emotion);

    return {
      averageSentiment: {
        score: avgScore,
        magnitude: avgMagnitude,
        label: avgLabel,
        confidence: avgConfidence
      },
      sentimentRange: {
        min: Math.min(...scores),
        max: Math.max(...scores)
      },
      commonEmotions,
      outliers
    };
  }

  // Parsing methods
  private parseSentimentResponse(responseText: string): SentimentScore {
    try {
      const parsed = JSON.parse(responseText);
      return {
        score: parsed.score || 0,
        magnitude: parsed.magnitude || 0,
        label: parsed.label || 'neutral',
        confidence: parsed.confidence || 0
      };
    } catch (error: any) {
      console.error('Error parsing sentiment response:', error);
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      };
    }
  }

  private parseSentenceResultsResponse(responseText: string): SentimentScore[] {
    try {
      const parsed = JSON.parse(responseText);
      return parsed.map((item: any) => ({
        score: item.score || 0,
        magnitude: item.magnitude || 0,
        label: item.label || 'neutral',
        confidence: item.confidence || 0
      }));
    } catch (error: any) {
      console.error('Error parsing sentence results:', error);
      return [];
    }
  }

  private parseEmotionalToneResponse(responseText: string): EmotionalTone {
    try {
      const parsed = JSON.parse(responseText);
      return {
        joy: parsed.joy || 0,
        sadness: parsed.sadness || 0,
        anger: parsed.anger || 0,
        fear: parsed.fear || 0,
        surprise: parsed.surprise || 0,
        disgust: parsed.disgust || 0
      };
    } catch (error: any) {
      console.error('Error parsing emotional tone:', error);
      return {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0
      };
    }
  }

  private parseAspectSentimentResponse(responseText: string): AspectSentiment[] {
    try {
      const parsed = JSON.parse(responseText);
      return parsed.map((item: any) => ({
        aspect: item.aspect || '',
        sentiment: item.sentiment || { score: 0, magnitude: 0, label: 'neutral', confidence: 0 },
        mentions: item.mentions || [],
        significance: item.significance || 0
      }));
    } catch (error: any) {
      console.error('Error parsing aspect sentiment:', error);
      return [];
    }
  }

  private parseComparativeSentimentResponse(responseText: string): ComparativeSentiment[] {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing comparative sentiment:', error);
      return [];
    }
  }

  private parseTemporalSentimentResponse(responseText: string): TemporalSentiment[] {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing temporal sentiment:', error);
      return [];
    }
  }

  private parseTopicSentimentResponse(responseText: string): TopicSentiment[] {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing topic sentiment:', error);
      return [];
    }
  }

  private parseEmotionalPatternsResponse(responseText: string) {
    try {
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error parsing emotional patterns:', error);
      return {
        patterns: [],
        emotionalArcs: []
      };
    }
  }

  // Utility methods
  private extractDefaultAspects(text: string): string[] {
    const commonAspects = [
      'quality', 'price', 'service', 'support', 'delivery', 'product', 
      'experience', 'staff', 'location', 'value', 'features', 'performance',
      'reliability', 'ease', 'design', 'functionality'
    ];
    
    const textLower = text.toLowerCase();
    return commonAspects.filter(aspect => 
      textLower.includes(aspect) || textLower.includes(aspect + 's')
    );
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [text];
  }

  private calculateOverallTrend(timePoints: SentimentTrend['timePoints']): SentimentTrend['overallTrend'] {
    if (timePoints.length < 2) return 'stable';
    
    const firstHalf = timePoints.slice(0, Math.floor(timePoints.length / 2));
    const secondHalf = timePoints.slice(Math.floor(timePoints.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.sentiment.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.sentiment.score, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    const volatility = this.calculateVolatility(timePoints);
    
    if (volatility > 0.3) return 'volatile';
    if (change > 0.2) return 'improving';
    if (change < -0.2) return 'declining';
    return 'stable';
  }

  private calculateVolatility(timePoints: SentimentTrend['timePoints']): number {
    if (timePoints.length < 2) return 0;
    
    const scores = timePoints.map(p => p.sentiment.score);
    const variance = this.calculateVariance(scores);
    return Math.sqrt(variance);
  }

  private calculateMovingAverage(timePoints: SentimentTrend['timePoints'], windowSize: number): number {
    if (timePoints.length < windowSize) return 0;
    
    const recentPoints = timePoints.slice(-windowSize);
    return recentPoints.reduce((sum, p) => sum + p.sentiment.score, 0) / windowSize;
  }

  private identifySignificantChanges(timePoints: SentimentTrend['timePoints']): SentimentTrend['significantChanges'] {
    const changes: SentimentTrend['significantChanges'] = [];
    
    for (let i = 1; i < timePoints.length; i++) {
      const change = timePoints[i].sentiment.score - timePoints[i - 1].sentiment.score;
      if (Math.abs(change) > 0.4) {
        changes.push({
          position: timePoints[i].position,
          change,
          description: change > 0 ? 'Significant positive shift' : 'Significant negative shift'
        });
      }
    }
    
    return changes;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateStandardDeviation(numbers: number[]): number {
    return Math.sqrt(this.calculateVariance(numbers));
  }

  private determineAnalysisDepth(result: EnhancedSentimentResult): 'basic' | 'standard' | 'comprehensive' {
    let depth: 'basic' | 'standard' | 'comprehensive' = 'basic';
    
    if (result.sentenceLevel || result.emotionalTone) {
      depth = 'standard';
    }
    
    if (result.aspectSentiments || result.topicSentiments || result.temporalSentiments) {
      depth = 'comprehensive';
    }
    
    return depth;
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}