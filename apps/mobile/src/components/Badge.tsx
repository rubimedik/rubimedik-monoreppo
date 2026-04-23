import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'flat';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant | string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  labelStyle,
  icon,
}) => {
  const { theme, isDarkMode } = useAppTheme();

  const variantStyles = useMemo(() => {
    const stylesMap: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
      success: {
        container: { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#E8F5E9' },
        text: { color: theme.colors.success },
      },
      warning: {
        container: { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FFF8E1' },
        text: { color: theme.colors.warning },
      },
      error: {
        container: { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEE' },
        text: { color: theme.colors.error },
      },
      info: {
        container: { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#E3F2FD' },
        text: { color: isDarkMode ? '#60A5FA' : '#1976D2' },
      },
      primary: {
        container: { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : theme.colors.lightRedTint },
        text: { color: theme.colors.primary },
      },
      neutral: {
        container: { backgroundColor: theme.colors.surface },
        text: { color: theme.colors.textSecondary },
      },
      flat: {
        container: { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' },
        text: { color: theme.colors.textPrimary },
      }
    };
    return stylesMap[variant as BadgeVariant] || stylesMap.neutral;
  }, [variant, theme, isDarkMode]);

  return (
    <View style={[styles.badge, variantStyles?.container, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[
        styles.label, 
        { fontFamily: theme.typography.fontFamilyMedium },
        variantStyles?.text, 
        labelStyle
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  icon: {
    marginRight: 4,
  },
});
