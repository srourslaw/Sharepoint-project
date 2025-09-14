import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  COLOR_THEMES,
  ColorPalette,
  getThemeById,
  createMuiPaletteFromTheme
} from '../themes/colorPalettes';

interface DynamicThemeContextType {
  currentTheme: ColorPalette;
  themeName: string;
  muiTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: ColorPalette[];
}

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

interface DynamicThemeProviderProps {
  children: ReactNode;
}

export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({ children }) => {
  // Get initial theme from localStorage or default to purple
  const getInitialTheme = (): string => {
    try {
      return localStorage.getItem('dashboard-theme') || 'purple';
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return 'purple';
    }
  };

  const [themeName, setThemeName] = useState<string>(getInitialTheme);
  const [currentTheme, setCurrentTheme] = useState<ColorPalette>(getThemeById(themeName));

  // Create Material-UI theme from current color theme
  const createMuiTheme = (colorTheme: ColorPalette): Theme => {
    return createTheme({
      palette: {
        mode: 'light',
        ...createMuiPaletteFromTheme(colorTheme),
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 700,
        },
        h2: {
          fontWeight: 600,
        },
        h3: {
          fontWeight: 600,
        },
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 600,
        },
        h6: {
          fontWeight: 600,
        },
        button: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 24px',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              border: `1px solid ${colorTheme.text.disabled}20`,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
            elevation1: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            },
            elevation2: {
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
            elevation3: {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              background: `linear-gradient(135deg, ${colorTheme.primary} 0%, ${colorTheme.secondary} 30%, ${colorTheme.accent} 70%, ${colorTheme.primary} 100%)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: `1px solid ${colorTheme.text.disabled}20`,
              boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              margin: '2px 8px',
              '&.Mui-selected': {
                backgroundColor: `${colorTheme.primary}15`,
                color: colorTheme.primary,
                '&:hover': {
                  backgroundColor: `${colorTheme.primary}20`,
                },
              },
              '&:hover': {
                backgroundColor: `${colorTheme.primary}10`,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
            colorPrimary: {
              backgroundColor: colorTheme.primary,
              color: '#ffffff',
            },
          },
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              backgroundColor: `${colorTheme.primary}20`,
            },
            bar: {
              borderRadius: 4,
              backgroundColor: colorTheme.primary,
            },
          },
        },
      },
    });
  };

  const [muiTheme, setMuiTheme] = useState<Theme>(createMuiTheme(currentTheme));

  // Update Material-UI theme when currentTheme changes
  useEffect(() => {
    setMuiTheme(createMuiTheme(currentTheme));
  }, [currentTheme]);

  // Update theme function
  const setTheme = (themeId: string) => {
    try {
      const newTheme = getThemeById(themeId);
      setThemeName(themeId);
      setCurrentTheme(newTheme);
      setMuiTheme(createMuiTheme(newTheme));

      // Save to localStorage
      localStorage.setItem('dashboard-theme', themeId);

      console.log(`Theme switched to: ${newTheme.displayName}`);
    } catch (error) {
      console.error('Failed to switch theme:', error);
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = getInitialTheme();
    if (savedTheme !== themeName) {
      setTheme(savedTheme);
    }
  }, []);

  const contextValue: DynamicThemeContextType = {
    currentTheme,
    themeName,
    muiTheme,
    setTheme,
    availableThemes: COLOR_THEMES,
  };

  return (
    <DynamicThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </DynamicThemeContext.Provider>
  );
};

export const useDynamicTheme = (): DynamicThemeContextType => {
  const context = useContext(DynamicThemeContext);
  if (context === undefined) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
};