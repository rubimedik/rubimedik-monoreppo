import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

interface CountdownTimerProps {
  targetDate: string | Date;
  style?: ViewStyle;
  textStyle?: TextStyle;
  prefix?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  style, 
  textStyle,
  prefix = 'Releases in: ' 
}) => {
  const { theme } = useAppTheme();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft('Processing...');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <View style={[styles.container, style]}>
      <Text style={[
        styles.text, 
        { color: theme.colors.warning, fontFamily: theme.typography.fontFamilyBold }, 
        textStyle
      ]}>
        {prefix}{timeLeft}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
  },
});
