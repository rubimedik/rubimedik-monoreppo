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
  loading?: boolean; // Alias for isLoading
  disabled?: boolean;
  style?: any; // Use any to allow style arrays
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode; // Alias for leftIcon
  variant?: 'primary' | 'outlined' | 'ghost' | 'error';
  size?: 'small' | 'medium' | 'large';
  textStyle?: TextStyle; // Alias for labelStyle
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  isLoading = false,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  textStyle,
  leftIcon,
  icon,
  variant = 'primary',
  size = 'medium',
}) => {
  const { theme } = useAppTheme();
  const actualIsLoading = isLoading || loading;
  const actualLeftIcon = leftIcon || icon;
  const actualLabelStyle = labelStyle || textStyle;

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 40, paddingHorizontal: 12 };
      case 'large':
        return { height: 60, paddingHorizontal: 24 };
      default:
        return { height: 52, paddingHorizontal: 16 };
    }
  };

  const getLabelColor = () => {
    if (variant === 'outlined') return theme.colors.primary;
    if (variant === 'ghost') return theme.colors.primary;
    return theme.colors.white;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderRadius: 12 },
        getVariantStyles(),
        getSizeStyles(),
        (disabled || actualIsLoading) && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || actualIsLoading}
      activeOpacity={0.8}
    >
      {actualIsLoading ? (
        <ActivityIndicator color={getLabelColor()} />
      ) : (
        <View style={styles.content}>
          {actualLeftIcon && <View style={styles.iconContainer}>{actualLeftIcon}</View>}
          <Text style={[
            styles.label, 
            { 
              color: getLabelColor(),
              fontFamily: theme.typography.fontFamilyMedium 
            },
            actualLabelStyle
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
