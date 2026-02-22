'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Box, GlobalStyles } from '@mui/material';

import {
  accessibility,
  useAccessibilityPreferences,
  useScreenReaderAnnouncements,
} from '../../utils/accessibility';
import { SkipLinksNavigation } from '../shared/SkipLinks';

import FocusManagementProvider from './FocusManagement';
import { FocusManagementProvider as FMProvider } from './FocusManagement';

// Accessibility context type
interface AccessibilityContextType {
  preferences: ReturnType<typeof useAccessibilityPreferences>;
  announcements: ReturnType<typeof useScreenReaderAnnouncements>;
  highContrastMode: boolean;
  reducedMotion: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
}

// Create accessibility context
const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

// Accessibility provider props
interface AccessibilityProviderProps {
  children: React.ReactNode;
  enableSkipLinks?: boolean;
  skipLinks?: Array<{ id: string; label: string; href?: string }>;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
}

// Global styles for accessibility features
const AccessibilityGlobalStyles = ({
  reducedMotion,
  highContrastMode,
}: {
  reducedMotion: boolean;
  highContrastMode: boolean;
}) => (
  <GlobalStyles
    styles={theme => ({
      // Reduced motion styles
      ...(reducedMotion && {
        '*': {
          animationDuration: '0.001ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.001ms !important',
          scrollBehavior: 'auto !important',
        },
      }),

      // High contrast mode styles
      ...(highContrastMode && {
        '*': {
          borderColor: `${theme.palette.text.primary} !important`,
        },
        'button, input, select, textarea': {
          borderWidth: '2px !important',
          borderStyle: 'solid !important',
        },
        a: {
          textDecoration: 'underline !important',
          textDecorationThickness: '2px !important',
        },
        ':focus-visible': {
          outline: `3px solid ${theme.palette.primary.main} !important`,
          outlineOffset: '2px !important',
        },
      }),

      // Focus styles for all interactive elements
      'button, input, select, textarea, a, [tabindex]': {
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
          borderRadius: theme.shape.borderRadius,
        },
      },

      // Skip link styles
      '.skip-link': {
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        zIndex: 10000,
        padding: theme.spacing(1, 2),
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        textDecoration: 'none',
        borderRadius: theme.shape.borderRadius,
        fontWeight: 600,
        fontSize: '0.875rem',
        border: `2px solid ${theme.palette.primary.dark}`,
        boxShadow: theme.shadows[4],

        '&:focus': {
          left: theme.spacing(1),
          top: theme.spacing(1),
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
        },
      },

      // Screen reader only content
      '.sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      },

      // Enhanced keyboard navigation
      '[role="button"], [role="link"], [role="menuitem"]': {
        cursor: 'pointer',

        '&:hover': {
          textDecoration: 'underline',
        },

        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      },

      // Table accessibility improvements
      table: {
        borderCollapse: 'collapse',

        'th, td': {
          textAlign: 'left',
          verticalAlign: 'top',
        },

        th: {
          fontWeight: 600,
        },
      },

      // Form accessibility improvements
      label: {
        cursor: 'pointer',
      },

      'input[required], select[required], textarea[required]': {
        '&:invalid': {
          borderColor: theme.palette.error.main,
        },
      },

      // ARIA live regions
      '[aria-live]': {
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      },

      // Better focus indicators for custom components
      '[role="tab"]': {
        cursor: 'pointer',

        '&[aria-selected="true"]': {
          fontWeight: 600,
        },

        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      },

      // Dialog and modal accessibility
      '[role="dialog"], [role="alertdialog"]': {
        '&:focus': {
          outline: 'none',
        },
      },

      // Better color contrast for error states
      '.error, [aria-invalid="true"]': {
        borderColor: `${theme.palette.error.main} !important`,
        color: theme.palette.error.main,
      },

      // Loading state accessibility
      '[aria-busy="true"]': {
        cursor: 'wait',
      },

      // Disabled state accessibility
      '[aria-disabled="true"], :disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
        pointerEvents: 'none',
      },
    })}
  />
);

// Accessibility provider component
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  enableSkipLinks = true,
  skipLinks,
  enableHighContrast = true,
  enableReducedMotion = true,
}) => {
  const preferences = useAccessibilityPreferences();
  const announcements = useScreenReaderAnnouncements();

  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync with system preferences
  useEffect(() => {
    if (enableHighContrast) {
      setHighContrastMode(preferences.highContrast);
    }
    if (enableReducedMotion) {
      setReducedMotion(preferences.reduceMotion);
    }
  }, [preferences, enableHighContrast, enableReducedMotion]);

  // Add skip links to document head
  useEffect(() => {
    if (enableSkipLinks && typeof window !== 'undefined') {
      const head = document.head;
      const existingSkipStyles = document.getElementById('skip-links-styles');

      if (!existingSkipStyles) {
        const style = document.createElement('style');
        style.id = 'skip-links-styles';
        style.textContent = `
          .skip-link:focus {
            left: 8px !important;
            top: 8px !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
        `;
        head.appendChild(style);
      }
    }
  }, [enableSkipLinks]);

  // Announce route changes for screen readers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRouteChange = () => {
        const pageTitle = document.title;
        announcements.announce(`Navigated to ${pageTitle}`, {
          priority: 'polite',
        });
      };

      // Listen for navigation events
      let lastUrl = window.location.href;
      const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          handleRouteChange();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, [announcements]);

  const contextValue: AccessibilityContextType = {
    preferences,
    announcements,
    highContrastMode,
    reducedMotion,
    setHighContrastMode,
    setReducedMotion,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <FMProvider>
        {/* Global accessibility styles */}
        <AccessibilityGlobalStyles
          reducedMotion={reducedMotion}
          highContrastMode={highContrastMode}
        />

        {/* Skip links navigation */}
        {enableSkipLinks && <SkipLinksNavigation links={skipLinks} />}

        {/* Main content */}
        <Box
          sx={{
            // Enhanced focus management
            '&:focus-within': {
              '& .focus-indicator': {
                opacity: 1,
              },
            },
          }}
        >
          {children}
        </Box>
      </FMProvider>
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
};

// Hook for accessible announcements
export const useAccessibleAnnouncements = () => {
  const { announcements } = useAccessibility();

  const announceNavigation = (destination: string) => {
    announcements.announce(`Navigating to ${destination}`, {
      priority: 'polite',
    });
  };

  const announceAction = (action: string, success = true) => {
    if (success) {
      announcements.announceSuccess(action);
    } else {
      announcements.announceError(`Failed to ${action}`);
    }
  };

  const announceLoading = (resource?: string) => {
    announcements.announceLoading(resource ? `Loading ${resource}` : 'Loading');
  };

  return {
    ...announcements,
    announceNavigation,
    announceAction,
    announceLoading,
  };
};

// Hook for accessible form validation
export const useAccessibleForm = () => {
  const { announcements } = useAccessibility();

  const announceValidationError = (fieldName: string, error: string) => {
    announcements.announceError(`${fieldName}: ${error}`);
  };

  const announceFormSuccess = (
    message: string = 'Form submitted successfully'
  ) => {
    announcements.announceSuccess(message);
  };

  const announceFieldChange = (fieldName: string, value: string) => {
    announcements.announce(`${fieldName} changed to ${value}`, {
      priority: 'polite',
    });
  };

  return {
    announceValidationError,
    announceFormSuccess,
    announceFieldChange,
  };
};

export default AccessibilityProvider;
