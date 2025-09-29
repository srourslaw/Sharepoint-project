/**
 * State Persistence Utility
 * Handles saving and restoring user work, AI chats, and application state
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileContext?: string[];
}

interface WorkSession {
  id: string;
  timestamp: Date;
  currentPath: string;
  selectedFiles: string[];
  chatHistory: ChatMessage[];
  aiAnalysisResults?: any[];
  searchQuery?: string;
  viewMode?: any;
}

interface UserPreferences {
  theme: string;
  sidebarWidth: number;
  aiPanelWidth: number;
  defaultViewMode: string;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
}

const STORAGE_KEYS = {
  WORK_SESSION: 'sp_work_session',
  CHAT_HISTORY: 'sp_chat_history',
  USER_PREFERENCES: 'sp_user_prefs',
  AUTO_SAVE_STATE: 'sp_auto_save',
  NAVIGATION_STATE: 'sp_nav_state',
} as const;

/**
 * State Persistence Manager
 */
export class StatePersistence {
  private static autoSaveTimer: NodeJS.Timeout | null = null;
  private static isAutoSaveEnabled = true;

  /**
   * Save current work session
   */
  static saveWorkSession(session: Partial<WorkSession>): void {
    try {
      const currentSession = this.getWorkSession();
      const updatedSession: WorkSession = {
        id: currentSession?.id || `session_${Date.now()}`,
        timestamp: new Date(),
        currentPath: '',
        selectedFiles: [],
        chatHistory: [],
        ...currentSession,
        ...session,
      };

      localStorage.setItem(STORAGE_KEYS.WORK_SESSION, JSON.stringify(updatedSession));

      console.log('💾 Work session saved:', updatedSession.id);
    } catch (error) {
      console.error('Failed to save work session:', error);
    }
  }

  /**
   * Restore work session
   */
  static getWorkSession(): WorkSession | null {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.WORK_SESSION);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Convert timestamp back to Date
      if (session.timestamp) {
        session.timestamp = new Date(session.timestamp);
      }

      // Convert chat message timestamps
      if (session.chatHistory) {
        session.chatHistory = session.chatHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }

