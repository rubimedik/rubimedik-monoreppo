import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BankSelect } from '../components/BankSelect';
import { BackButton } from '../components/BackButton';
import { CaretLeft, CaretRight, User as UserIcon, PaperPlaneTilt, Bank as BankIcon, CheckCircle } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const TransferScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  
  // Internal State
  const [email, setEmail] = useState('');
  
  // External State
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    content: {
      padding: 24,
    },
    form: {
      gap: 16,
    },
    accountNameBox: {
      backgroundColor: theme.colors.success + '10',
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: -4,
    },
    accountNameText: {
      color: theme.colors.success,
      fontSize: 13,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    sendButton: {
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
        textAlign: 'center',
    },
    verifyingSub: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    }
  }), [theme, isDarkMode]);

  // Resolve account name when 10 digits reached
  useEffect(() => {
    const resolve = async () => {
      if (activeTab === 'external' && accountNumber.length === 10 && bankCode) {
        setIsResolving(true);
        try {
          const res = await api.get(`/payments/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`);
          setAccountName(res.data.account_name);
        } catch (error) {
          setAccountName('');
        } finally {
          setIsResolving(false);
        }
      } else {
        setAccountName('');
      }
    };
    resolve();
  }, [accountNumber, bankCode, activeTab]);

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
                Alert.alert('Success', 'Transaction processed successfully.', [
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

  const transferMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = activeTab === 'internal' ? '/wallet/transfer' : '/wallet/withdraw';
      return api.post(endpoint, data);
    },
    onSuccess: (response) => {
      if (activeTab === 'internal') {
        queryClient.resetQueries({ queryKey: ['wallet'] });
        queryClient.resetQueries({ queryKey: ['all-transactions'] });
        Alert.alert('Success', 'Transfer successful.', [
            { text: 'Done', onPress: () => navigation.goBack() }
        ]);
      } else {
        // For external/bank transfers, poll for confirmation
        pollStatus(response.data.reference);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Transaction failed.';
      Alert.alert('Failed', Array.isArray(message) ? message.join('\n') : message);
    }
  });

  const handleProcess = () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter amount.');
      return;
    }

    if (activeTab === 'internal') {
      if (!email) {
        Alert.alert('Error', 'Please enter recipient email.');
        return;
      }
      transferMutation.mutate({ email, amount: parseFloat(amount), note });
    } else {
      if (!bankCode || !accountNumber) {
        Alert.alert('Error', 'Please select bank and enter account number.');
        return;
      }
      transferMutation.mutate({ 
        bankCode, 
        accountNumber, 
        amount: parseFloat(amount),
        accountName,
        note
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Send Money</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'internal' && styles.activeTab]}
            onPress={() => setActiveTab('internal')}
          >
            <Text style={[styles.tabText, activeTab === 'internal' && styles.activeTabText]}>To Rubimedik User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'external' && styles.activeTab]}
            onPress={() => setActiveTab('external')}
          >
            <Text style={[styles.tabText, activeTab === 'external' && styles.activeTabText]}>To Bank Account</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.form}>
            {activeTab === 'internal' ? (
              <TextInput
                label="Recipient Email"
                placeholder="user@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<UserIcon size={20} color={theme.colors.textSecondary} />}
              />
            ) : (
              <>
                <BankSelect 
                  label="Select Destination Bank"
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

                {isResolving && <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />}
                
                {accountName ? (
                  <View style={styles.accountNameBox}>
                    <CheckCircle size={16} color={theme.colors.success} weight="fill" />
                    <Text style={styles.accountNameText}>{accountName}</Text>
                  </View>
                ) : null}
              </>
            )}

            <TextInput
              label="Amount (NGN)"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              leftIcon={<Text style={{ fontSize: 18, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyBold }}>₦</Text>}
            />

            <TextInput
              label="Reason / Note (Optional)"
              placeholder="What's this for?"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <PrimaryButton 
              label={activeTab === 'internal' ? 'Send Instantly' : 'Request Bank Transfer'} 
              onPress={handleProcess} 
              isLoading={transferMutation.isPending}
              disabled={activeTab === 'external' && (isResolving || (accountNumber.length === 10 && !accountName))}
              style={styles.sendButton}
              leftIcon={<PaperPlaneTilt color={theme.colors.white} size={20} weight="fill" />}
            />
          </View>
        </ScrollView>

        {isVerifying && (
            <View style={styles.verifyingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <View>
                    <Text style={styles.verifyingText}>Confirming Transfer...</Text>
                    <Text style={styles.verifyingSub}>Please wait while we confirm the transaction with the banking network.</Text>
                </View>
            </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
