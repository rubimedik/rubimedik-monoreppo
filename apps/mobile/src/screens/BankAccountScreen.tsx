import React, { useState, useEffect, useMemo } from 'react';
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
import { TextInput, PrimaryButton, BackButton, Select } from '../components';
import { CaretLeft, Bank as BankIcon, Info, ShieldCheck } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const BankAccountScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Fetch banks from Paystack
  const { data: banks, isLoading: isBanksLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const res = await api.get('/wallet/banks');
      return res.data;
    }
  });

  const bankOptions = useMemo(() => {
    if (!banks) return [];
    return banks.map((b: any) => ({ label: b.name, value: b.code }));
  }, [banks]);

  // Determine endpoint based on role
  const isSpecialist = user?.activeRole === 'SPECIALIST';
  const profileQueryKey = isSpecialist ? 'specialist-profile' : 'user-profile';
  const profileEndpoint = isSpecialist ? `/specialists/user/${user?.id}` : `/users/profile`;
  const updateEndpoint = isSpecialist ? '/specialists/profile' : '/users/profile';

  const { data: profile, isLoading } = useQuery({
    queryKey: [profileQueryKey, user?.id],
    queryFn: async () => {
      const res = await api.get(profileEndpoint);
      return res.data;
    }
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
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
      padding: theme.spacing.xl,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.lightRedTint,
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
      color: theme.colors.textPrimary,
      lineHeight: 18,
    },
    form: {
      gap: 20,
    },
    saveButton: {
      marginTop: 12,
    },
    securityFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 32,
      opacity: 0.6,
    },
    securityText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    }
  }), [theme]);

  useEffect(() => {
    if (profile) {
      setBankCode(profile.bankCode || '');
      setBankName(profile.bankName || '');
      setAccountNumber(profile.accountNumber || '');
      setAccountName(profile.accountName || '');
    }
  }, [profile]);

  // Auto-resolve account name when 10 digits are entered
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const resolveAccount = async () => {
        setIsResolving(true);
        try {
          const res = await api.get(`/wallet/banks/resolve?accountNumber=${accountNumber}&bankCode=${bankCode}`);
          if (res.data && res.data.account_name) {
              setAccountName(res.data.account_name);
          }
        } catch (error: any) {
          console.warn('Failed to resolve account:', error.message);
          setAccountName('');
        } finally {
          setIsResolving(false);
        }
      };
      resolveAccount();
    }
  }, [accountNumber, bankCode]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(updateEndpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [profileQueryKey] });
      Alert.alert('Success', 'Bank account updated successfully.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update bank details.');
    }
  });

  const handleSave = () => {
    if (!bankCode || !accountNumber || !accountName) {
      Alert.alert('Error', 'Please fill in all bank details and ensure account name is resolved.');
      return;
    }
    updateMutation.mutate({ bankName, bankCode, accountNumber, accountName });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Bank Account</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
            <Info size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              {isSpecialist 
                ? "Provide your bank details to receive payouts for your consultations." 
                : "Provide your bank details for referral earnings and refund payouts."}
            </Text>
          </View>

          <View style={styles.form}>
            <Select
              label="Select Bank"
              placeholder={isBanksLoading ? "Loading banks..." : "Choose your bank"}
              options={bankOptions}
              value={bankCode}
              onChange={(val) => {
                  setBankCode(val);
                  const bank = banks?.find((b: any) => b.code === val);
                  if (bank) setBankName(bank.name);
              }}
              leftIcon={<BankIcon size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Account Number"
              placeholder="10-digit number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
            />

            <View>
                <TextInput
                    label="Account Name"
                    placeholder={isResolving ? "Resolving..." : "Resolved name will appear here"}
                    value={accountName}
                    onChangeText={setAccountName}
                    editable={false}
                />
                {isResolving && (
                    <ActivityIndicator 
                        size="small" 
                        color={theme.colors.primary} 
                        style={{ position: 'absolute', right: 16, top: 40 }} 
                    />
                )}
            </View>

            <PrimaryButton 
              label="Save Bank Info" 
              onPress={handleSave} 
              isLoading={updateMutation.isPending}
              disabled={isResolving || !accountName}
              style={styles.saveButton}
            />
          </View>

          <View style={styles.securityFooter}>
            <ShieldCheck size={16} color={theme.colors.textSecondary} />
            <Text style={styles.securityText}>Your financial info is kept secure.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
