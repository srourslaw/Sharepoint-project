import React from 'react';
import { useLogin, useAuthError } from '../../hooks/useAuth';

interface SimpleLoginFormProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  className?: string;
}

export const SimpleLoginForm: React.FC<SimpleLoginFormProps> = ({
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
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-blue-600 p-8 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="text-xl mr-3">⚠️</div>
              <div className="flex-1">
                <div className="font-semibold text-red-800">{error.code}</div>
                <p className="text-red-700 text-sm mt-1">{error.message}</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={dismissError}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Login Button */}
        <button
          className={`w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg'
          }`}
          onClick={handleLogin}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Redirecting to Microsoft...</span>
            </div>
          ) : loginAttempted ? (
            '🔄 Retry Sign In'
          ) : (
            '🔑 Sign in with Microsoft'
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            You'll be redirected to Microsoft to sign in securely. 
            After authentication, you'll be brought back here.
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 border-t pt-6">
          <h3 className="font-medium text-gray-800 mb-3">What you'll get access to:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">📁 Your SharePoint sites and documents</li>
            <li className="flex items-center">📊 OneDrive files and folders</li>
            <li className="flex items-center">👥 Team collaboration spaces</li>
            <li className="flex items-center">🔒 Secure, read-only access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};