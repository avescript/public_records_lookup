import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: tokens.colors.primary.main,
      light: tokens.colors.primary.light,
      dark: tokens.colors.primary.dark,
      contrastText: tokens.colors.primary.contrastText,
    },
    secondary: {
      main: tokens.colors.secondary.main,
      light: tokens.colors.secondary.light,
      dark: tokens.colors.secondary.dark,
      contrastText: tokens.colors.secondary.contrastText,
    },
    error: {
      main: tokens.colors.error.main,
      light: tokens.colors.error.light,
      dark: tokens.colors.error.dark,
      contrastText: tokens.colors.error.contrastText,
    },
    warning: {
      main: tokens.colors.warning.main,
      light: tokens.colors.warning.light,
      dark: tokens.colors.warning.dark,
      contrastText: tokens.colors.warning.contrastText,
    },
    info: {
      main: tokens.colors.info.main,
      light: tokens.colors.info.light,
      dark: tokens.colors.info.dark,
      contrastText: tokens.colors.info.contrastText,
    },
    success: {
      main: tokens.colors.success.main,
      light: tokens.colors.success.light,
      dark: tokens.colors.success.dark,
      contrastText: tokens.colors.success.contrastText,
    },
    grey: tokens.colors.grey,
  },
  typography: {
    fontFamily: tokens.typography.fontFamily.primary,
    h1: {
      fontSize: tokens.typography.fontSizes['4xl'],
      fontWeight: tokens.typography.fontWeights.bold,
      lineHeight: tokens.typography.lineHeights.tight,
    },
    h2: {
      fontSize: tokens.typography.fontSizes['3xl'],
      fontWeight: tokens.typography.fontWeights.bold,
      lineHeight: tokens.typography.lineHeights.tight,
    },
    h3: {
      fontSize: tokens.typography.fontSizes['2xl'],
      fontWeight: tokens.typography.fontWeights.medium,
      lineHeight: tokens.typography.lineHeights.tight,
    },
    h4: {
      fontSize: tokens.typography.fontSizes.xl,
      fontWeight: tokens.typography.fontWeights.medium,
      lineHeight: tokens.typography.lineHeights.normal,
    },
    h5: {
      fontSize: tokens.typography.fontSizes.lg,
      fontWeight: tokens.typography.fontWeights.medium,
      lineHeight: tokens.typography.lineHeights.normal,
    },
    h6: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.medium,
      lineHeight: tokens.typography.lineHeights.normal,
    },
    body1: {
      fontSize: tokens.typography.fontSizes.md,
      lineHeight: tokens.typography.lineHeights.relaxed,
    },
    body2: {
      fontSize: tokens.typography.fontSizes.sm,
      lineHeight: tokens.typography.lineHeights.relaxed,
    },
    button: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: parseInt(tokens.radii.md),
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  breakpoints: {
    values: {
      xs: parseInt(tokens.breakpoints.xs),
      sm: parseInt(tokens.breakpoints.sm),
      md: parseInt(tokens.breakpoints.md),
      lg: parseInt(tokens.breakpoints.lg),
      xl: parseInt(tokens.breakpoints.xl),
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radii.md,
          textTransform: 'none',
          fontWeight: tokens.typography.fontWeights.medium,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radii.lg,
        },
      },
    },
  },
});

export type Theme = typeof theme;
