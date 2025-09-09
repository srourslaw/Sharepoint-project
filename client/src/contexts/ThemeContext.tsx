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

  // Create dynamic theme based on dark mode setting
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#0078d4', // Microsoft Blue
        light: '#106ebe',
        dark: '#005a9e',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#8764b8', // Microsoft Purple
        light: '#a47dd6',
        dark: '#6b4c96',
        contrastText: '#ffffff',
      },
      background: {
        default: isDarkMode ? '#1a1a1a' : '#faf9f8',
        paper: isDarkMode ? '#2d2d2d' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#323130',
        secondary: isDarkMode ? '#b3b3b3' : '#605e5c',
      },
      divider: isDarkMode ? '#404040' : '#edebe9',
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
      h1: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 4,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#323130',
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