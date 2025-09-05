# File Processing Utilities Guide

Comprehensive file processing system with text extraction, validation, progress tracking, and security features.

## 🚀 **Complete Implementation**

The file processing system provides a full-featured API for handling various file types:

✅ **Multi-Format Support** - Word, Excel, PowerPoint, PDF, text files, images  
✅ **Text Extraction** - Extract readable content from Office documents and PDFs  
✅ **Progress Tracking** - Real-time progress indicators for large file operations  
✅ **File Validation** - Comprehensive security and format validation  
✅ **Batch Processing** - Process multiple files efficiently  
✅ **Error Handling** - Robust error recovery and detailed reporting  
✅ **Size Limits** - Per-type file size restrictions and validation  
✅ **Security Scanning** - Detect malicious files and suspicious patterns  

## 📁 **Architecture**

```
server/src/utils/
├── file-handlers.ts              # Core file type detection & text extraction
├── advanced-file-processor.ts    # Advanced processing with progress tracking
├── file-validator.ts             # Comprehensive file validation & security
└── sharepoint-client.ts          # Integration with SharePoint services
```

## 🔧 **Core Components**

### **1. File Type Handler (`FileTypeHandler`)**
Smart file type detection and capability checking:

```typescript
import { FileTypeHandler } from './utils/file-handlers';

// Detect file type from MIME type and filename
const fileType = FileTypeHandler.detectFileType('application/pdf', 'document.pdf');

// Check if text extraction is supported
const supportsText = FileTypeHandler.supportsTextExtraction(mimeType, fileName);

// Validate file size limits
const withinLimits = FileTypeHandler.isWithinSizeLimit(fileType, fileSize);
```

### **2. Text Extractor (`TextExtractor`)**
Extract text content from various file formats:

```typescript
import { TextExtractor } from './utils/file-handlers';

// Extract text from any supported file type
const extractedText = await TextExtractor.extractText(
  fileBuffer, 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'document.docx'
);
```

### **3. Advanced File Processor (`AdvancedFileProcessor`)**
Process files with progress tracking and enhanced capabilities:

```typescript
import { AdvancedFileProcessor } from './utils/advanced-file-processor';

const processor = new AdvancedFileProcessor({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedTypes: [FileType.DOCUMENT, FileType.PDF, FileType.SPREADSHEET]
});

// Process single file with progress tracking
const result = await processor.processFileWithProgress(
  fileBuffer,
  mimeType,
  fileName,
  true, // extract text
  'unique-process-id'
);

// Listen to progress events
processor.on('progress', (id, progress) => {
  console.log(`${progress.stage}: ${progress.percentage}% - ${progress.message}`);
});
```

### **4. File Validator (`FileValidator`)**
Comprehensive file validation with security scanning:

```typescript
import { FileValidator, QuickFileValidator } from './utils/file-validator';

// Comprehensive validation
const validation = FileValidator.validateFile(fileBuffer, mimeType, fileName, {
  allowExecutables: false,
  strictMimeTypeCheck: true,
  enableContentScanning: true
});

console.log(`Valid: ${validation.isValid}`);
console.log(`Risk Level: ${validation.metadata.riskLevel}`);
console.log(`Issues: ${validation.issues.length}`);

// Quick validation for uploads
const quickCheck = QuickFileValidator.validateForUpload(fileBuffer, mimeType, fileName);
if (!quickCheck.isValid) {
  throw new Error(quickCheck.message);
}
```

## 📊 **Supported File Types**

### **Document Files**
- **Word Documents**: `.docx`, `.doc` - Full text extraction with formatting preservation
- **Rich Text**: `.rtf`, `.odt` - Text content extraction
- **Processing**: Handles tables, headers, footers, and embedded content

### **Spreadsheet Files**
- **Excel**: `.xlsx`, `.xls` - Sheet-by-sheet text extraction with cell data
- **CSV Files**: `.csv` - Direct text processing with formatting
- **Processing**: Extracts formulas, cell values, and sheet structure

### **Presentation Files**
- **PowerPoint**: `.pptx`, `.ppt` - Slide-by-slide text extraction
- **OpenDocument**: `.odp` - Basic text extraction support
- **Processing**: Extracts slide titles, content, and speaker notes

