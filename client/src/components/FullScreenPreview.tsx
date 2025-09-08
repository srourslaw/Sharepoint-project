import React from 'react';
import ReactDOM from 'react-dom';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { SharePointFile } from '../types';

interface FullScreenPreviewProps {
  file: SharePointFile | null;
  content: string | null;
  onClose: () => void;
}

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({
  file,
  content,
  onClose,
}) => {
  console.log('🚀 FullScreenPreview rendering!', { file: file?.name, content: content?.substring(0, 50), hasFile: !!file, hasContent: !!content });
  
  if (!file || !content) {
    console.log('❌ FullScreenPreview: No file or content, not rendering');
    return null;
  }

  const renderContent = () => {
    const isPdf = file.mimeType === 'application/pdf';
    const isImage = file.mimeType.startsWith('image/');

    if (isPdf) {
      const pdfUrl = content?.startsWith('blob:') ? content : `/api/sharepoint-advanced/files/${file.id}/content`;
      return (
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            display: 'block',
          }}
          title={`PDF: ${String(file.name || file.displayName || 'Document')}`}
        />
      );
    }

    if (isImage) {
      const imageUrl = content?.startsWith('blob:') ? content : `/api/sharepoint-advanced/files/${file.id}/content`;
      return (
        <img
          src={imageUrl}
          alt={String(file.name || file.displayName || 'Image preview')}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            margin: 'auto',
          }}
        />
      );
    }

    return (
      <Box sx={{ 
        p: 4, 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography variant="h6" color="text.secondary">
          Cannot preview this file type: {file.mimeType}
        </Typography>
      </Box>
    );
  };

  const modal = (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          minHeight: 60,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white' }}>
          {String(file.displayName || file.name || 'File Preview')}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );

  return ReactDOM.createPortal(modal, document.body);
};