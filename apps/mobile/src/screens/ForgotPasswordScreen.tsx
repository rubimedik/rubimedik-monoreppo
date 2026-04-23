import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useMemo } from 'react';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components';
import { api } from '../services/api';
import { CaretLeft, Envelope } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ForgotPasswordRouteProp>();
  
  const [email, setEmail] = useState(route.params?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert(
        'Email Sent', 
        'If an account exists with this email, you will receive a reset code.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login', {}) }]
      );
    } catch (error: any) {
      Alert.alert('Process Initiated', 'Check your email for further instructions.');
      navigation.navigate('Login', {});
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.xl,
      flexGrow: 1,
    },
    backButton: {
      marginBottom: theme.spacing.xl,
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    header: {
      marginBottom: theme.spacing['2xl'],
    },
    title: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    form: {
      width: '100%',
    },
    resetButton: {
      marginTop: theme.spacing.lg,
    },
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        enabled={true}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <BackButton style={styles.backButton} />

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Envelope color={theme.colors.textSecondary} size={20} />}
            />

            <PrimaryButton 
              label="Send Instructions" 
              onPress={handleReset} 
              isLoading={isLoading}
              style={styles.resetButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
