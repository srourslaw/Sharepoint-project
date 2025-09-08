import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const ThakralFooter: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: { xs: '20px', md: '30px' },
        marginTop: '40px',
        borderRadius: '15px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        mx: { xs: 2, md: 3 },
        mb: 3
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: '15px',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 2 }
      }}>
        <img 
          src="https://www.thakralone.com/wp-content/uploads/2020/08/Thakral-One-Logo.png"
          alt="Thakral One Logo"
          style={{ 
            height: '40px', 
            filter: 'brightness(0) invert(1)'
          }}
        />
        <Typography 
          variant="h5" 
          component="h3" 
          sx={{ 
            margin: 0, 
            fontSize: { xs: '1.3rem', md: '1.5rem' }, 
            fontWeight: 'bold' 
          }}
        >
          Thakral One AI Solutions
        </Typography>
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: { xs: '1rem', md: '1.125rem' }, 
          margin: '10px 0', 
          fontWeight: 500 
        }}
      >
        🎯 SharePoint AI Intelligence Prototype
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          fontSize: { xs: '0.875rem', md: '1rem' }, 
          margin: '8px 0',
          px: { xs: 1, md: 0 }
        }}
      >
        Advanced AI-Powered SharePoint Analytics and Intelligence Platform
      </Typography>
      
      <Box sx={{ 
        borderTop: '1px solid rgba(255,255,255,0.3)', 
        margin: '20px 0', 
        paddingTop: '20px' 
      }}>
        <Typography 
          variant="body2" 
          sx={{ fontSize: '0.875rem', margin: '5px 0' }}
        >
          <strong>© 2025 Thakral One. All Rights Reserved.</strong>
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ fontSize: '0.8125rem', margin: '5px 0' }}
        >
          Proprietary AI Prototype - Intellectual Property Protected
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ fontSize: '0.8125rem', margin: '5px 0' }}
        >
          <Link 
            href="https://www.thakralone.com" 
            target="_blank" 
            sx={{ 
              color: '#87ceeb', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            www.thakralone.com
          </Link>
          {' | Further. Together.'}
        </Typography>
      </Box>
      
      <Box sx={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: { xs: '12px', md: '15px' }, 
        borderRadius: '10px', 
        marginTop: '15px' 
      }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: { xs: '0.875rem', md: '1rem' }, 
            margin: 0, 
            fontWeight: 'bold' 
          }}
        >
          Ready to transform your SharePoint experience?
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.8125rem', md: '0.875rem' }, 
            margin: '5px 0',
            px: { xs: 1, md: 0 }
          }}
        >
          Contact Thakral One to discuss your AI-powered business intelligence solutions
        </Typography>
      </Box>
    </Box>
  );
};