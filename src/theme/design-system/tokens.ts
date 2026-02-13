/**
 * Design System Tokens
 * Unified design tokens for consistent UI across the V2 workflow
 */

// Color System
export const colors = {
  // Primary Colors - Professional and accessible
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Main primary
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },

  // Secondary Colors - Government/Legal theme
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0', // Main secondary
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },

  // Success Colors - Actions and confirmations
  success: {
    50: '#e8f5e8',
    100: '#c8e6c8',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Main success
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },

  // Warning Colors - Cautions and attention
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107', // Main warning
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },

  // Error Colors - Errors and dangerous actions
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336', // Main error
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },

  // Neutral Colors - Text, backgrounds, and borders
  neutral: {
    0: '#ffffff', // Pure white
    50: '#fafafa', // Background light
    100: '#f5f5f5', // Background
    200: '#eeeeee', // Background dark
    300: '#e0e0e0', // Border light
    400: '#bdbdbd', // Border
    500: '#9e9e9e', // Border dark / Text disabled
    600: '#757575', // Text secondary
    700: '#616161', // Text primary light
    800: '#424242', // Text primary
    900: '#212121', // Text primary dark
  },

  // AI-specific colors for AI integration components
  ai: {
    50: '#f0f4ff',
    100: '#d0e4ff',
    200: '#b3d7ff',
    300: '#80c7ff',
    400: '#66b3ff',
    500: '#4d9fff', // Main AI accent
    600: '#3d8bff',
    700: '#2d7fff',
    800: '#1d6fff',
    900: '#0d5fff',
  },
} as const;

// Typography System
export const typography = {
  // Font Families
  fontFamily: {
    primary:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace',
  },

  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },

  // Font Sizes with line heights
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' }, // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' }, // 14px
    base: { size: '1rem', lineHeight: '1.5rem' }, // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' }, // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' }, // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' }, // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px
  },
} as const;

// Spacing System - Based on 8px grid
export const spacing = {
  0: '0rem', // 0px
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

// Border Radius System
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px', // Full rounded
} as const;

// Shadow System
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// Transition System
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
} as const;

// Z-Index System
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Component-specific token collections
export const components = {
  button: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[6]}`, // 16px 24px
    },
  },

  input: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[5]}`, // 16px 20px
    },
  },

  card: {
    padding: {
      sm: spacing[4], // 16px
      md: spacing[6], // 24px
      lg: spacing[8], // 32px
    },
    borderRadius: borderRadius.lg,
    shadow: shadows.base,
  },
} as const;

// Type definitions for TypeScript support
export type ColorPalette = keyof typeof colors;
export type ColorShade = keyof typeof colors.primary;
export type FontSize = keyof typeof typography.fontSize;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type Breakpoint = keyof typeof breakpoints;
