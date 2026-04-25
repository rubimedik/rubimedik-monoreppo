import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Coins, PaperPlaneTilt, Bank, Copy, Info, CheckCircle, Eye, EyeSlash, ClockCounterClockwise } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { Pressable as GHPressable } from 'react-native-gesture-handler';

export const WalletScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [showBalance, setShowBalance] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    },
  });

  const { data: txResponse, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.get('/wallet/transactions?limit=5');
      return res.data;
    },
  });

  const copyToClipboard = async (text: string, field: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const onRefresh = async () => {
    await Promise.all([refetch(), refetchTx()]);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    balanceCard: {
      backgroundColor: theme.colors.primary,
      padding: 24,
      borderRadius: 24,
      marginBottom: 24,
      gap: 16,
    },
    accountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accountText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    balanceValue: {
      color: theme.colors.white,
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
    },
    lastUpdated: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    pillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    pillButtonText: {
      color: 'white',
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyBold,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    actionBtn: {
      alignItems: 'center',
      gap: 8,
    },
    actionIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    dvaCard: {
      padding: 20,
      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
      borderRadius: 20,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dvaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    dvaTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    dvaContent: {
      gap: 12,
    },
    dvaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dvaLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    dvaValue: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    dvaAccountNumber: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    seeAll: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.primary,
    },
    txItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    txInfo: {
      flex: 1,
    },
    txTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    txDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    txAmount: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: 20,
      fontFamily: theme.typography.fontFamily,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary + '10',
      padding: 12,
      borderRadius: 12,
      marginTop: 16,
      gap: 8,
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wallet</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <Card style={styles.balanceCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountText}>
              {wallet?.accountNumber || '0000000000'} | {wallet?.bankName || 'Rubimedik Bank'}
            </Text>
            <GHPressable onPress={() => copyToClipboard(wallet?.accountNumber, 'acc')} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]} hitSlop={10}>
              {copiedField === 'acc' ? (
                <CheckCircle size={16} color="white" weight="fill" />
              ) : (
                <Copy size={16} color="white" weight="bold" />
              )}
            </GHPressable>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>
              {showBalance ? `₦${Number(wallet?.balance || 0).toLocaleString()}` : '₦ ••••••••'}
            </Text>
            <GHPressable onPress={() => setShowBalance(!showBalance)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]} hitSlop={10}>
              {showBalance ? (
                <EyeSlash size={24} color="white" />
              ) : (
                <Eye size={24} color="white" />
              )}
            </GHPressable>
          </View>

          <Text style={styles.lastUpdated}>Last updated just now</Text>

          <View style={styles.cardActions}>
            <GHPressable style={({ pressed }) => [styles.pillButton, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('TopUp')}>
              <Plus size={16} color="white" weight="bold" />
              <Text style={styles.pillButtonText}>Add Money</Text>
            </GHPressable>
            <GHPressable style={({ pressed }) => [styles.pillButton, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('TransactionHistory')}>
              <ClockCounterClockwise size={16} color="white" weight="bold" />
              <Text style={styles.pillButtonText}>History</Text>
            </GHPressable>
          </View>
        </Card>

        <View style={styles.actionsRow}>
          <GHPressable 
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]} 
            onPress={() => navigation.navigate('Transfer')}
            hitSlop={10}
          >
            <View style={styles.actionIcon}>
              <PaperPlaneTilt size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </GHPressable>

          <GHPressable 
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]} 
            onPress={() => navigation.navigate('Withdraw')}
            hitSlop={10}
          >
            <View style={styles.actionIcon}>
              <Bank size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </GHPressable>

          <GHPressable 
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]} 
            onPress={() => navigation.navigate('SavedCards')}
            hitSlop={10}
          >
            <View style={styles.actionIcon}>
              <Coins size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={styles.actionLabel}>Cards</Text>
          </GHPressable>

          <GHPressable 
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]} 
            onPress={() => navigation.navigate('Referrals')}
            hitSlop={10}
          >
            <View style={styles.actionIcon}>
              <Plus size={24} color={theme.colors.primary} weight="bold" />
            </View>
            <Text style={styles.actionLabel}>Redeem</Text>
          </GHPressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <GHPressable onPress={() => navigation.navigate('TransactionHistory')} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]} hitSlop={10}>
            <Text style={styles.seeAll}>See All</Text>
          </GHPressable>
        </View>

        {txLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={60} style={{ marginBottom: 12 }} />)
        ) : (
          <View>
            {txResponse?.items?.length > 0 ? (
              txResponse.items.slice(0, 5).map((tx: any) => {
                const isCredit = tx.type === 'CREDIT' || tx.type === 'WALLET_TOPUP' || tx.type === 'TRANSFER_IN' || tx.type === 'PLATFORM_FEE' || tx.type === 'CONSULTATION_PAYMENT';
                return (
                  <GHPressable 
                    key={tx.id} 
                    style={({ pressed }) => [styles.txItem, pressed && { opacity: 0.7, backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.navigate('TransactionDetail', { transaction: tx })}
                  >
                    <View style={[styles.txIcon, { backgroundColor: isCredit ? theme.colors.success + '15' : theme.colors.error + '15' }]}>
                      {isCredit ? 
                        <ArrowDownLeft size={20} color={theme.colors.success} /> : 
                        <ArrowUpRight size={20} color={theme.colors.error} />
                      }
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.metadata?.note || tx.type.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.txDate}>{safeFormat(tx.createdAt, 'MMM d, yyyy • HH:mm')}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? theme.colors.success : theme.colors.textPrimary }]}>
                      {isCredit ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                    </Text>
                  </GHPressable>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No transactions found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
