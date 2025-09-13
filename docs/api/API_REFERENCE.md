# API Reference 📚

Complete REST API documentation for the SharePoint AI Dashboard backend.

## 🌐 **Base URL**

```
Production:  https://your-domain.com/api
Development: http://localhost:3001/api
```

## 🔐 **Authentication**

All API endpoints (except `/auth/*` and `/health`) require authentication.

### **Authentication Header**
```http
Authorization: Bearer <jwt_token>
```

### **Getting Access Token**
```http
POST /api/auth/login
Content-Type: application/json

{
  "code": "azure_oauth_code",
  "state": "random_state_string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "displayName": "John Doe",
      "roles": ["user"]
    },
    "expiresIn": 86400
  }
}
```

---

## 🏥 **Health & System**

### **GET /api/health**
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-13T12:00:00.000Z",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "sharepoint": "connected"
  }
}
```

---

## 👤 **Authentication Endpoints**

### **POST /api/auth/login**
Authenticate user with Azure AD code.

**Request:**
```json
{
  "code": "azure_oauth_authorization_code",
  "state": "csrf_protection_state"
}
```

### **POST /api/auth/refresh**
Refresh JWT token.

**Request:**
```http
Authorization: Bearer <refresh_token>
```

### **POST /api/auth/logout**
Logout and invalidate tokens.

**Request:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📁 **SharePoint Files API**

### **GET /api/sharepoint-advanced/sites**
Get all accessible SharePoint sites.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "site-uuid",
      "displayName": "Company Portal",
      "webUrl": "https://company.sharepoint.com/sites/portal",
      "description": "Main company portal site",
      "createdDateTime": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### **GET /api/sharepoint-advanced/sites/:siteId/libraries**
Get document libraries for a specific site.

**Parameters:**
- `siteId` (string): SharePoint site ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "library-uuid",
      "name": "Documents",
      "displayName": "Shared Documents",
      "webUrl": "https://company.sharepoint.com/sites/portal/Documents",
      "itemCount": 157,
      "parentSite": {
        "id": "site-uuid",
        "displayName": "Company Portal"
      }
    }
  ]
}
```

### **GET /api/sharepoint-advanced/libraries/:libraryId/files**
Get files and folders in a library.

**Parameters:**
- `libraryId` (string): Document library ID

**Query Parameters:**
- `path` (string, optional): Folder path
- `search` (string, optional): Search query
- `limit` (number, optional): Number of items (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "file-uuid",
        "name": "document.pdf",
        "displayName": "Important Document.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "extension": "pdf",
        "isFolder": false,
        "webUrl": "https://company.sharepoint.com/sites/portal/Documents/document.pdf",
        "downloadUrl": "https://graph.microsoft.com/v1.0/drives/...",
        "thumbnailUrl": "https://graph.microsoft.com/v1.0/drives/.../thumbnail",
        "createdDateTime": "2025-09-01T10:00:00Z",
        "modifiedDateTime": "2025-09-10T15:30:00Z",
        "createdBy": {
          "displayName": "John Doe",
          "email": "john@company.com"
        },
        "modifiedBy": {
          "displayName": "Jane Smith",
          "email": "jane@company.com"
        }
      }
    ],
    "pagination": {
      "total": 157,
      "limit": 50,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

### **GET /api/sharepoint-advanced/files/:fileId**
Get file metadata.

**Parameters:**
- `fileId` (string): File ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "name": "document.pdf",
    "displayName": "Important Document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "extension": "pdf",
    "webUrl": "https://company.sharepoint.com/.../document.pdf",
    "downloadUrl": "https://graph.microsoft.com/v1.0/drives/...",
    "parentFolder": {
      "id": "folder-uuid",
      "name": "Reports",
      "path": "/Reports"
    }
  }
}
```

### **GET /api/sharepoint-advanced/files/:fileId/content**
Download file content.

**Parameters:**
- `fileId` (string): File ID

**Response:**
- Binary file content with appropriate `Content-Type` header
- For images: Returns image data
- For PDFs: Returns PDF data
- For Office docs: Returns file content

### **GET /api/sharepoint-advanced/files/:fileId/text**
Extract text content from file.

**Parameters:**
- `fileId` (string): File ID

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Extracted text content from the document...",
    "wordCount": 450,
    "language": "en",
    "extractedAt": "2025-09-13T12:00:00Z"
  }
}
```

### **GET /api/sharepoint-advanced/files/:fileId/download**
Download file with proper headers.

