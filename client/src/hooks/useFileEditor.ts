import { useState, useCallback, useRef, useEffect } from 'react';
import { SharePointFile, EditorState, FileChange, CollaborativeSession, EditorAction, AutoSaveConfig } from '../types';

interface UseFileEditorOptions {
  file: SharePointFile;
  autoSave?: AutoSaveConfig;
  collaborative?: boolean;
  onSave?: (content: string, version: string) => Promise<void>;
  onError?: (error: string) => void;
}

interface UseFileEditorReturn {
  editorState: EditorState;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  addChange: (change: Omit<FileChange, 'id' | 'timestamp'>) => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  updateCursor: (position: number, selection?: { start: number; end: number }) => void;
  loadVersion: (versionId: string) => Promise<void>;
}

export const useFileEditor = ({
  file,
  autoSave = { enabled: true, interval: 30000, maxRetries: 3, retryDelay: 1000 },
  collaborative = false,
  onSave,
  onError,
}: UseFileEditorOptions): UseFileEditorReturn => {
  const [editorState, setEditorState] = useState<EditorState>({
    content: file.content || '',
    isDirty: false,
    lastSaved: new Date().toISOString(),
    version: '1.0.0',
    changes: [],
    undoStack: [],
    redoStack: [],
    cursorPosition: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const saveRetries = useRef(0);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!editorState.isDirty || !autoSave.enabled || isSaving) return;

    try {
      setIsSaving(true);
      await onSave?.(editorState.content, editorState.version);
      
      setEditorState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date().toISOString(),
      }));
      
      saveRetries.current = 0;
    } catch (error: any) {
      saveRetries.current++;
      
      if (saveRetries.current <= autoSave.maxRetries) {
        // Retry after delay
        setTimeout(() => {
          performAutoSave();
        }, autoSave.retryDelay);
      } else {
        onError?.(`Auto-save failed after ${autoSave.maxRetries} attempts: ${error.message}`);
        saveRetries.current = 0;
      }
    } finally {
      setIsSaving(false);
    }
  }, [editorState.isDirty, editorState.content, editorState.version, autoSave, isSaving, onSave, onError]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSave.enabled && editorState.isDirty) {
      autoSaveTimer.current = setTimeout(performAutoSave, autoSave.interval);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editorState.isDirty, autoSave.enabled, autoSave.interval, performAutoSave]);

  // Update content with undo/redo tracking
  const updateContent = useCallback((content: string) => {
    setEditorState(prev => {
      const action: EditorAction = {
        type: 'replace',
        timestamp: new Date().toISOString(),
        position: { start: 0, end: prev.content.length },
        content,
        originalContent: prev.content,
      };

      return {
        ...prev,
        content,
        isDirty: content !== (file.content || ''),
        undoStack: [...prev.undoStack, action],
        redoStack: [], // Clear redo stack on new action
      };
    });
  }, [file.content]);

  // Manual save
  const save = useCallback(async () => {
    if (!editorState.isDirty || isSaving) return;

    try {
      setIsSaving(true);
      await onSave?.(editorState.content, editorState.version);
      
      setEditorState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date().toISOString(),
        version: incrementVersion(prev.version),
      }));
      
      // Clear auto-save timer since we just saved
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
    } catch (error: any) {
      onError?.(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [editorState.isDirty, editorState.content, editorState.version, isSaving, onSave, onError]);

  // Undo operation
  const undo = useCallback(() => {
    setEditorState(prev => {
      if (prev.undoStack.length === 0) return prev;

      const action = prev.undoStack[prev.undoStack.length - 1];
      const newUndoStack = prev.undoStack.slice(0, -1);
      
      return {
        ...prev,
        content: action.originalContent || '',
        undoStack: newUndoStack,
        redoStack: [action, ...prev.redoStack],
        isDirty: (action.originalContent || '') !== (file.content || ''),
      };
    });
  }, [file.content]);

  // Redo operation
  const redo = useCallback(() => {
    setEditorState(prev => {
      if (prev.redoStack.length === 0) return prev;

      const action = prev.redoStack[0];
      const newRedoStack = prev.redoStack.slice(1);
      
      return {
        ...prev,
        content: action.content,
        undoStack: [...prev.undoStack, action],
        redoStack: newRedoStack,
        isDirty: action.content !== (file.content || ''),
      };
    });
  }, [file.content]);

  // Add collaborative change
  const addChange = useCallback((change: Omit<FileChange, 'id' | 'timestamp'>) => {
    const newChange: FileChange = {
      ...change,
      id: generateId(),
      timestamp: new Date().toISOString(),
      accepted: false,
    };

    setEditorState(prev => ({
      ...prev,
      changes: [...prev.changes, newChange],
    }));
  }, []);

  // Accept change
  const acceptChange = useCallback((changeId: string) => {
    setEditorState(prev => ({
      ...prev,
      changes: prev.changes.map(change =>
        change.id === changeId ? { ...change, accepted: true } : change
      ),
    }));
  }, []);

  // Reject change
  const rejectChange = useCallback((changeId: string) => {
    setEditorState(prev => ({
      ...prev,
      changes: prev.changes.filter(change => change.id !== changeId),
    }));
  }, []);

  // Update cursor position
  const updateCursor = useCallback((position: number, selection?: { start: number; end: number }) => {
    setEditorState(prev => ({
      ...prev,
      cursorPosition: position,
      selection,
    }));
  }, []);

  // Load specific version
  const loadVersion = useCallback(async (versionId: string) => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual SharePoint API
      const response = await fetch(`/api/files/${file.id}/versions/${versionId}`);
      const versionData = await response.json();
      
      if (versionData.success) {
        setEditorState(prev => ({
          ...prev,
          content: versionData.data.content,
          version: versionData.data.version,
          isDirty: false,
          lastSaved: versionData.data.created,
          undoStack: [],
          redoStack: [],
        }));
      }
    } catch (error: any) {
      onError?.(`Failed to load version: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [file.id, onError]);

  return {
    editorState,
    isLoading,
    isSaving,
    isDirty: editorState.isDirty,
    canUndo: editorState.undoStack.length > 0,
    canRedo: editorState.redoStack.length > 0,
    updateContent,
    save,
    undo,
    redo,
    addChange,
    acceptChange,
    rejectChange,
    updateCursor,
    loadVersion,
  };
};

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const incrementVersion = (version: string): string => {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || '0', 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
};