import { CloudUpload } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function Dropzone({ onUploaded, onBulkUploaded }) {
  const onDrop = useCallback(
    (files) => {
      onUploaded?.(files[0]);
      onBulkUploaded?.(files);
    },
    [onUploaded, onBulkUploaded],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const boxStyles = {
    overflow: 'hidden',
    borderRadius: 0,
    border: `2px dashed ${isDragActive ? '#4caf50' : '#bdbdbd'}`,
    textAlign: 'center',
    backgroundColor: isDragActive ? '#e8f5e9' : '#ffffff',
    transition: 'background-color 0.3s, border-color 0.3s',
    width: '100%',
    display: {
      xs: 'block',
      sm: 'flex',
      md: 'flex',
      lg: 'flex',
    },
    mb: 0,
    gap: 2,
    padding: {
      xs: '10px',
      sm: '10px',
      md: '20px',
      lg: '20px',
    },
    justifyContent: 'center',
    alignItems: 'center',
    height: {
      xs: '200px',
      sm: '100%',
    },
    boxSizing: 'border-box',
  };

  return (
    <div {...getRootProps()} style={{ height: '100%' }}>
      <Box sx={boxStyles}>
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <CloudUpload sx={{ fontSize: 50, color: '#81c784' }} />
          <Typography sx={{ color: '#388e3c' }}>
            Drag and Drop <br /> files here
          </Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            or
          </Typography>
          <Button
            size="small"
            variant="contained"
            sx={{
              backgroundColor: 'rgb(41, 152, 111)',
            }}
          >
            Browse files
          </Button>
        </Stack>
        <input {...getInputProps()} />
      </Box>
    </div>
  );
}
