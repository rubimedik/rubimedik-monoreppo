import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { PrimaryButton, OTPInput, BackButton } from '../components';
import { ShieldCheck, Lock } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const PaymentOTPScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reference, amount } = route.params;
  const queryClient = useQueryClient();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
      gap: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    content: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
    },
    iconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 40,
      paddingHorizontal: 20,
    },
    otpSection: {
      width: '100%',
      marginBottom: 40,
    },
    footer: {
      width: '100%',
      gap: 16,
    }
  }), [theme, isDarkMode]);

  const handleSubmit = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your phone/email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/payments/submit-otp', {
        reference,
        otp,
      });

      const { status, display_text } = response.data;

      if (status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        Alert.alert('Success', 'Payment completed successfully!', [
            { text: 'OK', onPress: () => {
                const { redirectTo, returnParams } = route.params || {};
                if (redirectTo) {
                    navigation.navigate(redirectTo, returnParams);
                } else {
                    navigation.navigate('MainTabs');
                }
            }}
        ]);
      } else {
        Alert.alert('Payment Error', display_text || 'Unable to complete payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>OTP Verification</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconBg}>
            <Lock color={theme.colors.primary} size={40} weight="fill" />
          </View>

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            A verification code has been sent by your bank to authorize the payment of ₦{amount.toLocaleString()}.
          </Text>

          <View style={styles.otpSection}>
            <OTPInput 
              value={otp}
              onChange={setOtp}
              digits={6}
            />
          </View>

          <View style={styles.footer}>
            <PrimaryButton 
              label="Authorize Payment" 
              onPress={handleSubmit} 
              isLoading={isLoading}
            />
            
            <TouchableOpacity 
              style={{ padding: 16, alignItems: 'center' }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', gap: 8, paddingBottom: 24 }}>
            <ShieldCheck color={theme.colors.success} size={16} weight="fill" />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Secure Payment via Paystack</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
