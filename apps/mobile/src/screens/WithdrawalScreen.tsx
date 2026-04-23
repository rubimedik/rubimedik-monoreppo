import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BankSelect } from '../components/BankSelect';
import { BackButton } from '../components';
import { Bank as BankIcon, Info, CheckCircle } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

export const WithdrawalScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [note, setNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
      paddingBottom: 16,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    content: {
      padding: 24,
    },
    balanceCard: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      borderRadius: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    balanceLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
    },
    balanceValue: {
      color: theme.colors.white,
      fontSize: 28,
      fontFamily: theme.typography.fontFamilyBold,
      marginTop: 4,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary + '10',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    form: {
      gap: 12,
    },
    accountNameBox: {
      backgroundColor: theme.colors.success + '10',
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: -4,
      marginBottom: 8,
    },
    accountNameText: {
      color: theme.colors.success,
      fontSize: 13,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    withdrawButton: {
      marginTop: 12,
    },
    verifyingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        gap: 20,
    },
    verifyingText: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    verifyingSub: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    }
  }), [theme, isDarkMode]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    }
  });

  // Resolve account name when 10 digits reached
  useEffect(() => {
    const resolve = async () => {
      if (accountNumber.length === 10 && bankCode) {
        setIsResolving(true);
        try {
          const res = await api.get(`/payments/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`);
          setAccountName(res.data.account_name);
        } catch (error) {
          setAccountName('');
          console.error('Resolution error');
        } finally {
          setIsResolving(false);
        }
      } else {
        setAccountName('');
      }
    };
    resolve();
  }, [accountNumber, bankCode]);

  const pollStatus = async (reference: string) => {
    setIsVerifying(true);
    let attempts = 0;
    const maxAttempts = 5;

    const check = async () => {
        try {
            const res = await api.get(`/payments/verify/${reference}`);
            if (res.data.status === 'success' || res.data.status === 'failed' || attempts >= maxAttempts) {
                setIsVerifying(false);
                queryClient.resetQueries({ queryKey: ['wallet'] });
                queryClient.resetQueries({ queryKey: ['all-transactions'] });
                Alert.alert('Success', 'Withdrawal processed successfully.', [
                    { text: 'Done', onPress: () => navigation.popToTop() }
                ]);
            } else {
                attempts++;
                setTimeout(check, 2000);
            }
        } catch (e) {
            setIsVerifying(false);
            navigation.popToTop();
        }
    };
    check();
  };

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => api.post('/wallet/withdraw', data),
    onSuccess: (response) => {
      // Start polling for confirmation
      pollStatus(response.data.reference);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Withdrawal failed.';
      Alert.alert('Failed', Array.isArray(message) ? message.join('\n') : message);
    }
  });

  const handleWithdraw = () => {
    if (!amount || !accountNumber || !bankCode) {
      Alert.alert('Error', 'Please fill in all details.');
      return;
    }
    if (parseFloat(amount) > Number(wallet?.balance || 0)) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current balance.');
      return;
    }
    withdrawMutation.mutate({ 
      amount: parseFloat(amount),
      bankCode,
      accountNumber,
      accountName,
      note
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>₦{Number(wallet?.balance || 0).toLocaleString()}</Text>
          </Card>

          <View style={styles.infoCard}>
            <Info size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Withdrawals are processed to your bank account securely.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Amount (NGN)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              leftIcon={<Text style={{ fontSize: 18, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyBold }}>₦</Text>}
            />

            <BankSelect 
              label="Destination Bank"
              selectedBankCode={bankCode}
              onSelect={(bank) => {
                setBankCode(bank.code);
                setAccountName('');
              }}
            />
            
            <TextInput
              label="Account Number"
              placeholder="10-digit number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
              leftIcon={<BankIcon size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Reason / Note (Optional)"
              placeholder="What's this for?"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {isResolving && <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />}
            
            {accountName ? (
              <View style={styles.accountNameBox}>
                <CheckCircle size={16} color={theme.colors.success} weight="fill" />
                <Text style={styles.accountNameText}>{accountName}</Text>
              </View>
            ) : null}

            <PrimaryButton 
              label="Request Payout" 
              onPress={handleWithdraw} 
              isLoading={withdrawMutation.isPending}
              disabled={isResolving || (accountNumber.length === 10 && !accountName)}
              style={styles.withdrawButton}
            />
          </View>
        </ScrollView>

        {isVerifying && (
            <View style={styles.verifyingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <View>
                    <Text style={styles.verifyingText}>Verifying Payout...</Text>
                    <Text style={styles.verifyingSub}>Please wait while we confirm your withdrawal with the bank.</Text>
                </View>
            </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
