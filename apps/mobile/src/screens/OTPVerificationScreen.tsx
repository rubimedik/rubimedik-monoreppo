import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useMemo } from 'react';
import { OTPInput } from '../components/OTPInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { api } from '../services/api';
import { CaretLeft } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { notificationService } from '../services/notificationService';
import { Pressable as GHPressable } from 'react-native-gesture-handler';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OTPRouteProp>();
  const { email } = route.params;
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { user, access_token, refresh_token } = response.data;
      
      Alert.alert(
        'Verified!', 
        'Your email has been successfully verified.',
        [{ 
          text: 'Continue', 
          onPress: () => {
            // This will trigger RootNavigator to switch to authenticated routes
            setAuth(user, access_token, refresh_token);
            notificationService.registerForPushNotificationsAsync();
          } 
        }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message;
      const errorMessage = Array.isArray(message) ? message.join('\n') : message || 'Invalid code';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      Alert.alert('Sent!', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.xl,
      flex: 1,
    },
    backButton: {
      marginBottom: theme.spacing.lg,
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    emailText: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    verifyButton: {
      marginTop: theme.spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
    },
    footerLink: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <GHPressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CaretLeft weight="bold" color={theme.colors.textPrimary} size={24} />
        </GHPressable>

        <View style={styles.header}>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <OTPInput onComplete={setOtp} />

        <PrimaryButton 
          label="Verify Code" 
          onPress={handleVerify} 
          isLoading={isLoading}
          style={styles.verifyButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive code? </Text>
          {isResending ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.footerLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
