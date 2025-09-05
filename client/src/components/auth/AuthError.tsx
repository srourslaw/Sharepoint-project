import React from 'react';
import { AuthError as AuthErrorType } from '../../types/auth';

interface AuthErrorProps {
  error: AuthErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = false,
  className = ""
}) => {
  const getErrorIcon = (code: string): string => {
    switch (code) {
      case 'NETWORK_ERROR':
        return '📡';
      case 'TIMEOUT':
        return '⏱️';
      case 'UNAUTHORIZED':
      case 'INVALID_SESSION':
        return '🔒';
      case 'FORBIDDEN':
        return '🚫';
      case 'TOKEN_REFRESH_FAILED':
        return '🔄';
      case 'OAUTH_ERROR':
        return '🔑';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'TIMEOUT':
        return 'Request Timed Out';
      case 'UNAUTHORIZED':
        return 'Authentication Required';
      case 'INVALID_SESSION':
        return 'Session Expired';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'TOKEN_REFRESH_FAILED':
        return 'Token Refresh Failed';
      case 'OAUTH_ERROR':
        return 'Authentication Error';
      case 'CONFIGURATION_ERROR':
        return 'Configuration Error';
      default:
        return 'Error';
    }
  };

  const getSuggestion = (code: string): string => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'TIMEOUT':
        return 'The request took too long to complete. Please try again.';
      case 'UNAUTHORIZED':
      case 'INVALID_SESSION':
        return 'Your session has expired. Please sign in again.';
      case 'FORBIDDEN':
        return 'You don\'t have permission to access this resource.';
      case 'TOKEN_REFRESH_FAILED':
        return 'We couldn\'t refresh your authentication. Please sign in again.';
      case 'OAUTH_ERROR':
        return 'There was a problem with Microsoft authentication. Please try again.';
      case 'CONFIGURATION_ERROR':
        return 'There\'s a configuration issue. Please contact support.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  const shouldShowRetry = (code: string): boolean => {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'TOKEN_REFRESH_FAILED',
      'OAUTH_ERROR'
    ];
    return showRetry && retryableCodes.includes(code);
  };

  return (
    <div className={`auth-error ${className}`}>
      <div className="error-content">
        {/* Header */}
        <div className="error-header">
          <div className="error-icon">
            {getErrorIcon(error.code)}
          </div>
          <div className="error-title">
            {getErrorTitle(error.code)}
          </div>
          {onDismiss && (
            <button 
              className="error-close"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          )}
        </div>

        {/* Message */}
        <div className="error-body">
          <div className="error-message">
            {error.message}
          </div>
          <div className="error-suggestion">
            {getSuggestion(error.code)}
          </div>
        </div>

        {/* Technical Details */}
        <details className="error-details">
          <summary>Technical Details</summary>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Error Code:</span>
              <span className="detail-value">{error.code}</span>
            </div>
            {error.statusCode && (
              <div className="detail-row">
                <span className="detail-label">Status Code:</span>
                <span className="detail-value">{error.statusCode}</span>
              </div>
            )}
            {error.timestamp && (
              <div className="detail-row">
                <span className="detail-label">Timestamp:</span>
                <span className="detail-value">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </details>

        {/* Actions */}
        {(shouldShowRetry(error.code) || onDismiss) && (
          <div className="error-actions">
            {shouldShowRetry(error.code) && onRetry && (
              <button 
                className="error-action retry"
                onClick={onRetry}
              >
                <span className="action-icon">🔄</span>
                Try Again
              </button>
            )}
            {onDismiss && (
              <button 
                className="error-action dismiss"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 500px;
        }

        .error-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .error-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .error-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .error-title {
          flex: 1;
          font-size: 1.1rem;
          font-weight: 600;
          color: #dc2626;
          line-height: 1.3;
        }

        .error-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .error-close:hover {
          background: rgba(156, 163, 175, 0.1);
          color: #6b7280;
        }

        .error-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .error-message {
          color: #7f1d1d;
          font-size: 0.9rem;
          line-height: 1.4;
          font-weight: 500;
        }

        .error-suggestion {
          color: #991b1b;
          font-size: 0.85rem;
          line-height: 1.3;
        }

        .error-details {
          border-top: 1px solid #fecaca;
          padding-top: 1rem;
        }

        .error-details summary {
          color: #7f1d1d;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .error-details summary:hover {
          background: rgba(127, 29, 29, 0.05);
        }

        .error-details summary::before {
          content: '▶';
          font-size: 0.75rem;
          transition: transform 0.2s ease;
        }

        .error-details[open] summary::before {
          transform: rotate(90deg);
        }

        .details-content {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: rgba(254, 202, 202, 0.3);
          border-radius: 6px;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          color: #7f1d1d;
          font-weight: 500;
        }

        .detail-value {
          color: #991b1b;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.75rem;
        }

        .error-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #fecaca;
        }

        .error-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1px solid transparent;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-action.retry {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
        }

        .error-action.retry:hover {
          background: #b91c1c;
          border-color: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .error-action.dismiss {
          background: white;
          color: #7f1d1d;
          border-color: #fecaca;
        }

        .error-action.dismiss:hover {
          background: #fef2f2;
          border-color: #f87171;
        }

        .action-icon {
          font-size: 1rem;
        }

        @media (max-width: 480px) {
          .auth-error {
            padding: 1rem;
          }

          .error-header {
            gap: 0.5rem;
          }

          .error-actions {
            flex-direction: column;
          }

          .error-action {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};