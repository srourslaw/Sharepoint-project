import DOMPurify from 'isomorphic-dompurify';
import { encode } from 'gpt-tokenizer';

export interface SanitizationOptions {
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripHtml?: boolean;
  preserveFormatting?: boolean;
  normalizeWhitespace?: boolean;
  preventInjection?: boolean;
  validateFileTypes?: string[];
  maxFileSize?: number;
  enforceEncoding?: 'utf8' | 'ascii' | 'latin1';
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

export interface SanitizationResult {
  sanitizedValue: any;
  originalValue: any;
  wasModified: boolean;
  removedContent?: string[];
  warnings: string[];
  errors: string[];
  metadata: {
    originalLength: number;
    sanitizedLength: number;
    processingTime: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface OutputFormatOptions {
  format: 'json' | 'xml' | 'csv' | 'html' | 'markdown' | 'plain' | 'pdf';
  indentation?: number;
  escapeSpecialChars?: boolean;
  includeMetadata?: boolean;
  customHeaders?: Record<string, string>;
  templatePath?: string;
  compression?: boolean;
  encoding?: 'utf8' | 'base64' | 'hex';
}

export interface FormattedOutput {
  content: string | Buffer;
  contentType: string;
  size: number;
  encoding: string;
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface SecurityScanResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: SecurityThreat[];
  recommendations: string[];
  safeToProcess: boolean;
}

export interface SecurityThreat {
  type: 'xss' | 'sql_injection' | 'script_injection' | 'path_traversal' | 'malicious_content';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  suggestedAction: string;
}

export class SanitizationService {
  private readonly dangerousPatterns = [
    // XSS patterns
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    
    // SQL injection patterns
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b)[\s\S]*?(\bFROM\b|\bWHERE\b|\bINTO\b)/gi,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
    /['"];\s*(DROP|DELETE|UPDATE|INSERT)/gi,
    
    // Path traversal
    /\.\.[\/\\]/g,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    
    // Command injection
    /[;&|`$]/g,
    
    // File inclusion
    /include\s*\(/gi,
    /require\s*\(/gi,
    /file_get_contents\s*\(/gi,
  ];

  private readonly suspiciousKeywords = [
    'eval', 'exec', 'system', 'shell_exec', 'passthru', 'proc_open',
    'base64_decode', 'gzinflate', 'str_rot13', 'phpinfo',
    'document.cookie', 'document.write', 'window.location',
    'XMLHttpRequest', 'fetch', 'import', 'require'
  ];

  async sanitizeInput(input: any, options: SanitizationOptions = {}): Promise<SanitizationResult> {
    const startTime = Date.now();
    const originalValue = input;
    let sanitizedValue = input;
    let wasModified = false;
    const warnings: string[] = [];
    const errors: string[] = [];
    const removedContent: string[] = [];
    
    try {
      // Type-specific sanitization
      if (typeof input === 'string') {
        const stringResult = await this.sanitizeString(input, options);
        sanitizedValue = stringResult.value;
        wasModified = stringResult.wasModified;
        warnings.push(...stringResult.warnings);
        removedContent.push(...stringResult.removedContent);
      } else if (typeof input === 'object' && input !== null) {
        const objectResult = await this.sanitizeObject(input, options);
        sanitizedValue = objectResult.value;
        wasModified = objectResult.wasModified;
        warnings.push(...objectResult.warnings);
      } else if (Array.isArray(input)) {
        const arrayResult = await this.sanitizeArray(input, options);
        sanitizedValue = arrayResult.value;
        wasModified = arrayResult.wasModified;
        warnings.push(...arrayResult.warnings);
      }

      // Security scan
      const securityResult = await this.performSecurityScan(sanitizedValue);
      if (securityResult.riskLevel === 'critical' || securityResult.riskLevel === 'high') {
        errors.push(`High security risk detected: ${securityResult.threats.map(t => t.description).join(', ')}`);
      }

      const processingTime = Date.now() - startTime;
      const originalLength = this.calculateLength(originalValue);
      const sanitizedLength = this.calculateLength(sanitizedValue);

      return {
        sanitizedValue,
        originalValue,
        wasModified,
        removedContent,
        warnings,
        errors,
        metadata: {
          originalLength,
          sanitizedLength,
          processingTime,
          riskLevel: securityResult.riskLevel
        }
      };

    } catch (error: any) {
      errors.push(`Sanitization error: ${error.message}`);
      
      return {
        sanitizedValue: originalValue,
        originalValue,
        wasModified: false,
        warnings,
        errors,
        metadata: {
          originalLength: this.calculateLength(originalValue),
          sanitizedLength: this.calculateLength(originalValue),
          processingTime: Date.now() - startTime,
          riskLevel: 'high'
        }
      };
    }
  }

  async validateInput(input: any, rules: ValidationRules): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required check
    if (rules.required && (input === null || input === undefined || input === '')) {
      errors.push(rules.errorMessage || 'This field is required');
      return { isValid: false, errors, warnings };
    }

    // Skip further validation if not required and empty
    if (!rules.required && (input === null || input === undefined || input === '')) {
      return { isValid: true, errors, warnings };
    }

    // String-specific validations
    if (typeof input === 'string') {
      if (rules.minLength && input.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
      }

      if (rules.maxLength && input.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
      }

      if (rules.pattern && !rules.pattern.test(input)) {
        errors.push(rules.errorMessage || 'Input format is invalid');
      }
    }

    // Custom validation
    if (rules.customValidator && !rules.customValidator(input)) {
      errors.push(rules.errorMessage || 'Custom validation failed');
    }

    // Security warnings
    const securityResult = await this.performSecurityScan(input);
    if (securityResult.riskLevel !== 'low') {
      warnings.push(...securityResult.recommendations);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async formatOutput(data: any, options: OutputFormatOptions): Promise<FormattedOutput> {
    let content: string | Buffer = '';
    let contentType = 'text/plain';
    const encoding = options.encoding || 'utf8';
    const metadata: Record<string, any> = {};
    const headers: Record<string, string> = options.customHeaders || {};

    try {
      switch (options.format) {
        case 'json':
          content = this.formatAsJson(data, options);
          contentType = 'application/json';
          break;

        case 'xml':
          content = this.formatAsXml(data, options);
          contentType = 'application/xml';
          break;

        case 'csv':
          content = this.formatAsCsv(data, options);
          contentType = 'text/csv';
          break;

        case 'html':
          content = await this.formatAsHtml(data, options);
          contentType = 'text/html';
          break;

        case 'markdown':
          content = this.formatAsMarkdown(data, options);
          contentType = 'text/markdown';
          break;

        case 'pdf':
          content = await this.formatAsPdf(data, options);
          contentType = 'application/pdf';
          break;

        default:
          content = this.formatAsPlain(data, options);
          contentType = 'text/plain';
      }

      // Apply encoding
      if (encoding === 'base64') {
        content = Buffer.from(content).toString('base64');
      } else if (encoding === 'hex') {
        content = Buffer.from(content).toString('hex');
      }

      // Apply compression if requested
      if (options.compression) {
        content = await this.compressContent(content);
        headers['Content-Encoding'] = 'gzip';
      }

      // Add metadata if requested
      if (options.includeMetadata) {
        metadata.generatedAt = new Date().toISOString();
        metadata.format = options.format;
        metadata.encoding = encoding;
        metadata.size = Buffer.byteLength(content, encoding);
      }

      return {
        content,
        contentType,
        size: Buffer.byteLength(content, encoding),
        encoding,
        metadata: options.includeMetadata ? metadata : undefined,
        headers
      };

    } catch (error: any) {
      throw new Error(`Output formatting failed: ${error.message}`);
    }
  }

  async performSecurityScan(input: any): Promise<SecurityScanResult> {
    const threats: SecurityThreat[] = [];
    let riskLevel: SecurityScanResult['riskLevel'] = 'low';

    if (typeof input === 'string') {
      // Check for dangerous patterns
      for (const pattern of this.dangerousPatterns) {
        const matches = input.match(pattern);
        if (matches) {
          threats.push({
            type: this.classifyThreat(pattern),
            description: `Potentially dangerous pattern detected: ${matches[0].substring(0, 50)}...`,
            severity: 'high',
            location: `Position ${input.indexOf(matches[0])}`,
            suggestedAction: 'Remove or escape the dangerous content'
          });
        }
      }

      // Check for suspicious keywords
      for (const keyword of this.suspiciousKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(input)) {
          threats.push({
            type: 'script_injection',
            description: `Suspicious keyword detected: ${keyword}`,
            severity: 'medium',
            suggestedAction: 'Review and validate the necessity of this keyword'
          });
        }
      }

      // Check for data exfiltration attempts
      if (this.containsDataExfiltrationPatterns(input)) {
        threats.push({
          type: 'malicious_content',
          description: 'Potential data exfiltration attempt detected',
          severity: 'critical',
          suggestedAction: 'Block this content immediately'
        });
      }
    }

    // Determine overall risk level
    if (threats.some(t => t.severity === 'critical')) {
      riskLevel = 'critical';
    } else if (threats.some(t => t.severity === 'high')) {
      riskLevel = 'high';
    } else if (threats.some(t => t.severity === 'medium')) {
      riskLevel = 'medium';
    }

    const recommendations = this.generateSecurityRecommendations(threats);
    const safeToProcess = riskLevel === 'low' || riskLevel === 'medium';

    return {
      riskLevel,
      threats,
      recommendations,
      safeToProcess
    };
  }

  // String sanitization
  private async sanitizeString(input: string, options: SanitizationOptions) {
    let value = input;
    let wasModified = false;
    const warnings: string[] = [];
    const removedContent: string[] = [];

    // Length validation
    if (options.maxLength && value.length > options.maxLength) {
      const originalLength = value.length;
      value = value.substring(0, options.maxLength);
      wasModified = true;
      warnings.push(`Text truncated from ${originalLength} to ${options.maxLength} characters`);
    }

    // HTML sanitization
    if (options.stripHtml || options.preventInjection) {
      const originalValue = value;
      value = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: options.allowedTags || [],
        ALLOWED_ATTR: options.allowedAttributes || [],
        KEEP_CONTENT: !options.stripHtml
      });

      if (value !== originalValue) {
        wasModified = true;
        removedContent.push('HTML/Script tags removed for security');
      }
    }

    // Whitespace normalization
    if (options.normalizeWhitespace) {
      const originalValue = value;
      value = value.replace(/\s+/g, ' ').trim();
      
      if (value !== originalValue) {
        wasModified = true;
        warnings.push('Whitespace normalized');
      }
    }

    // Encoding validation
    if (options.enforceEncoding) {
      try {
        const buffer = Buffer.from(value, options.enforceEncoding);
        const decoded = buffer.toString(options.enforceEncoding);
        if (decoded !== value) {
          value = decoded;
          wasModified = true;
          warnings.push(`Text re-encoded as ${options.enforceEncoding}`);
        }
      } catch (error: any) {
        warnings.push(`Encoding validation failed: ${error.message}`);
      }
    }

    // Remove dangerous patterns
    if (options.preventInjection) {
      for (const pattern of this.dangerousPatterns) {
        if (pattern.test(value)) {
          const originalValue = value;
          value = value.replace(pattern, '');
          if (value !== originalValue) {
            wasModified = true;
            removedContent.push('Dangerous patterns removed');
          }
        }
      }
    }

    return { value, wasModified, warnings, removedContent };
  }

  // Object sanitization
  private async sanitizeObject(input: Record<string, any>, options: SanitizationOptions) {
    const value: Record<string, any> = {};
    let wasModified = false;
    const warnings: string[] = [];

    for (const [key, val] of Object.entries(input)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeObjectKey(key);
      if (sanitizedKey !== key) {
        wasModified = true;
        warnings.push(`Object key sanitized: ${key} -> ${sanitizedKey}`);
      }

      // Recursively sanitize value
      const sanitizedResult = await this.sanitizeInput(val, options);
      value[sanitizedKey] = sanitizedResult.sanitizedValue;

      if (sanitizedResult.wasModified) {
        wasModified = true;
        warnings.push(...sanitizedResult.warnings);
      }
    }

    return { value, wasModified, warnings };
  }

  // Array sanitization
  private async sanitizeArray(input: any[], options: SanitizationOptions) {
    const value: any[] = [];
    let wasModified = false;
    const warnings: string[] = [];

    for (let i = 0; i < input.length; i++) {
      const sanitizedResult = await this.sanitizeInput(input[i], options);
      value[i] = sanitizedResult.sanitizedValue;

      if (sanitizedResult.wasModified) {
        wasModified = true;
        warnings.push(...sanitizedResult.warnings.map(w => `Array[${i}]: ${w}`));
      }
    }

    return { value, wasModified, warnings };
  }

  // Output formatting methods
  private formatAsJson(data: any, options: OutputFormatOptions): string {
    const indentation = options.indentation || 2;
    let jsonString = JSON.stringify(data, null, indentation);

    if (options.escapeSpecialChars) {
      jsonString = this.escapeSpecialCharacters(jsonString);
    }

    return jsonString;
  }

  private formatAsXml(data: any, options: OutputFormatOptions): string {
    const indentation = ' '.repeat(options.indentation || 2);
    
    const buildXml = (obj: any, depth = 0): string => {
      const indent = indentation.repeat(depth);
      
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          return obj.map(item => `${indent}<item>\n${buildXml(item, depth + 1)}\n${indent}</item>`).join('\n');
        } else {
          return Object.entries(obj)
            .map(([key, value]) => {
              const sanitizedKey = this.sanitizeXmlTag(key);
              const content = typeof value === 'object' 
                ? `\n${buildXml(value, depth + 1)}\n${indent}`
                : this.escapeXmlContent(String(value));
              return `${indent}<${sanitizedKey}>${content}</${sanitizedKey}>`;
            })
            .join('\n');
        }
      } else {
        return `${indent}${this.escapeXmlContent(String(obj))}`;
      }
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${buildXml(data, 1)}\n</root>`;
  }

  private formatAsCsv(data: any, options: OutputFormatOptions): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      return '';
    }

    // Extract headers from first object
    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers
    csvRows.push(headers.map(h => this.escapeCsvField(h)).join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.escapeCsvField(String(value || ''));
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private async formatAsHtml(data: any, options: OutputFormatOptions): Promise<string> {
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '<title>Data Export</title>\n';
    html += '<style>body { font-family: Arial, sans-serif; margin: 20px; }</style>\n';
    html += '</head>\n<body>\n';

    if (Array.isArray(data)) {
      html += '<table border="1" cellpadding="5" cellspacing="0">\n';
      
      if (data.length > 0 && typeof data[0] === 'object') {
        const headers = Object.keys(data[0]);
        html += '<thead><tr>';
        headers.forEach(header => {
          html += `<th>${this.escapeHtml(header)}</th>`;
        });
        html += '</tr></thead>\n<tbody>\n';

        data.forEach(row => {
          html += '<tr>';
          headers.forEach(header => {
            const value = row[header];
            html += `<td>${this.escapeHtml(String(value || ''))}</td>`;
          });
          html += '</tr>\n';
        });
        
        html += '</tbody>\n';
      }
      
      html += '</table>\n';
    } else if (typeof data === 'object') {
      html += '<dl>\n';
      Object.entries(data).forEach(([key, value]) => {
        html += `<dt><strong>${this.escapeHtml(key)}</strong></dt>\n`;
        html += `<dd>${this.escapeHtml(String(value))}</dd>\n`;
      });
      html += '</dl>\n';
    } else {
      html += `<p>${this.escapeHtml(String(data))}</p>\n`;
    }

    html += '</body>\n</html>';
    return html;
  }

  private formatAsMarkdown(data: any, options: OutputFormatOptions): string {
    let markdown = '# Data Export\n\n';
    markdown += `*Generated on ${new Date().toISOString()}*\n\n`;

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      
      // Table headers
      markdown += `| ${headers.join(' | ')} |\n`;
      markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
      
      // Table rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return this.escapeMarkdown(String(value || ''));
        });
        markdown += `| ${values.join(' | ')} |\n`;
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        markdown += `## ${this.escapeMarkdown(key)}\n\n`;
        markdown += `${this.escapeMarkdown(String(value))}\n\n`;
      });
    } else {
      markdown += `${this.escapeMarkdown(String(data))}\n`;
    }

