import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Switch,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, Bell, Calendar as CalendarIcon, Drop, ShieldCheck, CheckCircle, Clock, Trash } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, BackButton } from '../components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';
import { api } from '../services/api';

export const NotificationsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getMyNotifications(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Alert.alert('Success', 'All notifications cleared');
    },
  });


  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    markReadText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    listContent: {
      padding: theme.spacing.xl,
    },
    notiCard: {
      flexDirection: 'row',
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
    },
    unreadCard: {
      borderColor: theme.colors.primary,
      backgroundColor: isDarkMode ? theme.colors.primary + '10' : theme.colors.primary + '05',
    },
    iconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notiHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    notiTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    notiTime: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    notiMessage: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      lineHeight: 18,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
      fontFamily: theme.typography.fontFamily,
    },
    deleteAction: {
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      height: '80%',
      marginTop: 6,
      borderRadius: 16,
      marginRight: 16,
    }
  }), [theme, isDarkMode]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <CalendarIcon color={theme.colors.primary} size={24} weight="fill" />;
      case 'donation': return <Drop color={theme.colors.error} size={24} weight="fill" />;
      case 'security': return <ShieldCheck color={theme.colors.success} size={24} weight="fill" />;
      default: return <Bell color={theme.colors.primary} size={24} weight="fill" />;
    }
  };

  const renderRightActions = (id: string) => {
    return (
      <GHPressable 
        style={({ pressed }) => [styles.deleteAction, pressed && { opacity: 0.8 }]} 
        onPress={() => deleteOneMutation.mutate(id)}
        hitSlop={15}
      >
        <Trash size={24} color="white" weight="bold" />
      </GHPressable>
    );
  };

  const renderNotification = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)} friction={2}>
        <Pressable 
        onPress={() => {
            if (!item.isRead) markReadMutation.mutate(item.id);
            // Optional: navigate based on item.type or metadata
        }}
        >
        <Card style={StyleSheet.flatten([styles.notiCard, !item.isRead && styles.unreadCard])} variant="outlined">
            <View style={styles.iconWrapper}>
            {getIcon(item.type?.toLowerCase())}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.notiHeader}>
                <Text style={styles.notiTitle}>{item.title}</Text>
                <Text style={styles.notiTime}>
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
                </Text>
            </View>
            <Text style={styles.notiMessage}>{item.message}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </Card>
        </Pressable>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <GHPressable 
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || notifications?.length === 0}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            hitSlop={15}
          >
            <Text style={[styles.markReadText, notifications?.length === 0 && { opacity: 0.5 }]}>Read All</Text>
          </GHPressable>
          <GHPressable 
            onPress={() => {
              Alert.alert('Clear All', 'Delete all notifications?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => clearAllMutation.mutate() }
              ]);
            }}
            disabled={clearAllMutation.isPending || notifications?.length === 0}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            hitSlop={15}
          >
            <Trash size={20} color={theme.colors.error} />
          </GHPressable>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
                refreshing={isLoading} 
                onRefresh={refetch} 
                tintColor={theme.colors.primary} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Bell size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};
