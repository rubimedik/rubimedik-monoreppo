import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, Plus, Drop } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { donationService, BloodRequest } from '../services/donationService';
import { SearchInput, BackButton } from '../components';

type RequestTab = 'ACTIVE' | 'URGENT' | 'CRITICAL';

export const BloodRequestsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RequestTab>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await donationService.getRequests();
      // In a real app, we'd filter by the current hospital's ID on the backend
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter(r => r.status !== 'COMPLETED' && r.urgency !== 'CRITICAL' && r.urgency !== 'URGENT');
    } else if (activeTab === 'URGENT') {
      filtered = filtered.filter(r => r.urgency === 'URGENT');
    } else {
      filtered = filtered.filter(r => r.urgency === 'CRITICAL');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.title && r.title.toLowerCase().includes(query)) ||
        r.bloodType.toLowerCase().includes(query) || 
        (r.reason && r.reason.toLowerCase().includes(query)) ||
        (r.status && r.status.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [requests, activeTab, searchQuery]);

  const formatDonationType = (type?: string) => {
    if (!type) return 'Whole Blood';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderRequestItem = ({ item }: { item: BloodRequest }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => navigation.navigate('BloodRequestForm' as never, { request: item } as never)}
    >
      <View style={styles.requestHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bloodType} numberOfLines={1}>{item.title || item.bloodType}</Text>
          {item.title && <Text style={{ fontSize: 14, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyBold }}>{item.bloodType}</Text>}
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'CRITICAL' ? '#FFEBEB' : '#EBF5FF' }]}>
          <Text style={[styles.urgencyText, { color: item.urgency === 'CRITICAL' ? '#FF4D4F' : '#1890FF' }]}>
            {item.urgency}
          </Text>
        </View>
      </View>
      <View style={styles.requestDetails}>
        <Text style={styles.detailText}><Text style={styles.label}>Type:</Text> {formatDonationType(item.donationType)}</Text>
        <Text style={styles.detailText}><Text style={styles.label}>Units:</Text> {item.units} ({item.unitsFulfilled} fulfilled)</Text>
        <Text style={styles.detailText}><Text style={styles.label}>Reason:</Text> {item.reason}</Text>
        <Text style={styles.detailText}><Text style={styles.label}>Status:</Text> {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    headerTitle: { flex: 1, fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    addButton: { backgroundColor: theme.colors.primary, padding: 8, borderRadius: 8 },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.colors.card,
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
    tabDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginLeft: 6,
    },
    listContainer: { 
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    requestCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bloodType: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.primary },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    urgencyText: { fontSize: 12, fontFamily: theme.typography.fontFamilyBold },
    requestDetails: { gap: 4 },
    detailText: { fontSize: 13, color: theme.colors.textSecondary },
    label: { fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textPrimary },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
  }), [theme, isDarkMode]);

  const getTabDotColor = (tab: RequestTab) => {
    if (tab === 'CRITICAL') return theme.colors.error;
    if (tab === 'URGENT') return theme.colors.warning;
    return theme.colors.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Blood Requests</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('BloodRequestForm' as never)}
        >
          <Plus color={theme.colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <SearchInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search requests..."
        />
      </View>

      <View style={styles.tabs}>
        {(['ACTIVE', 'URGENT', 'CRITICAL'] as RequestTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
              <View style={[styles.tabDot, { backgroundColor: getTabDotColor(tab) }]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchRequests} 
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Drop size={48} color={theme.colors.border} weight="light" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} requests found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
