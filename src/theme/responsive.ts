import { Theme, useMediaQuery, useTheme } from '@mui/material/styles';
import { Breakpoint } from '@mui/material/styles/createBreakpoints';

// Responsive breakpoints (extending the default MUI breakpoints)
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
  // Custom breakpoints for specific needs
  mobile: 600,
  tablet: 900,
  laptop: 1200,
  desktop: 1536,
  wide: 1920,
} as const;

// Responsive utilities type
export interface ResponsiveUtilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideScreen: boolean;
  breakpoint: Breakpoint;
  screenSize: keyof typeof breakpoints;
  isUp: (breakpoint: Breakpoint) => boolean;
  isDown: (breakpoint: Breakpoint) => boolean;
  isOnly: (breakpoint: Breakpoint) => boolean;
  isBetween: (start: Breakpoint, end: Breakpoint) => boolean;
}

// Hook for responsive utilities
export const useResponsive = (): ResponsiveUtilities => {
  const theme = useTheme();

  // Media query hooks - call all hooks at the top level
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  // Pre-compute all media queries for helper functions
  const mediaQueries = {
    xs: useMediaQuery(theme.breakpoints.only('xs')),
    sm: useMediaQuery(theme.breakpoints.only('sm')),
    md: useMediaQuery(theme.breakpoints.only('md')),
    lg: useMediaQuery(theme.breakpoints.only('lg')),
    xl: useMediaQuery(theme.breakpoints.only('xl')),
    upXs: useMediaQuery(theme.breakpoints.up('xs')),
    upSm: useMediaQuery(theme.breakpoints.up('sm')),
    upMd: useMediaQuery(theme.breakpoints.up('md')),
    upLg: useMediaQuery(theme.breakpoints.up('lg')),
    upXl: useMediaQuery(theme.breakpoints.up('xl')),
    downXs: useMediaQuery(theme.breakpoints.down('xs')),
    downSm: useMediaQuery(theme.breakpoints.down('sm')),
    downMd: useMediaQuery(theme.breakpoints.down('md')),
    downLg: useMediaQuery(theme.breakpoints.down('lg')),
    downXl: useMediaQuery(theme.breakpoints.down('xl')),
    betweenXsSm: useMediaQuery(theme.breakpoints.between('xs', 'sm')),
    betweenSmMd: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    betweenMdLg: useMediaQuery(theme.breakpoints.between('md', 'lg')),
    betweenLgXl: useMediaQuery(theme.breakpoints.between('lg', 'xl')),
  };

  // Helper functions that use pre-computed values
  const isUp = (breakpoint: Breakpoint): boolean => {
    switch (breakpoint) {
      case 'xs':
        return mediaQueries.upXs;
      case 'sm':
        return mediaQueries.upSm;
      case 'md':
        return mediaQueries.upMd;
      case 'lg':
        return mediaQueries.upLg;
      case 'xl':
        return mediaQueries.upXl;
      default:
        return false;
    }
  };

  const isDown = (breakpoint: Breakpoint): boolean => {
    switch (breakpoint) {
      case 'xs':
        return mediaQueries.downXs;
      case 'sm':
        return mediaQueries.downSm;
      case 'md':
        return mediaQueries.downMd;
      case 'lg':
        return mediaQueries.downLg;
      case 'xl':
        return mediaQueries.downXl;
      default:
        return false;
    }
  };

  const isOnly = (breakpoint: Breakpoint): boolean => {
    switch (breakpoint) {
      case 'xs':
        return mediaQueries.xs;
      case 'sm':
        return mediaQueries.sm;
      case 'md':
        return mediaQueries.md;
      case 'lg':
        return mediaQueries.lg;
      case 'xl':
        return mediaQueries.xl;
      default:
        return false;
    }
  };

  const isBetween = (start: Breakpoint, end: Breakpoint): boolean => {
    const key = `between${start.charAt(0).toUpperCase() + start.slice(1)}${end.charAt(0).toUpperCase() + end.slice(1)}`;
    return mediaQueries[key as keyof typeof mediaQueries] || false;
  };

  // Determine current breakpoint
  let breakpoint: Breakpoint = 'xs';
  let screenSize: keyof typeof breakpoints = 'mobile';

  if (isWideScreen) {
    breakpoint = 'xl';
    screenSize = 'wide';
  } else if (isDesktop) {
    breakpoint = 'lg';
    screenSize = 'desktop';
  } else if (isTablet) {
    breakpoint = 'md';
    screenSize = 'tablet';
  } else if (!isMobile) {
    breakpoint = 'sm';
    screenSize = 'tablet';
  } else {
    breakpoint = 'xs';
    screenSize = 'mobile';
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
    breakpoint,
    screenSize,
    isUp,
    isDown,
    isOnly,
    isBetween,
  };
};

