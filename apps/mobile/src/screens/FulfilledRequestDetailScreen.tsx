import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Drop, Calendar, Clock, User, CheckCircle, MapPin } from 'phosphor-react-native';
import { safeFormat } from '../utils/dateUtils';
import { Card, Badge, BackButton, Avatar } from '../components';

export const FulfilledRequestDetailScreen = ({ route }: { route: any }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { requestId } = route.params;

  const { data: request, isLoading: isRequestLoading } = useQuery({
    queryKey: ['fulfilled-request-detail', requestId],
    queryFn: async () => {
      const res = await api.get(`/donations/requests/${requestId}`);
      return res.data;
    },
    enabled: !!requestId
  });

  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['hospital-matches'],
    queryFn: async () => {
      const res = await api.get('/donations/hospital/matches');
      return res.data;
    },
  });

  const contributors = useMemo(() => {
    if (!matches) return [];
    return matches.filter((m: any) => 
        m.request.id === requestId && 
        ['COMPLETED', 'VERIFIED', 'DONATED'].includes(m.status)
    ).sort((a: any, b: any) => new Date(b.donatedAt || b.updatedAt).getTime() - new Date(a.donatedAt || a.updatedAt).getTime());
  }, [matches, requestId]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 24, paddingBottom: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainCard: { padding: 20, backgroundColor: 'white', marginBottom: 24 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    fulfilledDate: { fontSize: 12, color: '#6C757D' },
    requestTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 24 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16 },
    statBox: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    statLabel: { fontSize: 10, color: '#6C757D', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' },
    statDivider: { width: 1, height: 30, backgroundColor: '#DEE2E6' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 16 },
    contributorList: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F3F5' },
    contributorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    contributorName: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E' },
    contributorMeta: { fontSize: 12, color: '#6C757D', marginTop: 2 },
    donationTime: { fontSize: 12, fontWeight: 'bold', color: '#1A1C1E' },
    donationDate: { fontSize: 11, color: '#6C757D', marginTop: 2 },
    listDivider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 12 },
    infoBox: { gap: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { fontSize: 14, color: '#495057', flex: 1 },
    emptyText: { fontSize: 14, color: '#6C757D', textAlign: 'center', padding: 20 },
  }), [theme, isDarkMode]);

  const isLoading = isRequestLoading || isMatchesLoading;
  const progress = Math.min(100, Math.round(((request?.unitsFulfilled || 0) / (request?.units || 1)) * 100));
  const remaining = Math.max(0, (request?.units || 0) - (request?.unitsFulfilled || 0));

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const renderContributor = ({ item }: { item: any }) => (
    <View style={styles.contributorItem}>
      <Avatar name={item.isAnonymous ? 'Anonymous' : (item.donor?.fullName || 'Donor')} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.contributorName}>{item.isAnonymous ? 'Anonymous Donor' : (item.donor?.fullName || 'Donor')}</Text>
        <Text style={styles.contributorMeta}>
            {item.units || 1} Unit • {item.donationType?.replace('_', ' ') || 'Whole Blood'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.donationTime}>{safeFormat(item.donatedAt || item.updatedAt, 'h:mm aa')}</Text>
        <Text style={styles.donationDate}>{safeFormat(item.donatedAt || item.updatedAt, 'MMM dd')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Fulfillment Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard} variant="outlined">
            <View style={styles.statusRow}>
                <Badge label="COMPLETED" variant="success" />
                <Text style={styles.fulfilledDate}>Fulfilled {safeFormat(request?.updatedAt, 'PPP')}</Text>
            </View>
            
            <Text style={styles.requestTitle}>{request?.title || `${request?.bloodType} Blood Request`}</Text>
            
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Drop size={20} color={theme.colors.error} weight="fill" />
                    <Text style={styles.statValue}>{request?.bloodType}</Text>
                    <Text style={styles.statLabel}>Blood Type</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{request?.units}</Text>
                    <Text style={styles.statLabel}>Requested</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>{request?.unitsFulfilled}</Text>
                    <Text style={styles.statLabel}>Received</Text>
                </View>
            </View>

            <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6C757D', fontFamily: theme.typography.fontFamilyBold }}>Fulfillment</Text>
                    <Text style={{ fontSize: 13, color: progress === 100 ? theme.colors.success : theme.colors.primary, fontFamily: theme.typography.fontFamilyBold }}>{progress}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#F1F3F5', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? theme.colors.success : theme.colors.primary, borderRadius: 4 }} />
                </View>
                {remaining > 0 && (
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
                        {remaining} unit{remaining > 1 ? 's' : ''} still needed to reach goal.
                    </Text>
                )}
            </View>
        </Card>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Donor Breakdown</Text>
            <View style={styles.contributorList}>
                {contributors.length > 0 ? (
                    contributors.map((item: any, idx: number) => (
                        <View key={item.id}>
                            {renderContributor({ item })}
                            {idx < contributors.length - 1 && <View style={styles.listDivider} />}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No contributor data available for this request.</Text>
                )}
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Original Request Info</Text>
            <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                    <Calendar size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.infoText}>Created on {safeFormat(request?.createdAt, 'PPP')}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MapPin size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.infoText}>{request?.hospital?.hospitalProfile?.address || 'Medical Center'}</Text>
                </View>
                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                    <CheckCircle size={18} color={theme.colors.success} weight="fill" style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>Total of {contributors.length} verified donations received through RubiMedik.</Text>
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
