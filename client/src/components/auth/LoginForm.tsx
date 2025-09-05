import React from 'react';
import { useLogin, useAuthError } from '../../hooks/useAuth';

interface LoginFormProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  title = "SharePoint Dashboard",
  subtitle = "Sign in with your Microsoft account to access your SharePoint data",
  onSuccess,
  className = ""
}) => {
  const { login, isLoading, loginAttempted } = useLogin();
  const { error, dismissError } = useAuthError();

  const handleLogin = async () => {
    try {
      await login();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context and useAuthError hook
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={`auth-container ${className}`}>
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="microsoft-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00a4ef"/>
                <rect x="13" y="13" width="10" height="10" fill="#ffb900"/>
              </svg>
            </div>
            <h1 className="auth-title">{title}</h1>
          </div>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="auth-error">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-details">
                <strong>{error.code}</strong>
                <p>{error.message}</p>
              </div>
              <button 
                className="error-dismiss"
                onClick={dismissError}
                type="button"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Login Button */}
        <div className="auth-form">
          <button
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            onClick={handleLogin}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                <span>Redirecting to Microsoft...</span>
              </div>
            ) : loginAttempted ? (
              <div className="button-content">
                <span>🔄 Retry Sign In</span>
              </div>
            ) : (
              <div className="button-content">
                <div className="microsoft-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                    <rect x="13" y="1" width="10" height="10" fill="#7fba00"/>
                    <rect x="1" y="13" width="10" height="10" fill="#00a4ef"/>
                    <rect x="13" y="13" width="10" height="10" fill="#ffb900"/>
                  </svg>
                </div>
                <span>Sign in with Microsoft</span>
              </div>
            )}
          </button>

          <div className="auth-help">
            <p>
              You'll be redirected to Microsoft to sign in securely. 
              After authentication, you'll be brought back here.
            </p>
          </div>

          {/* Features List */}
          <div className="auth-features">
            <h3>What you'll get access to:</h3>
            <ul>
              <li>📁 Your SharePoint sites and documents</li>
              <li>📊 OneDrive files and folders</li>
              <li>👥 Team collaboration spaces</li>
              <li>🔒 Secure, read-only access</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
          padding: 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .auth-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          max-width: 440px;
          width: 100%;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .microsoft-logo svg {
          width: 32px;
          height: 32px;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #323130;
          margin: 0;
        }

        .auth-subtitle {
          color: #605e5c;
          font-size: 0.9rem;
          line-height: 1.4;
          margin: 0;
        }

        .auth-error {
          margin-bottom: 1.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .error-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .error-details {
          flex: 1;
        }

        .error-details strong {
          color: #dc2626;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .error-details p {
          color: #7f1d1d;
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
          line-height: 1.3;
        }

        .error-dismiss {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
        }

        .error-dismiss:hover {
          color: #374151;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .auth-button {
          width: 100%;
          background: #0078d4;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.875rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-button:hover:not(:disabled) {
          background: #106ebe;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .button-loading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .microsoft-icon svg {
          width: 20px;
          height: 20px;
        }

        .auth-help {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .auth-help p {
          color: #605e5c;
          font-size: 0.8rem;
          line-height: 1.4;
          margin: 0;
        }

        .auth-features {
          border-top: 1px solid #edebe9;
          padding-top: 1.5rem;
        }

        .auth-features h3 {
          color: #323130;
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .auth-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .auth-features li {
          color: #605e5c;
          font-size: 0.85rem;
          line-height: 1.3;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 1rem;
          }
          
          .auth-card {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
};