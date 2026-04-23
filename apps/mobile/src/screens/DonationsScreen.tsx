import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Calendar, CaretRight, Drop, Clock, CheckCircle, WarningCircle, XCircle, Info } from 'phosphor-react-native';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { DonationStatus } from '@repo/shared';
import { useNavigation } from '@react-navigation/native';
import { SearchInput } from '../components/SearchInput';

export const DonationsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'DECLINED' | 'CANCELLED'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: donations, isLoading, refetch } = useQuery({
    queryKey: ['my-donations'],
    queryFn: async () => {
      const res = await api.get('/donations/my');
      return res.data;
    },
  });

  const filteredDonations = useMemo(() => {
    if (!donations) return [];
    let filtered = donations;
    
    // Filter by tab
    if (activeTab === 'UPCOMING') {
      filtered = filtered.filter((d: any) => 
        [DonationStatus.PENDING, DonationStatus.ACCEPTED, DonationStatus.CONFIRMED].includes(d.status)
      );
    } else if (activeTab === 'DECLINED') {
      filtered = filtered.filter((d: any) => d.status === DonationStatus.DECLINED);
    } else if (activeTab === 'CANCELLED') {
      filtered = filtered.filter((d: any) => d.status === DonationStatus.CANCELLED);
    } else {
      filtered = filtered.filter((d: any) => 
        [DonationStatus.COMPLETED, DonationStatus.VERIFIED, DonationStatus.DONATED].includes(d.status)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((d: any) => {
        const hospitalName = d.request?.hospital?.hospitalProfile?.hospitalName?.toLowerCase() || '';
        const bloodType = d.request?.bloodType?.toLowerCase() || '';
        return hospitalName.includes(query) || bloodType.includes(query);
      });
    }

    return filtered;
  }, [donations, activeTab, searchQuery]);

  const getStatusInfo = (status: DonationStatus) => {
    switch (status) {
      case DonationStatus.PENDING:
        return { label: 'Awaiting Approval', color: theme.colors.warning, icon: Clock };
      case DonationStatus.ACCEPTED:
        return { label: 'Approved', color: theme.colors.success, icon: CheckCircle };
      case DonationStatus.COMPLETED:
      case DonationStatus.VERIFIED:
        return { label: 'Completed', color: theme.colors.success, icon: CheckCircle };
      case DonationStatus.DECLINED:
        return { label: 'Declined', color: theme.colors.error, icon: XCircle };
      case DonationStatus.CANCELLED:
        return { label: 'Cancelled', color: theme.colors.textSecondary, icon: XCircle };
      default:
        return { label: status, color: theme.colors.textSecondary, icon: Info };
    }
  };

  const renderDonationItem = ({ item }: { item: any }) => {
    const statusInfo = getStatusInfo(item.status);
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card 
        style={styles.donationCard} 
        variant="outlined"
        onPress={() => navigation.navigate('BloodRequestDetail', { requestId: item.request.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {item.request?.title || item.request?.hospital?.hospitalProfile?.hospitalName || 'Hospital'}
            </Text>
            {item.request?.title && (
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium, marginTop: 2 }}>
                {item.request?.hospital?.hospitalProfile?.hospitalName || 'Medical Facility'}
              </Text>
            )}
            <Text style={styles.dateText}>
              {safeFormat(item.createdAt, 'MMM d, yyyy')}
            </Text>
          </View>
          <Badge label={statusInfo.label} variant={item.status === DonationStatus.DECLINED ? 'error' : item.status === DonationStatus.CANCELLED ? 'warning' : 'info'} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Drop size={14} color={theme.colors.error} weight="fill" />
            <Text style={styles.detailText}>{item.request?.bloodType}</Text>
            <Text style={styles.statusDot}>•</Text>
            <StatusIcon size={14} color={statusInfo.color} weight="bold" />
            <Text style={[styles.detailText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>

          {item.status === DonationStatus.DECLINED && item.declineReason && (
            <View style={styles.declineReasonBox}>
              <WarningCircle size={14} color={theme.colors.error} weight="fill" />
              <Text style={styles.declineReasonText}>Reason: {item.declineReason}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    listContent: {
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    donationCard: {
      padding: 16,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    hospitalInfo: {
      flex: 1,
      marginRight: 12,
    },
    hospitalName: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    cardDivider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 12,
    },
    cardBody: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    declineReasonBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.lightRedTint,
      padding: 8,
      borderRadius: 8,
      marginTop: 8,
    },
    declineReasonText: {
      fontSize: 12,
      color: theme.colors.error,
      fontFamily: theme.typography.fontFamilyMedium,
      flex: 1,
    },
    bold: {
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 4,
    },
    viewDetailText: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
      gap: 16,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
    },
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Donations</Text>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <SearchInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search hospital or blood type..."
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'UPCOMING' && styles.activeTab]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'DECLINED' && styles.activeTab]}
          onPress={() => setActiveTab('DECLINED')}
        >
          <Text style={[styles.tabText, activeTab === 'DECLINED' && styles.activeTabText]}>Declined</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CANCELLED' && styles.activeTab]}
          onPress={() => setActiveTab('CANCELLED')}
        >
          <Text style={[styles.tabText, activeTab === 'CANCELLED' && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PAST' && styles.activeTab]}
          onPress={() => setActiveTab('PAST')}
        >
          <Text style={[styles.tabText, activeTab === 'PAST' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredDonations}
          renderItem={renderDonationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Drop size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>
                {activeTab === 'UPCOMING' 
                  ? "No scheduled donations yet.\nFind a hospital request to get started!" 
                  : "No donation history found."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