**Parameters:**
- `fileId` (string): File ID

**Response:**
- File download with `Content-Disposition: attachment` header

---

## 🤖 **AI Processing API**

### **POST /api/ai/analyze**
Analyze document content with AI.

**Request:**
```json
{
  "fileId": "file-uuid",
  "analysisType": "summary|sentiment|keywords|translation",
  "options": {
    "language": "en",
    "maxLength": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "type": "summary",
      "result": "This document discusses...",
      "confidence": 0.95,
      "processingTime": 1.23,
      "model": "gpt-4"
    },
    "metadata": {
      "fileId": "file-uuid",
      "processedAt": "2025-09-13T12:00:00Z",
      "wordCount": 450
    }
  }
}
```

### **POST /api/ai/chat**
Chat with AI about documents.

**Request:**
```json
{
  "message": "What are the key points in this document?",
  "context": {
    "fileIds": ["file-uuid-1", "file-uuid-2"],
    "conversationId": "conversation-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the documents, the key points are...",
    "sources": [
      {
        "fileId": "file-uuid-1",
        "fileName": "report.pdf",
        "relevance": 0.89
      }
    ],
    "conversationId": "conversation-uuid",
    "messageId": "message-uuid"
  }
}
```

---

## 📊 **Analytics API**

### **GET /api/analytics/usage**
Get usage analytics.

**Query Parameters:**
- `period` (string): `day|week|month|year`
- `startDate` (string): ISO date string
- `endDate` (string): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "metrics": {
      "totalUsers": 45,
      "activeUsers": 32,
      "documentsViewed": 1250,
      "searchQueries": 456,
      "aiInteractions": 189
    },
    "trends": {
      "userGrowth": 0.12,
      "documentViewGrowth": 0.05,
      "aiUsageGrowth": 0.23
    }
  }
}
```

### **GET /api/analytics/files/popular**
Get most popular files.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fileId": "file-uuid",
      "fileName": "monthly-report.pdf",
      "viewCount": 45,
      "downloadCount": 12,
      "lastAccessed": "2025-09-13T10:30:00Z"
    }
  ]
}
```

---

## 📂 **Recent Files API**

### **GET /api/recent/files**
Get user's recent files.

**Query Parameters:**
- `limit` (number): Number of files (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fileId": "file-uuid",
      "fileName": "document.pdf",
      "lastAccessed": "2025-09-13T11:45:00Z",
      "accessType": "view|download|edit",
      "parentLibrary": "Documents",
      "parentSite": "Company Portal"
    }
  ]
}
```

### **POST /api/recent/files**
Add file to recent files.

**Request:**
```json
{
  "fileId": "file-uuid",
  "accessType": "view"
}
```

---

## 🔍 **Search API**

### **GET /api/search**
Global search across all accessible content.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): `files|folders|all`
- `site` (string): Filter by site ID
- `library` (string): Filter by library ID
- `limit` (number): Results limit (default: 20)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "file-uuid",
        "type": "file",
        "title": "Monthly Report - September 2025",
        "snippet": "This report covers key metrics...",
        "url": "https://company.sharepoint.com/.../report.pdf",
        "relevance": 0.95,
        "lastModified": "2025-09-10T15:30:00Z"
      }
    ],
    "total": 23,
    "query": "monthly report",
    "searchTime": 0.15
  }
}
```

---

## 👥 **User Management API**

### **GET /api/users/profile**
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@company.com",
    "displayName": "John Doe",
    "roles": ["user", "admin"],
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications": true
    },
    "lastLogin": "2025-09-13T09:00:00Z"
  }
}
```

### **PUT /api/users/profile**
Update user profile.

**Request:**
```json
{
  "displayName": "John Doe",
  "preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

---

## ❌ **Error Responses**

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2025-09-13T12:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service error |

---

## 📊 **Rate Limiting**

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| File Access | 100 requests | 1 minute |
| AI Processing | 10 requests | 1 minute |
| Search | 30 requests | 1 minute |
| General API | 1000 requests | 1 hour |

---

## 🧪 **Testing the API**

### **Using cURL**
```bash
# Get access token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code": "auth_code", "state": "state"}'

# Use the API
curl -X GET http://localhost:3001/api/sharepoint-advanced/sites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Using Postman**
Import the Postman collection from `docs/api/postman-collection.json`

---

*API Version: 2.0 | Last Updated: September 13, 2025*