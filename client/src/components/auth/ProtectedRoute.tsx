import React from 'react';
import { useProtectedRoute } from '../../hooks/useAuth';
import { AuthLoadingSpinner } from './AuthLoadingSpinner';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectPath?: string;
  requireAuth?: boolean;
  className?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectPath = '/login',
  requireAuth = true,
  className = ""
}) => {
  const { isAuthenticated, isLoading, hasAccess } = useProtectedRoute(redirectPath);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <AuthLoadingSpinner 
        message="Checking authentication..."
        fullScreen
      />
    );
  }

  // If authentication is not required, always render children
  if (!requireAuth) {
    return <div className={className}>{children}</div>;
  }

  // If user has access, render children
  if (hasAccess && isAuthenticated) {
    return <div className={className}>{children}</div>;
  }

  // Show fallback or login form if not authenticated
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <LoginForm
        title="Access Required"
        subtitle="Please sign in with your Microsoft account to access this content"
      />
    </div>
  );
};