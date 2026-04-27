import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { FloatingSupport } from '../components/FloatingSupport';
import { 
    Bell, 
    Calendar as CalendarIcon, 
    Stethoscope, 
    ClockCounterClockwise, 
    ArrowRight, 
    VideoCamera, 
    ChatTeardropDots, 
    XCircle, 
    CalendarPlus,
    Sparkle,
    Lightbulb,
    Users,
    Drop,
    Robot,
    CaretDown,
    CaretUp
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    }
  });

  const { data: specialists, isLoading: isSpecialistsLoading } = useQuery({
    queryKey: ['specialists'],
    queryFn: async () => {
      const res = await api.get('/specialists');
      return res.data;
    }
  });

  const { data: appointments, isLoading: isApptsLoading } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: async () => {
      const res = await api.get('/consultations/appointments');
      return res.data;
    }
  });

  const { data: healthTips } = useQuery({
    queryKey: ['health-tips'],
    queryFn: async () => {
      const res = await api.post('/ai/health-tips', { 
          profileData: { 
              bloodGroup: user?.bloodGroup, 
              genotype: user?.genotype,
              role: 'PATIENT'
          } 
      });
      return res.data?.tips || [];
    },
    enabled: !!user?.id
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
    setRefreshing(true);
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['specialists'] }),
        queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['health-tips'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ]);
    setRefreshing(false);
  }, [queryClient]);

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
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    subGreeting: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginTop: 2,
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
    bannerContainer: {

      backgroundColor: theme.colors.success + '15', 
      borderRadius: 20,
      padding: 24,
      flexDirection: 'row',
      marginBottom: 32,
      overflow: 'hidden',
    },
    bannerContent: {
      flex: 1,
      zIndex: 2,
    },
    bannerTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
      lineHeight: 28,
    },
    bannerSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    bannerBtn: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    bannerBtnText: {
      color: 'white',
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 13,
    },
    bannerImagePlaceholder: {
      position: 'absolute',
      right: -20,
      bottom: -10,
      alignItems: 'center',
    },
    robotHead: {
      width: 80,
      height: 50,
      backgroundColor: theme.colors.success + '40',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    robotEye: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.textPrimary,
      marginTop: 10,
    },
    robotBody: {
      width: 70,
      height: 70,
      backgroundColor: theme.colors.success,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionsGrid: {
      gap: 12,
      marginBottom: 32,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    actionIconBg: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    actionDesc: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    seeAll: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    horizontalList: {
      gap: 16,
      paddingRight: 20,
    },
    recentSpecialist: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    recentName: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    recentSpecialty: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.success,
      marginTop: 2,
    },
    recentRating: {
      fontSize: 12,
      marginTop: 4,
      color: theme.colors.textPrimary,
    },
    nextAppointmentCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    appointmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    apptSpecialistName: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    apptSpecialty: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    apptDetailsGrid: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    apptDetailItem: {
      flex: 1,
    },
    apptDetailLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    apptDetailValue: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    apptDetailDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 12,
    },
    cancelApptBtn: {
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    cancelApptText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 13,
    },
    nearbyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    nearbyCard: {
      width: '48%',
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    nearbyName: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    nearbySpecialty: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.success,
      textAlign: 'center',
      marginBottom: 16,
    },
    nearbyRating: {
      color: theme.colors.warning,
    },
    nearbyFooter: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    nearbyHoursLabel: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textMuted,
    },
    nearbyHoursValue: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    nearbyArrowBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    }
  }), [theme]);

  const userName = profile?.fullName?.split(' ')[0] || user?.email.split('@')[0] || 'User';
  // Use consultation.status as the source of truth to ensure consistency
  const nextAppt = appointments?.filter((a: any) => 
    ['UPCOMING', 'CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(a.consultation?.status || a.status)
  )?.[0];

  if (!styles || !styles.container) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.7}
            >
                <Avatar uri={profile?.avatarUrl} name={profile?.fullName || user?.email} size={48} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.greeting}>Hello, {userName}</Text>
                    <Text style={styles.subGreeting}>How are you feeling today?</Text>
                </View>
            </TouchableOpacity>
            <GHPressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]} onPress={() => navigation.navigate('Notifications')} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}><Bell color={theme.colors.textSecondary} size={24} />{unreadCount > 0 && (<View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>)}</GHPressable>
        </View>

        {/* Health Banner */}
        <View style={styles.bannerContainer}><View style={styles.bannerContent}><Text style={styles.bannerTitle}>Your Health{'\n'}Matters</Text><Text style={styles.bannerSubtitle}>Get quick access to licensed{'\n'}specialists—anytime you{'\n'}need care.</Text><TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('SearchSpecialists')}><Text style={styles.bannerBtnText}>Get Medical Help</Text></TouchableOpacity></View><View style={styles.bannerImagePlaceholder}><View style={styles.robotHead}><View style={styles.robotEye} /><View style={styles.robotEye} /></View><View style={styles.robotBody}><Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>+</Text></View></View></View>

        {/* AI Health Tips */}
        {!!healthTips && healthTips.length > 0 && (
            <View style={{ marginBottom: 32 }}><TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }} onPress={() => setIsTipsExpanded(!isTipsExpanded)} activeOpacity={0.7}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Sparkle size={20} color={theme.colors.primary} weight="fill" /><Text style={styles.sectionTitle}>AI Health Pulse</Text></View>{isTipsExpanded ? <CaretUp size={20} color={theme.colors.textSecondary} /> : <CaretDown size={20} color={theme.colors.textSecondary} />}</TouchableOpacity><Card style={{ backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB', padding: 12, borderRadius: 16 }}>{(isTipsExpanded ? healthTips : [healthTips[0]]).map((tip: string, idx: number, arr: any[]) => (<View key={idx} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: (isTipsExpanded && idx !== arr.length - 1) ? 12 : 0 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' }}><Lightbulb size={14} color={theme.colors.primary} weight="bold" /></View><Text style={{ flex: 1, fontSize: 13, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyMedium }} numberOfLines={isTipsExpanded ? undefined : 3}>{tip}</Text>{!isTipsExpanded && healthTips.length > 1 && (<Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontStyle: 'italic' }}> +{healthTips.length - 1} more</Text>)}</View>))}</Card></View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}><View style={styles.quickActionsRow}><Card style={styles.quickActionCard} variant="outlined" onPress={() => navigation.navigate('SymptomChecker')}><View style={[styles.actionIconBg, { backgroundColor: theme.colors.primary + '15' }]}><Sparkle color={theme.colors.primary} size={24} weight="fill" /></View><Text style={styles.actionTitle}>Symptom Checker</Text><Text style={styles.actionDesc}>AI-powered triage and tips</Text></Card><Card style={styles.quickActionCard} variant="outlined" onPress={() => navigation.navigate('AiAssistant')}><View style={[styles.actionIconBg, { backgroundColor: theme.colors.success + '15' }]}><Robot color={theme.colors.success} size={24} weight="fill" /></View><Text style={styles.actionTitle}>AI Assistant</Text><Text style={styles.actionDesc}>Ask anything about your health</Text></Card></View></View>

        {/* Recently Viewed */}
        <View style={styles.section}><Text style={styles.sectionTitle}>Featured Specialists</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>{isSpecialistsLoading ? (<ActivityIndicator color={theme.colors.primary} />) : specialists?.slice(0, 5).map((spec: any, idx: number) => { const specName = spec.user?.fullName || spec.user?.email || 'Specialist'; return (<TouchableOpacity key={spec.id} style={styles.recentSpecialist} onPress={() => navigation.navigate('SpecialistProfile', { specialistId: spec.id })}><Avatar name={specName} size={56} /><View style={{ marginLeft: 12 }}><Text style={styles.recentName}>{spec.user?.fullName || spec.user?.email?.split('@')[0] || 'Dr. Specialist'}</Text><Text style={styles.recentSpecialty}>{spec.specialty}</Text><Text style={styles.recentRating}>⭐ {spec.rating?.toFixed(1) || '0.0'}</Text></View></TouchableOpacity>); })}</ScrollView></View>

        {/* Your next Appointment */}
        {!!nextAppt && (
          <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your next Appointment</Text><TouchableOpacity onPress={() => navigation.navigate('Appointments')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity></View>{isApptsLoading ? (<ActivityIndicator color={theme.colors.primary} />) : (<Card style={styles.nextAppointmentCard} variant="outlined" onPress={() => navigation.navigate('ConsultationDetail', { consultationId: nextAppt.consultation?.id })}><View style={styles.appointmentHeader}><Avatar name={nextAppt.consultation?.specialist?.fullName || nextAppt.consultation?.specialist?.user?.fullName || nextAppt.consultation?.specialist?.user?.email} size={48} /><View style={{ marginLeft: 12, flex: 1 }}><Text style={styles.apptSpecialistName}>{nextAppt.consultation?.specialist?.fullName || nextAppt.consultation?.specialist?.user?.fullName || nextAppt.consultation?.specialist?.email?.split('@')[0] || 'Dr. Specialist'}</Text><Text style={styles.apptSpecialty}>{nextAppt.consultation?.specialist?.specialistProfile?.specialty || nextAppt.consultation?.specialist?.specialty || 'General Practitioner'}</Text></View><TouchableOpacity onPress={() => navigation.navigate('Chat', { roomId: nextAppt.consultation?.id, otherUserName: nextAppt.consultation?.specialist?.fullName || nextAppt.consultation?.specialist?.user?.fullName })} style={{ padding: 10, backgroundColor: theme.colors.primary + '15', borderRadius: 12 }}><ChatTeardropDots size={24} color={theme.colors.primary} weight="fill" /></TouchableOpacity></View><View style={styles.apptDetailsGrid}><View style={styles.apptDetailItem}><Text style={styles.apptDetailLabel}>Type</Text><Text style={styles.apptDetailValue}><VideoCamera size={12} /> {nextAppt.consultation?.consultationType || 'Online'}</Text></View><View style={styles.apptDetailDivider} /><View style={styles.apptDetailItem}><Text style={styles.apptDetailLabel}>Date</Text><Text style={styles.apptDetailValue}>{safeFormat(nextAppt.scheduledAt, 'MMM do')}</Text></View><View style={styles.apptDetailDivider} /><View style={styles.apptDetailItem}><Text style={styles.apptDetailLabel}>Time</Text><Text style={styles.apptDetailValue}>{safeFormat(nextAppt.scheduledAt, 'p')}</Text></View></View><View style={{ flexDirection: 'row', gap: 12 }}><TouchableOpacity style={[styles.cancelApptBtn, { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '20', borderWidth: 1 }]} onPress={() => navigation.navigate('ConsultationDetail', { consultationId: nextAppt.consultation?.id })}><XCircle size={18} color={theme.colors.error} weight="bold" /><Text style={[styles.cancelApptText, { color: theme.colors.error }]}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.cancelApptBtn, { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '20', borderWidth: 1 }]} onPress={() => navigation.navigate('ConsultationDetail', { consultationId: nextAppt.consultation?.id })}><CalendarPlus size={18} color={theme.colors.primary} weight="bold" /><Text style={[styles.cancelApptText, { color: theme.colors.primary }]}>Reschedule</Text></TouchableOpacity></View></Card>)}</View>
        )}

        {/* Nearby Specialists */}
        <View style={styles.section}><Text style={styles.sectionTitle}>Available Specialists</Text><View style={styles.nearbyGrid}>{isSpecialistsLoading ? (<ActivityIndicator size="small" color={theme.colors.primary} />) : (specialists?.slice(0, 4).map((spec: any) => { const prices = spec.consultationPackages?.map((p: any) => Number(p.price)) || [10000]; const minPrice = Math.min(...prices); const specName = spec.user?.fullName || spec.user?.email || 'Dr. Specialist'; return (<Card key={spec.id} style={styles.nearbyCard} variant="outlined" onPress={() => navigation.navigate('SpecialistProfile', { specialistId: spec.id })}><Avatar name={specName} size={64} style={{ alignSelf: 'center', marginBottom: 12 }} /><Text style={styles.nearbyName}>{spec.user?.fullName || spec.user?.email?.split('@')[0] || 'Dr. Specialist'}</Text><Text style={styles.nearbySpecialty}>{spec.specialty} <Text style={styles.nearbyRating}>⭐ {spec.rating?.toFixed(1) || '0.0'}</Text></Text><View style={styles.nearbyFooter}><View style={{ flex: 1 }}><Text style={styles.nearbyHoursLabel}>Starting from:</Text><Text style={styles.nearbyHoursValue}>₦{minPrice.toLocaleString()}</Text></View><View style={styles.nearbyArrowBtn}><ArrowRight color="white" size={20} /></View></View></Card>); }))}</View></View>
      </ScrollView>
      <FloatingSupport />
    </SafeAreaView>
  );
};
