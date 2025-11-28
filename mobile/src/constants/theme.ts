/**
 * Theme Configuration
 * Centralizes all colors, spacing, typography, and other design tokens
 * for consistent styling across the application.
 */

/**
 * Theme Configuration
 * Centralizes all colors, spacing, typography, and other design tokens
 * for consistent styling across the application.
 */

const palette = {
  primary: '#007AFF',
  primaryDark: '#00A896',
  primaryDarker: '#4CAF50',
  primaryLight: '#E3F2FD',
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
};

export const lightTheme = {
  colors: {
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryDarker: palette.primaryDarker,
    primaryLight: palette.primaryLight,

    background: palette.white,
    backgroundSecondary: palette.gray100,
    backgroundTertiary: palette.gray200,
    cardBackground: '#F9F9F9',

    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',

    border: '#DDDDDD',
    borderLight: '#E5E5E5',
    borderDark: '#CCCCCC',

    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
    accent: palette.primary, // Re-map accent to primary as it was #007AFF

    white: palette.white,
    black: palette.black,

    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(255, 255, 255, 0.3)',
    overlayMedium: 'rgba(255, 255, 255, 0.8)',

    gradientPrimary: [palette.primary, palette.primaryDarker],
    gradientCard: [palette.primary, palette.primaryDarker],

    gold: '#FFD700',
    disabled: '#CCCCCC',
    disabledBackground: '#999999',
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
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    backgroundTertiary: '#2C2C2C',
    cardBackground: '#1E1E1E',

    text: '#E0E0E0',
    textSecondary: '#B0B0B0',
    textLight: '#757575',

    border: '#333333',
    borderLight: '#424242',
    borderDark: '#616161',

    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(255, 255, 255, 0.1)',

    // Darker, more subtle gradients for dark mode
    gradientPrimary: ['#002a5c', '#00453e'], // Very Dark Blue -> Very Dark Teal
    gradientCard: ['#002a5c', '#00453e'],
  },
};

// Default export for backward compatibility (will be replaced by context)
export const theme = lightTheme;

export type Theme = typeof lightTheme;