// Responsive value type (similar to MUI responsive props but more extensive)
export type ResponsiveValue<T> =
  | T
  | {
      xs?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
    };

// Get responsive value based on current breakpoint
export const getResponsiveValue = <T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  theme: Theme
): T => {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }

  const breakpointValues = value as Record<string, T>;

  // Get the breakpoint order
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Look for the value at current breakpoint or closest smaller one
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (breakpointValues[bp] !== undefined) {
      return breakpointValues[bp];
    }
  }

  // If no value found, return undefined or first available value
  for (const bp of breakpointOrder) {
    if (breakpointValues[bp] !== undefined) {
      return breakpointValues[bp];
    }
  }

  return undefined as T;
};

// Hook to get responsive value
export const useResponsiveValue = <T>(value: ResponsiveValue<T>): T => {
  const { breakpoint } = useResponsive();
  const theme = useTheme();

  return getResponsiveValue(value, breakpoint, theme);
};

// Responsive spacing utilities
export const responsiveSpacing = {
  // Container padding
  containerPadding: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 6,
    xl: 8,
  },

  // Section spacing
  sectionSpacing: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // Card padding
  cardPadding: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 4,
    xl: 6,
  },

  // Form spacing
  formSpacing: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 4,
    xl: 4,
  },
} as const;

// Responsive typography utilities
export const responsiveTypography = {
  // Hero text
  heroTitle: {
    xs: 'h4',
    sm: 'h3',
    md: 'h2',
    lg: 'h1',
    xl: 'h1',
  },

  // Section titles
  sectionTitle: {
    xs: 'h5',
    sm: 'h4',
    md: 'h3',
    lg: 'h3',
    xl: 'h2',
  },

  // Card titles
  cardTitle: {
    xs: 'h6',
    sm: 'h6',
    md: 'h5',
    lg: 'h5',
    xl: 'h5',
  },

  // Body text
  body: {
    xs: 'body2',
    sm: 'body1',
    md: 'body1',
    lg: 'body1',
    xl: 'body1',
  },
} as const;

// Container max widths
export const containerMaxWidths = {
  xs: '100%',
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
  content: '1200px', // Standard content width
  narrow: '768px', // Narrow content (forms, articles)
  wide: '1400px', // Wide content (dashboards)
  full: '100%', // Full width
} as const;

// Responsive grid utilities
export const gridSpacing = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
} as const;

// Common responsive patterns
export const responsivePatterns = {
  // Stack on mobile, row on desktop
  mobileStack: {
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 2, md: 4 },
  },

  // Center on mobile, left align on desktop
  mobileCenter: {
    textAlign: { xs: 'center', md: 'left' },
  },

  // Full width on mobile, auto on desktop
  mobileFullWidth: {
    width: { xs: '100%', md: 'auto' },
  },

  // Hide on mobile
  hideOnMobile: {
    display: { xs: 'none', sm: 'block' },
  },

  // Show only on mobile
  mobileOnly: {
    display: { xs: 'block', sm: 'none' },
  },

  // Responsive padding
  responsivePadding: {
    padding: { xs: 2, sm: 3, md: 4, lg: 6 },
  },

  // Responsive margin
  responsiveMargin: {
    margin: { xs: 1, sm: 2, md: 3, lg: 4 },
  },
} as const;

// Get container props for different layout types
export const getContainerProps = (
  variant: 'content' | 'narrow' | 'wide' | 'full' = 'content'
) => ({
  maxWidth: containerMaxWidths[variant] as any,
  width: '100%',
  mx: 'auto',
  px: responsiveSpacing.containerPadding,
});

// Get responsive props for common patterns
export const getResponsiveProps = (pattern: keyof typeof responsivePatterns) =>
  responsivePatterns[pattern];

// Export all utilities as named export
export const responsiveUtils = {
  breakpoints,
  useResponsive,
  useResponsiveValue,
  getResponsiveValue,
  responsiveSpacing,
  responsiveTypography,
  containerMaxWidths,
  gridSpacing,
  responsivePatterns,
  getContainerProps,
  getResponsiveProps,
};

// Default export for backward compatibility
export default responsiveUtils;
