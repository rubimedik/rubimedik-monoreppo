import React, { useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  ImageBackground,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
    Bell, 
    VideoCamera, 
    CheckCircle, 
    WarningCircle, 
    Clock, 
    Calendar as CalendarIcon,
    SealCheck, 
    CaretRight, 
    ChatTeardropDots,
    XCircle,
    Users,
    Wallet,
    CalendarPlus,
    Hourglass,
    Sparkle,
    Lightbulb,
    CaretDown,
    CaretUp
} from 'phosphor-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { SpecialistStackParamList } from '../navigation/SpecialistNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, isTomorrow, isToday, isValid } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

type NavigationProp = NativeStackNavigationProp<SpecialistStackParamList, 'MainTabs'>;

const { width } = Dimensions.get('window');

export const SpecialistDashboardScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  const styles = useMemo(() => {
    if (!theme) return null;
    return StyleSheet.create({
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
            marginBottom: 24,
        },
        greeting: {
            fontSize: 20,
            fontFamily: theme.typography.fontFamilyBold,
            color: theme.colors.textPrimary,
        },
        subGreeting: {
            fontSize: 13,
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        bellBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
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
        statCard: {
            padding: 16,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            gap: 8,
        },
        statIconWrap: {
            width: 32,
            height: 32,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        statValue: {
            fontSize: 18,
            fontFamily: theme.typography.fontFamilyBold,
            color: theme.colors.textPrimary,
        },
        statLabel: {
            fontSize: 10,
            fontFamily: theme.typography.fontFamilyBold,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        section: {
            marginBottom: 32,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontFamily: theme.typography.fontFamilyBold,
            color: theme.colors.textPrimary,
        },
        viewAll: {
            fontSize: 14,
            fontFamily: theme.typography.fontFamilyMedium,
            color: theme.colors.primary,
        },
        // HIGH FIDELITY RED HERO CARD
        heroCard: {
            backgroundColor: '#C62828',
            borderRadius: 24,
            padding: 24,
            paddingBottom: 20,
        },
        heroHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        heroAvatarRow: {
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 12
        },
        heroName: {
            fontSize: 18,
            fontFamily: theme.typography.fontFamilyBold,
            color: 'white',
        },
        heroSubtitle: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 2,
        },
        heroCamIcon: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        heroDivider: {
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginBottom: 20,
        },
        heroGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 24,
        },
        heroLabel: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        heroValue: {
            fontSize: 15,
            fontFamily: theme.typography.fontFamilySemiBold,
            color: 'white',
        },
        heroActions: {
            flexDirection: 'row',
            gap: 12,
        },
        heroBtnWhite: {
            flex: 1,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
        },
        heroBtnDark: {
            flex: 1,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        heroBtnTextRed: {
            fontSize: 14,
            fontFamily: theme.typography.fontFamilyBold,
            color: '#C62828',
        },
        heroBtnTextWhite: {
            fontSize: 14,
            fontFamily: theme.typography.fontFamilyBold,
            color: 'white',
        },
        // REQUEST & UPCOMING CARDS
        reqCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        reqRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        reqInfo: {
            flex: 1,
            marginLeft: 12,
        },
        reqName: {
            fontSize: 16,
            fontFamily: theme.typography.fontFamilyBold,
            color: theme.colors.textPrimary,
        },
        reqMetaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 12,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        metaText: {
            fontSize: 12,
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.textSecondary,
        },
        reqActions: {
            flexDirection: 'row', gap: 12,
        },
        confirmBtn: {
            flex: 1, height: 44, borderRadius: 12, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center',
        },
        reschedBtn: {
            flex: 1, height: 44, borderRadius: 12, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center',
        },
        upcCancelBtn: {
            flex: 1, height: 44, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center',
        },
        upcCancelText: {
            color: '#C62828', fontSize: 13, fontFamily: theme.typography.fontFamilyBold,
        },
        upcReschedBtn: {
            flex: 1, height: 44, borderRadius: 12, backgroundColor: '#C62828', justifyContent: 'center', alignItems: 'center',
        },
        activityItem: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
        },
        activityIcon: {
            width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        },
        activityText: {
            fontSize: 14, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textPrimary,
        },
        activityTime: {
            fontSize: 11, color: theme.colors.textSecondary, marginTop: 2,
        }
    });
  }, [theme]);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['specialist-profile', user?.id],
    queryFn: async () => {
      const res = await api.get('/specialists/user/' + user?.id);
      return res.data;
    }
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['specialist-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/specialists/dashboard-stats');
      return res.data;
    },
    enabled: !!profile?.id,
  });

  const { data: appointments, refetch: refetchAppts } = useQuery({
    queryKey: ['specialist-appointments'],
    queryFn: async () => {
      const res = await api.get('/consultations/my');
      return res.data;
    },
    enabled: !!profile?.id,
  });

  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['specialist-activities'],
    queryFn: async () => {
      const res = await api.get('/specialists/activities');
      return res.data;
    },
    enabled: !!profile?.id,
  });

  const { nextAppt, requests, upcoming } = useMemo(() => {
    if (!appointments) return { nextAppt: null, requests: [], upcoming: [] };
    const all = appointments as any[];
    
    // Sort all by scheduledAt to ensure "Next" is actually next
    const sorted = [...all].sort((a, b) => {
        const dateA = new Date(a.scheduledAt || a.createdAt).getTime();
        const dateB = new Date(b.scheduledAt || b.createdAt).getTime();
        return dateA - dateB;
    });

    const reqs = sorted.filter(a => a.status === 'UPCOMING');
    const upcs = sorted.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING_PAYOUT');
    const next = upcs[0] || null;
    return { nextAppt: next, requests: reqs.slice(0, 2), upcoming: upcs.slice(0, 3) };
  }, [appointments]);

  const { data: healthTips } = useQuery({
    queryKey: ['specialist-health-tips'],
    queryFn: async () => {
      const res = await api.post('/ai/health-tips', { 
          profileData: { 
              specialty: profile?.specialty,
              role: 'SPECIALIST'
          } 
      });
      return res.data?.tips || [];
    },
    enabled: !!profile?.id
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
    refetchInterval: 30000,
  });

  const unreadCount = useMemo(() => {
    return notifications?.filter((n: any) => !n.isRead).length || 0;
  }, [notifications]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchStats(),
      refetchAppts(),
      refetchActivities(),
      queryClient.invalidateQueries({ queryKey: ['specialist-health-tips'] })
    ]);
    setIsRefreshing(false);
  }, [refetchProfile, refetchStats, refetchAppts, refetchActivities, queryClient]);

  const confirmMutation = useMutation({
      mutationFn: (id: string) => api.put(`/consultations/${id}/confirm`),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['specialist-appointments'] });
          Alert.alert('Success', 'Appointment confirmed successfully.');
      }
  });

  const cancelMutation = useMutation({
      mutationFn: (id: string) => api.put(`/consultations/${id}/cancel`),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['specialist-appointments'] });
          Alert.alert('Cancelled', 'Appointment has been cancelled.');
      }
  });

  const getIdentityName = (person: any) => {
      if (person?.fullName) return person.fullName;
      if (person?.email) return person.email.split('@')[0];
      return 'User';
  };

  const getAvatarName = (person: any) => {
      return person?.fullName || person?.email || 'User';
  };

  const formatRelativeDay = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (!isValid(date)) return 'N/A';
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return safeFormat(date, 'EEEE, MMM do');
  };

  if (!styles || !theme) return <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#C62828" /></View>;

  const displayName = profile?.user?.fullName || user?.fullName || user?.email?.split('@')[0] || 'Specialist';
  const avatarName = profile?.user?.fullName || user?.fullName || user?.email || 'Specialist';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={avatarName} size={48} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.greeting}>Hello, {profile?.user?.fullName ? `Dr ${profile.user.fullName.split(' ')[1] || profile.user.fullName}` : displayName}</Text>
                    <Text style={styles.subGreeting}>Your schedule at a glance.</Text>
                </View>
            </View>
            <GHPressable 
                style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]} 
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

        {/* Stats Section */}
        <View style={{ gap: 12, marginBottom: 32 }}>
            <View style={[styles.statCard, { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, height: 80, backgroundColor: '#FFAB0010', borderColor: '#FFAB0020' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#FFAB0020', width: 44, height: 44, borderRadius: 12 }]}><Wallet size={24} color="#FFAB00" weight="fill" /></View>
                    <View><Text style={styles.statLabel}>Total Earnings</Text><Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>Platform Revenue</Text></View>
                </View>
                <Text style={[styles.statValue, { color: '#E65100', fontSize: 22 }]}>₦{Number(stats?.totalEarnings || 0).toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.statCard, { flex: 1, backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '20' }]}><View style={[styles.statIconWrap, { backgroundColor: theme.colors.primary + '20' }]}><CalendarIcon size={18} color={theme.colors.primary} weight="fill" /></View><Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats?.upcomingAppointments || 0}</Text><Text style={styles.statLabel}>Upcoming</Text></View>
                <View style={[styles.statCard, { flex: 1, backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '20' }]}><View style={[styles.statIconWrap, { backgroundColor: theme.colors.success + '20' }]}><Users size={18} color={theme.colors.success} weight="fill" /></View><Text style={[styles.statValue, { color: theme.colors.success }]}>{stats?.totalConsultations || 0}</Text><Text style={styles.statLabel}>Completed</Text></View>
            </View>
        </View>

        {/* AI Health Tips */}
        {healthTips && healthTips.length > 0 && (
            <View style={styles.section}>
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isTipsExpanded ? 16 : 0 }}
                    onPress={() => setIsTipsExpanded(!isTipsExpanded)}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Sparkle size={20} color={theme.colors.primary} weight="fill" />
                        <Text style={styles.sectionTitle}>AI Practice Pulse</Text>
                    </View>
                    {isTipsExpanded ? <CaretUp size={20} color={theme.colors.textSecondary} /> : <CaretDown size={20} color={theme.colors.textSecondary} />}
                </TouchableOpacity>

                {isTipsExpanded ? (
                    <Card style={{ backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB', padding: 16, borderRadius: 20 }}>
                        {healthTips.map((tip: string, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 12, marginBottom: idx === healthTips.length - 1 ? 0 : 12 }}>
                                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                                    <Lightbulb size={16} color={theme.colors.primary} weight="bold" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 13, color: theme.colors.textPrimary, lineHeight: 18, fontFamily: theme.typography.fontFamilyMedium }}>{tip}</Text>
                            </View>
                        ))}
                    </Card>
                ) : (
                    <Card style={{ backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB', padding: 12, borderRadius: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                                <Lightbulb size={14} color={theme.colors.primary} weight="bold" />
                            </View>
                            <Text style={{ flex: 1, fontSize: 13, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyMedium }} numberOfLines={3}>{healthTips[0]}</Text>
                            {healthTips.length > 1 && (
                                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                                    +{healthTips.length - 1} more
                                </Text>
                            )}
                        </View>
                    </Card>
                )}
            </View>
        )}

        {/* Next Appointment Section */}
        {nextAppt && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Next Appointment</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.heroCard} onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppt.id })}>
                <View style={styles.heroHeader}>
                    <View style={styles.heroAvatarRow}>
                        <Avatar name={getAvatarName(nextAppt.patient)} size={48} border />
                        <View>
                            <Text style={styles.heroName}>{getIdentityName(nextAppt.patient)}</Text>
                            <Text style={styles.heroSubtitle}>{nextAppt.consultationType || 'Video Call'}</Text>
                        </View>
                    </View>
                    <View style={styles.heroCamIcon}>
                        <VideoCamera size={22} color="white" weight="fill" />
                    </View>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroGrid}>
                    <View>
                        <Text style={styles.heroLabel}>{nextAppt.status === 'PENDING_PAYOUT' ? 'Payout Schedule' : 'Date'}</Text>
                        {nextAppt.status === 'PENDING_PAYOUT' && nextAppt.payoutReleasesAt ? (
                            <CountdownTimer 
                                targetDate={nextAppt.payoutReleasesAt} 
                                prefix="" 
                                textStyle={{ color: 'white', fontSize: 15 }} 
                            />
                        ) : (
                            <Text style={styles.heroValue}>{safeFormat(nextAppt.scheduledAt || nextAppt.createdAt, 'EEEE MMM do')}</Text>
                        )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.heroLabel}>{nextAppt.status === 'PENDING_PAYOUT' ? 'Estimated Amount' : 'Time'}</Text>
                        <Text style={styles.heroValue}>
                            {nextAppt.status === 'PENDING_PAYOUT' 
                                ? `₦${Number(nextAppt.specialistPayout || 0).toLocaleString()}`
                                : `${safeFormat(nextAppt.scheduledAt || nextAppt.createdAt, 'hh:mm aa')} - ${safeFormat(new Date(new Date(nextAppt.scheduledAt || nextAppt.createdAt).getTime() + (nextAppt.duration || 30) * 60000), 'hh:mm aa')}`
                            }
                        </Text>
                    </View>
                </View>

                <View style={styles.heroActions}>
                    <TouchableOpacity style={styles.heroBtnWhite} onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppt.id })}>
                        <Text style={styles.heroBtnTextRed}>Re-Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.heroBtnDark} onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppt.id })}>
                        <Text style={styles.heroBtnTextWhite}>View Profile</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Appointment Requests Section */}
        {requests.length > 0 && (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Appointment Requests</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Appointments')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
                </View>
                {requests.map((item) => (
                    <View key={item.id} style={styles.reqCard}>
                        <View style={styles.reqRow}>
                            <Avatar name={getAvatarName(item.patient)} size={56} />
                            <View style={styles.reqInfo}>
                                <Text style={styles.reqName}>{getIdentityName(item.patient)}</Text>
                                <View style={styles.reqMetaRow}>
                                    <View style={styles.metaItem}><VideoCamera size={14} color={theme.colors.textSecondary} weight="fill" /><Text style={styles.metaText}>{item.consultationType || 'Video Call'}</Text></View>
                                    <View style={styles.metaItem}><Clock size={14} color={theme.colors.textSecondary} weight="fill" /><Text style={styles.metaText}>{formatRelativeDay(item.scheduledAt || item.createdAt)}, {safeFormat(item.scheduledAt || item.createdAt, 'h:mm aa')}</Text></View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.reqActions}>
                            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmMutation.mutate(item.id)}><Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.reschedBtn} onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}><Text style={{ color: '#C62828', fontWeight: 'bold' }}>Re-schedule</Text></TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        )}

        {/* Upcoming Appointments Section */}
        {upcoming.length > 0 && (
            <View style={styles.section}>
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Upcoming Appointments</Text><TouchableOpacity onPress={() => navigation.navigate('Appointments')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>
                {upcoming.map((item) => (
                    <View key={item.id} style={styles.reqCard}>
                        <View style={styles.reqRow}>
                            <Avatar name={getAvatarName(item.patient)} size={56} />
                            <View style={styles.reqInfo}><Text style={styles.reqName}>{getIdentityName(item.patient)}</Text><View style={styles.reqMetaRow}><View style={styles.metaItem}><VideoCamera size={14} color={theme.colors.textSecondary} weight="fill" /><Text style={styles.metaText}>{item.consultationType || 'Video Call'}</Text></View><View style={styles.metaItem}><Clock size={14} color={theme.colors.textSecondary} weight="fill" /><Text style={styles.metaText}>{formatRelativeDay(item.scheduledAt || item.createdAt)}, {safeFormat(item.scheduledAt || item.createdAt, 'h:mm aa')}</Text></View></View></View>
                        </View>
                        <View style={styles.reqActions}>
                            <TouchableOpacity style={styles.upcReschedBtn} onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}><Text style={{ color: 'white', fontWeight: 'bold' }}>Re-Schedule</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.upcCancelBtn} onPress={() => Alert.alert('Cancel Appointment', 'Are you sure?', [{ text: 'No' }, { text: 'Yes', onPress: () => cancelMutation.mutate(item.id) }])}><Text style={styles.upcCancelText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        )}

        {/* Recent Activity Section */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activities</Text>
                {activities?.length > 5 && (
                    <TouchableOpacity onPress={() => navigation.navigate('RecentActivities', { type: 'specialist' })}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
                )}
            </View>
            {activitiesLoading ? <ActivityIndicator color={theme.colors.primary} /> : activities?.slice(0, 5).map((act: any) => (
                <TouchableOpacity key={act.id} style={styles.activityItem} onPress={() => navigation.navigate('ActivityDetail', { activityId: act.id, title: act.title, type: act.type, time: safeFormat(act.date || act.createdAt, 'p, MMM do'), message: act.description })}>
                    <View style={[styles.activityIcon, { backgroundColor: act.type.includes('COMPLETED') ? '#E8F5E9' : act.type.includes('CANCELLED') ? '#FFEBEE' : '#FFF3E0' }]}>{act.type.includes('COMPLETED') ? <CheckCircle size={20} color="#2E7D32" weight="fill" /> : act.type.includes('CANCELLED') ? <XCircle size={20} color="#C62828" weight="fill" /> : <WarningCircle size={20} color="#EF6C00" weight="fill" />}</View>
                    <View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.activityText}>{act.title}</Text><Text style={styles.activityTime}>{safeFormat(act.date || act.createdAt, 'p, MMM do')}</Text></View>
                    <CaretRight size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};
