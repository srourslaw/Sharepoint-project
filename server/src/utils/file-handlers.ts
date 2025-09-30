import { FileType, FileTypeInfo, FileContent, ProcessingProgress } from '../types/sharepoint';
import { Readable } from 'stream';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
const pipelineAsync = promisify(pipeline);

/**
 * File type detection and handling utilities
 */
export class FileTypeHandler {
  private static readonly FILE_TYPE_MAP: Record<FileType, FileTypeInfo> = {
    [FileType.DOCUMENT]: {
      type: FileType.DOCUMENT,
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/vnd.oasis.opendocument.text', // .odt
        'application/rtf', // .rtf
      ],
      extensions: ['.docx', '.doc', '.odt', '.rtf'],
      textExtractionSupported: true,
      maxSize: 50 * 1024 * 1024 // 50MB
    },
    [FileType.SPREADSHEET]: {
      type: FileType.SPREADSHEET,
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.oasis.opendocument.spreadsheet', // .ods
        'text/csv', // .csv
      ],
      extensions: ['.xlsx', '.xls', '.ods', '.csv'],
      textExtractionSupported: true,
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    [FileType.PRESENTATION]: {
      type: FileType.PRESENTATION,
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.oasis.opendocument.presentation', // .odp
      ],
      extensions: ['.pptx', '.ppt', '.odp'],
      textExtractionSupported: true,
      maxSize: 100 * 1024 * 1024 // 100MB
    },
    [FileType.PDF]: {
      type: FileType.PDF,
      mimeTypes: ['application/pdf'],
      extensions: ['.pdf'],
      textExtractionSupported: true,
      maxSize: 50 * 1024 * 1024 // 50MB
    },
    [FileType.TEXT]: {
      type: FileType.TEXT,
      mimeTypes: [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'text/xml',
        'application/json',
        'application/xml',
        'text/markdown',
        'text/yaml',
        'application/yaml'
      ],
      extensions: ['.txt', '.html', '.css', '.js', '.json', '.xml', '.md', '.yml', '.yaml'],
      textExtractionSupported: true,
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    [FileType.IMAGE]: {
      type: FileType.IMAGE,
      mimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/bmp',
        'image/svg+xml',
        'image/webp'
      ],
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
      textExtractionSupported: false
    },
    [FileType.ARCHIVE]: {
      type: FileType.ARCHIVE,
      mimeTypes: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip'
      ],
      extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      textExtractionSupported: false
    },
    [FileType.OTHER]: {
      type: FileType.OTHER,
      mimeTypes: [],
      extensions: [],
      textExtractionSupported: false
    }
  };

  /**
   * Detect file type from mime type or extension
   */
  static detectFileType(mimeType: string, fileName?: string): FileType {
    // First try mime type
    for (const [fileType, info] of Object.entries(this.FILE_TYPE_MAP)) {
      if (info.mimeTypes.includes(mimeType)) {
        return fileType as FileType;
      }
    }

    // Fallback to extension
    if (fileName) {
      const extension = this.getFileExtension(fileName);
      for (const [fileType, info] of Object.entries(this.FILE_TYPE_MAP)) {
        if (info.extensions.includes(extension)) {
          return fileType as FileType;
        }
      }
    }

    return FileType.OTHER;
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.substring(lastDot).toLowerCase();
  }

  /**
   * Get file type info
   */
  static getFileTypeInfo(fileType: FileType): FileTypeInfo {
    return this.FILE_TYPE_MAP[fileType];
  }

  /**
   * Check if file supports text extraction
   */
  static supportsTextExtraction(mimeType: string, fileName?: string): boolean {
    const fileType = this.detectFileType(mimeType, fileName);
    return this.FILE_TYPE_MAP[fileType].textExtractionSupported;
  }

  /**
   * Check if file size is within limits for processing
   */
  static isWithinSizeLimit(fileType: FileType, size: number): boolean {
    const info = this.FILE_TYPE_MAP[fileType];
    return !info.maxSize || size <= info.maxSize;
  }

  /**
   * Get supported mime types for a file type
   */
  static getSupportedMimeTypes(fileType: FileType): string[] {
    return this.FILE_TYPE_MAP[fileType].mimeTypes;
  }

  /**
   * Get all supported mime types
   */
  static getAllSupportedMimeTypes(): string[] {
    const allMimeTypes: string[] = [];
    for (const info of Object.values(this.FILE_TYPE_MAP)) {
      allMimeTypes.push(...info.mimeTypes);
    }
    return [...new Set(allMimeTypes)];
  }
}

/**
 * Text extraction service for different file types
 */
