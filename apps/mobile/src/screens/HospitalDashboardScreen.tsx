import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { PrimaryButton } from '../components/PrimaryButton';
import { Plus, Drop, UsersThree, FileText, CaretRight, Bell, FirstAidKit, Warning, Calendar as CalendarIcon, CheckCircle, WarningCircle, PenNib, BookOpen, X, User as UserIcon, SealCheck, Sparkle, ChatTeardropDots } from 'phosphor-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

const DATE_FILTERS = ['This week', 'This month', 'This year', 'All time'];

export const HospitalDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [dateFilter, setDateFilter] = useState('This week');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAiAlertCollapsed, setIsAiAlertCollapsed] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['hospital-profile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/hospitals/user/${user?.id}`);
      return res.data;
    },
    refetchInterval: (query) => (query.state.data?.isApproved ? false : 30000),
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['hospital-stats', dateFilter],
    queryFn: async () => {
      const [statsRes, matchesRes] = await Promise.all([
        api.get(`/hospitals/dashboard-stats?filter=${dateFilter}`),
        api.get('/donations/hospital/matches')
      ]);
      
      const statsData = statsRes.data;
      const matches = matchesRes.data || [];
      
      // If backend returns 0 but we have matches, calculate manually
      if (!statsData.donationsReceived || statsData.donationsReceived === 0) {
        const completedMatches = matches.filter((m: any) => 
          ['COMPLETED', 'VERIFIED', 'DONATED'].includes(m.status)
        );
        const receivedUnits = completedMatches.reduce((sum: number, m: any) => sum + (m.units || m.request?.units || 1), 0);
        statsData.donationsReceived = receivedUnits;
        
        // Also calculate reservedUnits manually: floor(total/5) * 2
        statsData.reservedUnits = Math.floor(receivedUnits / 5) * 2;
      }
      
      return statsData;
    },
    enabled: !!profile?.isApproved,
    refetchInterval: 10000, 
  });

  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['hospital-activities'],
    queryFn: async () => {
      const res = await api.get('/hospitals/activities');
      return res.data;
    },
    enabled: !!profile?.isApproved,
    refetchInterval: 10000, 
  });

  const { data: prediction } = useQuery({
    queryKey: ['inventory-prediction'],
    queryFn: async () => {
        const res = await api.get('/hospitals/inventory-prediction?bloodType=O-');
        return res.data;
    },
    enabled: !!profile?.isApproved,
  });

  const { data: pendingReviews } = useQuery({
    queryKey: ['hospital-pending-reviews'],
    queryFn: async () => {
        const res = await api.get('/donations/pending-reviews?role=HOSPITAL');
        return res.data;
    },
    enabled: !!profile?.isApproved,
  });

  const hasPendingReview = pendingReviews && pendingReviews.length > 0;

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
    refetchInterval: 30000,
  });

  const unreadCount = useMemo(() => {
    return notifications?.filter((n: any) => !n.isRead).length || 0;
  }, [notifications]);

  const unitsReceived = stats?.unitsReceived || 0;
  const reservedUnits = stats?.reservedUnits || 0;
  const termsAccepted = stats?.termsAccepted || false;

  const acceptTermsMutation = useMutation({
    mutationFn: () => api.put('/hospitals/accept-terms'),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['hospital-stats'] });
        Alert.alert('Success', 'Terms accepted successfully.');
    }
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchStats(),
      refetchActivities(),
    ]);
    setIsRefreshing(false);
  };

  const navigateToActivity = (title: string, type: string, time: string, message: string) => {
    navigation.navigate('ActivityDetail', { activityId: Math.random().toString(), title, type, time, message });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
    },
    greeting: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    hospitalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    userName: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.primary,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
    notificationBadgeText: {
      color: 'white',
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyBold,
    },
    statsGrid: {
      marginBottom: 32,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 20,
      minHeight: 140,
      justifyContent: 'space-between',
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    filterText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyMedium,
      color: 'white',
    },
    statValue: {
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
      color: 'white',
    },
    statLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    seeAll: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.primary,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityContent: {
      flex: 1,
      marginLeft: 12,
    },
    activityTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    activityTime: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    quickAction: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    quickActionText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    filterOption: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterOptionText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    activeFilterOption: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    section: {
      marginTop: 8,
    }
  }), [theme, isDarkMode]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'BLOOD_REQUEST':
        return { icon: FirstAidKit, color: theme.colors.error, bg: theme.colors.error + '15' };
      case 'INVENTORY_UPDATE':
        return { icon: PenNib, color: '#1976D2', bg: '#1976D215' };
      case 'PROFILE_UPDATE':
        return { icon: UserIcon, color: theme.colors.primary, bg: theme.colors.primary + '15' };
      case 'DONATION_MATCHED':
        return { icon: CheckCircle, color: theme.colors.success, bg: theme.colors.success + '15' };
      default:
        return { icon: FileText, color: theme.colors.textSecondary, bg: theme.colors.surface };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <View style={styles.hospitalHeaderRow}>
               <Text style={styles.userName}>{profile?.hospitalName || user?.email.split('@')[0]}</Text>
               {profile?.isApproved && (
                 <SealCheck size={18} color={theme.colors.success} weight="fill" />
               )}
            </View>
          </View>
          <GHPressable 
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]} 
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Bell color={theme.colors.textSecondary} size={24} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </GHPressable>
        </View>

        {(!termsAccepted && profile?.isApproved) && (
          <Card 
            style={{ marginBottom: 24, backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }} 
            variant="outlined"
          >
            <View style={{ padding: 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <FileText size={24} color={theme.colors.primary} weight="fill" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold, fontSize: 14 }}>Terms & Agreement</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>You must agree to the blood reservation policy (4 per 10 units) to receive blood.</Text>
                </View>
              </View>
              <PrimaryButton 
                label="Accept Terms" 
                size="small" 
                onPress={() => {
                    Alert.alert(
                        'Terms of Service',
                        'By accepting, you agree that for every 10 units of blood received through RubiMedik, 4 units shall be reserved for RubiMedik and managed as platform inventory.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'I Agree', onPress: () => acceptTermsMutation.mutate() }
                        ]
                    );
                }}
                isLoading={acceptTermsMutation.isPending}
              />
            </View>
          </Card>
        )}

        {hasPendingReview && (
          <Card
            style={{ marginBottom: 24, backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }}
            variant="outlined"
            onPress={() => navigation.navigate('HospitalDonationMatches', { initialTab: 'COMPLETED' })}
            >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 4 }}>              <ChatTeardropDots size={24} color={theme.colors.primary} weight="fill" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold, fontSize: 14 }}>Feedback Required</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>You have {pendingReviews.length} pending donor review{pendingReviews.length > 1 ? 's' : ''}. Please complete them to maintain quality.</Text>
              </View>
              <CaretRight size={20} color={theme.colors.textSecondary} />
            </View>
          </Card>
        )}

        {!profile?.isApproved && (
          <Card 
            style={{ marginBottom: 24, backgroundColor: theme.colors.warning + '15', borderColor: theme.colors.warning }} 
            variant="outlined"
            onPress={() => navigation.navigate('HospitalProfileUpdate')}
          >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 4 }}>
              <WarningCircle size={24} color={theme.colors.warning} weight="fill" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold, fontSize: 14 }}>Verification Pending</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>Unlock all features by completing your profile.</Text>
              </View>
              <CaretRight size={20} color={theme.colors.textSecondary} />
            </View>
          </Card>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.primary }]}>
              <View style={styles.statIconContainer}>
                <Drop color="white" size={20} weight="fill" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats?.activeRequests || 0}</Text>
                <Text style={styles.statLabel}>Active Requests</Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.colors.warning }]}>
              <View style={styles.statIconContainer}>
                <Warning color="white" size={20} weight="fill" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats?.urgentRequestsNearby || 0}</Text>
                <Text style={styles.statLabel}>Urgent Nearby</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.success }]}>
              <View style={styles.statHeader}>
                <View style={styles.statIconContainer}>
                  <CalendarIcon color="white" size={20} weight="fill" />
                </View>
                <TouchableOpacity 
                  style={styles.filterBadge}
                  onPress={() => setIsFilterModalVisible(true)}
                >
                  <Text style={styles.filterText}>{dateFilter}</Text>
                  <CaretRight size={10} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
              </View>
              <View>
                <Text style={styles.statValue}>{stats?.donationsReceived || 0}</Text>
                <Text style={styles.statLabel}>Donations Received</Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
              <View style={styles.statIconContainer}>
                <Sparkle color="white" size={20} weight="fill" />
              </View>
              <View>
                <Text style={styles.statValue}>{stats?.reservedUnits || 0}</Text>
                <Text style={styles.statLabel}>Platform Reserve</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Inventory Prediction */}
        {prediction && prediction.daysRemaining < 7 && (
            <Card style={{ marginBottom: 24, backgroundColor: isDarkMode ? '#3E2723' : '#FFF3E0', borderColor: isDarkMode ? '#4E342E' : '#FFE0B2', padding: 0 }} variant="outlined">
                <TouchableOpacity 
                    style={{ flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center' }}
                    onPress={() => setIsAiAlertCollapsed(!isAiAlertCollapsed)}
                >
                    <Sparkle size={24} color="#EF6C00" weight="fill" />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#E65100', fontFamily: theme.typography.fontFamilyBold, fontSize: 14 }}>AI Inventory Alert</Text>
                        {!isAiAlertCollapsed && (
                            <Text style={{ color: isDarkMode ? 'white' : '#4E342E', fontSize: 12, marginTop: 4, fontFamily: theme.typography.fontFamily }}>Click to expand details</Text>
                        )}
                    </View>
                    <CaretRight size={20} color="#EF6C00" style={{ transform: [{ rotate: isAiAlertCollapsed ? '90deg' : '0deg' }] }} />
                </TouchableOpacity>

                {isAiAlertCollapsed && (
                    <View style={{ padding: 16, paddingTop: 0 }}>
                        <Text style={{ color: isDarkMode ? 'white' : '#4E342E', fontSize: 13, lineHeight: 20, fontFamily: theme.typography.fontFamily }}>{prediction.alertMessage}</Text>
                        <TouchableOpacity 
                            style={{ marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#EF6C00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                            onPress={() => navigation.navigate('BloodRequestForm', { bloodType: 'O-', urgency: 'CRITICAL' })}
                        >
                            <Text style={{ color: 'white', fontSize: 13, fontFamily: theme.typography.fontFamilyBold }}>Send Urgent Request</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity 
                style={[styles.quickAction, hasPendingReview && pendingReviews.length >= 3 && { opacity: 0.5 }]} 
                onPress={() => {
                    if (hasPendingReview && pendingReviews.length >= 3) {
                        Alert.alert('Action Required', 'Please complete your pending donor reviews before submitting new blood requests.');
                    } else {
                        navigation.navigate('BloodRequestForm');
                    }
                }}
            >
              <Plus size={24} color={theme.colors.primary} weight="bold" />
              <Text style={styles.quickActionText}>Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('FulfilledRequests')}>
              <CheckCircle size={24} color={theme.colors.success} weight="bold" />
              <Text style={styles.quickActionText}>Fulfilled</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Inventory')}>
              <Drop size={24} color={theme.colors.error} weight="bold" />
              <Text style={styles.quickActionText}>Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activities?.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('RecentActivities', { type: 'hospital' })}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {activitiesLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : activities?.length > 0 ? (
            activities.slice(0, 5).map((activity: any) => {
              const themeInfo = getActivityIcon(activity.type);
              const Icon = themeInfo.icon;
              return (
                <TouchableOpacity 
                  key={activity.id} 
                  onPress={() => navigateToActivity(activity.title, activity.type, new Date(activity.createdAt || activity.date).toLocaleString(), activity.description)}
                  style={styles.activityItem}
                >
                  <View style={[styles.activityIcon, { backgroundColor: themeInfo.bg }]}>
                    <Icon size={20} color={themeInfo.color} weight="fill" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{new Date(activity.createdAt || activity.date).toLocaleString()}</Text>
                  </View>
                  <CaretRight size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No recent activity logged.</Text>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Time</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <X size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {DATE_FILTERS.map(filter => (
              <TouchableOpacity 
                key={filter}
                style={styles.filterOption}
                onPress={() => {
                  setDateFilter(filter);
                  setIsFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  dateFilter === filter && styles.activeFilterOption
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
