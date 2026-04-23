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
  Alert,
  Modal,
  TextInput,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Calendar, CaretRight, Drop, Clock, CheckCircle, WarningCircle, XCircle, User as UserIcon } from 'phosphor-react-native';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { Card, Badge, Avatar, PrimaryButton, SearchInput, BackButton } from '../components';
import { DonationStatus } from '@repo/shared';

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

export const HospitalDonationMatchesScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeclineModalVisible, setIsDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ['hospital-matches'],
    queryFn: async () => {
      const res = await api.get('/donations/hospital/matches');
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status, declineReason }: { matchId: string; status: DonationStatus; declineReason?: string }) => {
      const res = await api.put(`/donations/matches/${matchId}/status`, { status, declineReason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-matches'] });
      setIsDeclineModalVisible(false);
      setDeclineReason('');
      setSelectedMatchId(null);
      Alert.alert('Success', 'Status updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  });

  const completeDonationMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const res = await api.post(`/donations/complete/${matchId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-matches'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-inventory'] });
      Alert.alert('Success', 'Donation marked as completed and inventory updated.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to complete donation');
    }
  });

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    let filtered = matches;
    
    if (activeTab === 'PENDING') {
      filtered = filtered.filter((m: any) => m.status === DonationStatus.PENDING);
    } else if (activeTab === 'ACCEPTED') {
      filtered = filtered.filter((m: any) => m.status === DonationStatus.ACCEPTED);
    } else if (activeTab === 'DECLINED') {
      filtered = filtered.filter((m: any) => m.status === DonationStatus.DECLINED);
    } else {
      filtered = filtered.filter((m: any) => [DonationStatus.COMPLETED, DonationStatus.VERIFIED, DonationStatus.DONATED].includes(m.status));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m: any) => {
        const donorName = m.isAnonymous ? 'anonymous donor' : (m.donor?.fullName?.toLowerCase() || '');
        const donorEmail = m.isAnonymous ? '' : (m.donor?.email?.toLowerCase() || '');
        const bloodType = (m.donor?.bloodType || m.request?.bloodType || '').toLowerCase();
        const genotype = (m.donor?.genotype || '').toLowerCase();
        
        return donorName.includes(query) || 
               donorEmail.includes(query) || 
               bloodType.includes(query) || 
               genotype.includes(query);
      });
    }

    return filtered;
  }, [matches, activeTab, searchQuery]);

const handleDecline = (matchId: string) => {
  setSelectedMatchId(matchId);
  setDeclineReason('');
  setIsDeclineModalVisible(true);
};

const submitDecline = () => {
  if (!declineReason.trim()) {
    Alert.alert('Error', 'Please provide a reason for declining');
    return;
  }
  if (selectedMatchId) {
    updateStatusMutation.mutate({ 
      matchId: selectedMatchId, 
      status: DonationStatus.DECLINED,
      declineReason: declineReason.trim()
    });
  }
};

const renderMatchItem = ({ item }: { item: any }) => (
  <Pressable onPress={() => navigation.navigate('HospitalDonationDetail', { matchId: item.id })}>
    <Card style={styles.matchCard} variant="outlined">
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar 
            name={item.isAnonymous ? 'A' : (item.donor?.fullName || item.donor?.email)} 
            size={48} 
          />
          <View>
            <Text style={styles.donorName}>
              {item.isAnonymous ? 'Anonymous Donor' : (item.donor?.fullName || 'Anonymous Donor')}
            </Text>
            {!item.isAnonymous && (
              <Text style={styles.donorEmail}>{item.donor?.email}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.donorInfoSection}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Blood Type</Text>
            <Text style={styles.infoValue}>{item.donor?.bloodType || item.request?.bloodType || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Genotype</Text>
            <Text style={styles.infoValue}>{item.donor?.genotype || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Health Status</Text>
            <Badge 
              label={item.donor?.healthCondition || 'Healthy'} 
              variant={item.donor?.healthCondition === 'healthy' ? 'success' : 'warning'} 
              size="small"
            />
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Donation</Text>
            <Text style={styles.infoValue}>
              {item.donor?.lastDonationDate 
                ? safeFormat(item.donor.lastDonationDate, 'MMM d, yyyy') 
                : 'First time'}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Booked For</Text>
          <Text style={styles.infoValue}>
            {item.request?.bloodType} - {item.request?.units || 1} unit(s)
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>Booked on {safeFormat(item.createdAt, 'PPP p')}</Text>
        </View>

        {item.status === DonationStatus.DECLINED && item.declineReason && (
          <View style={styles.declineReasonContainer}>
            <WarningCircle size={16} color={theme.colors.error} />
            <Text style={styles.declineReasonText}>Reason: {item.declineReason}</Text>
          </View>
        )}
        
        {activeTab === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDecline(item.id)}
              disabled={updateStatusMutation.isPending}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => updateStatusMutation.mutate({ matchId: item.id, status: DonationStatus.ACCEPTED })}
              disabled={updateStatusMutation.isPending}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'ACCEPTED' && (
          <View style={{ gap: 12 }}>
            <PrimaryButton 
              label="Record Donation" 
              onPress={() => navigation.navigate('RecordDonation', { matchId: item.id })}
            />
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDecline(item.id)}
            >
              <Text style={styles.declineText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  </Pressable>
);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 24, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    tabs: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16, gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    activeTab: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { fontSize: 12, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textSecondary },
    activeTabText: { color: 'white' },
    listContent: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
    matchCard: { padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    donorName: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    donorEmail: { fontSize: 12, color: theme.colors.textSecondary },
    cardBody: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
    donorInfoSection: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 12, marginBottom: 12 },
    infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 11, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textSecondary, marginBottom: 4 },
    infoValue: { fontSize: 14, fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textPrimary },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    infoText: { fontSize: 13, color: theme.colors.textSecondary },
    declineReasonContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8, 
      backgroundColor: theme.colors.lightRedTint, 
      padding: 10, 
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    declineReasonText: { fontSize: 13, color: theme.colors.error, fontFamily: theme.typography.fontFamilyMedium, flex: 1 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    actionBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    acceptBtn: { backgroundColor: theme.colors.success },
    declineBtn: { backgroundColor: theme.colors.lightRedTint },
    acceptText: { color: 'white', fontFamily: theme.typography.fontFamilyBold },
    declineText: { color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: theme.colors.card, borderRadius: 20, padding: 24, gap: 16 },
    modalTitle: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    reasonInput: { 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: 12, 
      padding: 12, 
      height: 100, 
      textAlignVertical: 'top',
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cancelModalBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    submitModalBtn: { backgroundColor: theme.colors.error },
    modalBtnText: { fontFamily: theme.typography.fontFamilyBold, fontSize: 14 },
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <BackButton style={{ marginRight: 16 }} />
          <Text style={styles.headerTitle}>Donation Matches</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <SearchInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search donor or blood type..."
        />
      </View>

      <View style={styles.tabs}>
        {['PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED'].map((tab: any) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Drop size={48} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} matches found.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isDeclineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reason for Declining</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              value={declineReason}
              onChangeText={setDeclineReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setIsDeclineModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.submitModalBtn]}
                onPress={submitDecline}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: 'white' }]}>Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
