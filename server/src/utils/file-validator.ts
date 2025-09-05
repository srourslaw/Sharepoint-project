import { FileType } from '../types/sharepoint';
import { FileTypeHandler } from './file-handlers';

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  category: 'security' | 'format' | 'size' | 'content' | 'name';
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationMetadata {
  fileType: FileType;
  detectedMimeType: string;
  size: number;
  sizeFormatted: string;
  isWithinLimits: boolean;
  supportsTextExtraction: boolean;
  estimatedProcessingTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Comprehensive file validation utility
 */
export class FileValidator {
  private static readonly SUSPICIOUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.msi', '.dll',
    '.vbs', '.js', '.jar', '.app', '.deb', '.rpm', '.dmg',
    '.ps1', '.psm1', '.ps1xml', '.psc1', '.psd1'
  ];

  private static readonly DANGEROUS_MIME_TYPES = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-winexe',
    'application/x-javascript',
    'text/javascript',
    'application/javascript'
  ];

  private static readonly MAX_FILE_SIZES: Record<FileType, number> = {
    [FileType.TEXT]: 10 * 1024 * 1024,      // 10MB
    [FileType.PDF]: 50 * 1024 * 1024,       // 50MB
    [FileType.DOCUMENT]: 50 * 1024 * 1024,  // 50MB
    [FileType.SPREADSHEET]: 100 * 1024 * 1024, // 100MB
    [FileType.PRESENTATION]: 100 * 1024 * 1024, // 100MB
    [FileType.IMAGE]: 25 * 1024 * 1024,     // 25MB
    [FileType.ARCHIVE]: 200 * 1024 * 1024,  // 200MB
    [FileType.OTHER]: 50 * 1024 * 1024      // 50MB
  };

  /**
   * Comprehensive file validation
   */
  static validateFile(
    content: Buffer,
    mimeType: string,
    fileName?: string,
    options: {
      maxFileSize?: number;
      allowExecutables?: boolean;
      strictMimeTypeCheck?: boolean;
      enableContentScanning?: boolean;
    } = {}
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Detect file type
    const fileType = FileTypeHandler.detectFileType(mimeType, fileName);
    const maxSize = options.maxFileSize || this.MAX_FILE_SIZES[fileType];
    
    // Basic metadata
    const metadata: ValidationMetadata = {
      fileType,
      detectedMimeType: mimeType,
      size: content.length,
      sizeFormatted: this.formatBytes(content.length),
      isWithinLimits: content.length <= maxSize,
      supportsTextExtraction: FileTypeHandler.supportsTextExtraction(mimeType, fileName),
      estimatedProcessingTime: this.estimateProcessingTime(content.length, fileType),
      riskLevel: 'low'
    };

    // 1. File Name Validation
    if (fileName) {
      this.validateFileName(fileName, issues, warnings);
    }

    // 2. File Size Validation
    this.validateFileSize(content.length, maxSize, fileType, issues, warnings);

    // 3. MIME Type Validation
    this.validateMimeType(mimeType, fileType, options.strictMimeTypeCheck, issues, warnings);

    // 4. Security Validation
    this.validateSecurity(content, mimeType, fileName, options.allowExecutables, issues, warnings);

    // 5. Content Structure Validation
    if (options.enableContentScanning) {
      this.validateContentStructure(content, fileType, mimeType, issues, warnings);
    }

    // 6. File Type Consistency
    this.validateFileTypeConsistency(content, mimeType, fileName, issues, warnings);

    // Calculate risk level
    metadata.riskLevel = this.calculateRiskLevel(issues, warnings);

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      warnings,
      metadata
    };
  }

  /**
   * Validate file name
   */
  private static validateFileName(
    fileName: string,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    // Length check
    if (fileName.length > 255) {
      issues.push({
        code: 'FILENAME_TOO_LONG',
        message: 'File name exceeds 255 characters',
        severity: 'error',
        category: 'name'
      });
    }

    // Invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      issues.push({
        code: 'FILENAME_INVALID_CHARS',
        message: 'File name contains invalid characters',
        severity: 'error',
        category: 'name'
      });
    }

    // Reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(fileName)) {
      issues.push({
        code: 'FILENAME_RESERVED',
        message: 'File name uses reserved system name',
        severity: 'error',
        category: 'name'
      });
    }

    // Suspicious extensions
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (this.SUSPICIOUS_EXTENSIONS.includes(extension)) {
      issues.push({
        code: 'SUSPICIOUS_EXTENSION',
        message: `Potentially dangerous file extension: ${extension}`,
        severity: 'error',
        category: 'security'
      });
    }

    // Double extensions
    const extensionMatches = fileName.match(/\.[a-z0-9]{2,4}\.[a-z0-9]{2,4}$/i);
    if (extensionMatches) {
      warnings.push({
        code: 'DOUBLE_EXTENSION',
        message: 'File has double extension which may be suspicious',
        suggestion: 'Verify the file is from a trusted source'
      });
    }

    // Hidden file (starts with dot)
    if (fileName.startsWith('.')) {
      warnings.push({
        code: 'HIDDEN_FILE',
        message: 'File is hidden (starts with dot)',
        suggestion: 'Ensure this is intentional'
      });
    }
  }

  /**
   * Validate file size
   */
  private static validateFileSize(
    size: number,
    maxSize: number,
    fileType: FileType,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    if (size === 0) {
      issues.push({
        code: 'EMPTY_FILE',
        message: 'File is empty',
        severity: 'error',
        category: 'size'
      });
      return;
    }

    if (size > maxSize) {
      issues.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${this.formatBytes(size)}) exceeds limit (${this.formatBytes(maxSize)})`,
        severity: 'error',
        category: 'size'
      });
    }

    // Warning for unusually large files of certain types
    const warningSize = maxSize * 0.8;
    if (size > warningSize) {
      warnings.push({
        code: 'LARGE_FILE',
        message: `File is quite large (${this.formatBytes(size)})`,
        suggestion: 'Consider optimizing or compressing the file'
      });
    }

    // Warning for unusually small files that should contain more data
    const expectedMinSizes: Partial<Record<FileType, number>> = {
      [FileType.DOCUMENT]: 1024,     // 1KB
      [FileType.SPREADSHEET]: 1024,  // 1KB
      [FileType.PRESENTATION]: 2048, // 2KB
      [FileType.PDF]: 1024          // 1KB
    };

    const minExpected = expectedMinSizes[fileType];
    if (minExpected && size < minExpected) {
      warnings.push({
        code: 'SUSPICIOUSLY_SMALL',
        message: `File is smaller than expected for ${fileType} type`,
        suggestion: 'Verify file integrity'
      });
    }
  }

  /**
   * Validate MIME type
   */
  private static validateMimeType(
    mimeType: string,
    fileType: FileType,
    strictCheck: boolean = false,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    // Check for dangerous MIME types
    if (this.DANGEROUS_MIME_TYPES.includes(mimeType)) {
      issues.push({
        code: 'DANGEROUS_MIME_TYPE',
        message: `Potentially dangerous MIME type: ${mimeType}`,
        severity: 'error',
        category: 'security'
      });
    }

    // Check MIME type consistency with detected file type
    const supportedMimeTypes = FileTypeHandler.getSupportedMimeTypes(fileType);
    if (strictCheck && !supportedMimeTypes.includes(mimeType)) {
      issues.push({
        code: 'MIME_TYPE_MISMATCH',
        message: `MIME type ${mimeType} doesn't match detected file type ${fileType}`,
        severity: 'error',
        category: 'format'
      });
    }

    // Generic MIME type warning
    if (mimeType === 'application/octet-stream') {
      warnings.push({
        code: 'GENERIC_MIME_TYPE',
        message: 'Generic MIME type detected',
        suggestion: 'File type detection may be unreliable'
      });
    }
  }

  /**
   * Validate security aspects
   */
  private static validateSecurity(
    content: Buffer,
    mimeType: string,
    fileName: string | undefined,
    allowExecutables: boolean = false,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    // Check for executable headers
    if (!allowExecutables) {
      if (this.hasExecutableHeader(content)) {
        issues.push({
          code: 'EXECUTABLE_CONTENT',
          message: 'File contains executable code',
          severity: 'error',
          category: 'security'
        });
      }
    }

    // Check for script content in text files
    if (mimeType.startsWith('text/')) {
      const textContent = content.toString('utf8', 0, Math.min(1024, content.length));
      if (this.containsScriptContent(textContent)) {
        warnings.push({
          code: 'SCRIPT_CONTENT',
          message: 'File may contain script code',
          suggestion: 'Review content before processing'
        });
      }
    }

    // Check for embedded objects
    if (this.containsEmbeddedObjects(content)) {
      warnings.push({
        code: 'EMBEDDED_OBJECTS',
        message: 'File may contain embedded objects',
        suggestion: 'Scan for macros or active content'
      });
    }

    // Check for password protection indicators
    if (this.isPasswordProtected(content, mimeType)) {
      warnings.push({
        code: 'PASSWORD_PROTECTED',
        message: 'File appears to be password protected',
        suggestion: 'Content extraction may fail'
      });
    }
  }

  /**
   * Validate content structure
   */
  private static validateContentStructure(
    content: Buffer,
    fileType: FileType,
    mimeType: string,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    switch (fileType) {
      case FileType.PDF:
        if (!content.subarray(0, 4).toString().startsWith('%PDF')) {
          issues.push({
            code: 'INVALID_PDF_HEADER',
            message: 'File does not have valid PDF header',
            severity: 'error',
            category: 'format'
          });
        }
        break;

      case FileType.DOCUMENT:
      case FileType.SPREADSHEET:
      case FileType.PRESENTATION:
        if (mimeType.includes('openxmlformats')) {
          // Check for ZIP signature (Office 2007+ files are ZIP-based)
          if (!this.hasZipSignature(content)) {
            issues.push({
              code: 'INVALID_OFFICE_FORMAT',
              message: 'Office file does not have valid ZIP structure',
              severity: 'error',
              category: 'format'
            });
          }
        }
        break;

      case FileType.IMAGE:
        if (!this.hasValidImageHeader(content, mimeType)) {
          warnings.push({
            code: 'INVALID_IMAGE_HEADER',
            message: 'Image file may have invalid header',
            suggestion: 'File may be corrupted'
          });
        }
        break;
    }
  }

  /**
   * Validate file type consistency
   */
  private static validateFileTypeConsistency(
    content: Buffer,
    mimeType: string,
    fileName: string | undefined,
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): void {
    if (!fileName) return;

    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const mimeFromExtension = this.getMimeTypeFromExtension(extension);
    
    if (mimeFromExtension && mimeFromExtension !== mimeType) {
      warnings.push({
        code: 'EXTENSION_MIME_MISMATCH',
        message: `File extension suggests ${mimeFromExtension} but MIME type is ${mimeType}`,
        suggestion: 'Verify file integrity and type'
      });
    }
  }

  /**
   * Calculate risk level
   */
  private static calculateRiskLevel(
    issues: ValidationIssue[],
    warnings: ValidationWarning[]
  ): 'low' | 'medium' | 'high' {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const securityIssues = issues.filter(i => i.category === 'security').length;
    const warningCount = warnings.length;

    if (errorCount > 0 || securityIssues > 0) {
      return 'high';
    }
    if (warningCount > 2) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Check for executable headers
   */
  private static hasExecutableHeader(content: Buffer): boolean {
    if (content.length < 2) return false;

    // Check for common executable signatures
    const signatures = [
      Buffer.from([0x4D, 0x5A]),         // MZ (DOS/Windows executable)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
      Buffer.from([0xCF, 0xFA, 0xED, 0xFE]), // Mach-O (macOS executable)
      Buffer.from([0x50, 0x4B]),         // PK (ZIP, but check for JAR)
    ];

    return signatures.some(sig => content.subarray(0, sig.length).equals(sig));
  }

  /**
   * Check for script content
   */
  private static containsScriptContent(text: string): boolean {
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /function\s+\w+\s*\(/i
    ];

    return scriptPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check for embedded objects
   */
  private static containsEmbeddedObjects(content: Buffer): boolean {
    const embedPatterns = [
      Buffer.from('oleObject'),
      Buffer.from('embed'),
      Buffer.from('object'),
      Buffer.from('macro'),
      Buffer.from('vbaProject')
    ];

    const contentStr = content.toString('binary');
    return embedPatterns.some(pattern => 
      contentStr.includes(pattern.toString('binary'))
    );
  }

  /**
   * Check if file is password protected
   */
  private static isPasswordProtected(content: Buffer, mimeType: string): boolean {
    if (mimeType.includes('pdf')) {
      return content.includes(Buffer.from('/Encrypt'));
    }
    
    if (mimeType.includes('openxmlformats')) {
      return content.includes(Buffer.from('EncryptedPackage'));
    }

    return false;
  }

  /**
   * Check for ZIP signature
   */
  private static hasZipSignature(content: Buffer): boolean {
    return content.length >= 4 && 
           content[0] === 0x50 && content[1] === 0x4B;
  }

  /**
   * Check for valid image header
   */
  private static hasValidImageHeader(content: Buffer, mimeType: string): boolean {
    if (content.length < 4) return false;

    const signatures: { [key: string]: Buffer } = {
      'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
      'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
      'image/gif': Buffer.from([0x47, 0x49, 0x46]),
      'image/bmp': Buffer.from([0x42, 0x4D]),
      'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46])
    };

    const signature = signatures[mimeType];
    return signature ? content.subarray(0, signature.length).equals(signature) : true;
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeTypeFromExtension(extension: string): string | null {
    const mimeMap: { [key: string]: string } = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json'
    };

    return mimeMap[extension] || null;
  }

  /**
   * Estimate processing time
   */
  private static estimateProcessingTime(size: number, fileType: FileType): number {
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
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }
}

/**
 * Quick validation utility for common use cases
 */
export class QuickFileValidator {
  /**
   * Quick validation for upload scenarios
   */
  static validateForUpload(
    content: Buffer,
    mimeType: string,
    fileName?: string
  ): { isValid: boolean; message?: string } {
    const result = FileValidator.validateFile(content, mimeType, fileName, {
      allowExecutables: false,
      strictMimeTypeCheck: true,
      enableContentScanning: true
    });

    if (!result.isValid) {
      const primaryError = result.issues.find(i => i.severity === 'error');
      return {
        isValid: false,
        message: primaryError?.message || 'File validation failed'
      };
    }

    if (result.metadata.riskLevel === 'high') {
      return {
        isValid: false,
        message: 'File poses security risk'
      };
    }

    return { isValid: true };
  }

  /**
   * Quick validation for text extraction
   */
  static validateForTextExtraction(
    content: Buffer,
    mimeType: string,
    fileName?: string
  ): { isValid: boolean; supported: boolean; message?: string } {
    const result = FileValidator.validateFile(content, mimeType, fileName);
    
    return {
      isValid: result.isValid,
      supported: result.metadata.supportsTextExtraction,
      message: result.isValid ? undefined : result.issues[0]?.message
    };
  }
}