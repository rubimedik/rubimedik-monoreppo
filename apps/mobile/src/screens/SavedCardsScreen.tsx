import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components';
import { CreditCard, Trash, Plus, ShieldCheck, Bank as BankIcon } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const SavedCardsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: cards, isLoading, refetch } = useQuery({
    queryKey: ['saved-cards'],
    queryFn: async () => {
      const res = await api.get('/payments/cards');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (cardId: string) => api.delete(`/payments/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cards'] });
      Alert.alert('Deleted', 'Card removed from your account.');
    }
  });

  const handleDelete = (cardId: string) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(cardId) }
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
    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      gap: 12,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: {
      flex: 1,
    },
    cardNumber: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    cardDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
      gap: 16,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footer: {
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Saved Cards</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <ShieldCheck size={20} color={theme.colors.success} weight="fill" />
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Your card details are tokenized and securely stored by Paystack.</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : cards?.length > 0 ? (
          cards.map((card: any) => (
            <Card key={card.id} style={styles.cardItem} variant="outlined">
              <View style={styles.cardIcon}>
                <CreditCard color={theme.colors.primary} size={24} weight="fill" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNumber}>**** **** **** {card.last4}</Text>
                <Text style={styles.cardDetails}>{card.brand} • Expires {card.expMonth}/{card.expYear}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(card.id)} style={{ padding: 8 }}>
                <Trash size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
               <CreditCard size={40} color={theme.colors.border} weight="light" />
            </View>
            <Text style={styles.emptyText}>You haven't saved any cards yet.{'\n'}Save a card during your next payment for faster checkout.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          label="Add New Card" 
          onPress={() => navigation.navigate('NativeCardPayment', { amount: 50, isAddCardOnly: true })} 
          variant="outlined"
        />
      </View>
    </SafeAreaView>
  );
};
