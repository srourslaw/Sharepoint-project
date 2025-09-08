import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 REACT ERROR BOUNDARY CAUGHT:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorInfo
    });
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">React Error Caught!</Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Error:</strong> {String(this.state.error?.message || 'Unknown error')}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <strong>Stack:</strong><br />
            {String(this.state.error?.stack || 'No stack trace')}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <strong>Component Stack:</strong><br />
            {String(this.state.errorInfo?.componentStack || 'No component stack')}
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}