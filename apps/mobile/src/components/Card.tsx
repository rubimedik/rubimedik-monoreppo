import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity 
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const { theme } = useAppTheme();

  const cardStyles = [
    styles.card,
    { backgroundColor: theme.colors.surface }, // Default but will be overridden by variants or theme
    variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      backgroundColor: theme.colors.surface,
    },
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    variant === 'flat' && {
      backgroundColor: theme.colors.surface,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16, // using static value here as spacing usually doesn't change with theme
  },
});
