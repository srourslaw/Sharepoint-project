# SharePoint Service Guide

Comprehensive SharePoint service with advanced file operations, caching, retry logic, and text extraction capabilities.

## 🚀 **Complete Implementation**

The SharePoint service provides a full-featured API for interacting with SharePoint Online and OneDrive:

✅ **Site & Library Management** - Fetch SharePoint sites and document libraries  
✅ **File & Folder Operations** - List, download, upload, update, delete files  
✅ **Advanced Search** - Search across drives with filters and sorting  
✅ **File Content Extraction** - Extract text from Office docs, PDFs, text files  
✅ **Intelligent Caching** - Performance optimization with TTL and LRU eviction  
✅ **Retry Logic** - Exponential backoff for resilient API calls  
✅ **Error Handling** - Comprehensive error recovery and reporting  
✅ **File Type Detection** - Smart handling of different file types  
✅ **Batch Operations** - Efficient bulk operations  
✅ **Version Management** - File version history support  

## 📁 **Architecture**

```
server/src/
├── services/
│   └── sharepointService.ts          # Main service orchestrator
├── utils/
│   ├── sharepoint-client.ts          # Graph API client with retry
│   ├── cache.ts                      # Intelligent caching system
│   └── file-handlers.ts              # File type & text extraction
├── types/
│   └── sharepoint.ts                 # TypeScript definitions
└── routes/
    └── sharepoint-advanced.ts        # REST API endpoints
```

## 🔧 **Key Features**

### **1. SharePoint Service (`SharePointService`)**
The main service class that orchestrates all SharePoint operations:

```typescript
const sharePointService = new SharePointService(graphClient, {
  retryOptions: {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
  },
  cacheOptions: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    enabled: true
  },
  maxFileSize: 100 * 1024 * 1024, // 100MB
  textExtractionEnabled: true
});
```

### **2. Intelligent Caching (`SharePointCache`)**
- **LRU Eviction**: Removes least recently used items
- **TTL Support**: Time-to-live with automatic cleanup
- **Pattern Invalidation**: Clear related cache entries
- **Cache Warming**: Preload frequently accessed data

```typescript
// Get with auto-fetch if not cached
const data = await cache.getOrSet('key', async () => {
  return await fetchDataFromAPI();
});

// Invalidate by pattern
cache.invalidateByPattern('sharepoint:drive:*');
```

### **3. File Type Handling (`FileTypeHandler`)**
- **Smart Detection**: Detect file types from MIME types and extensions
- **Category Support**: Documents, spreadsheets, presentations, PDFs, text, images
- **Size Limits**: Per-type file size restrictions
- **Processing Rules**: Type-specific handling logic

```typescript
const fileType = FileTypeHandler.detectFileType('application/pdf', 'document.pdf');
const supportsText = FileTypeHandler.supportsTextExtraction(mimeType, fileName);
```

### **4. Text Extraction (`TextExtractor`)**
- **Multi-Format**: Office docs, PDFs, text files, HTML, JSON, XML
- **Smart Processing**: HTML tag stripping, JSON formatting
- **Error Handling**: Graceful fallbacks for unsupported formats
- **Extensible**: Easy to add new file type support

### **5. Retry Logic (`SharePointClient`)**
- **Exponential Backoff**: Smart retry delays
- **Configurable**: Customizable retry policies
- **Status Code Aware**: Different handling for different error types
- **Rate Limiting**: Proper 429 handling

## 🎯 **API Endpoints**

### **Sites & Libraries**

```http
# Get all SharePoint sites
GET /api/sharepoint-advanced/sites

# Get specific site
GET /api/sharepoint-advanced/sites/{siteId}

# Get document libraries for site
GET /api/sharepoint-advanced/sites/{siteId}/drives

# Get user's OneDrive
GET /api/sharepoint-advanced/me/drive
```

### **Files & Folders**

