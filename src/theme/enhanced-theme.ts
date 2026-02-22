import { PaletteMode } from '@mui/material';
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

import {
  borderRadius,
  colors,
  shadows,
  spacing,
  transitions,
  typography,
} from './design-system/tokens';

// Light mode theme configuration
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light' as PaletteMode,
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: colors.neutral[0],
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: colors.neutral[0],
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700],
      contrastText: colors.neutral[0],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
      contrastText: colors.neutral[900],
    },
    info: {
      main: colors.ai[500],
      light: colors.ai[300],
      dark: colors.ai[700],
      contrastText: colors.neutral[0],
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
      contrastText: colors.neutral[0],
    },
    background: {
      default: colors.neutral[50],
      paper: colors.neutral[0],
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
      disabled: colors.neutral[500],
    },
    divider: colors.neutral[300],
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: colors.neutral[500],
      disabledBackground: colors.neutral[200],
    },
    grey: colors.neutral,
  },
};

// Dark mode theme configuration
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark' as PaletteMode,
    primary: {
      main: colors.primary[400],
      light: colors.primary[200],
      dark: colors.primary[600],
      contrastText: colors.neutral[900],
    },
    secondary: {
      main: colors.secondary[300],
      light: colors.secondary[200],
      dark: colors.secondary[500],
      contrastText: colors.neutral[900],
    },
    error: {
      main: colors.error[400],
      light: colors.error[200],
      dark: colors.error[600],
      contrastText: colors.neutral[900],
    },
    warning: {
      main: colors.warning[400],
      light: colors.warning[200],
      dark: colors.warning[600],
      contrastText: colors.neutral[900],
    },
    info: {
      main: colors.ai[400],
      light: colors.ai[200],
      dark: colors.ai[600],
      contrastText: colors.neutral[900],
    },
    success: {
      main: colors.success[400],
      light: colors.success[200],
      dark: colors.success[600],
      contrastText: colors.neutral[900],
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: colors.neutral[100],
      secondary: colors.neutral[400],
      disabled: colors.neutral[600],
    },
    divider: colors.neutral[700],
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
      disabled: colors.neutral[600],
      disabledBackground: colors.neutral[800],
    },
    grey: colors.neutral,
  },
};

// Shared theme configuration for both light and dark modes
const sharedThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: typography.fontFamily.primary,
    h1: {
      fontSize: typography.fontSize['4xl'].size,
      lineHeight: typography.fontSize['4xl'].lineHeight,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: typography.fontSize['3xl'].size,
      lineHeight: typography.fontSize['3xl'].lineHeight,
      fontWeight: typography.fontWeight.semiBold,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: typography.fontSize['2xl'].size,
      lineHeight: typography.fontSize['2xl'].lineHeight,
      fontWeight: typography.fontWeight.semiBold,
    },
    h4: {
      fontSize: typography.fontSize.xl.size,
      lineHeight: typography.fontSize.xl.lineHeight,
      fontWeight: typography.fontWeight.medium,
    },
    h5: {
      fontSize: typography.fontSize.lg.size,
      lineHeight: typography.fontSize.lg.lineHeight,
      fontWeight: typography.fontWeight.medium,
    },
    h6: {
      fontSize: typography.fontSize.base.size,
      lineHeight: typography.fontSize.base.lineHeight,
      fontWeight: typography.fontWeight.medium,
    },
    body1: {
      fontSize: typography.fontSize.base.size,
      lineHeight: typography.fontSize.base.lineHeight,
      fontWeight: typography.fontWeight.regular,
    },
    body2: {
      fontSize: typography.fontSize.sm.size,
      lineHeight: typography.fontSize.sm.lineHeight,
      fontWeight: typography.fontWeight.regular,
    },
    button: {
      fontSize: typography.fontSize.sm.size,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: typography.fontSize.xs.size,
      lineHeight: typography.fontSize.xs.lineHeight,
      fontWeight: typography.fontWeight.regular,
    },
  },
  shape: {
    borderRadius: parseInt(borderRadius.md),
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  breakpoints: {
    values: {
      xs: parseInt('0'),
      sm: parseInt('600'),
      md: parseInt('900'),
      lg: parseInt('1200'),
      xl: parseInt('1536'),
    },
  },
  transitions: {
    duration: {
      shortest: parseInt(transitions.duration.fast),
      shorter: parseInt(transitions.duration.fast),
      short: parseInt(transitions.duration.normal),
      standard: parseInt(transitions.duration.normal),
      complex: parseInt(transitions.duration.slow),
      enteringScreen: parseInt(transitions.duration.normal),
      leavingScreen: parseInt(transitions.duration.fast),
    },
    easing: {
      easeInOut: transitions.easing.easeInOut,
      easeOut: transitions.easing.easeOut,
      easeIn: transitions.easing.easeIn,
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: colors.neutral[400],
            borderRadius: borderRadius.full,
            '&:hover': {
              backgroundColor: colors.neutral[500],
            },
          },
        },
        // Focus visible styles for accessibility
        '*:focus-visible': {
          outline: `2px solid ${colors.primary[500]}`,
          outlineOffset: '2px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          textTransform: 'none',
          fontWeight: typography.fontWeight.medium,
          boxShadow: 'none',
          transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
          '&:hover': {
            boxShadow: shadows.sm,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        sizeLarge: {
          padding: `${spacing[4]} ${spacing[6]}`,
          fontSize: typography.fontSize.base.size,
        },
        sizeMedium: {
          padding: `${spacing[3]} ${spacing[4]}`,
          fontSize: typography.fontSize.sm.size,
        },
        sizeSmall: {
          padding: `${spacing[2]} ${spacing[3]}`,
          fontSize: typography.fontSize.xs.size,
        },
      },
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.base,
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.base,
        },
        elevation3: {
          boxShadow: shadows.md,
        },
        elevation4: {
          boxShadow: shadows.lg,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[200]}`,
          transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
          '&:hover': {
            boxShadow: shadows.md,
            borderColor: colors.neutral[300],
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.md,
            transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: typography.fontSize.sm.size,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.base,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.sm,
          borderBottom: `1px solid ${colors.neutral[200]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.neutral[200]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.xl,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.neutral[800],
          fontSize: typography.fontSize.xs.size,
          borderRadius: borderRadius.base,
          padding: `${spacing[1]} ${spacing[2]}`,
        },
      },
    },
  },
};

// Create light theme
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  ...lightThemeOptions,
  palette: {
    ...lightThemeOptions.palette,
  },
});

// Create dark theme
export const darkTheme = createTheme({
  ...sharedThemeOptions,
  ...darkThemeOptions,
  palette: {
    ...darkThemeOptions.palette,
  },
  components: {
    ...sharedThemeOptions.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[700]}`,
          backgroundColor: '#1e1e1e',
          transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
          '&:hover': {
            boxShadow: shadows.md,
            borderColor: colors.neutral[600],
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.sm,
          borderBottom: `1px solid ${colors.neutral[700]}`,
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.neutral[700]}`,
          boxShadow: 'none',
          backgroundColor: '#1e1e1e',
        },
      },
    },
  },
});

// Theme factory function to create theme based on mode
export const createAppTheme = (mode: PaletteMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Legacy theme export for backward compatibility
export const theme = lightTheme;

export type AppTheme = typeof lightTheme;

// Theme utilities
export const getThemeMode = (theme: Theme): PaletteMode => theme.palette.mode;

export const isDarkMode = (theme: Theme): boolean =>
  theme.palette.mode === 'dark';

export const isLightMode = (theme: Theme): boolean =>
  theme.palette.mode === 'light';
