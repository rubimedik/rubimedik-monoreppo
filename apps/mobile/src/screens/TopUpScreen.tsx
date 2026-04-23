import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { CreditCard, Bank, CaretRight as CaretRightIcon, Info, CheckCircle } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../store/useAuthStore';

export const TopUpScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [amount, setAmount] = useState(route.params?.amount?.toString() || '1000');
  
  const { user } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'transfer' | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    scrollContent: {
      padding: theme.spacing.xl,
    },
    inputSection: {
      marginBottom: 32,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 12,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      paddingBottom: 8,
      marginBottom: 20,
    },
    currencySymbol: {
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      padding: 0,
    },
    quickAmountsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quickAmountBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    quickAmountBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    quickAmountText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    quickAmountTextActive: {
      color: 'white',
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      gap: 12,
      backgroundColor: theme.colors.surface,
    },
    selectedMethodCard: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05',
      borderWidth: 1.5,
    },
    methodIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '15',
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
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
      gap: 12,
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      padding: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    }
  }), [theme]);

  const handleMethodSelect = (method: 'card' | 'transfer') => {
    const numAmount = parseInt(amount);
    if (!amount || isNaN(numAmount) || numAmount < 100) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is NGN 100');
      return;
    }

    const { redirectTo, returnParams } = route.params || {};

    if (method === 'card') {
      navigation.navigate('NativeCardPayment', { 
          amount: numAmount, 
          paymentType: 'WALLET_FUNDING',
          redirectTo,
          returnParams
      });
    } else {
      navigation.navigate('NativeBankTransfer', { 
          amount: numAmount,
          redirectTo,
          returnParams
      });
    }
  };

  const quickAmounts = ['500', '1000', '2000', '5000'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter Amount (NGN)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity 
                key={amt} 
                style={[
                  styles.quickAmountBtn,
                  amount === amt && styles.quickAmountBtnActive
                ]}
                onPress={() => setAmount(amt)}
              >
                <Text style={[
                  styles.quickAmountText,
                  amount === amt && styles.quickAmountTextActive
                ]}>₦{Number(amt).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity onPress={() => setSelectedMethod('card')}>
          <Card 
            style={[
              styles.methodCard,
              selectedMethod === 'card' && styles.selectedMethodCard
            ]} 
            variant="outlined"
          >
            <View style={styles.methodIcon}>
              <CreditCard 
                color={selectedMethod === 'card' ? theme.colors.primary : theme.colors.textSecondary} 
                size={24} 
                weight={selectedMethod === 'card' ? "fill" : "regular"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.methodTitle,
                selectedMethod === 'card' && { color: theme.colors.primary }
              ]}>Debit/Credit Card</Text>
              <Text style={styles.methodDesc}>Pay via Secure Native SDK</Text>
            </View>
            {selectedMethod === 'card' ? (
              <CheckCircle size={20} color={theme.colors.primary} weight="fill" />
            ) : (
              <CaretRightIcon color={theme.colors.textSecondary} size={18} />
            )}
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedMethod('transfer')}>
          <Card 
            style={[
              styles.methodCard,
              selectedMethod === 'transfer' && styles.selectedMethodCard
            ]} 
            variant="outlined"
          >
            <View style={styles.methodIcon}>
              <Bank 
                color={selectedMethod === 'transfer' ? theme.colors.primary : theme.colors.textSecondary} 
                size={24} 
                weight={selectedMethod === 'transfer' ? "fill" : "regular"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.methodTitle,
                selectedMethod === 'transfer' && { color: theme.colors.primary }
              ]}>Bank Transfer</Text>
              <Text style={styles.methodDesc}>Virtual Account Transfer</Text>
            </View>
            {selectedMethod === 'transfer' ? (
              <CheckCircle size={20} color={theme.colors.primary} weight="fill" />
            ) : (
              <CaretRightIcon color={theme.colors.textSecondary} size={18} />
            )}
          </Card>
        </TouchableOpacity>

        {selectedMethod && (
          <PrimaryButton 
            label="Continue to Payment"
            onPress={() => handleMethodSelect(selectedMethod)}
            style={{ marginTop: 8 }}
          />
        )}

        <View style={styles.infoBox}>
          <Info color={theme.colors.textSecondary} size={20} />
          <Text style={styles.infoText}>
            Your wallet balance can be used to pay for consultations and other services on Rubimedik.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
