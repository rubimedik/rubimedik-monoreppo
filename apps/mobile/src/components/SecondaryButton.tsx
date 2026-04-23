import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  isLoading,
  disabled,
  style,
  labelStyle,
  icon,
}) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing.md,
        },
        disabled ? styles.disabled : undefined,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[
            styles.label, 
            { 
              color: theme.colors.textPrimary,
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
    backgroundColor: 'transparent',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
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
