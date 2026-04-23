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
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components';
import { Bank, Info } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const SpecialistAccountScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['specialist-profile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/specialists/user/${user?.id}`);
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
      color: theme.colors.text,
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
      color: theme.colors.text,
      lineHeight: 18,
    },
    form: {
      gap: 20,
    },
    saveButton: {
      marginTop: 12,
    }
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  useEffect(() => {
    if (profile) {
      setBankName(profile.bankName || '');
      setAccountNumber(profile.accountNumber || '');
      setAccountName(profile.accountName || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/specialists/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-profile'] });
      Alert.alert('Success', 'Account details updated successfully.');
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update account details.');
    }
  });

  const handleSave = () => {
    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Error', 'Please fill in all bank details.');
      return;
    }
    updateMutation.mutate({ bankName, accountNumber, accountName });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Account Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
            <Info size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Provide your bank details where you wish to receive payouts for your consultations.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Bank Name"
              placeholder="e.g. Access Bank"
              value={bankName}
              onChangeText={setBankName}
              leftIcon={<Bank size={20} color={theme.colors.textSecondary} />}
            />
            <TextInput
              label="Account Number"
              placeholder="10-digit number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
            <TextInput
              label="Account Name"
              placeholder="e.g. Dr. Sarah Johnson"
              value={accountName}
              onChangeText={setAccountName}
            />

            <PrimaryButton 
              label="Update Details" 
              onPress={handleSave} 
              isLoading={updateMutation.isPending}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