### **PDF Files**
- **Text Extraction**: Full PDF text content extraction
- **Metadata**: Page count estimation and document info
- **Security**: Detects password-protected documents

### **Text Files**
- **Plain Text**: `.txt`, `.md`, `.log` - Direct content reading
- **Structured Text**: `.json`, `.xml`, `.csv` - Formatted extraction
- **Web Files**: `.html`, `.css` - Content extraction with tag stripping
- **Code Files**: `.js`, `.py`, `.java` - Source code handling

### **Image Files**
- **Formats**: `.jpg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`
- **Validation**: Header validation and metadata extraction
- **Processing**: Basic image information and format verification

## ⚡ **Advanced Features**

### **Progress Tracking**
Real-time progress updates for file processing operations:

```typescript
// Progress stages: reading -> parsing -> extracting -> formatting -> complete
processor.on('progress', (processingId, progress) => {
  console.log(`[${progress.percentage}%] ${progress.stage}: ${progress.message}`);
  
  if (progress.bytesProcessed && progress.totalBytes) {
    const mbProcessed = (progress.bytesProcessed / 1024 / 1024).toFixed(1);
    const mbTotal = (progress.totalBytes / 1024 / 1024).toFixed(1);
    console.log(`Progress: ${mbProcessed}MB / ${mbTotal}MB`);
  }
});
```

### **Batch Processing**
Process multiple files with collective progress tracking:

```typescript
const files = [
  { content: buffer1, mimeType: 'application/pdf', fileName: 'doc1.pdf' },
  { content: buffer2, mimeType: 'text/plain', fileName: 'doc2.txt' }
];

const results = await processor.processBatchWithProgress(files, 'batch-id');
console.log(`Processed ${results.length} files`);
```

### **File Validation Features**

#### **Security Validation**
- **Executable Detection**: Identifies and blocks executable files
- **Script Content**: Detects embedded JavaScript and other script content
- **MIME Type Verification**: Validates MIME type consistency
- **Extension Analysis**: Checks for suspicious double extensions

#### **Format Validation**
- **Header Verification**: Validates file format headers and signatures
- **Structure Integrity**: Checks file structure consistency
- **Size Validation**: Enforces per-type and global size limits
- **Content Scanning**: Scans for embedded objects and macros

#### **File Name Validation**
- **Character Validation**: Checks for invalid filename characters
- **Length Limits**: Enforces filename length restrictions
- **Reserved Names**: Blocks system reserved filenames
- **Pattern Detection**: Identifies suspicious naming patterns

### **Error Handling & Recovery**

```typescript
try {
  const result = await processor.processFileWithProgress(buffer, mimeType, fileName);
  console.log('Processing successful:', result.metadata);
} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    console.log('File exceeds size limits');
  } else if (error.code === 'UNSUPPORTED_FORMAT') {
    console.log('File format not supported');
  } else if (error.code === 'SECURITY_RISK') {
    console.log('File poses security risk');
  }
}
```

## 🛡️ **Security Features**

### **Malicious File Detection**
```typescript
// Automatic detection of:
// - Executable files (.exe, .bat, .scr, etc.)
// - Script files with embedded code
// - Files with suspicious double extensions
// - Password-protected documents
// - Files with embedded objects/macros

const validation = FileValidator.validateFile(buffer, mimeType, fileName, {
  allowExecutables: false,        // Block executable files
  enableContentScanning: true,    // Scan file content
  strictMimeTypeCheck: true      // Enforce MIME type consistency
});

if (validation.metadata.riskLevel === 'high') {
  console.log('High-risk file detected!');
  validation.issues.forEach(issue => {
    if (issue.category === 'security') {
      console.log(`Security Issue: ${issue.message}`);
    }
  });
}
```

### **File Size & Resource Limits**
```typescript
// Per-type size limits (configurable)
const limits = {
  TEXT: 10 * 1024 * 1024,        // 10MB
  PDF: 50 * 1024 * 1024,         // 50MB  
  DOCUMENT: 50 * 1024 * 1024,    // 50MB
  SPREADSHEET: 100 * 1024 * 1024, // 100MB
  PRESENTATION: 100 * 1024 * 1024, // 100MB
  IMAGE: 25 * 1024 * 1024,       // 25MB
};

// Processing timeout limits
const processor = new AdvancedFileProcessor({
  maxFileSize: 200 * 1024 * 1024, // Global 200MB limit
  processingTimeout: 5 * 60 * 1000 // 5 minute timeout
});
```