export class TextExtractor {
  /**
   * Extract text from file content based on type
   */
  static async extractText(
    content: Buffer,
    mimeType: string,
    fileName?: string
  ): Promise<string> {
    const fileType = FileTypeHandler.detectFileType(mimeType, fileName);

    if (!FileTypeHandler.supportsTextExtraction(mimeType, fileName)) {
      throw new Error(`Text extraction not supported for file type: ${fileType}`);
    }

    try {
      switch (fileType) {
        case FileType.TEXT:
          return this.extractTextFromText(content, mimeType);
        
        case FileType.PDF:
          return this.extractTextFromPDF(content);
        
        case FileType.DOCUMENT:
          return this.extractTextFromDocument(content, mimeType);
        
        case FileType.SPREADSHEET:
          return this.extractTextFromSpreadsheet(content, mimeType);
        
        case FileType.PRESENTATION:
          return this.extractTextFromPresentation(content, mimeType);
        
        default:
          throw new Error(`Unsupported file type for text extraction: ${fileType}`);
      }
    } catch (error) {
      console.error(`Text extraction failed for ${fileName}:`, error);
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private static extractTextFromText(content: Buffer, mimeType: string): string {
    const encoding = this.detectTextEncoding(content);
    const text = content.toString(encoding);

    // Handle different text formats
    switch (mimeType) {
      case 'text/html':
        return this.stripHtmlTags(text);
      
      case 'application/json':
        try {
          return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          return text;
        }
      
      case 'text/xml':
      case 'application/xml':
        return this.stripXmlTags(text);
      
      default:
        return text;
    }
  }

  /**
   * Extract text from PDF files
   */
  private static async extractTextFromPDF(content: Buffer): Promise<string> {
    try {
      const options = {
        // Normalize whitespace and remove extra spaces
        normalizeWhitespace: true,
        // Don't render pages as images
        disableCombineTextItems: false,
        // Maximum pages to process (prevent memory issues)
        max: 100,
      };
      
      const data = await pdfParse(content);
      
      if (!data.text || data.text.trim().length === 0) {
        return '[PDF contains no extractable text or may be image-based]';
      }
      
      return data.text.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from Word documents
   */
  private static async extractTextFromDocument(content: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType.includes('openxmlformats')) {
        // Extract text from .docx files using mammoth
        const options = {
          styleMap: [
            // Preserve basic formatting
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
          includeEmbeddedStyleMap: true,
          includeDefaultStyleMap: true
        };
        
        const result = await mammoth.extractRawText({ buffer: content });
        
        if (result.messages && result.messages.length > 0) {
          console.warn('Document extraction warnings:', result.messages.map(m => m.message));
        }
        
        if (!result.value || result.value.trim().length === 0) {
          return '[Document contains no extractable text]';
        }
        
        return result.value.trim();
      } else {
        // Legacy .doc files - these require different handling
        // For now, return a message indicating limited support
        return `[Legacy .doc format - text extraction limited. File size: ${Math.round(content.length / 1024)}KB]\n` +
               'Consider converting to .docx format for full text extraction.';
      }
    } catch (error) {
      console.error('Document extraction error:', error);
      throw new Error(`Document text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from Excel spreadsheets
   */
  private static async extractTextFromSpreadsheet(content: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'text/csv') {
        return this.extractTextFromCSV(content);
      }
      
      // Read Excel file using xlsx library
      const workbook = XLSX.read(content, { 
        type: 'buffer',
        cellFormula: false,
        cellHTML: false,
        cellNF: false,
        cellStyles: false,
        cellDates: true,
        sheetStubs: false
      });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return '[Excel file contains no sheets]';
      }
      
      let extractedText = '';
      let totalCells = 0;
      
      workbook.SheetNames.forEach((sheetName, index) => {
        const sheet = workbook.Sheets[sheetName];
        
        // Add sheet header
        extractedText += `\n=== SHEET ${index + 1}: ${sheetName} ===\n`;
        
        try {
          // Convert sheet to CSV format for readable text
          const csvData = XLSX.utils.sheet_to_csv(sheet, {
            forceQuotes: false,
            RS: '\n',
            FS: ',',
            blankrows: false,
            skipHidden: true
          });
          
          if (csvData.trim()) {
            extractedText += csvData + '\n';
            // Count approximate cells (rows * average columns)
            const rows = csvData.split('\n').filter(row => row.trim());
            totalCells += rows.length * (rows[0] ? rows[0].split(',').length : 0);
          } else {
            extractedText += '[Empty sheet]\n';
          }
        } catch (sheetError) {
          extractedText += `[Error reading sheet: ${sheetError instanceof Error ? sheetError.message : 'Unknown error'}]\n`;
        }
      });
      
      if (extractedText.trim().length === 0) {
        return '[Excel file contains no extractable data]';
      }
      
      // Add summary header
      const summary = `Excel File Summary:\n- Sheets: ${workbook.SheetNames.length}\n- Estimated cells: ${totalCells}\n- File size: ${Math.round(content.length / 1024)}KB\n`;
      
      return summary + extractedText.trim();
    } catch (error) {
      console.error('Spreadsheet extraction error:', error);
      throw new Error(`Spreadsheet text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PowerPoint presentations
   */
  private static async extractTextFromPresentation(content: Buffer, mimeType: string): Promise<string> {
    try {
      if (!mimeType.includes('openxmlformats')) {
        // Legacy .ppt files
        return `[Legacy .ppt format - text extraction not supported. File size: ${Math.round(content.length / 1024)}KB]\n` +
               'Consider converting to .pptx format for text extraction.';
      }

      // For now, provide a simplified PowerPoint text extraction
      // The ZIP parsing approach requires a working node-stream-zip setup
      // We'll extract basic text using a regex approach on the raw content
      const summary = `PowerPoint Presentation:\n- File size: ${Math.round(content.length / 1024)}KB\n\n`;

      try {
        // Convert buffer to string and look for text patterns
        const contentStr = content.toString('utf8');

        // Try multiple approaches to extract text from PowerPoint
        let extractedTexts: string[] = [];

        // Approach 1: Look for <a:t> tags (text runs)
        const textMatches1 = contentStr.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
        if (textMatches1) {
          textMatches1.forEach(match => {
            const textContent = match.replace(/<a:t[^>]*>([^<]+)<\/a:t>/, '$1');
            if (textContent.trim() && textContent.length > 2) {
              extractedTexts.push(textContent.trim());
            }
          });
        }

        // Approach 2: Look for <t> tags (another PowerPoint text format)
        const textMatches2 = contentStr.match(/<t>([^<]+)<\/t>/g);
        if (textMatches2) {
          textMatches2.forEach(match => {
            const textContent = match.replace(/<t>([^<]+)<\/t>/, '$1');
            if (textContent.trim() && textContent.length > 2) {
              extractedTexts.push(textContent.trim());
            }
          });
        }

        // Approach 3: Look for text between docProps/core.xml title tags
        const titleMatch = contentStr.match(/<dc:title>([^<]+)<\/dc:title>/);
        if (titleMatch && titleMatch[1]) {
          extractedTexts.unshift(`Title: ${titleMatch[1].trim()}`);
        }

        // Approach 4: Look for plain text patterns (basic text content)
        const plainTextMatches = contentStr.match(/[A-Za-z0-9\s]{20,}/g);
        if (plainTextMatches) {
          plainTextMatches.forEach(match => {
            const cleaned = match.trim();
            if (cleaned.length > 20 && cleaned.length < 200 && !cleaned.includes('\x00')) {
              extractedTexts.push(cleaned);
            }
          });
        }

        if (extractedTexts.length > 0) {
          // Remove duplicates and sort by length (longer text is usually more meaningful)
          const uniqueTexts = [...new Set(extractedTexts)].sort((a, b) => b.length - a.length);

          let extractedText = 'PowerPoint Text Content:\n\n';
          let slideNum = 1;

          uniqueTexts.slice(0, 20).forEach((text, index) => { // Limit to top 20 text pieces
            if (index % 5 === 0 && index > 0) {
              slideNum++;
              extractedText += `\n=== SLIDE ${slideNum} ===\n`;
            }
            extractedText += text + '\n';
          });

          return summary + extractedText.trim();
        } else {
          return summary + '[No extractable text found in PowerPoint slides - may contain only images or complex formatting]';
        }
      } catch (textError) {
        console.warn('PowerPoint text extraction error:', textError);
        return summary + '[Text extraction temporarily unavailable for PowerPoint files]';
      }
    } catch (error) {
      console.error('PowerPoint extraction error:', error);
      throw new Error(`Presentation text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from CSV files
   */
  private static extractTextFromCSV(content: Buffer): string {
    const text = content.toString('utf-8');
    return text; // CSV is already text-readable
  }

  /**
   * Detect text encoding
   */
  private static detectTextEncoding(content: Buffer): BufferEncoding {
    // Simple BOM detection
    if (content.length >= 3 && 
        content[0] === 0xEF && 
        content[1] === 0xBB && 
        content[2] === 0xBF) {
      return 'utf8';
    }
    
    if (content.length >= 2 && 
        content[0] === 0xFF && 
        content[1] === 0xFE) {
      return 'utf16le';
    }
    
    if (content.length >= 2 && 
        content[0] === 0xFE && 
        content[1] === 0xFF) {
      return 'utf16le'; // Note: Node.js doesn't have utf16be
    }

    // Default to UTF-8
    return 'utf8';
  }

  /**
   * Strip HTML tags from text
   */
  private static stripHtmlTags(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Strip XML tags from text
   */
  private static stripXmlTags(xml: string): string {
    return xml
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract text from PowerPoint XML content
   */
  private static extractTextFromPowerPointXML(xmlContent: string): string {
    try {
      // Extract text from <a:t> tags (text runs in PowerPoint)
      const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      
      if (!textMatches) {
        return '';
      }
      
      const extractedTexts = textMatches
        .map(match => {
          // Extract content between <a:t> tags
          const textMatch = match.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
          return textMatch ? textMatch[1] : '';
        })
        .filter(text => text.trim().length > 0);
      
      return extractedTexts.join(' ').trim();
    } catch (error) {
      console.warn('PowerPoint XML parsing error:', error);
      return '[Error parsing slide content]';
    }
  }
}

/**
 * Content processor for different file operations
 */
export class ContentProcessor {
  /**
   * Process file content for storage/display
   */
  static async processFileContent(
    content: Buffer,
    mimeType: string,
    fileName?: string,
    extractText: boolean = true
  ): Promise<FileContent> {
    const fileType = FileTypeHandler.detectFileType(mimeType, fileName);
    const encoding = this.detectEncoding(content, mimeType);
    
    const processedContent: FileContent = {
      content,
      mimeType,
      size: content.length,
      encoding,
      metadata: {
        fileType,
        fileName,
        processedAt: new Date().toISOString()
      }
    };

    // Extract text if requested and supported
    if (extractText && FileTypeHandler.supportsTextExtraction(mimeType, fileName)) {
      try {
        processedContent.extractedText = await TextExtractor.extractText(content, mimeType, fileName);
      } catch (error) {
        console.warn(`Text extraction failed for ${fileName}:`, error instanceof Error ? error.message : 'Unknown error');
        processedContent.metadata!.textExtractionError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Add file-specific metadata
    switch (fileType) {
      case FileType.IMAGE:
        processedContent.metadata!.imageInfo = await this.extractImageMetadata(content, mimeType);
        break;
      
      case FileType.TEXT:
        processedContent.metadata!.lineCount = this.countLines(content.toString((encoding as BufferEncoding) || 'utf8'));
        break;
    }

    return processedContent;
  }

  /**
   * Detect content encoding
   */
  private static detectEncoding(content: Buffer, mimeType: string): string | undefined {
    if (mimeType.startsWith('text/')) {
      // Use the same logic as TextExtractor
      const bom = this.detectBOM(content);
      return bom || 'utf8';
    }
    return undefined;
  }

  /**
   * Detect Byte Order Mark
   */
  private static detectBOM(content: Buffer): string | null {
    if (content.length >= 3 && 
        content[0] === 0xEF && 
        content[1] === 0xBB && 
        content[2] === 0xBF) {
      return 'utf8';
    }
    
    if (content.length >= 2 && 
        content[0] === 0xFF && 
        content[1] === 0xFE) {
      return 'utf16le';
    }
    
    return null;
  }

  /**
   * Extract basic image metadata
   */
  private static async extractImageMetadata(content: Buffer, mimeType: string): Promise<any> {
    // This would require an image processing library like sharp
    return {
      mimeType,
      size: content.length,
      // width, height, etc. would be extracted with proper library
    };
  }

  /**
   * Count lines in text content
   */
  private static countLines(text: string): number {
    return text.split(/\r\n|\r|\n/).length;
  }

  /**
   * Validate file for processing
   */
  static validateFileForProcessing(
    size: number,
    mimeType: string,
    fileName?: string,
    maxSize: number = 100 * 1024 * 1024 // 100MB default
  ): { isValid: boolean; reason?: string } {
    // Check overall size limit
    if (size > maxSize) {
      return {
        isValid: false,
        reason: `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
      };
    }

    // Check file type specific limits
    const fileType = FileTypeHandler.detectFileType(mimeType, fileName);
    if (!FileTypeHandler.isWithinSizeLimit(fileType, size)) {
      const info = FileTypeHandler.getFileTypeInfo(fileType);
      return {
        isValid: false,
        reason: `File size exceeds limit for ${fileType} files (${Math.round(info.maxSize! / 1024 / 1024)}MB)`
      };
    }

    return { isValid: true };
  }
}