      return session;
    } catch (error) {
      console.error('Failed to restore work session:', error);
      return null;
    }
  }

  /**
   * Add message to chat history
   */
  static addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    try {
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...message,
      };

      const session = this.getWorkSession();
      const chatHistory = session?.chatHistory || [];

      chatHistory.push(chatMessage);

      // Keep only last 100 messages to prevent storage bloat
      const trimmedHistory = chatHistory.slice(-100);

      this.saveWorkSession({ chatHistory: trimmedHistory });

      console.log('💬 Chat message added:', chatMessage.id);
    } catch (error) {
      console.error('Failed to add chat message:', error);
    }
  }

  /**
   * Get chat history
   */
  static getChatHistory(): ChatMessage[] {
    const session = this.getWorkSession();
    return session?.chatHistory || [];
  }

  /**
   * Clear chat history
   */
  static clearChatHistory(): void {
    this.saveWorkSession({ chatHistory: [] });
    console.log('🗑️ Chat history cleared');
  }

  /**
   * Save user preferences
   */
  static saveUserPreferences(prefs: Partial<UserPreferences>): void {
    try {
      const currentPrefs = this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...prefs };

      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));

      console.log('⚙️ User preferences saved');
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): UserPreferences {
    try {
      const prefsData = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);

      const defaultPrefs: UserPreferences = {
        theme: 'auto',
        sidebarWidth: 280,
        aiPanelWidth: 380,
        defaultViewMode: 'grid',
        autoSaveEnabled: true,
        autoSaveInterval: 30000, // 30 seconds
      };

      if (!prefsData) return defaultPrefs;

      return { ...defaultPrefs, ...JSON.parse(prefsData) };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        theme: 'auto',
        sidebarWidth: 280,
        aiPanelWidth: 380,
        defaultViewMode: 'grid',
        autoSaveEnabled: true,
        autoSaveInterval: 30000,
      };
    }
  }

  /**
   * Save navigation state
   */
  static saveNavigationState(state: {
    currentPath?: string;
    selectedFiles?: string[];
    searchQuery?: string;
    viewMode?: any;
  }): void {
    this.saveWorkSession(state);
  }

  /**
   * Get navigation state
   */
  static getNavigationState(): {
    currentPath: string;
    selectedFiles: string[];
    searchQuery: string;
    viewMode: any;
  } {
    const session = this.getWorkSession();
    return {
      currentPath: session?.currentPath || '',
      selectedFiles: session?.selectedFiles || [],
      searchQuery: session?.searchQuery || '',
      viewMode: session?.viewMode || null,
    };
  }

  /**
   * Start auto-save
   */
  static startAutoSave(saveCallback: () => void): void {
    const prefs = this.getUserPreferences();

    if (!prefs.autoSaveEnabled) return;

    this.stopAutoSave(); // Clear any existing timer

    this.autoSaveTimer = setInterval(() => {
      try {
        saveCallback();
        console.log('🔄 Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, prefs.autoSaveInterval);

    console.log(`🔄 Auto-save started (interval: ${prefs.autoSaveInterval}ms)`);
  }

  /**
   * Stop auto-save
   */
  static stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('⏹️ Auto-save stopped');
    }
  }

  /**
   * Export all user data
   */
  static exportUserData(): string {
    try {
      const data = {
        workSession: this.getWorkSession(),
        userPreferences: this.getUserPreferences(),
        exportTimestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Import user data
   */
  static importUserData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.workSession) {
        localStorage.setItem(STORAGE_KEYS.WORK_SESSION, JSON.stringify(data.workSession));
      }

      if (data.userPreferences) {
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.userPreferences));
      }

      console.log('📥 User data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  /**
   * Clear all persisted data
   */
  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      this.stopAutoSave();
      console.log('🗑️ All persisted data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageUsage(): {
    used: number;
    total: number;
    percentage: number;
    breakdown: Record<string, number>;
  } {
    try {
      const breakdown: Record<string, number> = {};
      let totalUsed = 0;

      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        breakdown[name] = size;
        totalUsed += size;
      });

      // Estimate total available (most browsers allow ~5-10MB)
      const estimatedTotal = 5 * 1024 * 1024; // 5MB
      const percentage = (totalUsed / estimatedTotal) * 100;

      return {
        used: totalUsed,
        total: estimatedTotal,
        percentage: Math.min(percentage, 100),
        breakdown,
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        used: 0,
        total: 0,
        percentage: 0,
        breakdown: {},
      };
    }
  }
}

/**
 * React hook for using state persistence
 */
export const useStatePersistence = () => {
  return {
    saveWorkSession: StatePersistence.saveWorkSession.bind(StatePersistence),
    getWorkSession: StatePersistence.getWorkSession.bind(StatePersistence),
    addChatMessage: StatePersistence.addChatMessage.bind(StatePersistence),
    getChatHistory: StatePersistence.getChatHistory.bind(StatePersistence),
    clearChatHistory: StatePersistence.clearChatHistory.bind(StatePersistence),
    saveUserPreferences: StatePersistence.saveUserPreferences.bind(StatePersistence),
    getUserPreferences: StatePersistence.getUserPreferences.bind(StatePersistence),
    saveNavigationState: StatePersistence.saveNavigationState.bind(StatePersistence),
    getNavigationState: StatePersistence.getNavigationState.bind(StatePersistence),
    startAutoSave: StatePersistence.startAutoSave.bind(StatePersistence),
    stopAutoSave: StatePersistence.stopAutoSave.bind(StatePersistence),
    exportUserData: StatePersistence.exportUserData.bind(StatePersistence),
    importUserData: StatePersistence.importUserData.bind(StatePersistence),
    clearAllData: StatePersistence.clearAllData.bind(StatePersistence),
    getStorageUsage: StatePersistence.getStorageUsage.bind(StatePersistence),
  };
};

export type { ChatMessage, WorkSession, UserPreferences };