import { EventEmitter } from 'events';
import { FileType, ProcessingProgress, FileContent } from '../types/sharepoint';
import { FileTypeHandler, TextExtractor, ContentProcessor } from './file-handlers';

/**
 * Advanced file processor with progress tracking and enhanced capabilities
 */
export class AdvancedFileProcessor extends EventEmitter {
  private maxFileSize: number;
  private supportedTypes: FileType[];
  private processing = new Map<string, boolean>();

  constructor(options: {
    maxFileSize?: number;
    supportedTypes?: FileType[];
  } = {}) {
    super();
    this.maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB
    this.supportedTypes = options.supportedTypes || Object.values(FileType);
  }

  /**
   * Process file with progress tracking
   */
  async processFileWithProgress(
    content: Buffer,
    mimeType: string,
    fileName?: string,
    extractText: boolean = true,
    processingId: string = `process-${Date.now()}`
  ): Promise<FileContent> {
    if (this.processing.has(processingId)) {
      throw new Error(`Processing with ID ${processingId} is already in progress`);
    }

    this.processing.set(processingId, true);

    try {
      // Emit initial progress
      this.emitProgress(processingId, {
        stage: 'reading',
        percentage: 0,
        message: 'Starting file processing...',
        totalBytes: content.length
      });

      // Step 1: Validate file
      this.emitProgress(processingId, {
        stage: 'reading',
        percentage: 10,
        message: 'Validating file...',
        bytesProcessed: 0,
        totalBytes: content.length
      });

      const validation = this.validateFile(content.length, mimeType, fileName);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.reason}`);
      }

      // Step 2: Detect file type
      this.emitProgress(processingId, {
        stage: 'parsing',
        percentage: 20,
        message: 'Detecting file type...',
        bytesProcessed: content.length * 0.1,
        totalBytes: content.length
      });

      const fileType = FileTypeHandler.detectFileType(mimeType, fileName);
      
      // Step 3: Process file content
      this.emitProgress(processingId, {
        stage: 'extracting',
        percentage: 40,
        message: `Processing ${fileType} file...`,
        bytesProcessed: content.length * 0.3,
        totalBytes: content.length
      });

      const processedContent = await this.processFileByType(
        content,
        mimeType,
        fileName,
        fileType,
        extractText,
        processingId
      );

      // Step 4: Finalize
      this.emitProgress(processingId, {
        stage: 'complete',
        percentage: 100,
        message: 'File processing completed',
        bytesProcessed: content.length,
        totalBytes: content.length
      });

      return processedContent;

    } catch (error) {
      this.emit('error', processingId, error);
      throw error;
    } finally {
      this.processing.delete(processingId);
    }
  }

  /**
   * Process multiple files with batch progress tracking
   */
  async processBatchWithProgress(
    files: Array<{
      content: Buffer;
      mimeType: string;
      fileName?: string;
      extractText?: boolean;
    }>,
    batchId: string = `batch-${Date.now()}`
  ): Promise<FileContent[]> {
    const results: FileContent[] = [];
    const totalFiles = files.length;

    this.emitProgress(batchId, {
      stage: 'reading',
      percentage: 0,
      message: `Starting batch processing of ${totalFiles} files...`,
      itemsProcessed: 0,
      totalItems: totalFiles
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${batchId}-file-${i}`;

      try {
        this.emitProgress(batchId, {
          stage: 'extracting',
          percentage: Math.round((i / totalFiles) * 100),
          message: `Processing file ${i + 1} of ${totalFiles}...`,
          currentItem: file.fileName || `File ${i + 1}`,
          itemsProcessed: i,
          totalItems: totalFiles
        });

        const result = await this.processFileWithProgress(
          file.content,
          file.mimeType,
          file.fileName,
          file.extractText,
          fileId
        );

        results.push(result);

      } catch (error) {
        console.error(`Error processing file ${i + 1}:`, error);
        // Add error result but continue processing
        results.push({
          content: Buffer.alloc(0),
          mimeType: file.mimeType,
          size: file.content.length,
          metadata: {
            fileName: file.fileName,
            fileType: FileTypeHandler.detectFileType(file.mimeType, file.fileName),
            processedAt: new Date().toISOString(),
            processingError: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    this.emitProgress(batchId, {
      stage: 'complete',
      percentage: 100,
      message: `Batch processing completed. ${results.length} files processed.`,
      itemsProcessed: totalFiles,
      totalItems: totalFiles
    });

    return results;
  }

  /**
   * Process file by detected type with enhanced capabilities
   */
  private async processFileByType(
    content: Buffer,
    mimeType: string,
    fileName: string | undefined,
    fileType: FileType,
    extractText: boolean,
    processingId: string
  ): Promise<FileContent> {
    const startTime = Date.now();
    
    // Create base file content object
    const fileContent: FileContent = {
      content,
      mimeType,
      size: content.length,
      encoding: this.detectEncoding(content, mimeType),
      metadata: {
        fileType,
        fileName,
        processedAt: new Date().toISOString(),
        processingTimeMs: 0
      }
    };

    // Extract text if requested and supported
    if (extractText && FileTypeHandler.supportsTextExtraction(mimeType, fileName)) {
      try {
        this.emitProgress(processingId, {
          stage: 'extracting',
          percentage: 60,
          message: `Extracting text from ${fileType}...`,
          bytesProcessed: content.length * 0.6,
          totalBytes: content.length
        });

        const extractedText = await this.extractTextWithProgress(
          content,
          mimeType,
          fileName,
          fileType,
          processingId
        );

        fileContent.extractedText = extractedText;
        fileContent.metadata!.textExtractionSuccess = true;
        fileContent.metadata!.extractedTextLength = extractedText.length;

      } catch (error) {
        console.warn(`Text extraction failed for ${fileName}:`, error);
        fileContent.metadata!.textExtractionError = error instanceof Error ? error.message : 'Unknown error';
        fileContent.metadata!.textExtractionSuccess = false;
      }
    }

    // Add file-specific metadata
    await this.addFileSpecificMetadata(fileContent, content, mimeType, fileType, processingId);

    // Calculate processing time
    fileContent.metadata!.processingTimeMs = Date.now() - startTime;

    return fileContent;
  }

  /**
   * Extract text with progress updates
   */
  private async extractTextWithProgress(
    content: Buffer,
    mimeType: string,
    fileName: string | undefined,
    fileType: FileType,
    processingId: string
  ): Promise<string> {
    this.emitProgress(processingId, {
      stage: 'extracting',
      percentage: 70,
      message: `Extracting text content...`,
      bytesProcessed: content.length * 0.7,
      totalBytes: content.length
    });

    const text = await TextExtractor.extractText(content, mimeType, fileName);

    this.emitProgress(processingId, {
      stage: 'formatting',
      percentage: 90,
      message: `Formatting extracted text...`,
      bytesProcessed: content.length * 0.9,
      totalBytes: content.length
    });

    // Post-process text based on file type
    return this.postProcessExtractedText(text, fileType);
  }

  /**
   * Add file-specific metadata
   */
  private async addFileSpecificMetadata(
    fileContent: FileContent,
    content: Buffer,
    mimeType: string,
    fileType: FileType,
    processingId: string
  ): Promise<void> {
    switch (fileType) {
      case FileType.DOCUMENT:
        fileContent.metadata!.documentInfo = {
          estimatedPages: Math.ceil(content.length / 2000), // Rough estimate
          hasImages: mimeType.includes('openxmlformats'),
          wordCount: fileContent.extractedText ? fileContent.extractedText.split(/\s+/).length : 0
        };
        break;

      case FileType.SPREADSHEET:
        if (fileContent.extractedText) {
          const lines = fileContent.extractedText.split('\n');
          const sheetMatches = fileContent.extractedText.match(/=== SHEET \d+:/g);
          fileContent.metadata!.spreadsheetInfo = {
            estimatedSheets: sheetMatches ? sheetMatches.length : 1,
            estimatedRows: lines.length,
            hasFormulas: fileContent.extractedText.includes('=')
          };
        }
        break;

      case FileType.PRESENTATION:
        if (fileContent.extractedText) {
          const slideMatches = fileContent.extractedText.match(/=== SLIDE \d+ ===/g);
          fileContent.metadata!.presentationInfo = {
            slideCount: slideMatches ? slideMatches.length : 0,
            hasImages: true, // Assume PowerPoint has images
            estimatedDuration: slideMatches ? slideMatches.length * 2 : 0 // 2 minutes per slide
          };
        }
        break;

      case FileType.PDF:
        if (fileContent.extractedText) {
          const pageBreaks = (fileContent.extractedText.match(/\f/g) || []).length;
          fileContent.metadata!.pdfInfo = {
            estimatedPages: Math.max(1, pageBreaks + 1),
            hasText: fileContent.extractedText.length > 0,
            fileSize: content.length
          };
        }
        break;

      case FileType.TEXT:
        if (fileContent.extractedText) {
          fileContent.metadata!.textInfo = {
            lineCount: fileContent.extractedText.split('\n').length,
            wordCount: fileContent.extractedText.split(/\s+/).length,
            characterCount: fileContent.extractedText.length,
            encoding: fileContent.encoding
          };
        }
        break;
    }
  }

  /**
   * Post-process extracted text
   */
  private postProcessExtractedText(text: string, fileType: FileType): string {
    let processed = text;

    // Clean up common issues
    processed = processed
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\r/g, '\n')            // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n')      // Limit consecutive newlines
      .replace(/\t+/g, '\t')           // Clean up tabs
      .trim();

    // File-type specific post-processing
    switch (fileType) {
      case FileType.PDF:
        // Fix common PDF extraction issues
        processed = processed
          .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add spaces between concatenated words
          .replace(/(\d+)\s*\n\s*(\d+)/g, '$1 $2'); // Fix split numbers
        break;

      case FileType.SPREADSHEET:
        // Add some formatting to make CSV data more readable
        if (processed.includes(',')) {
          processed = processed.replace(/,/g, ' | '); // Make CSV more readable
        }
        break;

      case FileType.PRESENTATION:
        // Clean up slide separators
        processed = processed.replace(/=== SLIDE \d+ ===/g, '\n--- SLIDE ---\n');
        break;
    }

    return processed;
  }

  /**
   * Validate file for processing
   */
  private validateFile(size: number, mimeType: string, fileName?: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Check file size
    if (size > this.maxFileSize) {
      return {
        isValid: false,
        reason: `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`
      };
    }

    // Check if file type is supported
    const fileType = FileTypeHandler.detectFileType(mimeType, fileName);
    if (!this.supportedTypes.includes(fileType)) {
      return {
        isValid: false,
        reason: `File type '${fileType}' is not supported`
      };
    }

    // Check file type specific limits
    if (!FileTypeHandler.isWithinSizeLimit(fileType, size)) {
      const info = FileTypeHandler.getFileTypeInfo(fileType);
      return {
        isValid: false,
        reason: `File size exceeds limit for ${fileType} files (${Math.round(info.maxSize! / 1024 / 1024)}MB)`
      };
    }

    // Check for suspicious file patterns
    if (fileName) {
      // Check for double extensions or suspicious patterns
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|scr|pif|com)$/i,     // Executables
        /\.(js|vbs|ps1)$/i,                   // Scripts
        /\..*\..*/,                           // Double extensions
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
        return {
          isValid: false,
          reason: 'File name contains suspicious patterns'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Detect file encoding
   */
  private detectEncoding(content: Buffer, mimeType: string): string | undefined {
    if (!mimeType.startsWith('text/')) {
      return undefined;
    }

    // Check for BOM
    if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
      return 'utf8';
    }
    if (content.length >= 2 && content[0] === 0xFF && content[1] === 0xFE) {
      return 'utf16le';
    }
    if (content.length >= 2 && content[0] === 0xFE && content[1] === 0xFF) {
      return 'utf16le';
    }

    // Default to UTF-8
    return 'utf8';
  }

  /**
   * Emit progress event
   */
  private emitProgress(processingId: string, progress: ProcessingProgress): void {
    this.emit('progress', processingId, progress);
  }

  /**
   * Check if processing is in progress
   */
  isProcessing(processingId: string): boolean {
    return this.processing.has(processingId);
  }

  /**
   * Get currently processing IDs
   */
  getProcessingIds(): string[] {
    return Array.from(this.processing.keys());
  }

  /**
   * Cancel processing (if possible)
   */
  cancelProcessing(processingId: string): boolean {
    if (this.processing.has(processingId)) {
      this.processing.delete(processingId);
      this.emit('cancelled', processingId);
      return true;
    }
    return false;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    activeProcesses: number;
    maxFileSize: number;
    supportedTypes: FileType[];
  } {
    return {
      activeProcesses: this.processing.size,
      maxFileSize: this.maxFileSize,
      supportedTypes: [...this.supportedTypes]
    };
  }
}

/**
 * File processing utility functions
 */
export class FileProcessingUtils {
  /**
   * Estimate processing time based on file size and type
   */
  static estimateProcessingTime(size: number, fileType: FileType): number {
    // Base processing time in milliseconds per MB
    const baseTimePerMB: Record<FileType, number> = {
      [FileType.TEXT]: 100,
      [FileType.PDF]: 2000,
      [FileType.DOCUMENT]: 1500,
      [FileType.SPREADSHEET]: 1000,
      [FileType.PRESENTATION]: 3000,
      [FileType.IMAGE]: 500,
      [FileType.ARCHIVE]: 500,
      [FileType.OTHER]: 1000
    };

    const sizeMB = size / (1024 * 1024);
    return Math.round(sizeMB * baseTimePerMB[fileType]);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Get file type icon/emoji
   */
  static getFileTypeIcon(fileType: FileType): string {
    const icons: Record<FileType, string> = {
      [FileType.DOCUMENT]: '📄',
      [FileType.SPREADSHEET]: '📊',
      [FileType.PRESENTATION]: '📽️',
      [FileType.PDF]: '📕',
      [FileType.TEXT]: '📝',
      [FileType.IMAGE]: '🖼️',
      [FileType.ARCHIVE]: '📦',
      [FileType.OTHER]: '📁'
    };

    return icons[fileType] || '📄';
  }

  /**
   * Validate file name
   */
  static validateFileName(fileName: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Check length
    if (fileName.length > 255) {
      return { isValid: false, reason: 'File name too long (max 255 characters)' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      return { isValid: false, reason: 'File name contains invalid characters' };
    }

    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(fileName)) {
      return { isValid: false, reason: 'File name is reserved' };
    }

    return { isValid: true };
  }
}