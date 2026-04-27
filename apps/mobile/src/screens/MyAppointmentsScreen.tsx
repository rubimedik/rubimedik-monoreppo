import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { Avatar } from '../components/Avatar';
import { CountdownTimer } from '../components/CountdownTimer';
import { Calendar as CalendarIcon, Clock, CaretRight as CaretRightIcon, CaretRight, ChatTeardropDots, Drop, MagnifyingGlass, XCircle, CalendarPlus, CheckCircle, Star } from 'phosphor-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { UserRole, DonationStatus } from '@repo/shared';
import { format, isValid } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { SearchInput } from '../components/SearchInput';

export const MyAppointmentsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Declined' | 'Requests' | 'Pending Payout' | 'Review Needed' | 'History'>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const isDonor = user?.activeRole === UserRole.DONOR;
  const isSpecialist = user?.activeRole === UserRole.SPECIALIST;
  const isHospital = user?.activeRole === UserRole.HOSPITAL;

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['appointments', user?.id, user?.activeRole],
    queryFn: async () => {
      if (isDonor) {
        // Fetch blood donation bookings for donor
        const res = await api.get('/donations/my');
        return res.data;
      } else if (isHospital) {
        // Fetch blood donation bookings for hospital
        const res = await api.get('/donations/hospital/matches');
        return res.data;
      } else {
        // Fetch medical consultations for patient or specialist
        const res = await api.get('/consultations/my');
        return res.data;
      }
    },
    enabled: !!user?.id
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.put(`/consultations/${id}/confirm`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        Alert.alert('Success', 'Appointment confirmed successfully.');
    }
  });

  const filteredAppointments = useMemo(() => {
    // 1. Initial Sort by date (Newest First) - do this before filtering to be safe
    let sorted = [...(appointments || [])].sort((a, b) => {
        const dateA = new Date(a.scheduledAt || a.createdAt).getTime();
        const dateB = new Date(b.scheduledAt || b.createdAt).getTime();
        return dateB - dateA;
    });

    // 2. Filter by tab
    let filtered = sorted.filter((app: any) => {
      if (!app) return false;
      if (isHospital) {
        if (activeTab === 'Requests') return app.status === DonationStatus.PENDING;
        if (activeTab === 'Upcoming') return app.status === DonationStatus.ACCEPTED;
        if (activeTab === 'Completed') return [DonationStatus.COMPLETED, DonationStatus.VERIFIED, DonationStatus.DONATED].includes(app.status);
        if (activeTab === 'Declined') return app.status === DonationStatus.DECLINED || app.status === 'CANCELLED';
        return false;
      }

      if (isDonor) {
        if (activeTab === 'Upcoming') return [DonationStatus.PENDING, DonationStatus.ACCEPTED].includes(app.status);
        if (activeTab === 'Completed') return [DonationStatus.COMPLETED, DonationStatus.VERIFIED, DonationStatus.DONATED].includes(app.status);
        if (activeTab === 'Declined') return app.status === DonationStatus.DECLINED || app.status === 'CANCELLED';
        return false;
      }

      if (isSpecialist) {
            if (activeTab === 'Requests') return app.status === 'UPCOMING';
            if (activeTab === 'Upcoming') return app.status === 'CONFIRMED' || app.status === 'PENDING';
            
            const isFinalized = (app.status === 'PENDING_PAYOUT' || app.status === 'ARCHIVED');
            const isPaid = app.payoutStatus === 'PAID';
            
            if (activeTab === 'Pending Payout') {
                return isFinalized && !isPaid;
            }
            if (activeTab === 'Completed' || activeTab === 'History') {
                return app.status === 'COMPLETED' || (isFinalized && isPaid);
            }
            if (activeTab === 'Declined') return app.status === 'CANCELLED' || app.status === 'DECLINED';
            return false;
        } else {
            // Patient view
            if (activeTab === 'Declined') return app.status === 'CANCELLED' || app.status === 'DECLINED';
            
            const isHeld = app.payoutStatus === 'HELD';
            const isFinalizedStatus = (app.status === 'PENDING_PAYOUT' || app.status === 'ARCHIVED');
            
            // Pending Review for patient
            if (activeTab === 'Review Needed') {
                return (isFinalizedStatus || isHeld) && !app.patientFeedback;
            }
            
            // Completed (Patient view)
            if (activeTab === 'Completed') {
                const isPaid = app.status === 'COMPLETED';
                const hasFeedback = !!app.patientFeedback;
                return isPaid || ((isFinalizedStatus || isHeld) && hasFeedback);
            }
            
            // Upcoming (Patient view)
            const isUpcoming = (app.status === 'UPCOMING' || app.status === 'CONFIRMED' || app.status === 'PENDING') && !isFinalizedStatus && !isHeld;
            
            if (activeTab === 'Upcoming') return isUpcoming;
            return false;
        }
    });

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((app: any) => {
        if (isDonor) {
          const hospitalName = app.request?.hospital?.hospitalProfile?.hospitalName?.toLowerCase() || '';
          const bloodType = app.request?.bloodType?.toLowerCase() || '';
          return hospitalName.includes(query) || bloodType.includes(query);
        } else {
          const specialistName = (app.specialist?.user?.fullName || app.specialist?.user?.email || '').toLowerCase();
          const specialty = (app.specialist?.specialty || '').toLowerCase();
          return specialistName.includes(query) || specialty.includes(query);
        }
      });
    }

    return filtered;
  }, [appointments, activeTab, searchQuery, isDonor, isSpecialist, isHospital]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.xl, 
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    title: {
      fontSize: 24,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    tabs: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 4,
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    tab: {
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: isDarkMode ? theme.colors.card : theme.colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamilyMedium,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    listContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xs,
      gap: theme.spacing.md,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    appointmentCard: {
      padding: theme.spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerInfo: {
      flex: 1,
    },
    specialistName: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    specialty: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    cardDivider: {
      height: 1,
      marginVertical: 12,
      backgroundColor: theme.colors.border,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 12,
    },
    dateTimeRow: {
      gap: 4,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamilyMedium,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    chatButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
      backgroundColor: theme.colors.primary,
    },
    detailsText: {
      fontSize: 12,
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamilyBold,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 100,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
    },
    bookBtn: {
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },
    bookBtnText: {
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamilyBold,
    }
  }), [theme, isDarkMode]);

  const renderMedicalAppointment = (item: any) => {
    const isSpecialist = user?.activeRole === UserRole.SPECIALIST;
    const detailRoute = isSpecialist ? 'AppointmentDetails' : 'ConsultationDetail';

    const getIdentityName = (person: any) => {
        if (person?.fullName) return person.fullName;
        if (person?.email) return person.email.split('@')[0];
        return 'User';
    };

    const patientName = getIdentityName(item.consultation?.patient || item.patient);
    
    // Fix: Correct mapping for specialist name and specialty
    const specialist = item.consultation?.specialist || item.specialist;
    
    // For Avatar, pass the full name or full email so initials can be generated
    const avatarName = isSpecialist ? (item.consultation?.patient?.fullName || item.patient?.fullName || item.consultation?.patient?.email || item.patient?.email || 'User') : (specialist?.fullName || specialist?.user?.fullName || specialist?.user?.email || 'User');
    const avatarUrl = isSpecialist 
      ? (item.consultation?.patient?.avatarUrl || item.patient?.avatarUrl || item.consultation?.patient?.user?.avatarUrl || item.patient?.user?.avatarUrl)
      : (specialist?.avatarUrl || specialist?.user?.avatarUrl);
    
    const displayName = isSpecialist ? patientName : (specialist?.fullName || specialist?.user?.fullName || specialist?.user?.email?.split('@')[0] || 'Dr. Specialist');
    const displayPhone = isSpecialist 
      ? (item.consultation?.patient?.user?.phoneNumber || item.patient?.user?.phoneNumber)
      : (specialist?.user?.phoneNumber || specialist?.phoneNumber);

    const isRequest = item.status === 'UPCOMING' && isSpecialist;
    const isActionable = (item.status === 'UPCOMING' || item.status === 'CONFIRMED' || item.status === 'PENDING');
    const isPendingPayoutTab = activeTab === 'Pending Payout';
    // Normalize data (handle both Appointment and Consultation structures)
    const cons = item.consultation || item;
    const hasPatientFeedback = !!cons.patientFeedback;
    const payoutAmount = cons.specialistPayout || 0;
    const delayReason = cons.payoutNote;
    const isHeld = cons.payoutStatus === 'HELD';
    const isFinalized = (item.status === 'PENDING_PAYOUT' || item.status === 'ARCHIVED');
    const isPaid = cons.payoutStatus === 'PAID';

    // Patient-friendly label logic
    let statusLabel = item.status;
    let statusVariant = 'info';

    if (isHeld) {
        statusLabel = hasPatientFeedback ? 'Under Review' : 'Awaiting Review';
        statusVariant = 'error';
    } else if (isPaid || item.status === 'COMPLETED') {
        statusLabel = 'Completed';
        statusVariant = 'success';
    } else if (isFinalized) {
        if (!isSpecialist && !hasPatientFeedback) {
            statusLabel = 'Action Needed';
            statusVariant = 'warning';
        } else {
            statusLabel = isSpecialist ? 'Pending Payout' : 'Processing';
            statusVariant = 'warning';
        }
    } else if (item.status === 'PENDING') {
        statusVariant = 'warning';
    } else if (item.status === 'CONFIRMED' || item.status === 'UPCOMING') {
        statusVariant = isRequest ? 'warning' : 'info';
    } else if (item.status === 'CANCELLED' || item.status === 'DECLINED') {
        statusVariant = 'error';
    }

    return (
      <Card 
        style={styles.appointmentCard}
        onPress={() => navigation.navigate(detailRoute, { appointmentId: item.id, consultationId: cons.id })}
      >
        <View style={styles.cardHeader}>
          <Avatar uri={avatarUrl} name={avatarName} size={48} />
          <View style={styles.headerInfo}>
            <Text style={styles.specialistName}>{displayName}</Text>
            <Text style={styles.specialty}>
                {isSpecialist ? (isPendingPayoutTab ? `Completed: ${safeFormat(cons.completedAt || item.createdAt, 'MMM dd, yyyy')}` : 'Patient') : (specialist?.specialistProfile?.specialty || specialist?.specialty || 'General Practitioner')}
            </Text>
          </View>
          <Badge 
            label={statusLabel} 
            variant={statusVariant as any} 
          />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.dateTimeRow}>
            {isHeld ? (
                <View style={styles.infoItem}>
                    <Text style={[styles.infoText, { color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold }]}>
                        Payout Flagged: Check Details
                    </Text>
                </View>
            ) : isPendingPayoutTab ? (
                <View style={{ gap: 4 }}>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoText, { color: theme.colors.success, fontFamily: theme.typography.fontFamilyBold }]}>
                            Expected Payout: ₦{Number(payoutAmount).toLocaleString()}
                        </Text>
                    </View>
                    {isSpecialist && !cons.specialistFeedback ? (
                        <View style={styles.infoItem}>
                             <Text style={[styles.infoText, { color: theme.colors.error, fontSize: 12 }]}>
                                Action Required: Submit Feedback
                            </Text>
                        </View>
                    ) : (!!cons.payoutReleasesAt) ? (
                        new Date(cons.payoutReleasesAt) > new Date() ? (
                            <CountdownTimer 
                              targetDate={cons.payoutReleasesAt} 
                              prefix="Releases in: "
                            />
                        ) : (
                            <View style={styles.infoItem}>
                                <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
                                    Status: Awaiting Verification
                                </Text>
                            </View>
                        )
                    ) : null}
                </View>
            ) : (item.status === 'PENDING_PAYOUT' && !isSpecialist && !hasPatientFeedback) ? (
                <View style={styles.infoItem}>
                    <Star size={16} color={theme.colors.warning} weight="fill" />
                    <Text style={[styles.infoText, { color: theme.colors.warning, fontFamily: theme.typography.fontFamilyBold }]}>
                        Please share your feedback
                    </Text>
                </View>
            ) : (
                <View style={{ gap: 4 }}>
                    <View style={styles.infoItem}>
                        <CalendarIcon size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.infoText}>{safeFormat(item.scheduledAt || item.createdAt, 'PP')}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Clock size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.infoText}>{safeFormat(item.scheduledAt || item.createdAt, 'p')}</Text>
                    </View>
                </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => navigation.navigate('Chat', { roomId: cons.id, otherUserName: displayName, otherPhone: displayPhone })}
            >
              <ChatTeardropDots size={20} color={theme.colors.primary} weight="fill" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => navigation.navigate(detailRoute, { appointmentId: item.id, consultationId: cons.id })}
            >
              <Text style={styles.detailsText}>{(item.status === 'PENDING_PAYOUT' && !isSpecialist && !hasPatientFeedback) ? 'Review' : 'Details'}</Text>
              <CaretRight size={14} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>{isActionable && !isPendingPayoutTab ? (<View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>{isRequest ? (<View style={{ flexDirection: 'row', gap: 12, flex: 1 }}><TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.success + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 }} onPress={() => { Alert.alert('Confirm Request', 'Are you sure you want to confirm this appointment request?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => confirmMutation.mutate(item.id) }]); }}><CheckCircle size={16} color={theme.colors.success} weight="bold" /><Text style={{ color: theme.colors.success, fontSize: 12, fontFamily: theme.typography.fontFamilyBold }}>Confirm</Text></TouchableOpacity><TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.error + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 }} onPress={() => navigation.navigate(detailRoute, { appointmentId: item.id, consultationId: item.consultation?.id || item.id, action: 'cancel' })}><XCircle size={16} color={theme.colors.error} weight="bold" /><Text style={{ color: theme.colors.error, fontSize: 12, fontFamily: theme.typography.fontFamilyBold }}>Decline</Text></TouchableOpacity></View>) : (<View style={{ flexDirection: 'row', gap: 12, flex: 1 }}><TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.error + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 }} onPress={() => navigation.navigate(detailRoute, { appointmentId: item.id, consultationId: item.consultation?.id || item.id, action: 'cancel' })}><XCircle size={16} color={theme.colors.error} weight="bold" /><Text style={{ color: theme.colors.error, fontSize: 12, fontFamily: theme.typography.fontFamilyBold }}>Cancel</Text></TouchableOpacity><TouchableOpacity style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 }} onPress={() => navigation.navigate(detailRoute, { appointmentId: item.id, consultationId: item.consultation?.id || item.id, action: 'reschedule' })}><CalendarPlus size={16} color={theme.colors.primary} weight="bold" /><Text style={{ color: theme.colors.primary, fontSize: 12, fontFamily: theme.typography.fontFamilyBold }}>Reschedule</Text></TouchableOpacity></View>)}</View>) : null}</Card>    );
  };

  const renderDonationAppointment = (item: any) => (
    <Card
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('BloodRequestDetail', { requestId: item.request?.id })}
    >
      <View style={styles.cardHeader}>
        <Avatar uri={item.request?.hospital?.avatarUrl} name={item.request?.hospital?.hospitalProfile?.hospitalName || 'Hospital'} size={48} />
        <View style={styles.headerInfo}>
          <Text style={styles.specialistName}>{item.request?.hospital?.hospitalProfile?.hospitalName || 'Hospital'}</Text>
          <Text style={styles.specialty}>{item.request?.hospital?.hospitalProfile?.address || 'Medical Facility'}</Text>
        </View>
        <Badge
          label={item.status} 
          variant={item.status === DonationStatus.ACCEPTED ? 'success' : item.status === DonationStatus.PENDING ? 'warning' : 'info'} 
        />
      </View>

      <View style={styles.cardDivider} /><View style={styles.cardFooter}>
        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Drop size={16} color={theme.colors.error} weight="fill" />
            <Text style={styles.infoText}>Blood Type: <Text style={{fontFamily: theme.typography.fontFamilyBold}}>{item.request?.bloodType || 'N/A'}</Text></Text>
          </View>
          <View style={styles.infoItem}>
            <CalendarIcon size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>{safeFormat(item.createdAt, 'PPP')}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('BloodRequestDetail', { requestId: item.request?.id })}
        >
          <Text style={styles.detailsText}>View Facility</Text>
          <CaretRight size={14} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const tabOptions = useMemo(() => {
    if (isSpecialist) return ['Requests', 'Upcoming', 'Pending Payout', 'History', 'Cancelled'];
    if (isHospital) return ['Requests', 'Upcoming', 'Completed', 'Cancelled'];
    if (isDonor) return ['Upcoming', 'Completed', 'Cancelled'];
    return ['Upcoming', 'Review Needed', 'Completed', 'Cancelled'];
  }, [isSpecialist, isHospital, isDonor]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: 16 }}>
        <SearchInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search hospital or specialist..."
        />
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{tabOptions.map((tab) => (
            <TouchableOpacity 
                key={tab}
                style={[styles.tab, (activeTab === tab || (tab === 'Cancelled' && activeTab === 'Declined')) && styles.activeTab, { paddingHorizontal: 16 }]}
                onPress={() => {
                    if (tab === 'Cancelled') setActiveTab('Declined');
                    else setActiveTab(tab as any);
                }}
            >
                <Text style={[styles.tabText, (activeTab === tab || (tab === 'Cancelled' && activeTab === 'Declined')) && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={150} style={{ marginBottom: 16 }} />)}
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={({ item }) => (isDonor || isHospital) ? renderDonationAppointment(item) : renderMedicalAppointment(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <CalendarIcon size={64} color={theme.colors.border} weight="light" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} appointments found.</Text>
              {activeTab === 'Upcoming' && !isSpecialist && (<TouchableOpacity 
                  style={styles.bookBtn}
                  onPress={() => isDonor ? navigation.navigate('Donations') : navigation.navigate('SearchSpecialists')}
                >
                  <Text style={styles.bookBtnText}>{isDonor ? 'Find Blood Requests' : 'Book an Appointment'}</Text>
                </TouchableOpacity>)}
              </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};
