import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { 
  ChatCircleText, 
  CaretRight, 
  Clock, 
  CheckCircle, 
  WarningCircle, 
  Plus,
  ArrowLeft
} from 'phosphor-react-native';
import { safeFormat } from '../utils/dateUtils';
import { Card, Badge, BackButton } from '../components';
import { SupportTicketStatus } from '@repo/shared';

export const SupportTicketListScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['my-support-tickets'],
    queryFn: async () => {
      const res = await api.get('/support/my-tickets');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case SupportTicketStatus.RESOLVED:
      case SupportTicketStatus.CLOSED:
        return theme.colors.success;
      case SupportTicketStatus.ESCALATED:
        return theme.colors.error;
      case SupportTicketStatus.AI_TRIAGE:
        return theme.colors.primary;
      default:
        return theme.colors.warning;
    }
  };

  const renderTicket = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Chat', { 
        roomId: item.chatRoom?.id || item.id, 
        otherUserName: 'Support Chat',
        isSupport: true,
        ticketStatus: item.status
      })}
    >
      <Card style={styles.ticketCard} variant="outlined">
        <View style={styles.ticketHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
            <Text style={styles.ticketCategory}>{item.category.replace('_', ' ')}</Text>
          </View>
          <Badge 
            label={item.status} 
            variant={
                item.status === SupportTicketStatus.RESOLVED ? 'success' : 
                item.status === SupportTicketStatus.ESCALATED ? 'error' : 
                'info'
            } 
          />
        </View>

        <View style={styles.ticketFooter}>
          <View style={styles.dateRow}>
            <Clock size={14} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>{safeFormat(item.createdAt, 'MMM dd, yyyy')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.viewText}>Open Chat</Text>
            <CaretRight size={14} color={theme.colors.primary} weight="bold" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingHorizontal: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    listContent: {
      padding: 24,
      paddingBottom: 100,
      gap: 16,
    },
    ticketCard: {
      padding: 16,
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    ticketSubject: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    ticketCategory: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    ticketFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
      marginTop: 4,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    viewText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
    },
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 30,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BackButton />
            <Text style={styles.headerTitle}>Support Tickets</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ChatCircleText size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyTitle}>No support tickets</Text>
              <Text style={styles.emptyDesc}>Have an issue? Create a support ticket and our team will help you out.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CreateSupportTicket')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" weight="bold" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
