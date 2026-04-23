import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  labelStyle,
  leftIcon,
}) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { 
          backgroundColor: theme.colors.primary,
          borderRadius: 12, // theme.borderRadius.md
        },
        (disabled || isLoading) && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text style={[
            styles.label, 
            { 
              color: theme.colors.white,
              fontFamily: theme.typography.fontFamilyMedium 
            },
            labelStyle
          ]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.25,
  },
});
