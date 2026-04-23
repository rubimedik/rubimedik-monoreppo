import React, { useRef, useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Platform 
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onComplete }) => {
  const { theme } = useAppTheme();
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < length - 1) {
      inputs.current[index + 1].focus();
    }

    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border },
            digit ? { 
              borderColor: theme.colors.primary, 
              backgroundColor: theme.colors.lightRedTint, 
              color: theme.colors.primary 
            } : undefined
          ]}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          ref={(ref) => {
            if (ref) inputs.current[index] = ref;
          }}
          value={digit}
          selectTextOnFocus={true}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 32, // theme.spacing.xl
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 24,
    fontFamily: 'Inter_700Bold', // theme.typography.fontFamilyBold
    textAlign: 'center',
  },
});
