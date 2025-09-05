# Microsoft Graph API Authentication Setup

This document explains the complete Microsoft Graph API authentication implementation for the SharePoint Dashboard.

## Overview

The authentication system implements OAuth 2.0 Authorization Code flow with PKCE for secure Microsoft Graph API access. It includes:

- ✅ OAuth 2.0 Authorization Code flow with PKCE
- ✅ Automatic token refresh management
- ✅ Session-based authentication
- ✅ Protected route middleware
- ✅ Comprehensive error handling
- ✅ SharePoint/OneDrive API integration

## Architecture

### Core Components

1. **AuthService** (`src/services/authService.ts`)
   - Handles OAuth 2.0 flow
   - Manages token lifecycle
   - Provides Microsoft Graph client instances

2. **AuthMiddleware** (`src/middleware/authMiddleware.ts`)
   - Protects API routes
   - Validates sessions
   - Handles authentication errors

3. **Configuration** (`src/utils/config.ts`)
   - Environment variable management
   - Configuration validation

4. **Routes** (`src/routes/auth.ts`, `src/routes/sharepoint.ts`)
   - Authentication endpoints
   - Protected SharePoint API endpoints

## Microsoft App Registration Setup

To use this authentication system, you need to register an application in Azure AD:

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: SharePoint Dashboard
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web - `http://localhost:3001/auth/callback`

### 2. Configure Application

#### API Permissions
Add the following Microsoft Graph permissions:
- `openid` (delegated)
- `profile` (delegated)
- `email` (delegated)
- `User.Read` (delegated)
- `Sites.Read.All` (delegated)
- `Files.Read.All` (delegated)
- `offline_access` (delegated)

#### Authentication Settings
1. Go to **Authentication** tab
2. Add redirect URI: `http://localhost:3001/auth/callback`
3. Enable **Access tokens** and **ID tokens**
4. Configure **Implicit grant and hybrid flows**

#### Certificates & secrets
1. Go to **Certificates & secrets** tab
2. Click **New client secret**
3. Add description and set expiration
4. Copy the secret value (you won't see it again!)

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# Microsoft Graph API
AZURE_CLIENT_ID="your_application_client_id"
AZURE_CLIENT_SECRET="your_client_secret"
AZURE_TENANT_ID="your_tenant_id"
AZURE_REDIRECT_URI="http://localhost:3001/auth/callback"
GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
SESSION_SECRET="your_secure_session_secret"

# Google Gemini API (if using)
GEMINI_API_KEY="your_gemini_api_key"
```

## API Endpoints

### Authentication Endpoints

#### `GET /auth/login`
Initiates the OAuth 2.0 login flow.

**Query Parameters:**
- `state` (optional): State parameter for CSRF protection

**Response:**
```json
{
  "success": true,
  "authUrl": "https://login.microsoftonline.com/...",
  "message": "Authorization URL generated successfully"
}
```

#### `GET /auth/callback`
Handles the OAuth 2.0 callback from Microsoft.

**Query Parameters:**
- `code`: Authorization code from Microsoft
- `state`: State parameter for verification

**Response:**
```json
{
  "success": true,
  "sessionId": "session_12345_abc123",
  "message": "Authentication successful",
  "user": {
    "id": "user-id",
    "displayName": "John Doe",
    "mail": "john@company.com",
    "userPrincipalName": "john@company.onmicrosoft.com"
  }
}
```

#### `GET /auth/me`
Get current authenticated user information (protected route).

**Headers:**
- `Authorization: Bearer <sessionId>` or
- `x-session-id: <sessionId>` or
- Cookie: `session-id=<sessionId>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "displayName": "John Doe",
    "mail": "john@company.com",
    "userPrincipalName": "john@company.onmicrosoft.com"
  },
  "session": {
    "id": "session_12345_abc123",
    "hasValidToken": true
  }
}
```

#### `POST /auth/refresh`
Refresh access tokens.

**Body:**
```json
{
  "sessionId": "session_12345_abc123"
}
```

#### `POST /auth/logout`
Logout and revoke session.

#### `GET /auth/status`
Check current authentication status.

### Protected SharePoint Endpoints

#### `GET /api/sharepoint/sites`
Get SharePoint sites accessible to the user.

**Requires:** Authentication + `Sites.Read.All` permission

#### `GET /api/sharepoint/files`
Get files from user's OneDrive.

**Requires:** Authentication + `Files.Read.All` permission

#### `GET /api/sharepoint/site/:siteId/lists`
Get lists from a specific SharePoint site.

**Requires:** Authentication + `Sites.Read.All` permission

## Authentication Flow

### 1. Frontend Initiated Login
```javascript
// Frontend calls
const response = await fetch('/auth/login');
const { authUrl } = await response.json();

