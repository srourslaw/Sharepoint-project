import React, { useState } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';

export const fileNameSanitize = (filename) => {
  // Remove file extension
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '');

  // Convert to camelCase
  return nameWithoutExtension
    .split(/[-_ ]+/) // Split by hyphen, underscore, or space
    .map(
      (word, index) =>
        // index === 0
        // ? word.toLowerCase() // Keep the first word in lowercase
        // :
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(), // Capitalize the first letter of the rest
    )
    .join(' ');
};

const UploadButton = ({
  files,
  setFiles,
  onFileRemove,
  setSelectedFileName,
}) => {
  const [isDragging, setDragging] = useState(false);

  const onDragEnter = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const fileSetter = (files) => {
    setFiles([files[0]]);
    setSelectedFileName(fileNameSanitize(files[0]?.name));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    fileSetter(files);
  };

  const onChange = (e) => {
    const files = Array.from(e.target.files);
    fileSetter(files);
  };

  if (files.length > 0) {
    return (
      <Box
        sx={{
          alignContent: 'center',
          minHeight: '200px',
          borderRadius: 3,
          border: `2px dashed #bdbdbd`,
          textAlign: 'center',
          bgcolor: '#ffffff',
          width: '100%',
          maxWidth: '400px',
          margin: '16px auto',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'rgb(41, 152, 111)' }}
        >
          Selected File
        </Typography>
        <div>
          {files.map((file, index) => (
            <>
              <Typography sx={{ flexGrow: 1, color: 'rgb(41, 152, 111)' }}>
                {file.name}
              </Typography>
              <IconButton onClick={() => onFileRemove(index)}>
                <CloseIcon />
              </IconButton>
            </>
          ))}
        </div>
      </Box>
    );
  }

  return (
    <Box
      sx={boxStyle(isDragging)}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CloudUploadIcon sx={{ fontSize: 50, color: '#81c784' }} />
      <Typography variant="h6" sx={{ color: '#388e3c' }}>
        Drag and Drop a Single File Here
      </Typography>
      <Typography variant="body2" sx={{ color: '#757575' }}>
        or
      </Typography>
      <Button
        variant="contained"
        component="label"
        color="success"
        sx={{ mt: 1 }}
      >
        Browse a file
        <input type="file" hidden onChange={onChange} accept="*" />
      </Button>
    </Box>
  );
};

const boxStyle = (isDragging) => ({
  minHeight: '200px',
  borderRadius: 3,
  border: `2px dashed ${isDragging ? '#4caf50' : '#bdbdbd'}`,
  textAlign: 'center',
  bgcolor: isDragging ? '#e8f5e9' : '#ffffff',
  transition: 'background-color 0.3s, border-color 0.3s',
  width: '100%',
  maxWidth: '400px',
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
  boxSizing: 'border-box',
});

export default UploadButton;
