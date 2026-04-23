import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components';
import { FileText, DownloadSimple, ShareNetwork, Prescription as PrescriptionIcon } from 'phosphor-react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { generateInvoiceHtml } from '../utils/invoiceTemplate';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

export const CareHistoryScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
    },
    listContent: {
      padding: theme.spacing.xl,
      paddingTop: 0,
      gap: theme.spacing.lg,
    },
    historyCard: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerInfo: {
      flex: 1,
    },
    specialistName: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    recordsSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    recordsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    recordItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.text,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      gap: 12,
    },
    footerAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    footerActionText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.primary,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    primaryActionText: {
      color: theme.colors.white,
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyBold,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 100,
      paddingHorizontal: 40,
    },
    emptyText: {
      marginTop: 16,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 16,
    },
    emptySubtext: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      textAlign: 'center',
    }
  }), [theme]);

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['care-history', user?.id],
    queryFn: async () => {
      const res = await api.get('/consultations/my');
      // Filter for completed ones to represent history
      return res.data.filter((app: any) => app.status === 'COMPLETED');
    },
    enabled: !!user?.id
  });

  const renderHistoryItem = ({ item }: { item: any }) => {
    const specialistName = item.specialist?.fullName || item.specialist?.firstName || 'Dr. Specialist';
    
    const handleViewFile = (url: string, title: string) => {
        if (!url) {
            Alert.alert('Not Available', `The ${title.toLowerCase()} has not been uploaded yet.`);
            return;
        }
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open document.'));
    };

    const handleShareRecords = async () => {
        const urls = [item.prescriptionUrl, item.labReportUrl, item.medicalReportUrl].filter(Boolean);
        if (urls.length === 0) {
            Alert.alert('No Records', 'There are no digital records available to share for this appointment.');
            return;
        }
        
        try {
            await Sharing.shareAsync(urls[0], { dialogTitle: 'Share Medical Records' });
        } catch (e) {
            Alert.alert('Error', 'Failed to open share sheet.');
        }
    };

    const handlePrintInvoice = async () => {
        try {
            const html = generateInvoiceHtml(item);
            await Print.printAsync({ html });
        } catch (e) {
            Alert.alert('Error', 'Failed to generate invoice.');
        }
    };

    return (
    <Card style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Avatar name={specialistName} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.specialistName}>{specialistName}</Text>
          <Text style={styles.dateText}>{new Date(item.completedAt || item.createdAt).toLocaleDateString()} • Video Consultation</Text>
        </View>
        <Badge label="Completed" variant="success" />
      </View>

      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>Medical Records</Text>
        <View style={styles.recordsGrid}>
          <TouchableOpacity 
            style={[styles.recordItem, !item.prescriptionUrl && { opacity: 0.4 }]}
            onPress={() => handleViewFile(item.prescriptionUrl, 'Prescription')}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
              <PrescriptionIcon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.recordLabel}>Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.recordItem, !item.labReportUrl && { opacity: 0.4 }]}
            onPress={() => handleViewFile(item.labReportUrl, 'Lab Report')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <FileText size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.recordLabel}>Lab Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.recordItem}
            onPress={handlePrintInvoice}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.colors.success + '15' }]}>
              <DownloadSimple size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.recordLabel}>Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.footerAction} onPress={handleShareRecords}>
          <ShareNetwork size={18} color={theme.colors.primary} />
          <Text style={styles.footerActionText}>Share Records</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.footerAction, styles.primaryAction]}
            onPress={() => navigation.navigate('ConsultationDetail', { consultationId: item.id })}
        >
          <Text style={styles.primaryActionText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </Card>
    );
  };

  if (!styles || !styles.container) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Care History</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={200} style={{ marginBottom: 16 }} />)}
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <FileText size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>No care history found yet.</Text>
              <Text style={styles.emptySubtext}>Your completed consultations and records will appear here.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

