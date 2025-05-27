// src/context/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeContextType } from '@/lib/types';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS, COLORS } from '@/lib/constants';

// Create context with proper default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  actualTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

// Custom hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Provider component with enhanced functionality
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>('system');
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setActualTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // Update document classes and CSS variables when theme changes
  useEffect(() => {
    if (!isInitialized) return;

    updateDocumentTheme();
    persistTheme();
  }, [actualTheme, isInitialized]);

  // Initialize theme from storage or system preference
  const initializeTheme = useCallback(() => {
    try {
      // Get saved theme preference
      const savedTheme = storage.get<'dark' | 'light' | 'system'>(STORAGE_KEYS.THEME);
      
      // Get system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let selectedTheme: 'dark' | 'light' | 'system' = 'system';
      let resolvedTheme: 'dark' | 'light' = systemPrefersDark ? 'dark' : 'light';

      if (savedTheme) {
        selectedTheme = savedTheme;
        
        if (savedTheme === 'system') {
          resolvedTheme = systemPrefersDark ? 'dark' : 'light';
        } else {
          resolvedTheme = savedTheme;
        }
      }

      setThemeState(selectedTheme);
      setActualTheme(resolvedTheme);
      setIsInitialized(true);

    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to dark theme
      setThemeState('dark');
      setActualTheme('dark');
      setIsInitialized(true);
    }
  }, []);

  // Update document with theme classes and CSS variables
  const updateDocumentTheme = useCallback(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(actualTheme);
    
    // Update CSS custom properties
    if (actualTheme === 'dark') {
      root.style.setProperty('--bg-dark', COLORS.PRIMARY_DARK);
      root.style.setProperty('--card-bg', COLORS.CARD_BACKGROUND);
      root.style.setProperty('--border', COLORS.BORDER);
      root.style.setProperty('--text-primary', COLORS.TEXT_PRIMARY);
      root.style.setProperty('--text-secondary', COLORS.TEXT_SECONDARY);
      root.style.setProperty('--accent', COLORS.MARVEL_RED);
    } else {
      // Light theme colors (for future implementation)
      root.style.setProperty('--bg-dark', '#ffffff');
      root.style.setProperty('--card-bg', '#f8fafc');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--text-primary', '#1a202c');
      root.style.setProperty('--text-secondary', '#4a5568');
      root.style.setProperty('--accent', COLORS.MARVEL_RED);
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        actualTheme === 'dark' ? COLORS.PRIMARY_DARK : '#ffffff'
      );
    }

    // Apply theme to body for immediate visual feedback
    document.body.style.backgroundColor = actualTheme === 'dark' ? COLORS.PRIMARY_DARK : '#ffffff';
    document.body.style.color = actualTheme === 'dark' ? COLORS.TEXT_PRIMARY : '#1a202c';

  }, [actualTheme]);

  // Persist theme preference
  const persistTheme = useCallback(() => {
    storage.set(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Set theme with proper resolution
  const setTheme = useCallback((newTheme: 'dark' | 'light' | 'system') => {
    setThemeState(newTheme);

    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setActualTheme(systemPrefersDark ? 'dark' : 'light');
    } else {
      setActualTheme(newTheme);
    }

    // Track theme change event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'theme_change', {
        theme: newTheme,
      });
    }
  }, []);

  // Toggle between light and dark (skip system)
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If currently system, toggle to opposite of current actual theme
      setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If currently light or dark, toggle to opposite
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, actualTheme, setTheme]);

  // Check if system supports dark mode
  const systemSupportsDarkMode = useCallback((): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Check if system supports high contrast
  const systemSupportsHighContrast = useCallback((): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }, []);

  // Check if system prefers reduced motion
  const systemPrefersReducedMotion = useCallback((): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Apply high contrast mode if needed
  const applyHighContrastMode = useCallback(() => {
    const root = document.documentElement;
    
    if (systemSupportsHighContrast()) {
      root.classList.add('high-contrast');
      
      // Update colors for better contrast
      root.style.setProperty('--border', '#ffffff');
      root.style.setProperty('--text-secondary', '#ffffff');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [systemSupportsHighContrast]);

  // Apply reduced motion preferences
  const applyReducedMotionPreferences = useCallback(() => {
    const root = document.documentElement;
    
    if (systemPrefersReducedMotion()) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [systemPrefersReducedMotion]);

  // Handle accessibility preferences
  useEffect(() => {
    if (!isInitialized) return;

    applyHighContrastMode();
    applyReducedMotionPreferences();

    // Listen for changes in accessibility preferences
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = () => applyHighContrastMode();
    const handleMotionChange = () => applyReducedMotionPreferences();

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [isInitialized, applyHighContrastMode, applyReducedMotionPreferences]);

  // Get theme icon for UI
  const getThemeIcon = useCallback((): string => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '🌙';
    }
  }, [theme]);

  // Get theme label for UI
  const getThemeLabel = useCallback((): string => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Dark';
    }
  }, [theme]);

  // Mobile-specific theme optimizations
  const optimizeForMobile = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Optimize battery usage on mobile
      const root = document.documentElement;
      root.classList.add('mobile-optimized');

      // Use more efficient animations on mobile
      root.style.setProperty('--animation-duration', '0.2s');
      
      // Reduce shadow complexity on mobile
      root.style.setProperty('--shadow-complexity', 'simple');
    }
  }, []);

  // Apply mobile optimizations
  useEffect(() => {
    if (isInitialized) {
      optimizeForMobile();
    }
  }, [isInitialized, optimizeForMobile]);

  // Prevent flash of wrong theme
  useEffect(() => {
    if (isInitialized) {
      document.body.style.visibility = 'visible';
    }
  }, [isInitialized]);

  // Context value with all functionality
  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
    getThemeIcon,
    getThemeLabel,
    systemSupportsDarkMode,
    systemSupportsHighContrast,
    systemPrefersReducedMotion,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Higher-order component for theme-aware components
export function withTheme<P extends object>(Component: React.ComponentType<P>) {
  return function ThemedComponent(props: P) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}

export default ThemeContext;