```http
# List folder contents
GET /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/children
?orderBy=name&orderDirection=asc&limit=100

# Get file metadata
GET /api/sharepoint-advanced/drives/{driveId}/items/{itemId}

# Download file content
GET /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/content
?extractText=true&format=json

# Upload files (multipart)
POST /api/sharepoint-advanced/drives/{driveId}/items/{parentId}/children
Content-Type: multipart/form-data

# Update file content
PUT /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/content
Content-Type: multipart/form-data

# Delete file/folder
DELETE /api/sharepoint-advanced/drives/{driveId}/items/{itemId}
```

### **Advanced Operations**

```http
# Search files
GET /api/sharepoint-advanced/search
?q=contract&fileType=document&limit=20

# Create folder
POST /api/sharepoint-advanced/drives/{driveId}/items/{parentId}/folders
{"name": "New Folder"}

# Copy item
POST /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/copy
{"targetDriveId": "...", "targetParentId": "...", "newName": "Copy of file"}

# Move item  
PATCH /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/move
{"targetParentId": "...", "newName": "Moved file"}

# Get file versions
GET /api/sharepoint-advanced/drives/{driveId}/items/{itemId}/versions
```

### **Cache Management**

```http
# Get cache statistics
GET /api/sharepoint-advanced/cache/stats

# Clear cache (all or by pattern)
DELETE /api/sharepoint-advanced/cache
DELETE /api/sharepoint-advanced/cache?pattern=sharepoint:drive:*
```

## 💻 **Usage Examples**

### **Basic Site Operations**
```typescript
import { SharePointService } from './services/sharepointService';

const service = new SharePointService(graphClient);

// Get all sites
const sites = await service.getSites();

// Get site libraries
const libraries = await service.getDocumentLibraries(siteId);

// List folder contents
const items = await service.listItems(driveId, 'root', {
  orderBy: 'lastModifiedDateTime',
  orderDirection: 'desc',
  limit: 50
});
```

### **File Operations**
```typescript
// Download file with text extraction
const fileContent = await service.downloadFile(driveId, itemId, true);
console.log('Extracted text:', fileContent.extractedText);

// Upload multiple files
const results = await Promise.all(files.map(file => 
  service.uploadFile(driveId, parentId, {
    fileName: file.name,
    content: file.buffer,
    mimeType: file.type,
    conflictBehavior: 'rename'
  })
));

// Search with filters
const searchResults = await service.searchItems('quarterly report', driveId, {
  fileType: FileType.DOCUMENT,
  modifiedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  limit: 25
});
```

### **Advanced Operations**
```typescript
// Bulk operations with caching
const folderItems = await service.listItems(driveId, folderId);
const textContents = await Promise.all(
  folderItems
    .filter(item => item.file) // Only files
    .map(async (file) => {
      try {
        const content = await service.downloadFile(driveId, file.id, true);
        return { fileName: file.name, text: content.extractedText };
      } catch (error) {
        return { fileName: file.name, error: error.message };
      }
    })
);

// Cache warming
const service = new SharePointService(graphClient);
await service.getSites(); // Cached for future requests

// Cache management
const stats = service.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%, Size: ${stats.size}/${stats.maxSize}`);
```

## 🔍 **File Type Support**

### **Supported File Types**
- **Documents**: `.docx`, `.doc`, `.odt`, `.rtf`
- **Spreadsheets**: `.xlsx`, `.xls`, `.ods`, `.csv`  
- **Presentations**: `.pptx`, `.ppt`, `.odp`
- **PDFs**: `.pdf` (requires pdf-parse library)
- **Text**: `.txt`, `.html`, `.css`, `.js`, `.json`, `.xml`, `.md`, `.yml`
- **Images**: `.jpg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`
- **Archives**: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`

### **Text Extraction Features**
- **Office Documents**: Full text extraction from Word, Excel, PowerPoint
- **PDFs**: Text extraction support (library required)
- **HTML/XML**: Tag stripping with clean text output
- **JSON**: Pretty-printed formatting
- **CSV**: Direct text output
- **Encoding Detection**: UTF-8, UTF-16 BOM detection

## ⚡ **Performance Optimizations**

