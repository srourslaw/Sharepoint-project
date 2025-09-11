import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const ThakralFooter: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 30%, #7c3aed 70%, #8b5cf6 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
        },
        padding: { xs: '12px', md: '16px' },
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 -4px 20px rgba(124, 58, 237, 0.3)',
        width: '100%'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 4 },
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left side - Logo and Company */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src="https://www.thakralone.com/wp-content/uploads/2020/08/Thakral-One-Logo.png"
            alt="Thakral One Logo"
            style={{ 
              height: '28px', 
              filter: 'brightness(0) invert(1)'
            }}
          />
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontSize: '0.95rem', 
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
            >
              Thakral One AI Solutions
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              SharePoint AI Intelligence Prototype
            </Typography>
          </Box>
        </Box>

        {/* Center - Copyright */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center'
          }}
        >
          © 2025 Thakral One • Proprietary AI Solution
        </Typography>

        {/* Right side - Website */}
        <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
          <Link 
            href="https://www.thakralone.com" 
            target="_blank" 
            sx={{ 
              color: '#e0e7ff', 
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            www.thakralone.com
          </Link>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.8)',
              mt: 0.5
            }}
          >
            Further. Together.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};