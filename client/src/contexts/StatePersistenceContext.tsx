import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { StatePersistence, ChatMessage, WorkSession, UserPreferences } from '../utils/statePersistence';

interface StatePersistenceContextType {
  // Work session management
  saveWorkSession: (session: Partial<WorkSession>) => void;
  getWorkSession: () => WorkSession | null;

  // Chat management
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  getChatHistory: () => ChatMessage[];
  clearChatHistory: () => void;

  // User preferences
  saveUserPreferences: (prefs: Partial<UserPreferences>) => void;
  getUserPreferences: () => UserPreferences;

  // Navigation state
  saveNavigationState: (state: {
    currentPath?: string;
    selectedFiles?: string[];
    searchQuery?: string;
    viewMode?: any;
  }) => void;
  getNavigationState: () => {
    currentPath: string;
    selectedFiles: string[];
    searchQuery: string;
    viewMode: any;
  };

  // Auto-save management
  enableAutoSave: (saveCallback: () => void) => void;
  disableAutoSave: () => void;

  // Data management
  exportUserData: () => string;
  importUserData: (jsonData: string) => boolean;
  clearAllData: () => void;
  getStorageUsage: () => {
    used: number;
    total: number;
    percentage: number;
    breakdown: Record<string, number>;
  };
}

const StatePersistenceContext = createContext<StatePersistenceContextType | undefined>(undefined);

interface StatePersistenceProviderProps {
  children: React.ReactNode;
}

export const StatePersistenceProvider: React.FC<StatePersistenceProviderProps> = ({ children }) => {
  const autoSaveCallbackRef = useRef<(() => void) | null>(null);

  // Initialize auto-save on mount if enabled
  useEffect(() => {
    const preferences = StatePersistence.getUserPreferences();

    if (preferences.autoSaveEnabled && autoSaveCallbackRef.current) {
      StatePersistence.startAutoSave(autoSaveCallbackRef.current);
    }

    // Cleanup on unmount
    return () => {
      StatePersistence.stopAutoSave();
    };
  }, []);

  // Save state on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveCallbackRef.current) {
        autoSaveCallbackRef.current();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Context methods
  const saveWorkSession = useCallback((session: Partial<WorkSession>) => {
    StatePersistence.saveWorkSession(session);
  }, []);

  const getWorkSession = useCallback(() => {
    return StatePersistence.getWorkSession();
  }, []);

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    StatePersistence.addChatMessage(message);
  }, []);

  const getChatHistory = useCallback(() => {
    return StatePersistence.getChatHistory();
  }, []);

  const clearChatHistory = useCallback(() => {
    StatePersistence.clearChatHistory();
  }, []);

  const saveUserPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    StatePersistence.saveUserPreferences(prefs);

    // Restart auto-save if settings changed
    if ('autoSaveEnabled' in prefs || 'autoSaveInterval' in prefs) {
      const updatedPrefs = StatePersistence.getUserPreferences();

      if (updatedPrefs.autoSaveEnabled && autoSaveCallbackRef.current) {
        StatePersistence.stopAutoSave();
        StatePersistence.startAutoSave(autoSaveCallbackRef.current);
      } else {
        StatePersistence.stopAutoSave();
      }
    }
  }, []);

  const getUserPreferences = useCallback(() => {
    return StatePersistence.getUserPreferences();
  }, []);

  const saveNavigationState = useCallback((state: {
    currentPath?: string;
    selectedFiles?: string[];
    searchQuery?: string;
    viewMode?: any;
  }) => {
    StatePersistence.saveNavigationState(state);
  }, []);

  const getNavigationState = useCallback(() => {
    return StatePersistence.getNavigationState();
  }, []);

  const enableAutoSave = useCallback((saveCallback: () => void) => {
    autoSaveCallbackRef.current = saveCallback;

    const preferences = StatePersistence.getUserPreferences();
    if (preferences.autoSaveEnabled) {
      StatePersistence.startAutoSave(saveCallback);
    }
  }, []);

  const disableAutoSave = useCallback(() => {
    StatePersistence.stopAutoSave();
    autoSaveCallbackRef.current = null;
  }, []);

  const exportUserData = useCallback(() => {
    return StatePersistence.exportUserData();
  }, []);

  const importUserData = useCallback((jsonData: string) => {
    return StatePersistence.importUserData(jsonData);
  }, []);

  const clearAllData = useCallback(() => {
    StatePersistence.clearAllData();
  }, []);

  const getStorageUsage = useCallback(() => {
    return StatePersistence.getStorageUsage();
  }, []);

  const contextValue: StatePersistenceContextType = {
    saveWorkSession,
    getWorkSession,
    addChatMessage,
    getChatHistory,
    clearChatHistory,
    saveUserPreferences,
    getUserPreferences,
    saveNavigationState,
    getNavigationState,
    enableAutoSave,
    disableAutoSave,
    exportUserData,
    importUserData,
    clearAllData,
    getStorageUsage,
  };

  return (
    <StatePersistenceContext.Provider value={contextValue}>
      {children}
    </StatePersistenceContext.Provider>
  );
};

// Custom hook to use state persistence context
export const useStatePersistenceContext = (): StatePersistenceContextType => {
  const context = useContext(StatePersistenceContext);
  if (context === undefined) {
    throw new Error('useStatePersistenceContext must be used within a StatePersistenceProvider');
  }
  return context;
};

export default StatePersistenceProvider;