import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { theme as baseTheme } from '../theme';

const lightColors = {
  ...baseTheme.colors,
  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#F9FAFB',
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textDisabled: '#D1D5DB',
  border: '#E5E7EB',
  primary: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

const darkColors = {
  ...baseTheme.colors,
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  text: '#E2E8F0',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  border: '#334155',
  primary: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  lightRedTint: '#2D1A1E',
};

export type ThemeContextType = {
  theme: Omit<typeof baseTheme, 'colors'> & { colors: typeof lightColors };
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    ...baseTheme,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
