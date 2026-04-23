import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BackButton } from '../components';
import { Drop, MapPin, Clock } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

export const BloodRequestPickerScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['hospital-requests-active'],
    queryFn: async () => {
      const res = await api.get('/donations/requests');
      // Filter for current hospital's PENDING requests
      return res.data.filter((r: any) => r.status === 'PENDING');
    },
  });

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    listContent: { padding: 24 },
    requestCard: { padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bloodType: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.error },
    unitsText: { fontSize: 14, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyMedium },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
    dateText: { fontSize: 12, color: theme.colors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: 100, color: theme.colors.textSecondary }
  }), [theme]);

  const handleSelect = (request: any) => {
    navigation.navigate('RecordDonation', { requestId: request.id, bloodType: request.bloodType });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Select Active Request</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <Card style={styles.requestCard} variant="outlined" onPress={() => handleSelect(item)}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }} numberOfLines={1}>
                    {item.title || 'Blood Request'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Drop size={16} color={theme.colors.error} weight="fill" />
                    <Text style={styles.bloodType}>{item.bloodType}</Text>
                  </View>
                </View>
                <Badge label={item.urgency} variant={item.urgency === 'URGENT' || item.urgency === 'CRITICAL' ? 'error' : 'info'} />
              </View>
              <Text style={styles.unitsText}>{item.units - item.unitsFulfilled} units remaining of {item.units} requested</Text>
              <View style={styles.cardFooter}>
                 <Text style={styles.dateText}>Created {safeFormat(item.createdAt, 'PPP')}</Text>
                 <Text style={{ fontSize: 12, color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold }}>Select</Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No active blood requests found.</Text>}
        />
      )}
    </SafeAreaView>
  );
};
