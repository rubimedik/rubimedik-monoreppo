import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  RefreshControl,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Avatar } from '../components/Avatar';
import {
  Bell,
  Calendar as CalendarIcon,
  Drop,
  Medal,
  CheckCircle,
  Plus,
  ChatTeardropDots,
  ArrowRight,
  ShieldCheck,
  Clock,
  Warning
} from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import { ProfileIncompleteBanner } from '../components/ProfileIncompleteBanner';
import { isDonorCompatibleWithRequest } from '../utils/bloodTypeCompatibility';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { donationService, BloodRequest, DonationMatch, DonorStats, DonorEligibility } from '../services/donationService';

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export const DonorHomeScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch donor profile for blood type
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      const baseData = res.data;
      
      try {
        const profileRes = await api.get('/users/profile');
        return { ...baseData, ...profileRes.data };
      } catch (err) {
        return baseData;
      }
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
    refetchInterval: 30000,
  });

  const unreadCount = useMemo(() => {
    return notifications?.filter((n: any) => !n.isRead).length || 0;
  }, [notifications]);

  const formatDonationType = (type?: string) => {
    if (!type) return 'Whole Blood';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
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
    notificationButton: {
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
    // Hero Banner
    heroBanner: {
      backgroundColor: theme.colors.lightRedTint,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: {
      flex: 1,
      zIndex: 2,
    },
    heroTitle: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
      lineHeight: 32,
    },
    heroSubtitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.error,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    heroButtonText: {
      color: 'white',
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
    heroImage: {
      position: 'absolute',
      right: -10,
      bottom: -20,
      alignItems: 'center',
    },
    robotHead: {
      width: 70,
      height: 45,
      backgroundColor: theme.colors.error + '30',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 18,
      paddingHorizontal: 12,
    },
    robotEye: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.textPrimary,
      marginTop: 8,
    },
    robotBody: {
      width: 60,
      height: 60,
      backgroundColor: theme.colors.error,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Quick Actions
    quickActionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    quickActionCard: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    actionIconContainer: {
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
    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statsCardDonationCount: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      ...(isDarkMode ? {} : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }),
    },
    gradientMesh: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.success,
      top: -40,
      left: -40,
      opacity: isDarkMode ? 0.06 : 0.12,
    },
    gradientMeshPink: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDarkMode ? '#f43f5e' : '#ec4899',
      bottom: -30,
      right: -20,
      opacity: isDarkMode ? 0.08 : 0.15,
    },
    statsCard: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      ...(isDarkMode ? {} : {
        borderWidth: 1,
        borderColor: theme.colors.border,
      }),
    },
    statsLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    statsLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statsValue: {
      fontSize: 56,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.error,
    },
    statsValueDark: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    statsSubValue: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statBadge: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: 'transparent',
    },
    statBadgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.success,
    },
    bloodTypeLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.error,
      marginTop: 16,
    },
    // Section
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    // Appointment Card
    appointmentCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    appointmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    apptHospitalName: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      flex: 1,
      marginLeft: 12,
    },
    apptHospitalAddress: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginLeft: 12,
      marginBottom: 12,
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
      fontSize: 11,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    apptDetailValue: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    apptDetailDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 12,
    },
    cancelApptBtn: {
      backgroundColor: theme.colors.lightRedTint,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelApptText: {
      color: theme.colors.error,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    // Blood Request Cards
    bloodRequestList: {
      gap: 12,
    },
    bloodRequestCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    requestTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 12,
    },
    urgentTag: {
      backgroundColor: theme.colors.error + '15',
    },
    standardTag: {
      backgroundColor: theme.colors.primary + '15',
    },
    tagText: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamilyMedium,
    },
    urgentTagText: {
      color: theme.colors.error,
    },
    standardTagText: {
      color: theme.colors.primary,
    },
    requestHospital: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    requestHospitalSub: {
        fontSize: 13,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    requestAddress: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    requestDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    requestUnits: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    requestBloodType: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.error,
      backgroundColor: theme.colors.lightRedTint,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    requestTime: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginLeft: 'auto',
    },
    donateNowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    donateNowText: {
      color: 'white',
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 14,
    },
    // Impact Card
    impactCard: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      marginBottom: 24,
    },
    impactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    impactTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 12,
    },
    impactValue: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.error,
      marginBottom: 8,
    },
    impactMilestone: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.error,
      borderRadius: 4,
    },
    impactFootnote: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    },
    // Tips Section
    tipsList: {
      gap: 12,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      gap: 12,
    },
    tipIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
      lineHeight: 20,
    },
  }), [theme, isDarkMode]);

  // Fetch donor stats
  const { data: donorStats, isLoading: isStatsLoading } = useQuery<DonorStats>({
    queryKey: ['donor-stats'],
    queryFn: async () => {
      return donationService.getDonorStats();
    },
  });

  // Fetch donor eligibility
  const { data: eligibility, isLoading: isEligibilityLoading } = useQuery<DonorEligibility>({
    queryKey: ['donor-eligibility'],
    queryFn: async () => {
      return donationService.getEligibility();
    },
  });

  // Fetch donor insights
  const { data: insights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['donor-insights'],
    queryFn: async () => {
      const res = await api.get('/donations/my-insights');
      return res.data;
    },
    enabled: !!user?.id
  });

  const { data: myDonations, isLoading: isDonationsLoading } = useQuery<DonationMatch[]>({
    queryKey: ['my-donations'],
    queryFn: async () => {
      return donationService.getMyDonations();
    },
  });

  // Fetch all blood requests
  const { data: allBloodRequests, isLoading: isBloodRequestsLoading } = useQuery<BloodRequest[]>({
    queryKey: ['blood-requests'],
    queryFn: async () => {
      return donationService.getAllRequests();
    },
  });

  // Filter for pending/upcoming appointments
  const upcomingAppointments = myDonations?.filter(d =>
    d.status === 'PENDING' || d.status === 'ACCEPTED'
  ) || [];
  const nextAppt = upcomingAppointments[0];

  // Get pending blood requests (not fully fulfilled) - filter by compatibility if blood type is set
  const pendingBloodRequests = allBloodRequests?.filter(r => {
    const isIncomplete = r.status !== 'COMPLETED' && r.unitsFulfilled < r.units;
    if (!isIncomplete) return false;
    
    // If donor has blood type, filter by compatibility
    const donorBloodType = profile?.bloodType || profile?.bloodGroup;
    if (donorBloodType) {
      return isDonorCompatibleWithRequest(donorBloodType, r.bloodType);
    }
    
    // If no blood type, show nothing (user needs to complete profile)
    return false;
  }) || [];

  const userHasBloodType = !!(profile?.bloodType || profile?.bloodGroup);
  const userName = profile?.fullName || user?.email?.split('@')[0] || 'Donor';
  
  let calculatedUnitsDonated = donorStats?.unitsDonated || 0;
  let calculatedLivesSaved = donorStats?.livesSaved || 0;
  let calculatedDonationCount = donorStats?.donationCount || 0;

  if (calculatedUnitsDonated === 0 && myDonations) {
    const completedDonations = myDonations.filter(d => ['COMPLETED', 'VERIFIED', 'DONATED'].includes(d.status));
    calculatedUnitsDonated = completedDonations.reduce((sum, d) => sum + (d.units || d.request?.units || 1), 0);
    calculatedDonationCount = completedDonations.length;
    if (calculatedLivesSaved === 0) {
      calculatedLivesSaved = calculatedUnitsDonated * 3;
    }
  }

  const unitsDonated = calculatedUnitsDonated;
  const donationCount = calculatedDonationCount;
  const unitCount = unitsDonated > 0 ? unitsDonated : donationCount;
  const lastDonationDate = donorStats?.lastDonationDate;
  const livesSaved = calculatedLivesSaved;
  const nextMilestone = Math.ceil((donationCount + 1) / 5) * 5;
  const progressToNext = ((donationCount % 5) / 5) * 100;

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async (matchId: string) => {
      await donationService.cancelDonation(matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-donations']);
      Alert.alert('Success', 'Appointment cancelled successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel appointment');
    },
  });

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ matchId, scheduledDate }: { matchId: string; scheduledDate: Date }) => {
      await donationService.rescheduleDonation(matchId, scheduledDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-donations']);
      Alert.alert('Success', 'Appointment rescheduled successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to reschedule appointment');
    },
  });

  const handleCancelAppointment = () => {
    if (nextAppt?.id) {
      Alert.alert(
        'Cancel Appointment',
        'Are you sure you want to cancel this appointment?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate(nextAppt.id) },
        ]
      );
    }
  };

  const handleRescheduleAppointment = () => {
    if (nextAppt?.id) {
      navigation.navigate('BookDonation', { rescheduleMatchId: nextAppt.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isStatsLoading || isDonationsLoading || isBloodRequestsLoading || isEligibilityLoading} 
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['profile'] });
              queryClient.invalidateQueries({ queryKey: ['donor-stats'] });
              queryClient.invalidateQueries({ queryKey: ['donor-eligibility'] });
              queryClient.invalidateQueries({ queryKey: ['my-donations'] });
              queryClient.invalidateQueries({ queryKey: ['blood-requests-nearby'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }}

            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Incomplete Banner */}
        <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md }}>
          <ProfileIncompleteBanner bloodType={profile?.bloodType || profile?.bloodGroup} />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={profile?.fullName || user?.email} size={48} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.subGreeting}>
                {userHasBloodType 
                  ? `Blood Type: ${profile.bloodType || profile.bloodGroup} • Ready to donate!` 
                  : 'Complete your profile to donate'}
              </Text>
            </View>
          </View>
          <GHPressable 
            style={({ pressed }) => [styles.notificationButton, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Bell size={24} color={theme.colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </GHPressable>
          </View>


        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            {!userHasBloodType ? (
              <>
                <Text style={styles.heroTitle}>Complete Your Profile</Text>
                <Text style={styles.heroSubtitle}>Add your blood type to start{'\n'}receiving donation requests.</Text>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => navigation.navigate('PersonalInformation')}
                >
                  <Text style={styles.heroButtonText}>Add Blood Type</Text>
                  <ArrowRight size={16} color="white" weight="bold" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.heroTitle}>A Small Act. A Big Impact.</Text>
                <Text style={styles.heroSubtitle}>See hospital requests around you{'\n'}and donate when you're ready.</Text>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => navigation.navigate('BloodRequestsNearby')}
                >
                  <Text style={styles.heroButtonText}>Book Donation</Text>
                  <ArrowRight size={16} color="white" weight="bold" />
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.heroImage}>
            <View style={styles.robotHead}>
              <View style={styles.robotEye} />
              <View style={styles.robotEye} />
            </View>
            <View style={styles.robotBody}>
              <Plus color="white" size={28} weight="bold" />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <Card style={styles.quickActionCard} variant="outlined" onPress={() => navigation.navigate('BloodRequestsNearby')}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.error + '15' }]}>
              <Drop color={theme.colors.error} size={22} weight="fill" />
            </View>
            <Text style={styles.actionTitle}>Donate Now</Text>
            <Text style={styles.actionDesc}>See blood requests{'\n'}around you</Text>
          </Card>
          <Card style={styles.quickActionCard} variant="outlined" onPress={() => navigation.navigate('Donations')}>
            <View style={[styles.actionIconContainer, { backgroundColor: isEligibilityLoading ? theme.colors.border + '15' : (eligibility?.isEligible ? theme.colors.success + '15' : theme.colors.error + '15') }]}>
              {isEligibilityLoading ? (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              ) : eligibility?.isEligible ? (
                <ShieldCheck color={theme.colors.success} size={22} weight="fill" />
              ) : (
                <Clock color={theme.colors.error} size={22} weight="fill" />
              )}
            </View>
            <Text style={styles.actionTitle}>Eligibility Status</Text>
            <Text style={[styles.actionDesc, { color: isEligibilityLoading ? theme.colors.textSecondary : (eligibility?.isEligible ? theme.colors.success : theme.colors.error), fontFamily: theme.typography.fontFamilyBold }]}>
              {isEligibilityLoading 
                ? 'Checking...' 
                : eligibility?.isEligible 
                  ? 'Ready to Donate' 
                  : eligibility?.nextEligibleDate 
                    ? `Eligible: ${safeFormat(eligibility.nextEligibleDate, 'MMM d')}` 
                    : 'Check History'}
            </Text>
          </Card>
        </View>

        {/* AI Donor Insights */}
        {insights && (
          <View style={{ marginBottom: 24 }}>
             {insights.burnoutWarning && (
                <Card style={{ marginBottom: 12, backgroundColor: theme.colors.warning + '15', borderColor: theme.colors.warning }} variant="outlined">
                    <View style={{ flexDirection: 'row', gap: 12, padding: 4 }}>
                        <Warning color={theme.colors.warning} size={24} weight="fill" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.colors.warning, fontFamily: theme.typography.fontFamilyBold, fontSize: 14, marginBottom: 4 }}>Health Alert</Text>
                            <Text style={{ color: theme.colors.textPrimary, fontSize: 13, lineHeight: 20 }}>{insights.burnoutWarning}</Text>
                        </View>
                    </View>
                </Card>
             )}
             
             {insights.rarityMessage && (
                 <Card style={{ backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30', marginBottom: 12 }} variant="outlined">
                     <View style={{ flexDirection: 'row', gap: 12, padding: 4, alignItems: 'center' }}>
                         <Drop color={theme.colors.primary} size={24} weight="fill" />
                         <View style={{ flex: 1 }}>
                             <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: 13, marginBottom: 2 }}>Your Blood is Rare</Text>
                             <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{insights.rarityMessage}</Text>
                         </View>
                     </View>
                 </Card>
             )}
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statsCardDonationCount, { height: 180 }]}>
            <View style={styles.gradientMesh} />
            <View style={styles.gradientMeshPink} />
            <Text style={styles.statsLabel}>Units Donated:</Text>
            <Text style={[styles.statsValue, { color: isDarkMode ? '#4ade80' : theme.colors.success, fontSize: 48, marginTop: 8 }]}>{unitCount}</Text>
            {profile?.bloodType && (
              <Text style={styles.bloodTypeLabel}>Blood Type: {profile.bloodType}</Text>
            )}
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            <View style={[styles.statsCard, { height: 80 }]}>
              <View style={styles.statsLabelRow}>
                <Text style={styles.statsLabel}>Last Donation</Text>
              </View>
              <Text style={styles.statsValueDark}>
                {lastDonationDate
                  ? safeFormat(lastDonationDate, 'MMM d, yyyy')
                  : 'No data'}
              </Text>
            </View>
            <View style={[styles.statsCard, { height: 88 }]}>
              <View style={styles.statsLabelRow}>
                <Text style={styles.statsLabel}>Lives Saved</Text>
              </View>
              <Text style={[styles.statsValueDark, { fontSize: 24, marginTop: 4 }]}>{livesSaved}</Text>
            </View>
          </View>
        </View>

        {/* Next Appointment */}
        {(isDonationsLoading || nextAppt) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your next Appointment</Text>
            {isDonationsLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Card style={styles.appointmentCard} variant="outlined" onPress={() => navigation.navigate('BloodRequestDetail', { requestId: nextAppt.request?.id })}>
                <View style={styles.appointmentHeader}>
                  <Avatar name={nextAppt.request?.hospital?.hospitalProfile?.hospitalName || nextAppt.request?.hospital?.fullName || 'Hospital'} size={48} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.apptHospitalName}>{nextAppt.request?.hospital?.hospitalProfile?.hospitalName || nextAppt.request?.hospital?.fullName || 'Emmanuel General Hospital'}</Text>
                    <Text style={styles.apptHospitalAddress}>
                      {nextAppt.request?.hospital?.hospitalProfile?.address || '16 Hospital Road, Eket Akwa-Ibom State'}
                    </Text>
                  </View>
                </View>

                <View style={styles.apptDetailsGrid}>
                  <View style={styles.apptDetailItem}>
                    <Text style={styles.apptDetailLabel}>Blood Type</Text>
                    <Text style={styles.apptDetailValue}>{nextAppt.request?.bloodType || 'O+'}</Text>
                  </View>
                  <View style={styles.apptDetailDivider} />
                  <View style={styles.apptDetailItem}>
                    <Text style={styles.apptDetailLabel}>Units</Text>
                    <Text style={styles.apptDetailValue}>{nextAppt.units || nextAppt.request?.units || 1}</Text>
                  </View>
                  <View style={styles.apptDetailDivider} />
                  <View style={styles.apptDetailItem}>
                    <Text style={styles.apptDetailLabel}>Date</Text>
                    <Text style={styles.apptDetailValue}>
                      {safeFormat(nextAppt.scheduledDate, 'MMM d', 'Scheduled')}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {(nextAppt.status === 'PENDING' || nextAppt.status === 'ACCEPTED') ? (
                    <>
                      <TouchableOpacity
                        style={[styles.cancelApptBtn, { flex: 1 }]}
                        onPress={handleCancelAppointment}
                      >
                        <Text style={styles.cancelApptText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cancelApptBtn, { flex: 1, backgroundColor: theme.colors.primary }]}
                        onPress={handleRescheduleAppointment}
                      >
                        <Text style={[styles.cancelApptText, { color: 'white' }]}>Reschedule</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Nearby Blood Requests */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Nearby Blood Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BloodRequestsNearby')}>
              <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyMedium, fontSize: 14 }}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bloodRequestList}>
            {isBloodRequestsLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : pendingBloodRequests.length > 0 ? (
              pendingBloodRequests.slice(0, 2).map((request: BloodRequest, idx: number) => (
                <Card key={request.id || idx} style={styles.bloodRequestCard} variant="outlined">
                  <View style={[
                    styles.requestTag,
                    request.urgency?.toLowerCase() === 'urgent' ? styles.urgentTag : styles.standardTag
                  ]}>
                    <Text style={[
                      styles.tagText,
                      request.urgency?.toLowerCase() === 'urgent' ? styles.urgentTagText : styles.standardTagText
                    ]}>
                      {request.urgency?.toLowerCase() === 'urgent' ? 'Urgent' : 'Standard'}
                    </Text>
                  </View>
                  <Text style={styles.requestHospital} numberOfLines={1}>
                    {request.title || request.hospital?.hospitalProfile?.hospitalName || request.hospital?.fullName || 'Blood Request'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    {request.title ? (
                      <Text style={[styles.requestHospitalSub, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>
                        {request.hospital?.hospitalProfile?.hospitalName || request.hospital?.fullName || 'Medical Facility'}
                      </Text>
                    ) : (
                      <Text style={[styles.requestHospitalSub, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>
                        {request.hospital?.hospitalProfile?.address || 'Medical Facility'}
                      </Text>
                    )}
                    <Text style={[styles.requestTime, { marginLeft: 8 }]}>
                      {request.createdAt ? `${safeFormat(request.createdAt, 'H')} hrs ago` : 'recently'}
                    </Text>
                  </View>
                  {request.title && (
                    <Text style={styles.requestAddress} numberOfLines={1}>
                      {request.hospital?.hospitalProfile?.address || '16 Hospital Road, Eket Akwa-Ibom State'}
                    </Text>
                  )}
                  <View style={styles.requestDetails}>
                    <Drop color={theme.colors.error} size={20} weight="fill" />
                    <Text style={styles.requestUnits}>{request.units - request.unitsFulfilled} units</Text>
                    <Text style={styles.requestBloodType}>{request.bloodType}</Text>
                    <View style={{ backgroundColor: theme.colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                        <Text style={{ fontSize: 11, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textSecondary }}>{formatDonationType(request.donationType)}</Text>
                    </View>
                  </View>
                  <View style={{ height: 12 }} />
                  <TouchableOpacity
                    style={styles.donateNowBtn}
                    onPress={() => navigation.navigate('BloodRequestDetail', { requestId: request.id })}
                  >
                    <Drop color="white" size={18} weight="fill" />
                    <Text style={styles.donateNowText}>Donate Now</Text>
                  </TouchableOpacity>
                </Card>
              ))
            ) : (
              <Card style={styles.bloodRequestCard} variant="outlined">
                <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, padding: 16 }}>
                  No blood requests in your area at the moment.
                </Text>
              </Card>
            )}
          </View>
        </View>

        {/* Impact Card */}
        <Card style={styles.impactCard} variant="outlined">
          <View style={styles.impactHeader}>
            <Medal color={theme.colors.warning} size={32} weight="fill" />
            <Text style={styles.impactTitle}>Your Impact</Text>
          </View>
          <Text style={styles.impactValue}>Units Donated: {unitsDonated}</Text>
          <Text style={styles.impactMilestone}>Next Milestone: {nextMilestone} Donations</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
          </View>
          <Text style={styles.impactFootnote}>
              {insights?.lastImpactSummary || 'One step closer to saving more lives.'}
          </Text>
        </Card>

        {/* Tips & Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips & Safety</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <CheckCircle color={theme.colors.success} size={16} weight="fill" />
              </View>
              <Text style={styles.tipText}>Eat before donating for steady energy.</Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <CheckCircle color={theme.colors.success} size={16} weight="fill" />
              </View>
              <Text style={styles.tipText}>Stay hydrated 24 hours before donation.</Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <CheckCircle color={theme.colors.success} size={16} weight="fill" />
              </View>
              <Text style={styles.tipText}>Avoid strenuous exercises on donation day.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