// Redirect user to authUrl
window.location.href = authUrl;
```

### 2. Microsoft Authentication
User authenticates with Microsoft and is redirected to `/auth/callback`

### 3. Token Exchange
Server exchanges authorization code for access tokens and creates session

### 4. Protected API Calls
```javascript
// Frontend makes authenticated requests
const response = await fetch('/api/sharepoint/sites', {
  headers: {
    'x-session-id': sessionId
  }
});
```

## Middleware Usage

### Protecting Routes

```typescript
// Require authentication
app.get('/api/protected', authMiddleware.requireAuth, (req, res) => {
  // req.user contains user info
  // req.session contains session info
  res.json({ user: req.user });
});

// Optional authentication
app.get('/api/optional', authMiddleware.optionalAuth, (req, res) => {
  // req.user may or may not be present
  res.json({ 
    authenticated: !!req.user,
    user: req.user 
  });
});

// Require specific permissions
app.get('/api/sites', 
  authMiddleware.requireAuth,
  authMiddleware.requireScope('Sites.Read.All'),
  (req, res) => {
    // Access granted only if user has required permissions
  }
);
```

## Error Handling

The system provides comprehensive error handling:

### Authentication Errors
- `MISSING_SESSION`: No session provided
- `INVALID_SESSION`: Session expired or invalid
- `TOKEN_REFRESH_FAILED`: Failed to refresh tokens
- `INSUFFICIENT_SCOPE`: Missing required permissions

### OAuth Errors
- `AUTH_URL_GENERATION_FAILED`: Failed to generate auth URL
- `TOKEN_EXCHANGE_FAILED`: Failed to exchange auth code
- `OAUTH_ERROR`: OAuth provider error

### API Errors
All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "statusCode": 400,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Security Features

### Token Security
- Automatic token refresh before expiration
- Secure session storage (in-memory)
- HTTP-only cookies in production
- CSRF protection with state parameters

### CORS Configuration
- Configured for frontend origin
- Credentials support enabled
- Secure headers enforced

### Session Management
- Automatic cleanup of expired sessions
- Secure session ID generation
- Multiple authentication methods (header, cookie, query)

## Testing the Setup

### 1. Start the Server
```bash
npm run dev --workspace=server
```

### 2. Test Health Check
```bash
curl http://localhost:3001/health
```

### 3. Test Authentication Flow
```bash
# Get login URL
curl http://localhost:3001/auth/login

# Visit the returned authUrl in browser
# After authentication, you'll be redirected to /auth/callback

# Test protected route
curl -H "x-session-id: YOUR_SESSION_ID" http://localhost:3001/api/protected
```

## Production Considerations

### Environment Variables
- Use strong, unique values for all secrets
- Set `NODE_ENV=production`
- Configure secure session secrets
- Use HTTPS redirect URIs

### Security
- Enable HTTPS in production
- Set secure cookie flags
- Configure proper CORS origins
- Implement rate limiting
- Add request logging
- Use persistent session storage (Redis, database)

### Monitoring
- Add application insights
- Monitor token refresh rates
- Track authentication failures
- Set up alerts for errors

## Troubleshooting

### Common Issues

1. **"Configuration validation failed"**
   - Check all required environment variables are set
   - Verify Azure app registration details

2. **"Failed to exchange authorization code"**
   - Check redirect URI matches exactly
   - Verify client secret is correct
   - Ensure app registration is configured properly

3. **"Session not found or expired"**
   - Session may have expired (24 hours default)
   - Try re-authenticating

4. **Microsoft Graph API errors**
   - Check if required permissions are granted
   - Verify admin consent for application permissions
   - Ensure user has necessary access rights

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.