/**
 * Theme Configuration
 * Centralizes all colors, spacing, typography, and other design tokens
 * for consistent styling across the application.
 */

export const theme = {
  colors: {
    // Primary Brand Colors (matching active plan card gradient)
    primary: '#007AFF', // Gradient start - blue
    primaryDark: '#00A896', // Teal/turquoise - gradient middle
    primaryDarker: '#4CAF50', // Gradient end - green
    primaryLight: '#E3F2FD',

    // Background Colors
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#FAFAFA',
    cardBackground: '#F9F9F9',

    // Text Colors
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',

    // Border Colors
    border: '#DDDDDD',
    borderLight: '#E5E5E5',
    borderDark: '#CCCCCC',

    // Status Colors
    success: '#4CAF50',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',
    accent: '#007AFF',

    // State Colors
    disabled: '#CCCCCC',
    disabledBackground: '#999999',

    // Base Colors
    white: '#FFFFFF',
    black: '#000000',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(255, 255, 255, 0.3)',
    overlayMedium: 'rgba(255, 255, 255, 0.8)',

    // Special Colors
    gold: '#FFD700',

    // Gradient Colors (for LinearGradient arrays)
    gradientPrimary: ['#007AFF', '#4CAF50'],
    gradientCard: ['#007AFF', '#4CAF50'],
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 64,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },

  opacity: {
    disabled: 0.9,
  },
};

export type Theme = typeof theme;
