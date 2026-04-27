import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ChatTeardropText } from 'phosphor-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../store/useAuthStore';

export const FloatingSupport = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();
  const { theme } = useAppTheme();

  if (!isAuthenticated) return null;

  return (
    <Animated.View 
      entering={FadeIn.delay(1000)}
      style={styles.floatingContainer}
    >
      <TouchableOpacity 
        style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SupportTickets')}
      >
        <ChatTeardropText color="white" size={24} weight="fill" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 9999,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
});
