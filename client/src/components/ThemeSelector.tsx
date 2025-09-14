import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useDynamicTheme } from '../contexts/DynamicThemeContext';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, themeName, setTheme, availableThemes } = useDynamicTheme();
  const muiTheme = useTheme();

  const handleThemeChange = (themeId: string) => {
    console.log(`Switching theme from ${themeName} to ${themeId}`);
    setTheme(themeId);
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PaletteIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dashboard Theme
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose your preferred color theme for the dashboard
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={1.5}>
          {availableThemes.map((theme) => {
            const isSelected = theme.id === themeName;

            return (
              <Grid item xs={6} sm={4} md={3} key={theme.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${currentTheme.primary}`
                      : '2px solid transparent',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      border: isSelected
                        ? `2px solid ${currentTheme.primary}`
                        : `2px solid ${alpha(theme.primary, 0.3)}`,
                    },
                  }}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    {/* Theme Color Preview */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          height: 40,
                          borderRadius: 1.5,
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.accent} 100%)`,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {/* Color swatches overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            display: 'flex',
                            gap: 0.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: theme.success,
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: theme.warning,
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: theme.error,
                              border: '1px solid rgba(255,255,255,0.3)',
                            }}
                          />
                        </Box>

                        {/* Selected indicator */}
                        {isSelected && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            <CheckIcon
                              sx={{
                                fontSize: 12,
                                color: theme.primary,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Theme Info */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          mb: 0.5,
                          color: isSelected ? currentTheme.primary : 'text.primary',
                          textAlign: 'center',
                        }}
                      >
                        {theme.displayName}
                      </Typography>

                      {/* Status Chip */}
                      {isSelected && (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              backgroundColor: alpha(currentTheme.primary, 0.1),
                              color: currentTheme.primary,
                              fontWeight: 500,
                              fontSize: '0.6rem',
                              height: 18,
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Current Theme Info */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: alpha(currentTheme.primary, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(currentTheme.primary, 0.1)}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Current Theme: {currentTheme.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTheme.description}
          </Typography>

          {/* Color Palette Preview */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: currentTheme.primary,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Primary
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: currentTheme.secondary,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Secondary
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: currentTheme.accent,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Accent
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};