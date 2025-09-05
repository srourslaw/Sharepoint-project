import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  DriveFileMove as MoveIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { SharePointFile, SharePointLibrary } from '../types';

interface BulkOperation {
  id: string;
  type: 'delete' | 'copy' | 'move';
  files: SharePointFile[];
  targetPath?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  results: OperationResult[];
  error?: string;
}

interface OperationResult {
  fileId: string;
  fileName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  newLocation?: string;
}

interface BulkOperationsManagerProps {
  selectedFiles: SharePointFile[];
  availableLibraries: SharePointLibrary[];
  onOperationComplete?: (operation: BulkOperation) => void;
  onClose?: () => void;
}

interface FolderPath {
  id: string;
  name: string;
  path: string;
}

export const BulkOperationsManager: React.FC<BulkOperationsManagerProps> = ({
  selectedFiles,
  availableLibraries,
  onOperationComplete,
  onClose,
}) => {
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [operationType, setOperationType] = useState<'delete' | 'copy' | 'move' | null>(null);
  const [targetLibrary, setTargetLibrary] = useState<string>('');
  const [targetFolder, setTargetFolder] = useState<string>('');
  const [availableFolders, setAvailableFolders] = useState<FolderPath[]>([]);
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [operationHistory, setOperationHistory] = useState<BulkOperation[]>([]);

  // Initialize operation results
  const initializeResults = (files: SharePointFile[]): OperationResult[] => {
    return files.map(file => ({
      fileId: file.id,
      fileName: file.name,
      status: 'pending' as const,
    }));
  };

  // Load folders for selected library
  const loadFoldersForLibrary = useCallback(async (libraryId: string) => {
    try {
      const response = await fetch(`/api/libraries/${libraryId}/folders`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableFolders(data.data);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  // Handle library selection
  const handleLibraryChange = (libraryId: string) => {
    setTargetLibrary(libraryId);
    setTargetFolder('');
    loadFoldersForLibrary(libraryId);
  };

  // Start bulk operation
  const startBulkOperation = (type: 'delete' | 'copy' | 'move') => {
    setOperationType(type);
    setConfirmationStep(0);
    
    if (type !== 'delete') {
      // For copy/move operations, we need target selection
      setConfirmationStep(1);
    }
  };

  // Execute the bulk operation
  const executeBulkOperation = async () => {
    if (!operationType) return;

    const operation: BulkOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: operationType,
      files: selectedFiles,
      targetPath: operationType !== 'delete' ? `${targetLibrary}/${targetFolder || ''}` : undefined,
      status: 'running',
      progress: 0,
      results: initializeResults(selectedFiles),
    };

    setCurrentOperation(operation);
    setConfirmationStep(2); // Move to execution step

    try {
      // Process files in batches
      const batchSize = 5;
      let completed = 0;

      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize);
        const batchPromises = batch.map(file => executeFileOperation(file, operation));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Update results
        batchResults.forEach((result, index) => {
          const fileIndex = i + index;
          const fileId = selectedFiles[fileIndex].id;
          
          setCurrentOperation(prev => {
            if (!prev) return prev;
            
            const newResults = [...prev.results];
            const resultIndex = newResults.findIndex(r => r.fileId === fileId);
            
            if (resultIndex !== -1) {
              if (result.status === 'fulfilled') {
                newResults[resultIndex] = {
                  ...newResults[resultIndex],
                  status: 'success',
                  newLocation: result.value?.newLocation,
                };
              } else {
                newResults[resultIndex] = {
                  ...newResults[resultIndex],
                  status: 'error',
                  error: result.reason?.message || 'Unknown error',
                };
              }
            }
            
            completed++;
            const progress = (completed / selectedFiles.length) * 100;
            
            return {
              ...prev,
              results: newResults,
              progress,
              status: completed === selectedFiles.length ? 'completed' : 'running',
            };
          });
        });
      }

      // Final update
      setCurrentOperation(prev => {
        if (!prev) return prev;
        
        const hasErrors = prev.results.some(r => r.status === 'error');
        const finalOperation = {
          ...prev,
          status: hasErrors ? 'error' as const : 'completed' as const,
          progress: 100,
        };
        
        // Add to history
        setOperationHistory(history => [finalOperation, ...history]);
        onOperationComplete?.(finalOperation);
        
        return finalOperation;
      });

    } catch (error: any) {
      setCurrentOperation(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message,
      } : null);
    }
  };

  // Execute operation on single file
  const executeFileOperation = async (
    file: SharePointFile,
    operation: BulkOperation
  ): Promise<{ newLocation?: string }> => {
    const endpoint = `/api/files/${file.id}/${operation.type}`;
    const body = operation.type !== 'delete' ? {
      targetLibrary,
      targetFolder: createNewFolder ? newFolderName : targetFolder,
      createFolder: createNewFolder,
    } : undefined;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`${operation.type} failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || `${operation.type} failed`);
    }

    return {
      newLocation: result.data?.newLocation,
    };
  };

  // Cancel operation
  const cancelOperation = () => {
    setCurrentOperation(prev => prev ? { ...prev, status: 'cancelled' } : null);
    resetOperation();
  };

  // Reset operation state
  const resetOperation = () => {
    setOperationType(null);
    setTargetLibrary('');
    setTargetFolder('');
    setCreateNewFolder(false);
    setNewFolderName('');
    setConfirmationStep(0);
    setCurrentOperation(null);
  };

  // Retry failed operations
  const retryFailedOperations = async () => {
    if (!currentOperation) return;

    const failedFiles = currentOperation.files.filter(file => {
      const result = currentOperation.results.find(r => r.fileId === file.id);
      return result?.status === 'error';
    });

    if (failedFiles.length === 0) return;

    // Reset failed results and retry
    setCurrentOperation(prev => {
      if (!prev) return prev;
      
      const newResults = prev.results.map(result => 
        result.status === 'error' ? { ...result, status: 'pending' as const, error: undefined } : result
      );
      
      return {
        ...prev,
        results: newResults,
        status: 'running',
        error: undefined,
      };
    });

    // Execute retry logic here...
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'delete': return <DeleteIcon color="error" />;
      case 'copy': return <CopyIcon color="primary" />;
      case 'move': return <MoveIcon color="warning" />;
      default: return <FileIcon />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'delete': return 'error';
      case 'copy': return 'primary';
      case 'move': return 'warning';
      default: return 'default';
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0: // Operation Selection
        return (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => startBulkOperation('delete')}
              color="error"
            >
              Delete ({selectedFiles.length} files)
            </Button>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => startBulkOperation('copy')}
            >
              Copy ({selectedFiles.length} files)
            </Button>
            <Button
              variant="outlined"
              startIcon={<MoveIcon />}
              onClick={() => startBulkOperation('move')}
            >
              Move ({selectedFiles.length} files)
            </Button>
          </Box>
        );

      case 1: // Target Selection
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Target Library</InputLabel>
              <Select
                value={targetLibrary}
                label="Target Library"
                onChange={(e) => handleLibraryChange(e.target.value)}
              >
                {availableLibraries.map(library => (
                  <MenuItem key={library.id} value={library.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderIcon />
                      {library.displayName}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {targetLibrary && (
              <FormControl fullWidth>
                <InputLabel>Target Folder</InputLabel>
                <Select
                  value={targetFolder}
                  label="Target Folder"
                  onChange={(e) => setTargetFolder(e.target.value)}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderOpenIcon />
                      Root Folder
                    </Box>
                  </MenuItem>
                  {availableFolders.map(folder => (
                    <MenuItem key={folder.id} value={folder.path}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderIcon />
                        {folder.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={createNewFolder}
                onChange={(e) => setCreateNewFolder(e.target.checked)}
              />
              <Typography>Create new folder</Typography>
            </Box>

            {createNewFolder && (
              <TextField
                label="New Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                fullWidth
              />
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={resetOperation}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => setConfirmationStep(2)}
                disabled={!targetLibrary || (createNewFolder && !newFolderName)}
              >
                Continue
              </Button>
            </Box>
          </Box>
        );

      case 2: // Confirmation & Execution
        return (
          <Box>
            {!currentOperation && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Confirm {operationType} operation
                  </Typography>
                  <Typography variant="body2">
                    {operationType === 'delete' 
                      ? `You are about to delete ${selectedFiles.length} files permanently.`
                      : `You are about to ${operationType} ${selectedFiles.length} files to ${targetLibrary}${targetFolder ? `/${targetFolder}` : ''}.`
                    }
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom>
                  Files to {operationType}:
                </Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {selectedFiles.map(file => (
                    <ListItem key={file.id}>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                  <Button onClick={resetOperation}>Cancel</Button>
                  <Button
                    variant="contained"
                    color={getOperationColor(operationType || '') as any}
                    onClick={executeBulkOperation}
                    startIcon={getOperationIcon(operationType || '')}
                  >
                    {operationType} Files
                  </Button>
                </Box>
              </Box>
            )}

            {currentOperation && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    {currentOperation.type} Operation
                  </Typography>
                  <Chip
                    label={currentOperation.status}
                    color={
                      currentOperation.status === 'completed' ? 'success' :
                      currentOperation.status === 'error' ? 'error' :
                      currentOperation.status === 'running' ? 'info' :
                      'default'
                    }
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={currentOperation.progress}
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progress: {currentOperation.progress.toFixed(0)}% 
                  ({currentOperation.results.filter(r => r.status === 'success').length} / {currentOperation.results.length})
                </Typography>

                {/* Results List */}
                <List dense sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {currentOperation.results.map(result => (
                    <ListItem key={result.fileId}>
                      <ListItemIcon>
                        {result.status === 'success' && <CheckIcon color="success" />}
                        {result.status === 'error' && <ErrorIcon color="error" />}
                        {result.status === 'pending' && <FileIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.fileName}
                        secondary={
                          result.status === 'error' ? result.error :
                          result.status === 'success' && result.newLocation ? `Moved to: ${result.newLocation}` :
                          result.status === 'pending' ? 'Waiting...' :
                          'Completed'
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                  {currentOperation.status === 'running' && (
                    <Button
                      onClick={cancelOperation}
                      startIcon={<CancelIcon />}
                    >
                      Cancel
                    </Button>
                  )}
                  
                  {currentOperation.status === 'error' && (
                    <Button
                      onClick={retryFailedOperations}
                      startIcon={<RefreshIcon />}
                    >
                      Retry Failed
                    </Button>
                  )}
                  
                  {(currentOperation.status === 'completed' || currentOperation.status === 'error') && (
                    <Button
                      variant="contained"
                      onClick={() => {
                        resetOperation();
                        onClose?.();
                      }}
                    >
                      Done
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (selectedFiles.length === 0) {
    return (
      <Alert severity="info">
        Select files to perform bulk operations
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Operations
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {selectedFiles.length} files selected
      </Typography>

      <Stepper activeStep={confirmationStep} orientation="vertical">
        <Step>
          <StepLabel>Select Operation</StepLabel>
          <StepContent>
            {getStepContent(0)}
          </StepContent>
        </Step>
        
        {operationType !== 'delete' && (
          <Step>
            <StepLabel>Choose Destination</StepLabel>
            <StepContent>
              {getStepContent(1)}
            </StepContent>
          </Step>
        )}
        
        <Step>
          <StepLabel>Execute Operation</StepLabel>
          <StepContent>
            {getStepContent(2)}
          </StepContent>
        </Step>
      </Stepper>

      {/* Operation History */}
      {operationHistory.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Operations
          </Typography>
          <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {operationHistory.slice(0, 5).map((operation, index) => (
              <React.Fragment key={operation.id}>
                <ListItem>
                  <ListItemIcon>
                    {getOperationIcon(operation.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${operation.type} ${operation.files.length} files`}
                    secondary={
                      <Box>
                        <Typography variant="caption">
                          {operation.results.filter(r => r.status === 'success').length} successful, {' '}
                          {operation.results.filter(r => r.status === 'error').length} failed
                        </Typography>
                        {operation.targetPath && (
                          <Typography variant="caption" display="block">
                            Target: {operation.targetPath}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={operation.status}
                    size="small"
                    color={
                      operation.status === 'completed' ? 'success' :
                      operation.status === 'error' ? 'error' :
                      'default'
                    }
                  />
                </ListItem>
                {index < Math.min(operationHistory.length - 1, 4) && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};