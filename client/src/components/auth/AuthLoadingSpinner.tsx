import React from 'react';

interface AuthLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const AuthLoadingSpinner: React.FC<AuthLoadingSpinnerProps> = ({
  message = "Loading...",
  size = 'md',
  fullScreen = false,
  className = ""
}) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md', 
    lg: 'spinner-lg'
  };

  return (
    <div className={`auth-loading ${fullScreen ? 'fullscreen' : ''} ${className}`}>
      <div className="loading-content">
        <div className={`loading-spinner ${sizeClasses[size]}`}>
          <div className="spinner-ring">
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
          </div>
        </div>
        
        {message && (
          <div className="loading-message">
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .auth-loading.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          z-index: 9999;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner-ring {
          display: inline-block;
          position: relative;
        }

        .spinner-sm .spinner-ring {
          width: 24px;
          height: 24px;
        }

        .spinner-md .spinner-ring {
          width: 40px;
          height: 40px;
        }

        .spinner-lg .spinner-ring {
          width: 56px;
          height: 56px;
        }

        .spinner-circle {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top: 3px solid #0078d4;
          border-radius: 50%;
          animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .spinner-sm .spinner-circle {
          border-width: 2px;
          border-top-color: #0078d4;
        }

        .spinner-circle:nth-child(1) {
          animation-delay: -0.45s;
        }

        .spinner-circle:nth-child(2) {
          animation-delay: -0.3s;
        }

        .spinner-circle:nth-child(3) {
          animation-delay: -0.15s;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-message {
          color: #605e5c;
          font-size: 0.9rem;
          text-align: center;
          max-width: 300px;
          line-height: 1.4;
        }

        .spinner-sm + .loading-message {
          font-size: 0.8rem;
        }

        .spinner-lg + .loading-message {
          font-size: 1rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};