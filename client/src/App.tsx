// MUST BE FIRST: Fix console.log object rendering issue
import './utils/disableConsole';

import React from 'react';
import { CssBaseline, Box, Typography, Button, CircularProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from './components/Dashboard.debug';
import { SharePointTest } from './components/SharePointTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MSALAuthProvider } from './contexts/MSALAuthContext';
import { DynamicThemeProvider } from './contexts/DynamicThemeContext';
import { AuthLoadingSpinner } from './components/auth/AuthLoadingSpinner';
import { AuthError } from './components/auth/AuthError';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Theme is now managed by ThemeContextProvider

// Login Page Component
const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #0078d4 30%, #106ebe 90%)',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: 3,
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          SharePoint AI Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Connect to your SharePoint sites and documents
        </Typography>
        
        {error && <AuthError error={error} />}
        
        <Button
          variant="contained"
          size="large"
          onClick={login}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 2, width: '100%' }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </Button>
      </Box>
    </Box>
  );
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sites/:siteId" element={<Dashboard />} />
      <Route path="/sites/:siteId/libraries/:libraryId/*" element={<Dashboard />} />
      <Route path="/onedrive/*" element={<Dashboard />} />
      <Route path="/recent" element={<Dashboard />} />
      <Route path="/analytics" element={<Dashboard />} />
      <Route path="/people" element={<Dashboard />} />
      <Route path="/settings" element={<Dashboard />} />
      <Route path="/sharepoint-test" element={<SharePointTest />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <DynamicThemeProvider>
        <MSALAuthProvider>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </MSALAuthProvider>
      </DynamicThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
