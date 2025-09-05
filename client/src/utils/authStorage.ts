import { AuthSession } from '../types/auth';

const STORAGE_KEYS = {
  SESSION: 'auth_session',
  SESSION_ID: 'session_id',
  LAST_CHECK: 'last_auth_check',
} as const;

/**
 * Secure storage utility for authentication data
 * Uses sessionStorage for temporary data and localStorage for persistent data
 */
export class AuthStorage {
  /**
   * Store authentication session
   */
  static setSession(session: AuthSession): void {
    try {
      const sessionData = {
        ...session,
        expiresAt: session.expiresAt.toISOString(),
      };
      
      // Store session in sessionStorage (cleared when browser tab closes)
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      
      // Store session ID in localStorage for persistence across tabs
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, session.sessionId);
      
      // Update last check timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_CHECK, new Date().toISOString());
    } catch (error) {
      console.error('Failed to store authentication session:', error);
    }
  }

  /**
   * Retrieve authentication session
   */
  static getSession(): AuthSession | null {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      
      if (!sessionData) {
        // Try to get session ID from localStorage
        const sessionId = this.getSessionId();
        return sessionId ? { sessionId } as AuthSession : null;
      }

      const parsed = JSON.parse(sessionData);
      
      // Convert expiresAt back to Date object
      if (parsed.expiresAt) {
        parsed.expiresAt = new Date(parsed.expiresAt);
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to retrieve authentication session:', error);
      return null;
    }
  }

  /**
   * Get session ID from storage
   */
  static getSessionId(): string | null {
    try {
      // First try sessionStorage
      const session = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.sessionId || null;
      }
      
      // Fallback to localStorage
      return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.error('Failed to retrieve session ID:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  static updateSession(updates: Partial<AuthSession>): void {
    const currentSession = this.getSession();
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      ...updates,
    };

    this.setSession(updatedSession);
  }

  /**
   * Clear all authentication data
   */
  static clearSession(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.LAST_CHECK);
    } catch (error) {
      console.error('Failed to clear authentication session:', error);
    }
  }

  /**
   * Check if session exists and is valid
   */
  static isSessionValid(): boolean {
    const session = this.getSession();
    
    if (!session || !session.sessionId) {
      return false;
    }

    // Check expiration if available
    if (session.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now >= expiresAt) {
        this.clearSession();
        return false;
      }
    }

    return true;
  }

  /**
   * Get last authentication check timestamp
   */
  static getLastCheck(): Date | null {
    try {
      const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if we should revalidate authentication
   * Returns true if it's been more than 5 minutes since last check
   */
  static shouldRevalidate(): boolean {
    const lastCheck = this.getLastCheck();
    if (!lastCheck) return true;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastCheck < fiveMinutesAgo;
  }

  /**
   * Set authentication check timestamp
   */
  static setLastCheck(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CHECK, new Date().toISOString());
    } catch (error) {
      console.error('Failed to set last check timestamp:', error);
    }
  }
}

/**
 * Cookie utilities for session ID storage
 * Used as fallback when localStorage is not available
 */
export class CookieStorage {
  /**
   * Set a cookie
   */
  static setCookie(name: string, value: string, days: number = 1): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    } catch (error) {
      console.error('Failed to set cookie:', error);
    }
  }

  /**
   * Get a cookie value
   */
  static getCookie(name: string): string | null {
    try {
      if (!name || typeof name !== 'string') return null;
      
      const nameEQ = name + '=';
      const cookieString = document?.cookie;
      
      if (!cookieString || typeof cookieString !== 'string') return null;
      
      const ca = cookieString.split(';');
      if (!Array.isArray(ca)) return null;
      
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        if (!c || typeof c !== 'string' || c.length === 0) continue;
        
        // Safely trim leading spaces
        while (c.length > 0 && c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        
        if (c.length === 0) continue;
        
        if (c.indexOf(nameEQ) === 0) {
          const value = c.substring(nameEQ.length);
          return value || null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cookie:', error);
      return null;
    }
  }

  /**
   * Delete a cookie
   */
  static deleteCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
    } catch (error) {
      console.error('Failed to delete cookie:', error);
    }
  }
}