import React from 'react';

interface MainContentProps {
  currentPath: string;
  selectedFiles: string[];
  onFileSelect: (files: string[]) => void;
  onNavigate: (path: string) => void;
  onPreviewToggle: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  currentPath,
  selectedFiles,
  onFileSelect,
  onNavigate,
  onPreviewToggle,
}) => {
  console.log('MainContent.debug rendering...', { currentPath, selectedFiles: selectedFiles.length });

  return (
    <div style={{ padding: '20px' }}>
      <h2>MainContent Debug Mode - Minimal</h2>
      <p>This is a minimal MainContent with no external dependencies.</p>
      <p>Current Path: {currentPath || 'None'}</p>
      <p>Selected Files: {selectedFiles.length}</p>
    </div>
  );
};