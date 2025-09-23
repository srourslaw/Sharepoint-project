import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create a basic theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0078d4',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Dashboard that uses AuthContext
const AuthAwareDashboard: React.FC = () => {
  const { user, isLoading, error } = useAuth();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Auth-Aware Dashboard - Step 2
      </Typography>
      <Typography variant="body1">
        Testing AuthContext integration.
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          Loading: {String(isLoading)}
        </Typography>
        <Typography variant="body2">
          Error: {error || 'None'}
        </Typography>
        <Typography variant="body2">
          User: {user ? user.displayName : 'Not logged in'}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
        If this works, AuthContext is not the issue.
      </Typography>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="*" element={<AuthAwareDashboard />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;