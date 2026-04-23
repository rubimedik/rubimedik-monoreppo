import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Warning, MagnifyingGlass, Drop } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { donationService, BloodRequest } from '../services/donationService';
import { TextInput, Card, Badge, BackButton } from '../components';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { isDonorCompatibleWithRequest } from '../utils/bloodTypeCompatibility';
import { CompatibilityBadge } from '../components/ProfileIncompleteBanner';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

export const BloodRequestsNearbyScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user profile for blood type
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      // Basic info
      const res = await api.get('/users/me');
      const baseData = res.data;
      
      try {
        // Extended profile info for donors/patients
        const profileRes = await api.get('/users/profile');
        return { ...baseData, ...profileRes.data };
      } catch (err) {
        // It's possible the profile doesn't exist yet
        return baseData;
      }
    },
  });

  const userBloodType = profile?.bloodType || profile?.bloodGroup;

  useEffect(() => {
    fetchRequests();
  }, [profile]); // Refetch when profile (blood type) changes

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await donationService.getRequests();
      // Filter for active requests
      const activeRequests = data.filter(r => r.status === 'PENDING');
      
      // Filter by blood type compatibility if user has blood type
      if (userBloodType) {
        const compatible = activeRequests.filter(r => 
          isDonorCompatibleWithRequest(userBloodType, r.bloodType)
        );
        setRequests(compatible);
      } else {
        // No blood type - show nothing
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching nearby requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;
    const query = searchQuery.toLowerCase();
    return requests.filter(r => 
      r.bloodType.toLowerCase().includes(query) || 
      (r.hospital.hospitalProfile?.hospitalName || '').toLowerCase().includes(query) ||
      (r.hospital.hospitalProfile?.address || '').toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const formatDonationType = (type?: string) => {
    if (!type) return 'Whole Blood';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderRequestItem = ({ item }: { item: BloodRequest }) => (
    <Card 
        style={styles.requestCard} 
        variant="outlined"
        onPress={() => navigation.navigate('BloodRequestDetail', { requestId: item.id })}
    >
      <View style={styles.requestHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Drop size={24} color={theme.colors.error} weight="fill" />
          <Text style={styles.bloodType}>{item.bloodType}</Text>
          <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontSize: 12, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary }}>{formatDonationType(item.donationType)}</Text>
          </View>
        </View>
        <Badge 
          label={item.urgency} 
          variant={item.urgency === 'CRITICAL' || item.urgency === 'URGENT' ? 'error' : 'info'} 
        />
      </View>
      <View style={styles.requestDetails}>
        <Text style={styles.hospitalName} numberOfLines={1}>
          {item.title || item.hospital.hospitalProfile?.hospitalName || item.hospital.fullName || 'Blood Request'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ flex: 1, fontSize: 13, color: theme.colors.textSecondary }} numberOfLines={1}>
            {item.title 
              ? (item.hospital.hospitalProfile?.hospitalName || item.hospital.fullName)
              : (item.hospital.hospitalProfile?.address || 'Medical Facility')}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8 }}>
            {item.createdAt ? `${safeFormat(item.createdAt, 'h')} hrs ago` : 'recently'}
          </Text>
        </View>
        {item.title && (
          <Text style={styles.locationText} numberOfLines={1}>
            {item.hospital.hospitalProfile?.address || 'Medical Facility'}
          </Text>
        )}
        
        <View style={styles.unitsRow}>
            <Text style={styles.unitsLeft}>{item.units - item.unitsFulfilled} units left</Text>
            <Text style={styles.unitsTotal}>of {item.units} requested</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.contactBtn}
        onPress={() => navigation.navigate('BloodRequestDetail', { requestId: item.id })}
      >
        <Text style={styles.contactBtnText}>Provide Blood</Text>
      </TouchableOpacity>
    </Card>
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    headerTitle: { flex: 1, fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    listContainer: { padding: 20, paddingBottom: 40 },
    requestCard: {
      padding: 16,
      marginBottom: 16,
    },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    bloodType: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    requestDetails: { marginBottom: 16 },
    hospitalName: { fontSize: 16, fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textPrimary, marginBottom: 2 },
    locationText: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 },
    unitsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    unitsLeft: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    unitsTotal: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    contactBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    contactBtnText: {
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
    emptyContainer: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyText: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Nearby Requests</Text>
      </View>

      <View style={styles.searchContainer}>
          <TextInput 
            placeholder="Search blood type or hospital..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<MagnifyingGlass size={20} color={theme.colors.textSecondary} />}
          />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {!userBloodType ? (
                <>
                  <Warning size={48} color={theme.colors.border} weight="light" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyText}>Add your blood type in your profile to see compatible donation requests</Text>
                  <TouchableOpacity 
                    style={[styles.contactBtn, { width: '100%', marginTop: 24 }]}
                    onPress={() => navigation.navigate('PersonalInformation')}
                  >
                    <Text style={styles.contactBtnText}>Complete Profile</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Drop size={48} color={theme.colors.border} weight="light" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyText}>No compatible blood requests in your area right now.</Text>
                  <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                    Requests compatible with {userBloodType} will appear here
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
