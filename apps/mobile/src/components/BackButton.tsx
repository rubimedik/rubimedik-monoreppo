import React from 'react';
import { Pressable as GHPressable } from 'react-native-gesture-handler';
import { CaretLeft } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
}

export const BackButton = ({ onPress, style, color, size = 24 }: BackButtonProps) => {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <GHPressable 
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.6 },
        style
      ]}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <CaretLeft 
        weight="bold" 
        color={color || theme.colors.textPrimary} 
        size={size} 
      />
    </GHPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});
