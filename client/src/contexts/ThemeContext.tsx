import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sharepoint-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setIsDarkMode(settings.appearance?.darkMode || false);
      } catch (err) {
        console.warn('Could not parse saved settings for theme:', err);
      }
    }
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
  };

  // Create dynamic theme based on dark mode setting with modern vivid colors
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1', // Modern indigo
        light: '#8b5cf6', // Modern purple
        dark: '#4f46e5', // Deeper indigo
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Modern emerald
        light: '#34d399', // Light emerald
        dark: '#059669', // Deep emerald
        contrastText: '#ffffff',
      },
      background: {
        default: isDarkMode ? 
          'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 
          'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        paper: isDarkMode ? 
          'linear-gradient(145deg, #1e293b 0%, #334155 100%)' : 
          'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      },
      text: {
        primary: isDarkMode ? '#f8fafc' : '#1e293b',
        secondary: isDarkMode ? '#94a3b8' : '#64748b',
      },
      divider: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)',
      success: {
        main: '#10b981', // Modern emerald
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#f59e0b', // Modern amber
        light: '#fbbf24',
        dark: '#d97706',
        contrastText: '#ffffff',
      },
      info: {
        main: '#06b6d4', // Modern cyan
        light: '#22d3ee',
        dark: '#0891b2',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444', // Modern red
        light: '#f87171',
        dark: '#dc2626',
        contrastText: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.025em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: isDarkMode 
              ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: isDarkMode 
              ? '1px solid rgba(148, 163, 184, 0.1)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' 
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDarkMode 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: '0.875rem',
            letterSpacing: '-0.025em',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            },
          },
          contained: {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)',
            },
          },
          outlined: {
            borderWidth: '2px',
            borderColor: '#6366f1',
            background: 'transparent',
            '&:hover': {
              borderColor: '#4f46e5',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDarkMode 
              ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            color: isDarkMode ? '#f8fafc' : '#1e293b',
            boxShadow: isDarkMode 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            borderBottom: isDarkMode 
              ? '1px solid rgba(148, 163, 184, 0.2)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 500,
            fontSize: '0.75rem',
            '&.MuiChip-colorPrimary': {
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
            },
            '&.MuiChip-colorSecondary': {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: isDarkMode 
              ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 16,
            border: isDarkMode 
              ? '1px solid rgba(148, 163, 184, 0.1)' 
              : '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
              },
              '&.Mui-focused': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)',
              },
            },
          },
        },
      },
    },
  });

  const value = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};