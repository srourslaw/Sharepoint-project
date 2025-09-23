import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

// Simple Dashboard component without SharePoint functionality
const SimpleDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Simple Dashboard - Step 1
      </Typography>
      <Typography variant="body1">
        Basic React Router + Material-UI theme setup.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
        If this works, we can add more components gradually.
      </Typography>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="*" element={<SimpleDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;