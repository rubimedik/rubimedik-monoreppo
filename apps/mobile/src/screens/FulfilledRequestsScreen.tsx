import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Drop, CaretRight, Calendar, CheckCircle } from 'phosphor-react-native';
import { safeFormat } from '../utils/dateUtils';
import { Card, Badge, BackButton, SearchInput } from '../components';

export const FulfilledRequestsScreen = ({ navigation }: { navigation: any }) => {
  const { theme, isDarkMode } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['fulfilled-requests'],
    queryFn: async () => {
      const res = await api.get('/donations/hospital/requests');
      // Show ALL previous requests here
      return res.data;
    },
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    let filtered = [...requests];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r: any) => 
        (r.title || '').toLowerCase().includes(query) || 
        r.bloodType.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
    });
  }, [requests, searchQuery]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    searchWrap: { paddingHorizontal: 24, marginBottom: 16 },
    listContent: { padding: 24, gap: 16, paddingBottom: 100 },
    requestCard: { padding: 16, backgroundColor: 'white' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
    requestTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    requestDate: { fontSize: 13, color: '#6C757D', marginTop: 2 },
    progressSection: { marginTop: 20 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 12, color: '#6C757D', fontFamily: theme.typography.fontFamilyMedium },
    progressValue: { fontSize: 12, color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold },
    progressBarBg: { height: 6, backgroundColor: '#F1F3F5', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    cardDivider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 16 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerItem: { gap: 4 },
    footerLabel: { fontSize: 11, color: '#6C757D', textTransform: 'uppercase', fontWeight: 'bold' },
    footerValue: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 16 },
    emptyText: { fontSize: 14, color: '#6C757D', textAlign: 'center', marginTop: 8 },
  }), [theme, isDarkMode]);

  const renderItem = ({ item }: { item: any }) => {
    const progress = Math.min(100, Math.round((item.unitsFulfilled / item.units) * 100));
    const isFullyFulfilled = progress >= 100;

    return (
      <Card 
        style={styles.requestCard} 
        variant="outlined"
        onPress={() => navigation.navigate('FulfilledRequestDetail', { requestId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, !isFullyFulfilled && { backgroundColor: theme.colors.primary + '10' }]}>
              <Drop size={24} color={isFullyFulfilled ? theme.colors.error : theme.colors.primary} weight="fill" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.requestTitle} numberOfLines={1}>{item.title || `${item.bloodType} Request`}</Text>
            <Text style={styles.requestDate}>
                {isFullyFulfilled ? `Fulfilled on ${safeFormat(item.updatedAt, 'MMM dd, yyyy')}` : `Created on ${safeFormat(item.createdAt, 'MMM dd, yyyy')}`}
            </Text>
          </View>
          <CaretRight size={20} color={theme.colors.textMuted} />
        </View>

        <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Fulfillment Progress</Text>
                <Text style={[styles.progressValue, isFullyFulfilled && { color: theme.colors.success }]}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isFullyFulfilled ? theme.colors.success : theme.colors.primary }]} />
            </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Blood Type</Text>
            <Text style={styles.footerValue}>{item.bloodType}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Units</Text>
            <Text style={styles.footerValue}>{item.unitsFulfilled}/{item.units} Bags</Text>
          </View>
          <Badge 
            label={isFullyFulfilled ? 'Fulfilled' : 'In Progress'} 
            variant={isFullyFulfilled ? 'success' : 'primary'} 
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Request History</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchInput 
          placeholder="Search by title or blood type..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyTitle}>No fulfilled requests</Text>
              <Text style={styles.emptyText}>Completed requests will appear here once they are fully fulfilled.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