    return markdown;
  }

  private formatAsPlain(data: any, options: OutputFormatOptions): string {
    if (typeof data === 'string') {
      return data;
    } else if (typeof data === 'object') {
      return JSON.stringify(data, null, options.indentation || 2);
    } else {
      return String(data);
    }
  }

  private async formatAsPdf(data: any, options: OutputFormatOptions): Promise<Buffer> {
    // This would require a PDF library like puppeteer or jsPDF
    // For now, return a placeholder
    const htmlContent = await this.formatAsHtml(data, options);
    return Buffer.from(`PDF content would be generated from:\n${htmlContent}`);
  }

  // Utility methods
  private sanitizeObjectKey(key: string): string {
    // Remove special characters that could cause issues
    return key.replace(/[^a-zA-Z0-9_$]/g, '_');
  }

  private sanitizeXmlTag(tag: string): string {
    // XML tag names must start with a letter or underscore
    let sanitized = tag.replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!/^[a-zA-Z_]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }
    return sanitized;
  }

  private escapeSpecialCharacters(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private escapeXmlContent(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeMarkdown(text: string): string {
    return text
      .replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
  }

  private classifyThreat(pattern: RegExp): SecurityThreat['type'] {
    const patternStr = pattern.source.toLowerCase();
    
    if (patternStr.includes('script') || patternStr.includes('iframe')) {
      return 'xss';
    } else if (patternStr.includes('union') || patternStr.includes('select')) {
      return 'sql_injection';
    } else if (patternStr.includes('..')) {
      return 'path_traversal';
    } else if (patternStr.includes('eval') || patternStr.includes('exec')) {
      return 'script_injection';
    } else {
      return 'malicious_content';
    }
  }

  private containsDataExfiltrationPatterns(input: string): boolean {
    const exfiltrationPatterns = [
      /document\.location\s*=.*?(ftp|http)/gi,
      /new\s+Image\(\).*?src\s*=.*?['"]/gi,
      /fetch\s*\(.*?(ftp|http)/gi,
      /XMLHttpRequest.*?open.*?(ftp|http)/gi,
    ];

    return exfiltrationPatterns.some(pattern => pattern.test(input));
  }

  private generateSecurityRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];

    if (threats.some(t => t.type === 'xss')) {
      recommendations.push('Enable Content Security Policy (CSP) headers');
      recommendations.push('Use proper output encoding for all user-generated content');
    }

    if (threats.some(t => t.type === 'sql_injection')) {
      recommendations.push('Use parameterized queries or prepared statements');
      recommendations.push('Implement input validation for database queries');
    }

    if (threats.some(t => t.type === 'script_injection')) {
      recommendations.push('Disable execution of user-provided code');
      recommendations.push('Implement strict input filtering');
    }

    if (threats.some(t => t.type === 'path_traversal')) {
      recommendations.push('Validate and sanitize file paths');
      recommendations.push('Use whitelist-based path validation');
    }

    if (threats.some(t => t.severity === 'critical')) {
      recommendations.push('Block this content immediately');
      recommendations.push('Log the incident for security review');
    }

    return recommendations;
  }

  private calculateLength(value: any): number {
    if (typeof value === 'string') {
      return value.length;
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).length;
    } else {
      return String(value).length;
    }
  }

  private async compressContent(content: string | Buffer): Promise<Buffer> {
    // This would use compression library like zlib
    // For now, return the content as-is
    return Buffer.isBuffer(content) ? content : Buffer.from(content);
  }
}