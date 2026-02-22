'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  useFocusManagement,
  useScreenReaderAnnouncements,
} from '../../utils/accessibility';

// Focus management context type
interface FocusManagementContextType {
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  saveFocusedElement: () => void;
  focusFirstElement: (container: HTMLElement) => void;
  focusLastElement: (container: HTMLElement) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
}

// Create focus management context
const FocusManagementContext = createContext<
  FocusManagementContextType | undefined
>(undefined);

// Focus management provider props
interface FocusManagementProviderProps {
  children: React.ReactNode;
}

// Focus management provider component
export const FocusManagementProvider: React.FC<
  FocusManagementProviderProps
> = ({ children }) => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const { trapFocus, getFocusableElements } = useFocusManagement();
  const { announce, announceError, announceSuccess } =
    useScreenReaderAnnouncements();

  // Save the currently focused element
  const saveFocusedElement = useCallback(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  // Restore focus to the previously focused element
  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
    }
  }, []);

  // Focus the first focusable element in a container
  const focusFirstElement = useCallback(
    (container: HTMLElement) => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    },
    [getFocusableElements]
  );

  // Focus the last focusable element in a container
  const focusLastElement = useCallback(
    (container: HTMLElement) => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
      }
    },
    [getFocusableElements]
  );

  // Enhanced trap focus with save/restore
  const enhancedTrapFocus = useCallback(
    (container: HTMLElement) => {
      saveFocusedElement();
      const cleanup = trapFocus(container);

      return () => {
        cleanup();
        restoreFocus();
      };
    },
    [trapFocus, saveFocusedElement, restoreFocus]
  );

  const contextValue: FocusManagementContextType = {
    trapFocus: enhancedTrapFocus,
    restoreFocus,
    saveFocusedElement,
    focusFirstElement,
    focusLastElement,
    announce,
    announceError,
    announceSuccess,
  };

  return (
    <FocusManagementContext.Provider value={contextValue}>
      {children}
    </FocusManagementContext.Provider>
  );
};

// Hook to use focus management
export const useFocusManager = (): FocusManagementContextType => {
  const context = useContext(FocusManagementContext);
  if (context === undefined) {
    throw new Error(
      'useFocusManager must be used within a FocusManagementProvider'
    );
  }
  return context;
};

// Focus trap component for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreOnCleanup?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreOnCleanup = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus } = useFocusManager();

  useEffect(() => {
    if (active && containerRef.current) {
      const cleanup = trapFocus(containerRef.current);

      if (restoreOnCleanup) {
        return cleanup;
      } else {
        return () => {
          // Cleanup focus trap but don't restore focus
          cleanup();
        };
      }
    }
  }, [active, trapFocus, restoreOnCleanup]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Auto-focus wrapper component
interface AutoFocusProps {
  children: React.ReactNode;
  selector?: string;
  delay?: number;
  disabled?: boolean;
}

export const AutoFocus: React.FC<AutoFocusProps> = ({
  children,
  selector,
  delay = 0,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { focusFirstElement } = useFocusManager();

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const focusElement = () => {
      if (selector) {
        const target = containerRef.current?.querySelector(
          selector
        ) as HTMLElement;
        if (target) {
          target.focus();
        }
      } else {
        focusFirstElement(containerRef.current!);
      }
    };

    if (delay > 0) {
      const timeout = setTimeout(focusElement, delay);
      return () => clearTimeout(timeout);
    } else {
      focusElement();
    }
  }, [selector, delay, disabled, focusFirstElement]);

  return <div ref={containerRef}>{children}</div>;
};

// Focus guard components for complex focus management
export const FocusGuard: React.FC<{ onFocus?: () => void }> = ({ onFocus }) => {
  return (
    <div
      tabIndex={0}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      onFocus={onFocus}
      aria-hidden='true'
    />
  );
};

// Hook for focus visible management
export const useFocusVisible = () => {
  const [focusVisible, setFocusVisible] = React.useState(false);

  useEffect(() => {
    let hadKeyboardEvent = false;

    const onKeyDown = () => {
      hadKeyboardEvent = true;
    };

    const onMouseDown = () => {
      hadKeyboardEvent = false;
    };

    const onFocus = () => {
      setFocusVisible(hadKeyboardEvent);
    };

    const onBlur = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('focus', onFocus, true);
      document.removeEventListener('blur', onBlur, true);
    };
  }, []);

  return focusVisible;
};

// Hook for focus within detection
export const useFocusWithin = (ref: React.RefObject<HTMLElement>) => {
  const [focusWithin, setFocusWithin] = React.useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onFocusIn = (event: FocusEvent) => {
      if (element.contains(event.target as Node)) {
        setFocusWithin(true);
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (!element.contains(event.relatedTarget as Node)) {
        setFocusWithin(false);
      }
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [ref]);

  return focusWithin;
};

export default FocusManagementProvider;
