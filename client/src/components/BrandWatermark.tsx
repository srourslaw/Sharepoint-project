import React from 'react';
import { Box, Typography } from '@mui/material';

export const BrandWatermark: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        opacity: 0.2,
        zIndex: 1000,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        '&:hover': {
          opacity: 0.3,
        }
      }}
    >
      <Box
        component="img"
        src="https://www.thakralone.com/wp-content/uploads/2020/08/Thakral-One-Logo.png"
        alt="Thakral One"
        sx={{
          height: 12,
          filter: 'grayscale(1) opacity(0.4)',
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.5rem',
          color: 'text.secondary',
          fontWeight: 400,
          letterSpacing: '0.02em',
          opacity: 0.6
        }}
      >
        Thakral One AI
      </Typography>
    </Box>
  );
};