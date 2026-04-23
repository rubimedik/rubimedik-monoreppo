import React, { useMemo, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Share,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShareNetwork, 
  CheckCircle, 
  Clock, 
  XCircle,
  Copy,
  Receipt
} from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const TransactionDetailScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { transaction: initialTransaction } = route.params;
  const [transaction, setTransaction] = useState(initialTransaction);
  const [copied, setCopied] = useState(false);
  const viewShotRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/payments/verify/${transaction.reference}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success' || data.status === 'failed') {
        const newStatus = data.status === 'success' ? 'COMPLETED' : 'FAILED';
        // Update local state to reflect new status
        setTransaction(prev => ({ ...prev, status: newStatus }));
        
        queryClient.resetQueries({ queryKey: ['wallet'] });
        queryClient.resetQueries({ queryKey: ['all-transactions'] });
        Alert.alert('Status Updated', `Transaction is now ${newStatus}`);
      } else {
        Alert.alert('Status', 'Transaction is still processing');
      }
    }
  });

  const isCredit = transaction.type === 'CREDIT' || 
                   transaction.type === 'WALLET_TOPUP' || 
                   transaction.type === 'TRANSFER_IN';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return theme.colors.success;
      case 'PENDING': return theme.colors.warning;
      case 'FAILED': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (error: any) {
      console.log(error.message);
      const message = `Rubimedik Transaction Receipt\n\nReference: ${transaction.reference}\nAmount: ₦${Number(transaction.amount).toLocaleString()}\nType: ${transaction.type}\nStatus: ${transaction.status}\nDate: ${safeFormat(transaction.createdAt, 'PPP p')}`;
      await Share.share({ message });
    }
  };

  const styles = useMemo(() => StyleSheet.create({
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
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    content: {
      padding: 24,
      alignItems: 'center',
    },
    amountContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    amount: {
      fontSize: 36,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },
    statusText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyBold,
      textTransform: 'uppercase',
    },
    detailsCard: {
      width: '100%',
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      gap: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    detailLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      flex: 1,
      marginLeft: 40,
    },
    referenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'flex-end',
      flex: 1,
      marginLeft: 40,
    },
    footer: {
      padding: 24,
      gap: 16,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    shareBtn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    shareBtnText: {
      color: 'white',
      fontFamily: theme.typography.fontFamilyBold,
    },
    senderBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 4,
      alignSelf: 'flex-start'
    },
    senderBadgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <ShareNetwork color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ width: '100%', backgroundColor: theme.colors.background, padding: 10 }}>
          <View style={styles.amountContainer}>
            <View style={[styles.iconCircle, { backgroundColor: isCredit ? theme.colors.success + '15' : theme.colors.error + '15' }]}>
              {isCredit ? 
                <ArrowDownLeft size={32} color={theme.colors.success} weight="bold" /> : 
                <ArrowUpRight size={32} color={theme.colors.error} weight="bold" />
              }
            </View>
            <Text style={styles.amount}>
              {isCredit ? '+' : '-'}₦{Number(transaction.amount).toLocaleString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '15' }]}>
              {transaction.status === 'COMPLETED' && <CheckCircle size={14} color={theme.colors.success} weight="fill" />}
              {transaction.status === 'PENDING' && <Clock size={14} color={theme.colors.warning} weight="fill" />}
              {transaction.status === 'FAILED' && <XCircle size={14} color={theme.colors.error} weight="fill" />}
              <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>{transaction.status}</Text>
            </View>

            {transaction.status === 'PENDING' && (
              <TouchableOpacity 
                onPress={() => verifyMutation.mutate()} 
                style={{ marginTop: 12 }}
                disabled={verifyMutation.isPending}
              >
                <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: 13 }}>
                  {verifyMutation.isPending ? 'Checking...' : 'Refresh Status'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Card style={styles.detailsCard} variant="flat">
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Type</Text>
              <Text style={styles.detailValue}>{transaction.type.replace(/_/g, ' ')}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference ID</Text>
              <TouchableOpacity 
                style={styles.referenceRow}
                onPress={() => copyToClipboard(transaction.reference)}
              >
                <Text style={{ fontSize: 14, fontFamily: 'monospace', color: theme.colors.textPrimary, textAlign: 'right' }}>{transaction.reference}</Text>
                {copied ? (
                  <CheckCircle size={14} color={theme.colors.success} weight="fill" />
                ) : (
                  <Copy size={14} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{safeFormat(transaction.createdAt, 'PPP p')}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.metadata?.note || 'No description provided'}</Text>
            </View>

            {transaction.metadata?.senderName && (
              <View style={styles.detailRow}>
                <View>
                  <Text style={styles.detailLabel}>Sender</Text>
                  <View style={styles.senderBadge}><Text style={styles.senderBadgeText}>FROM</Text></View>
                </View>
                <View style={{ alignItems: 'flex-end', flex: 1 }}>
                  <Text style={[styles.detailValue, { marginLeft: 0 }]}>{transaction.metadata.senderName}</Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }}>{transaction.metadata.senderEmail}</Text>
                </View>
              </View>
            )}

            {transaction.metadata?.recipientName && (
              <View style={styles.detailRow}>
                <View>
                  <Text style={styles.detailLabel}>Recipient</Text>
                  <View style={[styles.senderBadge, { borderColor: theme.colors.success + '40' }]}><Text style={[styles.senderBadgeText, { color: theme.colors.success }]}>TO</Text></View>
                </View>
                <View style={{ alignItems: 'flex-end', flex: 1 }}>
                  <Text style={[styles.detailValue, { marginLeft: 0 }]}>{transaction.metadata.recipientName}</Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }}>{transaction.metadata.recipientEmail || transaction.metadata.accountNumber}</Text>
                </View>
              </View>
            )}

            {transaction.metadata?.bankName && (              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{transaction.metadata.bankName}</Text>
              </View>
            )}

            {transaction.metadata?.accountNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>{transaction.metadata.accountNumber}</Text>
              </View>
            )}
          </Card>
          
          <View style={{ marginTop: 24, alignItems: 'center', opacity: 0.5 }}>
            <Text style={{ fontSize: 10, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary }}>
              OFFICIAL DIGITAL RECEIPT • RUBIMEDIK HEALTH
            </Text>
          </View>
        </ViewShot>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
          <Receipt size={20} color="white" weight="bold" />
          <Text style={styles.shareBtnText}>Download Receipt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
