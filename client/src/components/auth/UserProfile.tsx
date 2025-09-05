import React, { useState } from 'react';
import { useAuth, useLogout } from '../../hooks/useAuth';

interface UserProfileProps {
  showDetails?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  showDetails = true,
  orientation = 'horizontal',
  size = 'md',
  className = ""
}) => {
  const { user } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'profile-sm',
    md: 'profile-md',
    lg: 'profile-lg'
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <div 
        className={`user-profile ${sizeClasses[size]} ${orientation} ${className}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {/* Avatar */}
        <div className="user-avatar">
          <div className="avatar-circle">
            {getInitials(user.displayName)}
          </div>
          <div className="status-indicator online"></div>
        </div>

        {/* User Info */}
        {showDetails && (
          <div className="user-info">
            <div className="user-name">{user.displayName}</div>
            <div className="user-email">{user.mail}</div>
          </div>
        )}

        {/* Dropdown Arrow */}
        <div className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="header-avatar">
                <div className="avatar-circle">
                  {getInitials(user.displayName)}
                </div>
              </div>
              <div className="header-info">
                <div className="header-name">{user.displayName}</div>
                <div className="header-email">{user.mail}</div>
                <div className="header-upn">{user.userPrincipalName}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-section">
              <div className="section-title">Account</div>
              <button className="dropdown-item" disabled>
                <div className="item-icon">👤</div>
                <span>Profile Settings</span>
                <span className="item-badge">Soon</span>
              </button>
              <button className="dropdown-item" disabled>
                <div className="item-icon">🔔</div>
                <span>Notifications</span>
                <span className="item-badge">Soon</span>
              </button>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-section">
              <button 
                className={`dropdown-item logout ${isLoggingOut ? 'loading' : ''}`}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <div className="item-icon">
                  {isLoggingOut ? (
                    <div className="logout-spinner"></div>
                  ) : (
                    '🚪'
                  )}
                </div>
                <span>
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="dropdown-backdrop" 
          onClick={() => setShowDropdown(false)}
        />
      )}

      <style jsx>{`
        .user-profile {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          user-select: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .user-profile:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .user-profile.vertical {
          flex-direction: column;
          text-align: center;
          gap: 0.5rem;
        }

        /* Size variants */
        .profile-sm .user-avatar {
          width: 32px;
          height: 32px;
        }

        .profile-md .user-avatar {
          width: 40px;
          height: 40px;
        }

        .profile-lg .user-avatar {
          width: 48px;
          height: 48px;
        }

        .profile-sm .user-name {
          font-size: 0.875rem;
        }

        .profile-sm .user-email {
          font-size: 0.75rem;
        }

        /* Avatar */
        .user-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #0078d4, #106ebe);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .status-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .status-indicator.online {
          background-color: #10b981;
        }

        /* User Info */
        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #323130;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.8rem;
          color: #605e5c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Dropdown Arrow */
        .dropdown-arrow {
          flex-shrink: 0;
          color: #605e5c;
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        /* Dropdown Menu */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          border: 1px solid #e1dfdd;
          min-width: 280px;
          z-index: 1000;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          background: #f8f9fa;
          border-bottom: 1px solid #e1dfdd;
        }

        .header-avatar .avatar-circle {
          width: 48px;
          height: 48px;
          font-size: 1rem;
        }

        .header-info {
          flex: 1;
          min-width: 0;
        }

        .header-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #323130;
          margin-bottom: 0.25rem;
        }

        .header-email {
          font-size: 0.8rem;
          color: #605e5c;
          margin-bottom: 0.125rem;
        }

        .header-upn {
          font-size: 0.75rem;
          color: #8a8886;
        }

        .dropdown-divider {
          height: 1px;
          background: #e1dfdd;
        }

        .dropdown-section {
          padding: 0.5rem 0;
        }

        .section-title {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #8a8886;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 0.875rem;
          color: #323130;
        }

        .dropdown-item:hover:not(:disabled) {
          background-color: #f3f2f1;
        }

        .dropdown-item:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .dropdown-item.logout {
          color: #d13438;
        }

        .dropdown-item.logout:hover:not(:disabled) {
          background-color: #fef2f2;
        }

        .item-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-badge {
          margin-left: auto;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          background: #edebe9;
          color: #605e5c;
          border-radius: 12px;
        }

        .logout-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #fca5a5;
          border-top: 2px solid #d13438;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Backdrop */
        .dropdown-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999;
        }

        @media (max-width: 768px) {
          .dropdown-menu {
            min-width: 250px;
            right: -1rem;
          }
        }
      `}</style>
    </>
  );
};