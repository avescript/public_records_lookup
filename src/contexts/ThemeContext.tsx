'use client';

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { createAppTheme, darkTheme, lightTheme } from '../theme/enhanced-theme';

// Theme mode type
export type ThemeMode = PaletteMode | 'system';

// Theme context type
interface ThemeContextType {
  mode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for theme preference
const THEME_STORAGE_KEY = 'public-records-app-theme-mode';

// Get system preference
const getSystemPreference = (): PaletteMode => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
};

// Get stored theme preference
const getStoredTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }
  }
  return 'system';
};

// Store theme preference
const storeTheme = (mode: ThemeMode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
};

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
}) => {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [systemPreference, setSystemPreference] =
    useState<PaletteMode>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setSystemPreference(getSystemPreference());
    setMode(getStoredTheme());
    setMounted(true);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate effective theme mode
  const effectiveMode: PaletteMode =
    mode === 'system' ? systemPreference : (mode as PaletteMode);
  const isDarkMode = effectiveMode === 'dark';

  // Toggle between light and dark (skips system preference)
  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setMode(newMode);
    storeTheme(newMode);
  };

  // Set specific theme mode
  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    storeTheme(newMode);
  };

  // Create the appropriate theme
  const theme = createAppTheme(effectiveMode);

  // Context value
  const contextValue: ThemeContextType = {
    mode,
    isDarkMode,
    toggleTheme,
    setThemeMode,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={contextValue}>
        <MuiThemeProvider theme={lightTheme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for theme mode utilities
export const useThemeMode = () => {
  const { mode, isDarkMode, toggleTheme, setThemeMode } = useTheme();

  return {
    mode,
    isDarkMode,
    isLightMode: !isDarkMode,
    isSystemMode: mode === 'system',
    toggleTheme,
    setThemeMode,
    setLightMode: () => setThemeMode('light'),
    setDarkMode: () => setThemeMode('dark'),
    setSystemMode: () => setThemeMode('system'),
  };
};

// Export theme context for advanced usage
export { ThemeContext };

// Default export
export default ThemeProvider;
