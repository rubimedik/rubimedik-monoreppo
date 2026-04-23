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
import { TextInput, PrimaryButton, BackButton } from '../components';
import { CaretLeft, Bank as BankIcon, Info, ShieldCheck } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const BankAccountScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

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
      setBankName(profile.bankName || '');
      setAccountNumber(profile.accountNumber || '');
      setAccountName(profile.accountName || '');
    }
  }, [profile]);

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
    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Error', 'Please fill in all bank details.');
      return;
    }
    updateMutation.mutate({ bankName, accountNumber, accountName });
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
            <TextInput
              label="Bank Name"
              placeholder="e.g. GTBank"
              value={bankName}
              onChangeText={setBankName}
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
            <TextInput
              label="Account Name"
              placeholder="e.g. John Doe"
              value={accountName}
              onChangeText={setAccountName}
            />

            <PrimaryButton 
              label="Save Bank Info" 
              onPress={handleSave} 
              isLoading={updateMutation.isPending}
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
