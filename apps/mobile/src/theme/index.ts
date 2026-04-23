export const theme = {
  colors: {
    primary: '#EF4444',
    primaryLight: '#F87171',
    primaryDark: '#B91C1C',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textDisabled: '#D1D5DB',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    white: '#FFFFFF',
    black: '#000000',
    lightRedTint: '#FEF2F2',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 24,
  },
  typography: {
    fontFamily: 'Inter_400Regular',
    fontFamilyBold: 'Inter_700Bold',
    fontFamilySemiBold: 'Inter_600SemiBold',
    fontFamilyMedium: 'Inter_500Medium',
  }
};

export type Theme = typeof theme;