## 💻 **Usage Examples**

### **Basic File Processing**
```typescript
import { AdvancedFileProcessor, FileProcessingUtils } from './utils/advanced-file-processor';

// Initialize processor
const processor = new AdvancedFileProcessor();

// Process a file
const fileBuffer = fs.readFileSync('document.docx');
const result = await processor.processFileWithProgress(
  fileBuffer,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'document.docx',
  true // extract text
);

console.log('File type:', result.metadata?.fileType);
console.log('Text extracted:', result.extractedText ? 'Yes' : 'No');
console.log('Processing time:', result.metadata?.processingTimeMs + 'ms');
```

### **Upload Validation**
```typescript
import { QuickFileValidator } from './utils/file-validator';

async function handleFileUpload(file: Express.Multer.File) {
  // Quick security validation
  const validation = QuickFileValidator.validateForUpload(
    file.buffer, 
    file.mimetype, 
    file.originalname
  );
  
  if (!validation.isValid) {
    throw new Error(`Upload rejected: ${validation.message}`);
  }
  
  // Process the file
  const processor = new AdvancedFileProcessor();
  return await processor.processFileWithProgress(
    file.buffer,
    file.mimetype,
    file.originalname,
    true
  );
}
```

### **Progress Monitoring**
```typescript
const processor = new AdvancedFileProcessor();

// Set up progress monitoring
processor.on('progress', (id, progress) => {
  // Update UI with progress
  updateProgressBar(progress.percentage);
  updateStatusMessage(progress.message);
  
  if (progress.stage === 'extracting') {
    console.log('Extracting content...');
  }
});

processor.on('error', (id, error) => {
  console.error(`Processing ${id} failed:`, error.message);
});

// Process file with monitoring
const result = await processor.processFileWithProgress(
  fileBuffer, mimeType, fileName, true, 'my-upload-id'
);
```

### **Batch File Processing**
```typescript
// Process multiple files with progress tracking
const files = await Promise.all(uploadedFiles.map(async (file) => ({
  content: file.buffer,
  mimeType: file.mimetype,
  fileName: file.originalname,
  extractText: true
})));

const processor = new AdvancedFileProcessor();

// Monitor batch progress
processor.on('progress', (batchId, progress) => {
  if (progress.itemsProcessed !== undefined) {
    console.log(`Progress: ${progress.itemsProcessed}/${progress.totalItems} files`);
    console.log(`Current: ${progress.currentItem}`);
  }
});

const results = await processor.processBatchWithProgress(files, 'batch-upload');
console.log(`Successfully processed ${results.length} files`);

// Process results
results.forEach((result, index) => {
  if (result.metadata?.processingError) {
    console.log(`File ${index + 1} failed: ${result.metadata.processingError}`);
  } else {
    console.log(`File ${index + 1} processed successfully`);
    if (result.extractedText) {
      console.log(`Extracted ${result.extractedText.length} characters of text`);
    }
  }
});
```

## 🔍 **File Content Analysis**

### **Extracted Metadata**
```typescript
// Rich metadata extracted during processing
const result = await processor.processFileWithProgress(buffer, mimeType, fileName, true);

console.log('File Metadata:', {
  fileType: result.metadata?.fileType,
  size: result.metadata?.size,
  processingTime: result.metadata?.processingTimeMs,
  textExtractionSuccess: result.metadata?.textExtractionSuccess,
  
  // Document-specific metadata
  documentInfo: result.metadata?.documentInfo, // pages, word count, images
  spreadsheetInfo: result.metadata?.spreadsheetInfo, // sheets, rows, formulas
  presentationInfo: result.metadata?.presentationInfo, // slides, duration
  pdfInfo: result.metadata?.pdfInfo, // pages, text content
  textInfo: result.metadata?.textInfo // lines, words, characters
});
```

