import React, { useEffect, useRef, useState } from 'react';

// Types for accessibility utilities
export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

export interface FocusManagementOptions {
  restoreOnCleanup?: boolean;
  preventScroll?: boolean;
  selectTextContent?: boolean;
}

export interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

// Hook to detect user accessibility preferences
export const useAccessibilityPreferences = (): AccessibilityPreferences => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePreferences = () => {
      setPreferences({
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
          .matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        largeText: window.matchMedia('(prefers-reduced-data: reduce)').matches,
        screenReader:
          window.navigator.userAgent.includes('NVDA') ||
          window.navigator.userAgent.includes('JAWS') ||
          window.navigator.userAgent.includes('VoiceOver'),
      });
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-data: reduce)'),
    ];

    mediaQueries.forEach(mq =>
      mq.addEventListener('change', updatePreferences)
    );

    return () => {
      mediaQueries.forEach(mq =>
        mq.removeEventListener('change', updatePreferences)
      );
    };
  }, []);

  return preferences;
};

// Hook for focus management
export const useFocusManagement = () => {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  // Get all focusable elements within a container
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(
      container.querySelectorAll(focusableSelector)
    ) as HTMLElement[];
  };

  // Focus trap for modals/dialogs
  const trapFocus = (container: HTMLElement) => {
    const elements = getFocusableElements(container);
    setFocusableElements(elements);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && elements.length > 0) {
        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab (moving backward)
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab (moving forward)
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first element
    if (elements.length > 0) {
      elements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  // Navigate focus with arrow keys
  const navigateWithArrows = (
    container: HTMLElement,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) => {
    const elements = getFocusableElements(container);
    setFocusableElements(elements);

    const handleKeyDown = (e: KeyboardEvent) => {
      let targetIndex = -1;
      const currentIndex = elements.indexOf(
        document.activeElement as HTMLElement
      );

      if (orientation === 'vertical') {
        if (e.key === 'ArrowDown') {
          targetIndex =
            currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
          targetIndex =
            currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        }
      } else {
        if (e.key === 'ArrowRight') {
          targetIndex =
            currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowLeft') {
          targetIndex =
            currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        }
      }

      if (targetIndex !== -1) {
        e.preventDefault();
        elements[targetIndex].focus();
        setCurrentFocusIndex(targetIndex);
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    trapFocus,
    navigateWithArrows,
    getFocusableElements,
    focusableElements,
    currentFocusIndex,
  };
};

// Hook for screen reader announcements
export const useScreenReaderAnnouncements = () => {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement element if it doesn't exist
    if (typeof window !== 'undefined' && !announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('aria-relevant', 'text');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (
        announcerRef.current &&
        document.body.contains(announcerRef.current)
      ) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = (message: string, options: AnnouncementOptions = {}) => {
    if (!announcerRef.current) return;

    const { priority = 'polite', atomic = true, relevant = 'text' } = options;

    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.setAttribute('aria-atomic', String(atomic));
    announcerRef.current.setAttribute('aria-relevant', relevant);

    // Clear previous message and add new one
    announcerRef.current.textContent = '';
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  };

  const announceError = (message: string) => {
    announce(`Error: ${message}`, { priority: 'assertive' });
  };

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, { priority: 'polite' });
  };

  const announceLoading = (message: string = 'Loading') => {
    announce(message, { priority: 'polite' });
  };

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
  };
};

// Hook for skip links management
export const useSkipLinks = () => {
  const [skipLinks, setSkipLinks] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const addSkipLink = (id: string, label: string) => {
    setSkipLinks(prev => {
      if (prev.find(link => link.id === id)) return prev;
      return [...prev, { id, label }];
    });
  };

  const removeSkipLink = (id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  };

  const focusSkipTarget = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    focusSkipTarget,
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  options: {
    onEscape?: () => void;
    onEnter?: () => void;
    onSpace?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  } = {}
) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        options.onEscape?.();
        break;
      case 'Enter':
        options.onEnter?.();
        break;
      case ' ':
      case 'Space':
        options.onSpace?.();
        break;
      case 'ArrowUp':
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        options.onArrowRight?.();
        break;
    }
  };

  const bindKeyboardListeners = (element: HTMLElement | null) => {
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
    return () => {};
  };

  return {
    handleKeyDown,
    bindKeyboardListeners,
  };
};

// Utility functions
export const accessibility = {
  // Generate unique IDs for form labels
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get color contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    // Simple contrast calculation (would need a color library for full implementation)
    // This is a placeholder for a more comprehensive contrast calculation
    return 4.5; // WCAG AA standard
  },

  // Check if an element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusableElements = ['button', 'input', 'select', 'textarea', 'a'];

    return (
      (focusableElements.includes(element.tagName.toLowerCase()) ||
        element.hasAttribute('tabindex') ||
        element.hasAttribute('contenteditable')) &&
      !element.hasAttribute('disabled')
    );
  },

  // Get readable text content from an element
  getAccessibleText: (element: HTMLElement): string => {
    return (
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent ||
      element.getAttribute('title') ||
      ''
    ).trim();
  },

  // Check if reduced motion is preferred
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Focus an element with options
  focusElement: (
    element: HTMLElement,
    options: FocusManagementOptions = {}
  ) => {
    const { preventScroll = false, selectTextContent = false } = options;

    element.focus({ preventScroll });

    if (selectTextContent && (element as any).select) {
      (element as any).select();
    }
  },

  // Create skip link
  createSkipLink: (targetId: string, text: string): HTMLElement => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: 10000;
      padding: 8px 16px;
      background: #000;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.left = '10px';
      skipLink.style.top = '10px';
      skipLink.style.width = 'auto';
      skipLink.style.height = 'auto';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.left = '-10000px';
      skipLink.style.top = 'auto';
      skipLink.style.width = '1px';
      skipLink.style.height = '1px';
    });

    return skipLink;
  },
};

// Export all utilities as named export
export const accessibilityUtils = {
  useAccessibilityPreferences,
  useFocusManagement,
  useScreenReaderAnnouncements,
  useSkipLinks,
  useKeyboardNavigation,
  accessibility,
};

// Default export for backward compatibility
export default accessibilityUtils;