### **Caching Strategy**
```typescript
// Different TTL for different data types
const cacheConfig = {
  sites: 60 * 60 * 1000,        // 1 hour
  folders: 5 * 60 * 1000,       // 5 minutes
  fileContent: 10 * 60 * 1000,  // 10 minutes
  searchResults: 2 * 60 * 1000  // 2 minutes
};

// Cache warming on startup
await cache.warmUp(
  () => service.getSites(),
  () => service.getUserDrive()
);
```

### **Batch Operations**
```typescript
// Batch multiple requests
const requests = [
  { id: '1', method: 'GET', url: '/drives/1/items/root/children' },
  { id: '2', method: 'GET', url: '/drives/2/items/root/children' }
];

const responses = await client.batchRequests(requests);
```

### **Smart Retry**
```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504]
};
```

## 🛡️ **Error Handling**

### **Error Types**
```typescript
class SharePointError extends Error {
  code: string;           // ERROR_CODE
  statusCode?: number;    // HTTP status
  innerError?: any;       // Graph API inner error
  retryAfter?: number;    // Retry delay for 429 errors
}
```

### **Common Error Scenarios**
- **Authentication**: Token expired, insufficient permissions
- **Rate Limiting**: 429 with automatic retry
- **File Size**: Exceeds service limits
- **File Type**: Unsupported for operation
- **Network**: Connection failures with retry
- **API**: SharePoint service errors

### **Error Recovery**
```typescript
try {
  const content = await service.downloadFile(driveId, itemId, true);
} catch (error) {
  if (error instanceof SharePointError) {
    switch (error.code) {
      case 'FILE_TOO_LARGE':
        console.log('File exceeds size limit');
        break;
      case 'NETWORK_ERROR':
        console.log('Connection failed, will retry');
        break;
      default:
        console.log(`SharePoint error: ${error.message}`);
    }
  }
}
```

## 🔒 **Security Features**

### **File Validation**
- **Size Limits**: Per-type and global size restrictions
- **Type Validation**: MIME type and extension checking
- **Content Scanning**: Safe text extraction
- **Access Control**: Authentication-based access

### **Safe Operations**
- **Input Sanitization**: Clean file names and paths
- **Error Isolation**: Prevent error information leakage
- **Resource Limits**: Memory and processing constraints
- **Audit Logging**: Operation tracking

## 📊 **Monitoring & Diagnostics**

### **Cache Statistics**
```json
{
  "size": 245,
  "maxSize": 1000,
  "hitRate": 0.85,
  "enabled": true
}
```

### **Service Metrics**
- **Request Count**: Total API calls made
- **Error Rate**: Failed requests percentage  
- **Cache Efficiency**: Hit/miss ratios
- **Processing Time**: Operation durations
- **File Types**: Usage distribution

### **Health Checks**
```typescript
// Service health endpoint
GET /api/sharepoint-advanced/cache/stats

// Response includes:
// - Cache performance
// - Active connections
// - Error rates
// - Processing queues
```

## 🚀 **Deployment & Configuration**

### **Environment Variables**
```env
# Required
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret  
AZURE_TENANT_ID=your_tenant_id

# Optional service configuration
SHAREPOINT_CACHE_TTL=300000          # 5 minutes
SHAREPOINT_CACHE_SIZE=1000           # Max cached items
SHAREPOINT_MAX_FILE_SIZE=104857600   # 100MB
SHAREPOINT_RETRY_MAX=3               # Max retries
SHAREPOINT_TEXT_EXTRACTION=true      # Enable text extraction
```

### **Production Considerations**
- **Redis Cache**: Replace in-memory cache with Redis
- **File Storage**: Use Azure Blob Storage for large files
- **Scaling**: Implement connection pooling
- **Monitoring**: Add application insights
- **Security**: Implement rate limiting per user
- **Backup**: Cache warm-up on startup

### **Performance Tuning**
- **Cache Size**: Adjust based on memory availability
- **TTL Values**: Balance freshness vs performance
- **Retry Policy**: Tune for your network conditions
- **File Size Limits**: Set appropriate boundaries
- **Batch Size**: Optimize for your workload

The SharePoint service provides enterprise-grade functionality for comprehensive SharePoint and OneDrive integration! 🎉