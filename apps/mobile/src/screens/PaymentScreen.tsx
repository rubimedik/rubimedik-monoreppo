import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { CreditCard, Bank as BankIcon, CaretRight as CaretRightIcon, ShieldCheck, Wallet, CheckCircle  } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const PaymentScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { amount, consultationId } = route.params || { amount: 5000 };
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNativePayment = (method: 'card' | 'transfer') => {
    if (method === 'card') {
      navigation.navigate('NativeCardPayment', { amount, consultationId });
    } else {
      navigation.navigate('NativeBankTransfer', { amount, consultationId });
    }
  };

  const handleWalletPayment = async () => {
    Alert.alert(
      'Wallet Payment',
      `NGN ${Number(amount).toLocaleString()} will be deducted from your wallet. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Note: This endpoint would need to be implemented on the backend
              // to support direct wallet deductions for consultations.
              const response = await api.post('/wallet/pay-consultation', { amount, consultationId });
              if (response.data?.status === 'success') {
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                queryClient.invalidateQueries({ queryKey: ['wallet'] });
                setIsSuccess(true);
              }
            } catch (error: any) {
              Alert.alert('Payment Failed', error.response?.data?.message || 'Insufficient wallet balance.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 16,
    },
    scrollContent: {
      padding: theme.spacing.xl,
    },
    amountCard: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: 32,
      backgroundColor: theme.colors.surface,
    },
    amountLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 8,
    },
    amountValue: {
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: 12,
      gap: 12,
      backgroundColor: theme.colors.card,
    },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.colors.lightRedTint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    methodTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    methodDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      gap: 8,
    },
    securityText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    successContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    successTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginTop: 24,
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
      lineHeight: 24,
    }
  }), [theme]);

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle color={theme.colors.success} size={100} weight="fill" />
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            Your payment of NGN {Number(amount).toLocaleString()} has been confirmed. Your consultation is now active.
          </Text>
          <PrimaryButton 
            label="Go to Appointments" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Appointments' })} 
            style={{ width: '100%', marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.amountCard} variant="flat">
          <Text style={styles.amountLabel}>Payable Amount</Text>
          <Text style={styles.amountValue}>₦{Number(amount).toLocaleString()}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <Card style={styles.methodCard} variant="outlined" onPress={() => handleNativePayment('card')}>
          <View style={styles.methodIcon}>
            <CreditCard color={theme.colors.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Pay with Card</Text>
            <Text style={styles.methodDesc}>Secure native card payment</Text>
          </View>
          <CaretRightIcon color={theme.colors.textSecondary} size={18} />
        </Card>

        <Card style={styles.methodCard} variant="outlined" onPress={() => handleNativePayment('transfer')}>
          <View style={styles.methodIcon}>
            <BankIcon color={theme.colors.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Bank Transfer</Text>
            <Text style={styles.methodDesc}>Pay via Virtual Bank Account</Text>
          </View>
          <CaretRightIcon color={theme.colors.textSecondary} size={18} />
        </Card>

        <Card style={styles.methodCard} variant="outlined" onPress={handleWalletPayment}>
          <View style={styles.methodIcon}>
            <Wallet color={theme.colors.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Rubimedik Wallet</Text>
            <Text style={styles.methodDesc}>Pay using your wallet balance</Text>
          </View>
          <CaretRightIcon color={theme.colors.textSecondary} size={18} />
        </Card>

        {isProcessing && (
           <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        )}

        <View style={styles.securityNote}>
          <ShieldCheck color={theme.colors.success} size={20} />
          <Text style={styles.securityText}>Secure 256-bit SSL Encrypted Payment</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
