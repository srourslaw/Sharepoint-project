import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error, errorInfo);
    console.error('🔴 Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, maxWidth: '100%' }}>
          <Alert severity="error">
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Error:</strong> {this.state.error?.message}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2, fontSize: '0.875rem', fontFamily: 'monospace' }}>
              <strong>Stack:</strong><br />
              {this.state.error?.stack}
            </Typography>
            
            {this.state.errorInfo && (
              <Typography variant="body2" sx={{ mb: 2, fontSize: '0.875rem', fontFamily: 'monospace' }}>
                <strong>Component Stack:</strong><br />
                {this.state.errorInfo.componentStack}
              </Typography>
            )}
            
            <Button variant="outlined" onClick={this.handleReset} sx={{ mt: 2 }}>
              Try Again
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}