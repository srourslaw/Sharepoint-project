# React Authentication Component Guide

This guide explains the complete React authentication system that integrates with Microsoft Graph API for the SharePoint dashboard.

## 🚀 **Complete Implementation Summary**

The React authentication system provides:

✅ **Secure Microsoft OAuth 2.0 Integration**
✅ **Token Storage & Management** 
✅ **Authentication Context & Hooks**
✅ **Loading States & Error Handling**
✅ **Protected Routes**
✅ **User Profile Management**
✅ **Session Persistence**
✅ **TypeScript Support**

## 📁 **Project Structure**

```
client/src/
├── components/auth/
│   ├── index.ts                    # Main exports
│   ├── SimpleLoginForm.tsx         # Login component
│   ├── LoginForm.tsx              # Full-featured login (styled-jsx)
│   ├── UserProfile.tsx            # User profile with dropdown
│   ├── AuthLoadingSpinner.tsx     # Loading states
│   ├── AuthError.tsx              # Error handling component
│   └── ProtectedRoute.tsx         # Route protection
├── contexts/
│   └── AuthContext.tsx            # Auth context & provider
├── hooks/
│   └── useAuth.ts                 # Authentication hooks
├── services/
│   └── authApi.ts                 # API communication
├── utils/
│   └── authStorage.ts             # Secure token storage
├── types/
│   └── auth.ts                    # TypeScript definitions
└── App.tsx                        # Main app with auth integration
```

## 🔐 **Key Features**

### **1. Authentication Context**
- **Provider**: `AuthProvider` - Wraps the entire app
- **Global State**: User, loading, error states
- **Actions**: Login, logout, check status
- **Auto-refresh**: Token refresh and session validation

### **2. Secure Token Storage**
- **Session Storage**: Temporary session data
- **Local Storage**: Persistent session IDs
- **Cookie Fallback**: For cross-tab support
- **Expiration Handling**: Automatic cleanup

### **3. Authentication Hooks**
- `useAuth()` - Main authentication hook
- `useAuthenticatedRequest()` - API requests with auth
- `useLogin()` - Login state management
- `useLogout()` - Logout handling
- `useSharePoint()` - SharePoint-specific operations
- `useProtectedRoute()` - Route access control

### **4. Components**
- **SimpleLoginForm** - Clean, accessible login UI
- **UserProfile** - User info with dropdown menu
- **AuthError** - Comprehensive error display
- **AuthLoadingSpinner** - Loading states
- **ProtectedRoute** - Route-level protection

## 🔄 **Authentication Flow**

### **1. Initial Load**
```typescript
// App starts with AuthProvider
<AuthProvider>
  <AppContent />
</AuthProvider>

// AuthProvider automatically checks auth status
useEffect(() => {
  checkAuthStatus(); // Validates stored session
}, []);
```

### **2. Login Process**
```typescript
// User clicks "Sign in with Microsoft"
const login = async () => {
  // 1. Get Microsoft OAuth URL from backend
  const { authUrl } = await AuthApi.initiateLogin();
  
  // 2. Redirect to Microsoft
  window.location.href = authUrl;
  
  // 3. User authenticates with Microsoft
  // 4. Microsoft redirects back with auth code
  // 5. Backend exchanges code for tokens
  // 6. Frontend receives session ID and user info
};
```

### **3. Session Management**
```typescript
// Automatic token refresh
useEffect(() => {
  const interval = setInterval(async () => {
    if (AuthStorage.shouldRevalidate()) {
      await checkAuthStatus(); // Refresh if needed
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}, []);
```

### **4. Protected API Calls**
```typescript
// Automatically includes session headers
const makeRequest = async (endpoint: string) => {
  const sessionId = AuthStorage.getSessionId();
  
  return fetch(endpoint, {
    headers: {
      'x-session-id': sessionId,
      'Content-Type': 'application/json'
    }
  });
};
```

## 🛠 **Usage Examples**

### **Basic App Setup**
```typescript
import { AuthProvider } from './components/auth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<SimpleLoginForm />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### **Using Authentication in Components**
```typescript
import { useAuth, useSharePoint } from './components/auth';

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const { getSites, getFiles } = useSharePoint();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.displayName}!</h1>
      <button onClick={() => getSites()}>Get Sites</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### **Protected Routes**
```typescript
import { ProtectedRoute } from './components/auth';

const App = () => (
  <Routes>
    <Route path="/public" element={<PublicPage />} />
    <Route path="/private" element={
      <ProtectedRoute>
        <PrivatePage />
      </ProtectedRoute>
    } />
  </Routes>
);
```