### **Text Post-Processing**
```typescript
// Automatic text cleaning and formatting
const processor = new AdvancedFileProcessor();
const result = await processor.processFileWithProgress(buffer, mimeType, fileName, true);

// Text is automatically:
// - Normalized (line endings, whitespace)
// - Cleaned (HTML tags stripped, entities decoded)
// - Formatted (readable structure for spreadsheets/presentations)
// - Fixed (common PDF extraction issues corrected)

console.log('Clean extracted text:', result.extractedText);
```

## 📈 **Utility Functions**

### **File Processing Utils**
```typescript
import { FileProcessingUtils } from './utils/advanced-file-processor';

// Format file sizes
console.log(FileProcessingUtils.formatFileSize(1536)); // "1.5 KB"
console.log(FileProcessingUtils.formatFileSize(2097152)); // "2.0 MB"

// Estimate processing time
const estimate = FileProcessingUtils.estimateProcessingTime(1024 * 1024, FileType.PDF);
console.log(`PDF processing estimate: ${estimate}ms`);

// File type icons
console.log(FileProcessingUtils.getFileTypeIcon(FileType.DOCUMENT)); // "📄"

// File name validation
const nameCheck = FileProcessingUtils.validateFileName("my document.pdf");
console.log(`Name valid: ${nameCheck.isValid}`);
```

## 🚀 **Performance Optimizations**

### **Memory Management**
- **Streaming Processing**: Large files processed in chunks
- **Buffer Management**: Efficient memory usage for file operations
- **Garbage Collection**: Automatic cleanup of processing resources

### **Processing Efficiency**
- **Type-Specific Optimization**: Different strategies for each file type
- **Early Validation**: Quick rejection of invalid files
- **Progress Batching**: Efficient progress event handling

### **Error Recovery**
- **Graceful Degradation**: Partial success when possible
- **Timeout Handling**: Prevents hanging operations
- **Resource Cleanup**: Automatic cleanup on errors

## 🔧 **Configuration**

### **Processor Configuration**
```typescript
const processor = new AdvancedFileProcessor({
  maxFileSize: 100 * 1024 * 1024,     // Global size limit
  supportedTypes: [                    // Allowed file types
    FileType.DOCUMENT,
    FileType.SPREADSHEET,
    FileType.PDF,
    FileType.TEXT
  ]
});
```

### **Validation Configuration**
```typescript
const validation = FileValidator.validateFile(buffer, mimeType, fileName, {
  maxFileSize: 50 * 1024 * 1024,      // Override size limit
  allowExecutables: false,             // Block executables
  strictMimeTypeCheck: true,           // Enforce MIME consistency
  enableContentScanning: true          // Deep content analysis
});
```

The file processing system provides enterprise-grade capabilities for comprehensive file handling with security, validation, and progress tracking! 🎉

## 📝 **Integration Examples**

### **SharePoint Integration**
```typescript
// Enhanced SharePoint file processing
const sharepointService = new SharePointService(graphClient);
const processor = new AdvancedFileProcessor();

// Download and process file from SharePoint
const fileContent = await sharepointService.downloadFile(driveId, itemId);
const processedContent = await processor.processFileWithProgress(
  fileContent.content as Buffer,
  fileContent.mimeType,
  fileName,
  true
);

console.log('SharePoint file processed:', {
  originalSize: fileContent.size,
  extractedTextLength: processedContent.extractedText?.length,
  processingTime: processedContent.metadata?.processingTimeMs
});
```

### **Express.js Route Integration**
```typescript
import multer from 'multer';
import { AdvancedFileProcessor } from './utils/advanced-file-processor';
import { QuickFileValidator } from './utils/file-validator';

const upload = multer({ storage: multer.memoryStorage() });
const processor = new AdvancedFileProcessor();

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Quick validation
    const validation = QuickFileValidator.validateForUpload(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.message });
    }

    // Process with progress (in real app, use WebSocket for progress)
    const result = await processor.processFileWithProgress(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      true,
      `upload-${Date.now()}`
    );

    res.json({
      success: true,
      fileInfo: {
        name: req.file.originalname,
        size: result.size,
        type: result.metadata?.fileType,
        textExtracted: !!result.extractedText,
        textLength: result.extractedText?.length || 0,
        processingTimeMs: result.metadata?.processingTimeMs
      },
      extractedText: result.extractedText?.substring(0, 1000) // First 1000 chars
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});
```