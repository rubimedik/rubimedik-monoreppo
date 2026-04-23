import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { BackButton } from '../components';
import { Clock, Info } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../components/Card';

export const ActivityDetailScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, title, type, time, message } = route.params as any || {};

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: theme.colors.textPrimary },
    content: { padding: 20 },
    detailCard: { padding: 20, marginBottom: 24 },
    typeBadge: { backgroundColor: theme.colors.lightRedTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 12 },
    typeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: theme.colors.primary },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: theme.colors.textPrimary, marginBottom: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    time: { fontSize: 14, color: theme.colors.textSecondary, fontFamily: 'Inter_400Regular' },
    divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 20 },
    messageLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: theme.colors.textMuted, marginBottom: 8, textTransform: 'uppercase' },
    message: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22, fontFamily: 'Inter_400Regular' },
    infoSection: { marginTop: 8 },
    sectionHeader: { fontSize: 16, fontFamily: 'Inter_700Bold', color: theme.colors.textPrimary, marginBottom: 16 },
    infoCard: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center', backgroundColor: theme.colors.surface },
    infoText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 }
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Activity Details</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.detailCard} variant="outlined">
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{type?.toUpperCase() || 'GENERAL'}</Text>
          </View>
          <Text style={styles.title}>{title || 'Activity Log'}</Text>
          <View style={styles.timeRow}>
            <Clock size={16} color={theme.colors.textSecondary} />
            <Text style={styles.time}>{time || 'Recently'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.messageLabel}>Description</Text>
          <Text style={styles.message}>{message || 'No additional details available for this activity.'}</Text>
        </Card>

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>Related Information</Text>
          <Card style={styles.infoCard} variant="flat">
            <Info size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              This activity was automatically logged by the system based on your interactions.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
