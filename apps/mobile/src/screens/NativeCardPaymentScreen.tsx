import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput, PrimaryButton, Card, BackButton } from '../components';
import { CaretLeft, CaretRight, CreditCard, Lock, ShieldCheck, Plus, CheckCircle } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const NativeCardPaymentScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { amount = 50, isAddCardOnly = false, paymentType = 'CONSULTATION_PAYMENT' } = route.params || {};
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [paymentMode, setPaymentMode] = useState<'SELECT' | 'NEW'>( 'SELECT' );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: savedCards, isLoading: loadingCards } = useQuery({
    queryKey: ['saved-cards'],
    queryFn: async () => {
      const res = await api.get('/payments/cards');
      return res.data;
    }
  });

  useEffect(() => {
    if (savedCards && savedCards.length === 0) {
      setPaymentMode('NEW');
    }
  }, [savedCards]);

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
      padding: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedCardItem: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05',
      borderWidth: 1.5,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: {
      flex: 1,
    },
    cardNumberText: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    cardMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    newCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
      marginTop: 8,
    },
    newCardText: {
      fontSize: 15,
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    form: {
      gap: 20,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    saveCardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    saveCardLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    secureInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      gap: 8,
      paddingBottom: 40,
    },
    secureText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
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

  const handleExpiryChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 2) {
      setExpiry(clean.slice(0, 2) + '/' + clean.slice(2, 4));
    } else {
      setExpiry(clean);
    }
  };

  const validateCard = () => {
    if (cardNumber.length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number');
      return false;
    }
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    if (sum % 10 !== 0) {
      Alert.alert('Invalid Card', 'This card number is not a valid credit card');
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      Alert.alert('Invalid Expiry', 'Format must be MM/YY');
      return false;
    }
    const [m, y] = expiry.split('/').map(n => parseInt(n));
    const now = new Date();
    const currentYear = parseInt(now.getFullYear().toString().slice(-2));
    const currentMonth = now.getMonth() + 1;
    if (m < 1 || m > 12) {
      Alert.alert('Invalid Date', 'Month must be between 01 and 12');
      return false;
    }
    if (y < currentYear || (y === currentYear && m < currentMonth)) {
      Alert.alert('Expired Card', 'This card has already expired');
      return false;
    }
    if (cvv.length < 3) {
      Alert.alert('Invalid CVV', 'CVV must be at least 3 digits');
      return false;
    }
    return true;
  };

  const handlePaymentResponse = async (data: any) => {
    const { status, reference, display_text } = data;

    if (status === 'send_otp') {
      navigation.navigate('PaymentOTP', { reference, amount });
    } else if (status === 'success' || data?.status === 'success') {
      setIsVerifying(true);
      let attempts = 0;
      const poll = async () => {
        try {
          const res = await api.get(`/payments/verify/${reference}`);
          if (res.data.status === 'success' || res.data.status === 'failed' || attempts > 5) {
            setIsVerifying(false);
            queryClient.resetQueries({ queryKey: ['wallet'] });
            queryClient.resetQueries({ queryKey: ['all-transactions'] });
            Alert.alert('Success', 'Transaction successful!', [
                { text: 'OK', onPress: () => {
                    const { redirectTo, returnParams } = route.params || {};
                    if (redirectTo) {
                        navigation.navigate(redirectTo, returnParams);
                    } else {
                        navigation.navigate('MainTabs', { screen: 'WalletTab' });
                    }
                }}
            ]);
          } else {
            attempts++;
            setTimeout(poll, 2000);
          }
        } catch (e) {
          setIsVerifying(false);
          navigation.popToTop();
        }
      };
      poll();
    } else {
      Alert.alert('Payment Error', display_text || 'Unable to process payment');
    }
  };

  const handleSavedCardCharge = async () => {
    const card = savedCards?.find((c: any) => c.id === selectedCardId);
    if (!card) return;
    setIsLoading(true);
    try {
      const response = await api.post('/payments/charge-card', {
        amount,
        authorization_code: card.authorizationCode,
        type: paymentType,
      });
      await handlePaymentResponse(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCardCharge = async () => {
    if (!validateCard()) return;
    setIsLoading(true);
    try {
      const [month, year] = expiry.split('/');
      const response = await api.post('/payments/charge-card', {
        amount,
        type: paymentType,
        card: {
          number: cardNumber,
          cvv: cvv,
          expiry_month: month,
          expiry_year: year,
        }
      });
      await handlePaymentResponse(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Card Payment</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {paymentMode === 'SELECT' ? (
            <>
              <Text style={styles.sectionTitle}>Select a saved card</Text>
              {loadingCards ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <View>
                  {savedCards?.map((card: any) => (
                    <TouchableOpacity 
                      key={card.id} 
                      onPress={() => setSelectedCardId(card.id)}
                      disabled={isLoading}
                    >
                      <Card 
                        style={[
                          styles.cardItem,
                          selectedCardId === card.id && styles.selectedCardItem
                        ]} 
                        variant="outlined"
                      >
                        <View style={styles.cardIcon}>
                          <CreditCard 
                            color={selectedCardId === card.id ? theme.colors.primary : theme.colors.textSecondary} 
                            size={24} 
                            weight={selectedCardId === card.id ? "fill" : "regular"} 
                          />
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={[
                            styles.cardNumberText,
                            selectedCardId === card.id && { color: theme.colors.primary }
                          ]}>**** **** **** {card.last4}</Text>
                          <Text style={styles.cardMeta}>{card.brand} • Expires {card.expMonth}/{card.expYear}</Text>
                        </View>
                        {selectedCardId === card.id ? (
                          <CheckCircle size={20} color={theme.colors.primary} weight="fill" />
                        ) : (
                          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border }} />
                        )}
                      </Card>
                    </TouchableOpacity>
                  ))}

                  {selectedCardId && (
                    <PrimaryButton 
                      label={isAddCardOnly ? 'Verify Selected Card' : `Pay ₦${amount.toLocaleString()} with Card`}
                      onPress={handleSavedCardCharge}
                      isLoading={isLoading}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.newCardBtn} onPress={() => setPaymentMode('NEW')}>
                <View style={[styles.cardIcon, { backgroundColor: theme.colors.surface }]}>
                  <Plus size={20} color={theme.colors.primary} weight="bold" />
                </View>
                <Text style={styles.newCardText}>Use a new card</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.form}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -4 }}>
                 <Text style={styles.sectionTitle}>Enter card details</Text>
                 {savedCards?.length > 0 && (
                   <TouchableOpacity onPress={() => setPaymentMode('SELECT')}>
                     <Text style={{ color: theme.colors.primary, fontSize: 13, fontFamily: theme.typography.fontFamilyBold }}>Use Saved Card</Text>
                   </TouchableOpacity>
                 )}
              </View>

              <TextInput
                label="Card Number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(t.replace(/[^0-9]/g, '').slice(0, 16))}
                keyboardType="numeric"
                leftIcon={<CreditCard color={theme.colors.textSecondary} size={20} />}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="CVV"
                    placeholder="123"
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/[^0-9]/g, '').slice(0, 3))}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
                  />
                </View>
              </View>

              <View style={styles.saveCardRow}>
                <Text style={styles.saveCardLabel}>Save card for future payments</Text>
                <Switch 
                  value={saveCard}
                  onValueChange={setSaveCard}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>

              <PrimaryButton 
                label={isAddCardOnly ? 'Save Card (₦50 Charge)' : `Pay ₦${amount.toLocaleString()}`} 
                onPress={handleNewCardCharge} 
                isLoading={isLoading}
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          <View style={styles.secureInfo}>
            <ShieldCheck color={theme.colors.success} size={16} weight="fill" />
            <Text style={styles.secureText}>Secured by Paystack</Text>
          </View>
        </ScrollView>

        {isVerifying && (
            <View style={styles.verifyingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <View>
                    <Text style={styles.verifyingText}>Verifying Payment...</Text>
                    <Text style={styles.verifyingSub}>Please wait while we confirm your transaction with the bank.</Text>
                </View>
            </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
