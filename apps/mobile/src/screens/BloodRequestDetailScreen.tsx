import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Modal,
  TextInput as RNTextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card, Badge, Avatar, PrimaryButton, BackButton } from '../components';
import { CaretLeft, MapPin, Calendar, Clock, Drop, ShieldCheck, Phone, Info, CheckCircle, XCircle, Star, ChatTeardropDots, Warning } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { donationService, DonorEligibility } from '../services/donationService';
import { DonationStatus } from '@repo/shared';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export const BloodRequestDetailScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { requestId } = route.params;
  const queryClient = useQueryClient();

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: request, isLoading, refetch: refetchRequest } = useQuery({
    queryKey: ['blood-request', requestId],
    queryFn: async () => {
      const res = await api.get(`/donations/requests/${requestId}`);
      return res.data;
    }
  });

  const { data: myDonations, refetch: refetchMyDonations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: async () => {
      const res = await api.get('/donations/my');
      return res.data;
    }
  });

  const { data: eligibility } = useQuery<DonorEligibility>({
    queryKey: ['donor-eligibility'],
    queryFn: donationService.getEligibility,
  });

  const { data: requestReviews } = useQuery({
      queryKey: ['request-reviews', requestId],
      queryFn: async () => {
          if (!requestId) return [];
          return donationService.getRequestReviews(requestId);
      },
      enabled: !!requestId
  });

  const { data: myReview } = useQuery({
    queryKey: ['my-review', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      return donationService.getMyReviewForRequest(requestId);
    },
    enabled: !!requestId,
  });

  const COMPLETED_STATUSES = [DonationStatus.COMPLETED, DonationStatus.VERIFIED, DonationStatus.DONATED];

  const activeBooking = useMemo(() => {
    return myDonations?.find((d: any) => 
        d.request.id === requestId && 
        !COMPLETED_STATUSES.includes(d.status) && 
        d.status !== DonationStatus.DECLINED
    );
  }, [myDonations, requestId]);

  const completedDonation = useMemo(() => {
    return myDonations?.find((d: any) => 
        d.request.id === requestId && 
        COMPLETED_STATUSES.includes(d.status)
    );
  }, [myDonations, requestId]);

  const cancelMutation = useMutation({
    mutationFn: (matchId: string) => donationService.cancelDonation(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      Alert.alert('Cancelled', 'Your donation booking has been cancelled.');
    }
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ matchId, date }: { matchId: string, date: Date }) => 
        donationService.rescheduleDonation(matchId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      Alert.alert('Rescheduled', 'Your rescheduling request has been sent.');
    }
  });

  const feedbackMutation = useMutation({
      mutationFn: (data: any) => api.post('/donations/feedback', data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['hospital-feedbacks'] });
          setIsFeedbackModalVisible(false);
          Alert.alert('Thank You', 'Your feedback has been submitted successfully.');
      },
      onError: (err: any) => {
          Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback.');
      }
  });

  const handleRescheduleConfirm = (date: Date) => {
    setDatePickerVisibility(false);
    if (activeBooking) {
        rescheduleMutation.mutate({ matchId: activeBooking.id, date });
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this donation appointment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate(activeBooking.id) }
    ]);
  };

  const submitFeedback = () => {
      if (!comment.trim()) {
          Alert.alert('Error', 'Please enter a comment.');
          return;
      }
      feedbackMutation.mutate({
          hospitalId: request.hospital.id,
          requestId: request.id,
          rating,
          comment,
          isAnonymous: false
      });
  };

  const formatDonationType = (type?: string) => {
    if (!type) return 'Whole Blood';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    content: { paddingBottom: 40 },
    hospitalCard: { padding: 20, alignItems: 'center', marginBottom: 24, marginHorizontal: 24 },
    hospitalName: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginTop: 12, textAlign: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    locationText: { fontSize: 14, color: theme.colors.textSecondary },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32, marginHorizontal: 24 },
    statItem: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
    statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
    statValue: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, textAlign: 'center' },
    section: { marginBottom: 32, paddingHorizontal: 24 },
    sectionTitle: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginBottom: 12 },
    reasonBox: { padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
    reasonText: { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 22 },
    
    journeyCard: { padding: 20, backgroundColor: theme.colors.surface, borderRadius: 20, marginBottom: 24, marginHorizontal: 24 },
    journeyStep: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    stepIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: theme.colors.primary },
    stepCompleted: { backgroundColor: theme.colors.success },
    stepTitle: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    stepDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    line: { position: 'absolute', left: 15, top: 32, width: 2, height: 20, backgroundColor: theme.colors.border },
    lineActive: { backgroundColor: theme.colors.success },

    feedbackItem: { padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
    feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    feedbackUser: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    feedbackComment: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

    footer: { padding: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: theme.colors.background, borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' },
    starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
    commentInput: { height: 120, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, color: theme.colors.textPrimary, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 },

    eligibilityBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.colors.error + '10',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.error,
      marginBottom: 16,
    },
    eligibilityText: {
      flex: 1,
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.error,
    }
  }), [theme, isDarkMode]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={theme.colors.primary} size="large" /></View>;
  }

  const renderJourney = () => {
    const booking = activeBooking || completedDonation;
    if (!booking) return null;

    const isAcceptedOrBeyond = [DonationStatus.ACCEPTED, ...COMPLETED_STATUSES].includes(booking.status);
    const isCompleted = COMPLETED_STATUSES.includes(booking.status);

    return (
      <View style={styles.journeyCard}>
        <Text style={styles.sectionTitle}>Donation Journey</Text>
        
        <View style={styles.journeyStep}>
          <View style={[styles.stepIconWrap, styles.stepCompleted]}><CheckCircle size={20} color="white" weight="fill" /></View>
          <View><Text style={styles.stepTitle}>Appointment Booked</Text><Text style={styles.stepDesc}>Scheduled for {safeFormat(booking.scheduledDate || booking.createdAt, 'PPP p')}</Text></View>
          <View style={[styles.line, styles.lineActive]} />
        </View>

        <View style={styles.journeyStep}>
          <View style={[styles.stepIconWrap, isAcceptedOrBeyond && styles.stepCompleted, booking.status === DonationStatus.PENDING && styles.stepActive]}>
            {isAcceptedOrBeyond ? <CheckCircle size={20} color="white" weight="fill" /> : <Clock size={20} color="white" />}
          </View>
          <View>
            <Text style={styles.stepTitle}>Hospital Confirmation</Text>
            <Text style={styles.stepDesc}>
              {isAcceptedOrBeyond 
                ? `${booking.request?.title ? booking.request.title + " - " : ""}Accepted on ${safeFormat(booking.updatedAt || booking.createdAt, "PPP p")}` 
                : 'Awaiting hospital review.'}
            </Text>
          </View>
          <View style={[styles.line, isCompleted && styles.lineActive]} />
        </View>

        <View style={[styles.journeyStep, { marginBottom: 0 }]}>
          <View style={[styles.stepIconWrap, isCompleted && styles.stepCompleted]}>
            <Drop size={20} color="white" weight={isCompleted ? 'fill' : 'regular'} />
          </View>
          <View>
            <Text style={styles.stepTitle}>Donation Completed</Text>
            <Text style={styles.stepDesc}>
              {isCompleted 
                ? `${booking.request?.title ? booking.request.title + " - " : ""}Completed on ${safeFormat(booking.donatedAt || booking.updatedAt, "PPP p")}. ${booking.units || booking.request?.units || 1} unit(s) donated.` 
                : 'Final step after your visit.'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.hospitalCard} variant="outlined">
          <Avatar name={request?.hospital?.hospitalProfile?.hospitalName || 'Hospital'} size={80} />
          <Text style={[styles.hospitalName, { fontSize: 20, marginBottom: 4 }]}>{request?.title || 'Blood Request'}</Text>
          <Text style={[styles.hospitalName, { marginTop: 0, fontSize: 16, color: theme.colors.textSecondary }]}>{request?.hospital?.hospitalProfile?.hospitalName || 'Medical Facility'}</Text>
          <View style={styles.locationRow}><MapPin size={16} color={theme.colors.textSecondary} /><Text style={styles.locationText}>{request?.hospital?.hospitalProfile?.address || 'Location Hidden'}</Text></View>
          
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12}}>
              {[1,2,3,4,5].map(s => <Star key={s} size={16} color="#FFB100" weight={s <= 4 ? "fill" : "regular"} />)}
              <Text style={{fontSize: 12, color: theme.colors.textSecondary, marginLeft: 4}}>(4.0)</Text>
          </View>

          <Badge label={request?.urgency + ' URGENCY'} variant={request?.urgency === 'CRITICAL' || request?.urgency === 'URGENT' ? 'error' : 'info'} style={{ marginTop: 16 }} />
        </Card>

        {renderJourney()}

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Blood Type</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Drop size={20} color={theme.colors.error} weight="fill" />
              <Text style={[styles.statValue, { fontSize: 20 }]}>{request?.bloodType}</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Donation Type</Text>
            <Text style={styles.statValue}>{formatDonationType(request?.donationType)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, { fontSize: 20 }]}>{Math.max(0, request?.units - request?.unitsFulfilled)} Bags</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Request</Text>
          <View style={styles.reasonBox}><Text style={styles.reasonText}>{request?.reason || "This request was initiated to maintain necessary blood bank levels for emergency procedures."}</Text></View>
        </View>

        <View style={styles.section}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <Text style={styles.sectionTitle}>Reviews for this Donation</Text>
                <Badge label={`${requestReviews?.length || 0} Reviews`} variant="neutral" />
            </View>
            
            {requestReviews?.length > 0 ? (
                requestReviews.map((f: any) => (
                    <View key={f.id} style={styles.feedbackItem}>
                        <View style={styles.feedbackHeader}>
                            <Text style={styles.feedbackUser}>{f.isAnonymous ? 'Anonymous Donor' : (f.donor?.fullName || f.donorName || 'User')}</Text>
                            <View style={{flexDirection: 'row', gap: 2}}>
                                {[1,2,3,4,5].map(s => <Star key={s} size={12} color="#FFB100" weight={s <= f.rating ? "fill" : "regular"} />)}
                            </View>
                        </View>
                        <Text style={styles.feedbackComment}>{f.comment}</Text>
                    </View>
                ))
            ) : (
                <Text style={{color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8}}>No reviews yet for this donation request.</Text>
            )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {activeBooking ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
                style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleCancel}
            >
                <Text style={{ color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setDatePickerVisibility(true)}
            >
                <Text style={{ color: 'white', fontFamily: theme.typography.fontFamilyBold }}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        ) : completedDonation ? (
            <View style={{gap: 12}}>
                {!myReview && (
                    <PrimaryButton 
                        label="Share Your Experience" 
                        onPress={() => navigation.navigate('ReviewForm', { requestId: request.id, hospitalId: request?.hospital?.id })} 
                        style={{
                          backgroundColor: theme.colors.success, 
                          borderWidth: 0,
                          borderRadius: 12,
                          paddingVertical: 16,
                        }}
                        textStyle={{color: 'white', fontWeight: '600'}}
                        leftIcon={<ChatTeardropDots color="white" weight="fill" size={20} />}
                    />
                )}
                {(myReview && (request?.units - request?.unitsFulfilled) > 0) && (
                    <PrimaryButton 
                        label="Schedule Another Visit" 
                        onPress={() => navigation.navigate('BookDonation', { requestId: request.id })} 
                    />
                )}
            </View>
        ) : (
          <>
            {eligibility && !eligibility.isEligible && (
              <View style={styles.eligibilityBox}>
                <Warning size={24} color={theme.colors.error} weight="fill" />
                <Text style={styles.eligibilityText}>
                  You can donate again on {safeFormat(eligibility.nextEligibleDate, 'MMMM d, yyyy')}.
                </Text>
              </View>
            )}
            <PrimaryButton 
              label="Donate Now" 
              onPress={() => navigation.navigate('BookDonation', { requestId: request.id })} 
              disabled={eligibility && !eligibility.isEligible}
              style={(eligibility && !eligibility.isEligible) ? { backgroundColor: theme.colors.border } : {}}
            />
          </>
        )}
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleRescheduleConfirm}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {/* Feedback Modal */}
      <Modal visible={isFeedbackModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Rate Your Experience</Text>
                  <Text style={{textAlign: 'center', color: theme.colors.textSecondary, fontSize: 13}}>How was your donation visit at {request?.hospital?.hospitalProfile?.hospitalName}?</Text>
                  
                  <View style={styles.starRow}>
                      {[1,2,3,4,5].map(s => (
                          <TouchableOpacity key={s} onPress={() => setRating(s)}>
                              <Star size={40} color="#FFB100" weight={s <= rating ? "fill" : "regular"} />
                          </TouchableOpacity>
                      ))}
                  </View>

                  <RNTextInput 
                    style={styles.commentInput}
                    placeholder="Share your thoughts..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    value={comment}
                    onChangeText={setComment}
                  />

                  <View style={{flexDirection: 'row', gap: 12}}>
                      <TouchableOpacity style={{flex: 1, padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface}} onPress={() => setIsFeedbackModalVisible(false)}>
                          <Text style={{textAlign: 'center', fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary}}>Later</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{flex: 2, padding: 16, borderRadius: 16, backgroundColor: theme.colors.primary}}
                        onPress={submitFeedback}
                        disabled={feedbackMutation.isPending}
                      >
                          {feedbackMutation.isPending ? <ActivityIndicator color="white" size="small" /> : <Text style={{textAlign: 'center', fontFamily: theme.typography.fontFamilyBold, color: 'white'}}>Submit Review</Text>}
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
};
