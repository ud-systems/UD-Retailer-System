import { useState, useEffect } from 'react';
import ThemeService from '@/services/themeService';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Initialize theme from service
    const currentTheme = ThemeService.getTheme();
    setThemeState(currentTheme);
  }, []);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    ThemeService.setTheme(newTheme);
  };

  return {
    theme,
    setTheme,
  };
} 