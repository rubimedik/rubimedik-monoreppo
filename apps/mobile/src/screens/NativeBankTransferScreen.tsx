import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as RN from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { CaretLeft, Copy, CheckCircle, Info, X } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { api } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';

export const NativeBankTransferScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { amount } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  // Fetch user's persistent virtual account from wallet
  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    }
  });

  // Initialize the specific bank transfer session
  const { data: transferDetails, isLoading: isTransferLoading } = useQuery({
    queryKey: ['initialize-transfer', amount],
    queryFn: async () => {
      const res = await api.post('/payments/initialize-transfer', { amount });
      return res.data;
    }
  });

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanup = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleVerify = async () => {
    const currentBalance = wallet?.balance || 0;
    setIsVerifying(true);
    setCountdown(60); // Revert to 60 second countdown

    const poll = async () => {
      try {
        const res = await api.get('/wallet/balance');
        const newBalance = res.data.balance;
        
        if (newBalance > currentBalance) {
          // Success!
          cleanup();
          setIsVerifying(false);
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
          RN.Alert.alert(
            'Payment Confirmed',
            `Successfully credited ₦${(newBalance - currentBalance).toLocaleString()} to your wallet.`,
            [{ text: 'OK', onPress: () => {
                const { redirectTo, returnParams } = route.params || {};
                if (redirectTo) {
                    navigation.navigate(redirectTo, returnParams);
                } else {
                    navigation.navigate('MainTabs', { screen: 'WalletTab' });
                }
            }}]
          );
          return;
        }
        
        // Also invalidate just in case UI needs update elsewhere
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    pollRef.current = setInterval(poll, 5000);
    
    // Countdown timer
    timerRef.current = setInterval(() => {
        setCountdown(prev => {
            if (prev <= 1) {
                cleanup();
                setIsVerifying(false);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const handleSimulate = async () => {
    const accountToSimulate = transferDetails?.account_number || wallet?.accountNumber;
    if (!accountToSimulate) return;
    try {
        await api.post('/payments/simulate-deposit', {
            accountNumber: accountToSimulate,
            amount
        });
        RN.Alert.alert(
            'Simulation Successful', 
            'A deposit has been simulated for your account. Would you like to check for it now?',
            [
                { text: 'Later', style: 'cancel' },
                { text: 'Check Now', onPress: handleVerify }
            ]
        );
    } catch (error) {
        RN.Alert.alert('Error', 'Failed to simulate deposit.');
    }
  };

  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const styles = useMemo(() => RN.StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    content: {
      padding: 24,
      flexGrow: 1,
    },
    instructionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 32,
      lineHeight: 20,
    },
    detailCard: {
      backgroundColor: isDarkMode ? '#1A1A1A' : theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 40,
    },
    detailItem: {
      marginBottom: 20,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamilyMedium,
      marginBottom: 8,
    },
    detailValue: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginTop: 20,
      opacity: 0.5,
    },
    footerInfo: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 8,
    },
    confirmText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    timerText: {
      color: theme.colors.success,
      fontFamily: theme.typography.fontFamilyBold,
    },
    subInfoText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 'auto',
        gap: 16,
    },
    simulateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        marginTop: 8,
    },
    simulateText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    }
  }), [theme, isDarkMode]);

  if (isWalletLoading || isTransferLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <RN.ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const displayBank = transferDetails?.bank?.name || wallet?.bankName || 'Wema Bank';
  const displayAccount = transferDetails?.account_number || wallet?.accountNumber || 'Generating...';
  const displayAccountName = transferDetails?.account_name || wallet?.accountName || 'Rubimedik / ' + (user?.email?.split('@')[0] || 'User');

  const formattedTimer = () => {
      const mins = Math.floor(countdown / 60);
      const secs = countdown % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <RN.View style={styles.header}>
        <RN.Text style={styles.headerTitle}>Bank Transfer</RN.Text>
        <RN.TouchableOpacity onPress={() => navigation.goBack()}>
          <X weight="bold" color={theme.colors.textPrimary} size={24} />
        </RN.TouchableOpacity>
      </RN.View>

      <RN.ScrollView contentContainerStyle={styles.content}>
        <RN.Text style={styles.instructionText}>
          Transfer from your local bank to the account details below
        </RN.Text>

        <RN.View style={styles.detailCard}>
          <RN.View style={styles.detailItem}>
            <RN.Text style={styles.detailLabel}>Bank</RN.Text>
            <RN.Text style={styles.detailValue}>{displayBank}</RN.Text>
            <RN.View style={styles.divider} />
          </RN.View>

          <RN.View style={styles.detailItem}>
            <RN.Text style={styles.detailLabel}>Account Number</RN.Text>
            <RN.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <RN.Text style={[styles.detailValue, { fontSize: 20 }]}>{displayAccount}</RN.Text>
              <RN.TouchableOpacity onPress={() => copyToClipboard(displayAccount)}>
                {copied ? (
                  <CheckCircle size={22} color={theme.colors.success} weight="fill" />
                ) : (
                  <Copy size={22} color="#F59E0B" weight="fill" />
                )}
              </RN.TouchableOpacity>
            </RN.View>
            <RN.View style={styles.divider} />
          </RN.View>

          <RN.View style={styles.detailItem}>
            <RN.Text style={styles.detailLabel}>Account Name</RN.Text>
            <RN.Text style={styles.detailValue}>{displayAccountName}</RN.Text>
          </RN.View>
        </RN.View>

        <RN.View style={styles.footerInfo}>
          {isVerifying ? (
            <RN.Text style={styles.confirmText}>
              Please wait while we confirm <RN.Text style={styles.timerText}>{formattedTimer()}</RN.Text>
            </RN.Text>
          ) : null}
          <RN.Text style={styles.subInfoText}>
            Your wallet will be credited once we receive your payment.
          </RN.Text>
        </RN.View>

        <RN.View style={styles.buttonContainer}>
          <PrimaryButton 
            label="I have made the transfer" 
            onPress={handleVerify} 
            isLoading={isVerifying}
          />

          {__DEV__ && (
              <RN.TouchableOpacity 
                style={styles.simulateBtn}
                onPress={handleSimulate}
              >
                  <Info size={16} color={theme.colors.textMuted} />
                  <RN.Text style={styles.simulateText}>Simulate Inbound Transfer (Dev Only)</RN.Text>
              </RN.TouchableOpacity>
          )}
        </RN.View>
      </RN.ScrollView>
    </SafeAreaView>
  );
};
