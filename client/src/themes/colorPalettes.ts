// MindNode-Inspired Color Palette for SharePoint AI Dashboard

export interface ColorPalette {
  id: string;
  name: string;
  displayName: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Base colors from the MindNode palette
export const MINDNODE_COLORS = {
  // Primary & Background Colors
  deepNavy: '#2c3e50',
  charcoal: '#34495e',
  lightGray: '#ecf0f1',
  offWhite: '#f8f9fa',

  // Vibrant Accent Colors
  skyBlue: '#3498db',
  emeraldGreen: '#2ecc71',
  orange: '#f39c12',
  red: '#e74c3c',

  // Soft Pastels for Mind Map Nodes
  mintGreen: '#a8e6cf',
  brightYellow: '#ffd93d',
  coralPink: '#ff9aa2',
  seafoam: '#b5ead7',

  // Professional Blues & Purples
  periwinkle: '#5d7fdb',
  violet: '#9013fe',
  softBlue: '#667eea',
  deepPurple: '#764ba2',

  // Additional Neutrals & Supporting Colors
  coolGray: '#95a5a6',
  slateGray: '#7f8c8d',
  silver: '#bdc3c7',
  pureWhite: '#ffffff',
} as const;

// Color theme definitions
export const COLOR_THEMES: ColorPalette[] = [
  // Current Purple Theme
  {
    id: 'purple',
    name: 'purple',
    displayName: 'Royal Purple',
    description: 'The classic purple theme - sophisticated and professional',
    primary: '#7c3aed',
    secondary: '#9013fe',
    accent: '#8b5cf6',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Sky Blue Theme
  {
    id: 'skyblue',
    name: 'skyblue',
    displayName: 'Sky Blue',
    description: 'Fresh and modern with vibrant blue accents',
    primary: '#2563eb', // Deep blue
    secondary: '#3b82f6', // Medium blue
    accent: '#60a5fa', // Light blue
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Emerald Green Theme
  {
    id: 'emerald',
    name: 'emerald',
    displayName: 'Emerald Green',
    description: 'Nature-inspired with vibrant green tones',
    primary: '#059669', // Deep emerald
    secondary: '#10b981', // Medium emerald
    accent: '#34d399', // Light emerald
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Orange Sunset Theme
  {
    id: 'orange',
    name: 'orange',
    displayName: 'Orange Sunset',
    description: 'Warm and energetic with sunset orange tones',
    primary: '#ea580c', // Deep orange
    secondary: '#f97316', // Medium orange
    accent: '#fb923c', // Light orange
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Coral Pink Theme
  {
    id: 'coral',
    name: 'coral',
    displayName: 'Coral Pink',
    description: 'Soft and creative with coral pink highlights',
    primary: '#ec4899', // Deep pink
    secondary: '#f472b6', // Medium pink
    accent: '#f9a8d4', // Light pink
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Mint Green Theme
  {
    id: 'mint',
    name: 'mint',
    displayName: 'Mint Fresh',
    description: 'Calm and refreshing with mint green accents',
    primary: '#14b8a6', // Deep teal
    secondary: '#20d9cc', // Medium teal
    accent: '#7dd3fc', // Light teal
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Professional Navy Theme
  {
    id: 'navy',
    name: 'navy',
    displayName: 'Professional Navy',
    description: 'Corporate and sophisticated with deep navy tones',
    primary: '#1e293b', // Deep navy
    secondary: '#334155', // Medium navy
    accent: '#64748b', // Light navy
    background: '#ecf0f1',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Periwinkle Theme
  {
    id: 'periwinkle',
    name: 'periwinkle',
    displayName: 'Periwinkle Blue',
    description: 'Elegant and modern with periwinkle accents',
    primary: '#6366f1', // Deep indigo
    secondary: '#8b5cf6', // Medium indigo
    accent: '#a78bfa', // Light indigo
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#34495e',
      disabled: '#95a5a6',
    },
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#6366f1',
  },
];

// Helper function to get theme by ID
export const getThemeById = (themeId: string): ColorPalette => {
  const theme = COLOR_THEMES.find(t => t.id === themeId);
  return theme || COLOR_THEMES[0]; // Default to purple if not found
};

// Helper function to get all theme names
export const getThemeNames = (): string[] => {
  return COLOR_THEMES.map(theme => theme.name);
};

// Helper function to create Material-UI theme palette from ColorPalette
export const createMuiPaletteFromTheme = (colorTheme: ColorPalette) => ({
  primary: {
    main: colorTheme.primary,
    light: lightenColor(colorTheme.primary, 0.3),
    dark: darkenColor(colorTheme.primary, 0.3),
  },
  secondary: {
    main: colorTheme.secondary,
    light: lightenColor(colorTheme.secondary, 0.3),
    dark: darkenColor(colorTheme.secondary, 0.3),
  },
  error: {
    main: colorTheme.error,
  },
  warning: {
    main: colorTheme.warning,
  },
  info: {
    main: colorTheme.info,
  },
  success: {
    main: colorTheme.success,
  },
  background: {
    default: colorTheme.background,
    paper: colorTheme.surface,
  },
  text: {
    primary: colorTheme.text.primary,
    secondary: colorTheme.text.secondary,
    disabled: colorTheme.text.disabled,
  },
});

// Utility functions for color manipulation
function lightenColor(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function darkenColor(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.round(r * (1 - factor));
  const newG = Math.round(g * (1 - factor));
  const newB = Math.round(b * (1 - factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}