### **Making Authenticated API Calls**
```typescript
import { useAuthenticatedRequest } from './components/auth';

const MyComponent = () => {
  const { makeRequest, isLoading, error } = useAuthenticatedRequest();
  
  const fetchData = async () => {
    try {
      const data = await makeRequest('/api/sharepoint/sites');
      console.log('Sites:', data);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={fetchData} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};
```

## 🎨 **UI Components**

### **Login Form**
```typescript
<SimpleLoginForm 
  title="My App"
  subtitle="Sign in to access your data"
  onSuccess={() => navigate('/dashboard')}
/>
```

### **User Profile**
```typescript
<UserProfile 
  showDetails={true}
  size="md"
  orientation="horizontal"
/>
```

### **Error Handling**
```typescript
<AuthError 
  error={error}
  showRetry={true}
  onRetry={() => retry()}
  onDismiss={() => clearError()}
/>
```

## 🔧 **Configuration**

### **Environment Variables**
```env
# client/.env
VITE_API_URL=http://localhost:3001
VITE_NODE_ENV=development
```

### **Backend Integration**
The React app communicates with these backend endpoints:
- `GET /auth/login` - Get OAuth URL
- `GET /auth/callback` - Handle OAuth callback  
- `GET /auth/status` - Check auth status
- `GET /auth/me` - Get user info
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh tokens

## 🚨 **Error Handling**

### **Error Types**
```typescript
interface AuthError {
  code: string;           // ERROR_CODE
  message: string;        // Human-readable message
  statusCode?: number;    // HTTP status code
  timestamp?: string;     // When error occurred
}
```

### **Common Error Codes**
- `NETWORK_ERROR` - Connection issues
- `INVALID_SESSION` - Session expired
- `TOKEN_REFRESH_FAILED` - Token refresh failed
- `OAUTH_ERROR` - Microsoft auth failed
- `UNAUTHORIZED` - Access denied

### **Error Recovery**
```typescript
const { error, dismissError } = useAuthError();

// Auto-dismiss after 5 seconds
useEffect(() => {
  if (error) {
    const timer = setTimeout(dismissError, 5000);
    return () => clearTimeout(timer);
  }
}, [error]);
```

## 🔒 **Security Features**

### **Token Security**
- HTTP-only session cookies in production
- Automatic token refresh before expiration
- Secure storage with expiration checks
- CSRF protection with state parameters

### **Session Management**
- In-memory session storage (development)
- Persistent session IDs across browser tabs
- Automatic cleanup of expired sessions
- Multiple authentication methods (header, cookie)

### **Request Security**
- CORS configuration for API calls
- Authenticated request headers
- Automatic retry with token refresh
- Error handling for auth failures

## 🧪 **Testing**

### **Running the App**
```bash
# Start the backend (required)
npm run dev --workspace=server

# Start the frontend
npm run dev --workspace=client

# Build for production
npm run build --workspace=client
```

### **Test Flow**
1. Visit `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. Authenticate with Microsoft account
4. Get redirected back to the app
5. See dashboard with user info
6. Test SharePoint API calls
7. Test logout functionality

## 📱 **Mobile & Responsive**

The authentication components are fully responsive:
- Mobile-friendly login form
- Responsive dashboard layout
- Touch-friendly buttons and interactions
- Proper viewport handling

## 🎯 **Best Practices**

### **State Management**
- Single source of truth with React Context
- Automatic state synchronization
- Error boundary for auth failures
- Loading states for better UX

### **Performance**
- Lazy loading of components
- Memoized context values
- Efficient re-renders
- Background token refresh

### **Accessibility**
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Error announcements

## 🔮 **Future Enhancements**

Potential improvements:
- **Persistent Storage** - Redis/database for sessions
- **Multi-tab Sync** - Broadcast channel API
- **Biometric Auth** - WebAuthn integration
- **SSO Integration** - Multiple identity providers
- **Audit Logging** - Authentication events
- **Rate Limiting** - Request throttling
- **Offline Support** - Service worker integration

## 🆘 **Troubleshooting**

### **Common Issues**

**"No session found"**
- Clear browser storage and retry
- Check if backend is running
- Verify API URL configuration

**"Token refresh failed"**
- Session may have expired (24h default)
- Re-authenticate through login flow
- Check backend token handling

**"CORS errors"**
- Verify backend CORS configuration
- Check API URL matches backend
- Ensure credentials are included

**"Redirect loop"**
- Clear browser cache and cookies
- Check redirect URI configuration
- Verify state parameter handling

The React authentication system provides a complete, secure, and user-friendly authentication experience for the SharePoint dashboard! 🎉