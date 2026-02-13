import type { Preview } from '@storybook/nextjs-vite';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import React from 'react';

// Import our design tokens
import {
  colors,
  typography,
  spacing,
  transitions,
  borderRadius,
} from '../src/theme/design-system/tokens';

// Create Material-UI theme from our design tokens
const storybookTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
    },
    error: {
      main: colors.error[500],
    },
    warning: {
      main: colors.warning[500],
    },
    success: {
      main: colors.success[500],
    },
  },
  typography: {
    fontFamily: typography.fontFamily.primary,
  },
  shape: {
    borderRadius: parseInt(borderRadius.md.replace('rem', '')) * 16, // Convert rem to px
  },
  transitions: {
    duration: {
      short: parseInt(transitions.duration.fast.replace('ms', '')),
      standard: parseInt(transitions.duration.medium.replace('ms', '')),
    },
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: colors.neutral[50],
        },
        {
          name: 'dark',
          value: colors.neutral[900],
        },
        {
          name: 'primary',
          value: colors.primary[50],
        },
      ],
    },
  },
  decorators: [
    Story =>
      React.createElement(
        ThemeProvider,
        { theme: storybookTheme },
        React.createElement(CssBaseline),
        React.createElement(
          'div',
          { style: { padding: '1rem' } },
          React.createElement(Story)
        )
      ),
  ],
};

export default preview;
