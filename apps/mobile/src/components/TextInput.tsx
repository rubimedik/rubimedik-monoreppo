import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput as RNTextInput, 
  StyleSheet, 
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  secureTextEntry,
  multiline,
  ...props
}) => {
  const { theme } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.md }, containerStyle]}>
      <Text style={[
        styles.label, 
        { 
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.xs,
          fontFamily: theme.typography.fontFamilyMedium
        }
      ]}>
        {label}
      </Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
        },
        isFocused ? { borderColor: theme.colors.primary, borderWidth: 1.5 } : undefined,
        error ? { borderColor: theme.colors.error } : undefined,
        multiline ? styles.multilineContainer : undefined
      ]}>
        {leftIcon ? (
          <View style={[styles.leftIcon, multiline ? { marginTop: Platform.OS === 'ios' ? 2 : 4 } : undefined]}>
            {leftIcon}
          </View>
        ) : null}
        <RNTextInput
          style={[
            styles.input, 
            { 
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily,
              paddingTop: multiline ? 0 : undefined, // Reduce extra padding in multiline
            },
            multiline ? styles.multilineInput : undefined, 
            inputStyle
          ]}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          secureTextEntry={!!secureTextEntry}
          multiline={!!multiline}
          {...props}
        />
        {rightIcon ? (
          <View style={[styles.rightIcon, multiline ? { marginTop: Platform.OS === 'ios' ? 2 : 4 } : undefined]}>
            {rightIcon}
          </View>
        ) : null}
      </View>
      {error ? (
        <Text style={[
          styles.errorText, 
          { 
            color: theme.colors.error,
            marginTop: theme.spacing.xs,
            fontFamily: theme.typography.fontFamily,
          }
        ]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  label: {
    fontSize: 12,
  },
  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineContainer: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 12, 
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },
  multilineInput: {
    height: 'auto',
    textAlignVertical: 'top',
    paddingTop: 0, 
  },
  errorText: {
    fontSize: 12,
  },
  leftIcon: {
    marginRight: 8, 
  },
  rightIcon: {
    marginLeft: 8, 
  },
});
