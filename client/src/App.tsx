// MUST BE FIRST: Fix console.log object rendering issue
import './utils/disableConsole';

import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Button, CircularProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from './components/Dashboard.debug';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthLoadingSpinner } from './components/auth/AuthLoadingSpinner';
import { AuthError } from './components/auth/AuthError';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Create a custom theme for the application
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0078d4', // Microsoft Blue
      light: '#106ebe',
      dark: '#005a9e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8764b8', // Microsoft Purple
      light: '#a47dd6',
      dark: '#6b4c96',
      contrastText: '#ffffff',
    },
    background: {
      default: '#faf9f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#323130',
      secondary: '#605e5c',
    },
    divider: '#edebe9',
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    caption: {
      fontSize: '0.6875rem',
      lineHeight: 1.3,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0078d4',
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f3f2f1',
          borderRight: '1px solid #edebe9',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 120, 212, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: '#0078d4',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#106ebe',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
            },
            '& .MuiTypography-root': {
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)',
          borderRadius: '8px',
          border: '1px solid #edebe9',
          '&:hover': {
            boxShadow: '0 6.4px 14.4px 0 rgba(0,0,0,0.132), 0 1.2px 3.6px 0 rgba(0,0,0,0.108)',
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '4px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)',
          '&:hover': {
            boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,0.132), 0 0.6px 1.8px 0 rgba(0,0,0,0.108)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0078d4',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0078d4',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: '48px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)',
        },
        elevation1: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)',
        },
        elevation2: {
          boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,0.132), 0 0.6px 1.8px 0 rgba(0,0,0,0.108)',
        },
        elevation4: {
          boxShadow: '0 6.4px 14.4px 0 rgba(0,0,0,0.132), 0 1.2px 3.6px 0 rgba(0,0,0,0.108)',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Responsive theme adjustments
const responsiveTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          [theme.breakpoints.up('sm')]: {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
          [theme.breakpoints.up('lg')]: {
            paddingLeft: '32px',
            paddingRight: '32px',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          ...theme.components?.MuiDrawer?.styleOverrides?.paper,
          [theme.breakpoints.down('md')]: {
            width: '280px',
          },
          [theme.breakpoints.up('md')]: {
            width: '300px',
          },
          [theme.breakpoints.up('lg')]: {
            width: '320px',
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        item: {
          [theme.breakpoints.down('sm')]: {
            minWidth: '100%',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...theme.components?.MuiCard?.styleOverrides?.root,
          [theme.breakpoints.down('sm')]: {
            margin: '4px',
          },
          [theme.breakpoints.up('sm')]: {
            margin: '8px',
          },
        },
      },
    },
  },
});

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider theme={responsiveTheme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
