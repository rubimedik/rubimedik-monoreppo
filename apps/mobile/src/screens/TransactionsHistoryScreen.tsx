import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { 
  CaretLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  MagnifyingGlass, 
  Calendar as CalendarIcon, 
  FilePdf, 
  FileXls,
  Receipt,
  FileText,
  X,
  DeviceMobile,
  Envelope,
  CaretRight as CaretRightIcon
} from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { format, startOfMonth } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { BackButton } from '../components';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export const TransactionsHistoryScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  
  // Statement Modal State
  const [isStatementModalVisible, setStatementModalVisible] = useState(false);
  const [statementFormat, setStatementFormat] = useState<'PDF' | 'EXCEL'>('PDF');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['all-transactions', activeFilter],
    queryFn: async () => {
      let url = '/wallet/transactions?limit=100';
      if (activeFilter !== 'ALL') {
        url += `&type=${activeFilter}`;
      }
      const res = await api.get(url);
      return res.data;
    },
  });

  const transactions = response?.items || [];

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter((tx: any) => 
      tx.reference.toLowerCase().includes(query) || 
      tx.metadata?.note?.toLowerCase().includes(query) ||
      tx.type.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  const handleDownload = async (destination: 'device' | 'email') => {
    if (destination === 'email') {
        await handleSendEmail();
        return;
    }

    if (statementFormat === 'EXCEL') {
        await handleDownloadExcel();
    } else {
        await handleDownloadPDF();
    }
    setStatementModalVisible(false);
  };

  const handleSendEmail = async () => {
    setIsGenerating(true);
    try {
      await api.post(`/wallet/statement/email?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      Alert.alert('Statement Sent', 'Your account statement has been sent to your registered email address.');
      setStatementModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send statement via email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsGenerating(true);
    try {
      const res = await api.get(`/wallet/statement?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const filename = `Rubimedik_Statement_${safeFormat(startDate, 'yyyyMMdd')}_${safeFormat(endDate, 'yyyyMMdd')}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, res.data, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Statement' });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate Excel/CSV statement');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 40px; }
              .title { font-size: 24px; font-weight: bold; color: #EF4444; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border-bottom: 1px solid #eee; padding: 12px; text-align: left; }
              th { background-color: #f9f9f9; font-size: 12px; color: #666; text-transform: uppercase; }
              .amount { font-weight: bold; }
              .credit { color: #10B981; }
              .debit { color: #111827; }
              .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">RUBIMEDIK HEALTH</div>
              <p>Account Statement</p>
              <p>${safeFormat(startDate, 'PPP')} - ${safeFormat(endDate, 'PPP')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions.slice(0, 100).map((tx: any) => `
                  <tr>
                    <td>${safeFormat(tx.createdAt, 'MMM d, yyyy')}</td>
                    <td style="font-family: monospace; font-size: 10px;">${tx.reference}</td>
                    <td>${tx.type.replace(/_/g, ' ')}</td>
                    <td class="amount ${tx.type.includes('CREDIT') || tx.type.includes('TOPUP') ? 'credit' : 'debit'}">
                      ₦${Number(tx.amount).toLocaleString()}
                    </td>
                    <td>${tx.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              This is an official Rubimedik statement generated on ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF statement');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT' || item.type === 'WALLET_TOPUP' || item.type === 'TRANSFER_IN';
    return (
      <TouchableOpacity 
        style={styles.txItem}
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
      >
        <View style={[styles.txIcon, { backgroundColor: isCredit ? theme.colors.success + '15' : theme.colors.error + '15' }]}>
          {isCredit ? 
            <ArrowDownLeft size={20} color={theme.colors.success} /> : 
            <ArrowUpRight size={20} color={theme.colors.error} />
          }
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.metadata?.note || item.type.replace(/_/g, ' ')}</Text>
          <Text style={styles.txDate}>{safeFormat(item.createdAt, 'MMM d, yyyy • HH:mm')}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? theme.colors.success : theme.colors.textPrimary }]}>
          {isCredit ? '+' : '-'}₦{Number(item.amount).toLocaleString()}
        </Text>
      </TouchableOpacity>
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
      justifyContent: 'space-between',
      padding: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    searchContainer: {
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
    },
    filters: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 8,
      marginBottom: 16,
    },
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilter: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
    },
    activeFilterText: {
      color: 'white',
    },
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    txItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    txIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    txInfo: {
      flex: 1,
    },
    txTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    txDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    txAmount: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyBold,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 100,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    modalSection: {
      marginBottom: 24,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
    },
    datePicker: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 4,
    },
    dateLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      fontFamily: theme.typography.fontFamilyBold,
    },
    dateValue: {
      fontSize: 13,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    formatRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formatBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFormatBtn: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05',
    },
    formatText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
    },
    activeFormatText: {
      color: theme.colors.primary,
    },
    destinationRow: {
      gap: 12,
    },
    destinationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    destinationText: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    downloadIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <BackButton />
            <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <TouchableOpacity onPress={() => setStatementModalVisible(true)}>
            <FileText size={24} color={theme.colors.primary} weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MagnifyingGlass size={20} color={theme.colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search reference or note..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'CREDIT', 'DEBIT'] as const).map((filter) => (
          <TouchableOpacity 
            key={filter}
            style={[styles.filterBtn, activeFilter === filter && styles.activeFilter]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found matching your criteria.</Text>
            </View>
          }
        />
      )}

      {/* Account Statement Modal */}
      <Modal
        visible={isStatementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Statement</Text>
              <TouchableOpacity onPress={() => setStatementModalVisible(false)}>
                <X size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Select Period</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity 
                    style={styles.datePicker} 
                    onPress={() => {
                        setStatementModalVisible(false);
                        setTimeout(() => setStartDatePickerVisible(true), 500);
                    }}
                >
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>{safeFormat(startDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.datePicker} 
                    onPress={() => {
                        setStatementModalVisible(false);
                        setTimeout(() => setEndDatePickerVisible(true), 500);
                    }}
                >
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>{safeFormat(endDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>File Format</Text>
              <View style={styles.formatRow}>
                <TouchableOpacity 
                  style={[styles.formatBtn, statementFormat === 'PDF' && styles.activeFormatBtn]}
                  onPress={() => setStatementFormat('PDF')}
                >
                  <FilePdf size={20} color={statementFormat === 'PDF' ? theme.colors.primary : theme.colors.textSecondary} weight="fill" />
                  <Text style={[styles.formatText, statementFormat === 'PDF' && styles.activeFormatText]}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.formatBtn, statementFormat === 'EXCEL' && styles.activeFormatBtn]}
                  onPress={() => setStatementFormat('EXCEL')}
                >
                  <FileXls size={20} color={statementFormat === 'EXCEL' ? "#166534" : theme.colors.textSecondary} weight="fill" />
                  <Text style={[styles.formatText, statementFormat === 'EXCEL' && { color: '#166534' }]}>Excel/CSV</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Get Statement</Text>
              <View style={styles.destinationRow}>
                <TouchableOpacity style={styles.destinationBtn} onPress={() => handleDownload('device')} disabled={isGenerating}>
                  <View style={styles.downloadIcon}>
                    <DeviceMobile size={20} color={theme.colors.primary} weight="bold" />
                  </View>
                  <Text style={styles.destinationText}>Download to Device</Text>
                  <CaretRightIcon size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.destinationBtn} onPress={() => handleDownload('email')} disabled={isGenerating}>
                  <View style={[styles.downloadIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Envelope size={20} color={theme.colors.secondary} weight="bold" />
                  </View>
                  <Text style={styles.destinationText}>Send to Email</Text>
                  <CaretRightIcon size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {isGenerating && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', marginTop: 10 }}>
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Generating your statement...</Text>
                </View>
            )}
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        isDarkModeEnabled={isDarkMode}
        themeVariant={isDarkMode ? 'dark' : 'light'}
        accentColor={theme.colors.primary}
        onConfirm={(date) => {
          setStartDatePickerVisible(false);
          setStartDate(date);
          setTimeout(() => setStatementModalVisible(true), 600);
        }}
        onCancel={() => {
          setStartDatePickerVisible(false);
          setTimeout(() => setStatementModalVisible(true), 600);
        }}
        date={startDate}
        maximumDate={endDate}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        isDarkModeEnabled={isDarkMode}
        themeVariant={isDarkMode ? 'dark' : 'light'}
        accentColor={theme.colors.primary}
        onConfirm={(date) => {
          setEndDatePickerVisible(false);
          setEndDate(date);
          setTimeout(() => setStatementModalVisible(true), 600);
        }}
        onCancel={() => {
          setEndDatePickerVisible(false);
          setTimeout(() => setStatementModalVisible(true), 600);
        }}
        date={endDate}
        minimumDate={startDate}
        maximumDate={new Date()}
      />
    </SafeAreaView>
  );
};
