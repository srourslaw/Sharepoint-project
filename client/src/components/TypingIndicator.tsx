import React from 'react';
import { Box, Avatar, Paper, Typography, keyframes } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';

const dotBounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

interface TypingIndicatorProps {
  message?: string;
  showAvatar?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  message = "AI is thinking...",
  showAvatar = true 
}) => {
  return (
    <Box sx={{ display: 'flex', mb: 2, alignItems: 'flex-start', gap: 1 }}>
      {showAvatar && (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <BotIcon fontSize="small" />
        </Avatar>
      )}
      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: 'grey.100',
          borderRadius: 2,
          borderTopLeftRadius: showAvatar ? 0 : 2,
          animation: `${fadeInOut} 2s ease-in-out infinite`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
          
          <Box display="flex" alignItems="center" gap="2px">
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: `${dotBounce} 1.4s infinite ease-in-out`,
                  animationDelay: `${index * 0.2}s`,
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};