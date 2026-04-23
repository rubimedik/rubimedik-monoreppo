import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, VideoCamera, ChatCircleDots, Calendar as CalendarIcon, Clock, Star, X, CheckCircle, FileText, DownloadSimple, Prescription as PrescriptionIcon, XCircle, CalendarPlus } from 'phosphor-react-native';
import * as Print from 'expo-print';
import { generateInvoiceHtml } from '../utils/invoiceTemplate';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Avatar, Card, Badge, PrimaryButton, BackButton } from '../components';
import { format, isValid } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const YES_NO = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
];

export const ConsultationDetailScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { consultationId, action } = route.params as any || {};
  const queryClient = useQueryClient();

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  // Advanced Payout Signal Questions
  const [didSpecialistShow, setDidSpecialistShow] = useState('');
  const [offPlatformContact, setOffPlatformContact] = useState('');
  const [receiveDiagnosis, setReceiveDiagnosis] = useState('');
  
  // Referral feedback questions
  const [referredToHospital, setReferredToHospital] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [referredToSpecialist, setReferredToSpecialist] = useState('');
  const [specialistName, setSpecialistName] = useState('');

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-details', consultationId],
    queryFn: async () => {
      const res = await api.get(`/consultations/${consultationId}`);
      return res.data;
    },
    enabled: !!consultationId
  });

  const reviewMutation = useMutation({
    mutationFn: (data: any) => 
        api.post(`/consultations/${consultationId}/feedback`, data),
    onSuccess: () => {
        Alert.alert('Thank you!', 'Your feedback has been submitted. Payment release is being programmatically evaluated.');
        setReviewModalVisible(false);
        queryClient.invalidateQueries({ queryKey: ['consultation-details'] });
    },
    onError: (err: any) => {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to submit feedback');
    }
  });

  const rescheduleMutation = useMutation({
      mutationFn: (newDate: string) => api.put(`/consultations/${consultationId}/reschedule`, { scheduledAt: newDate }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details', consultationId] });
          Alert.alert('Success', 'Appointment has been rescheduled.');
      },
      onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to reschedule');
      }
  });

  const cancelMutation = useMutation({
      mutationFn: () => api.put(`/consultations/${consultationId}/cancel`),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details', consultationId] });
          Alert.alert('Cancelled', 'Appointment has been cancelled.');
          navigation.goBack();
      },
      onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel');
      }
  });

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
        { text: 'No' },
        { text: 'Yes, Cancel', onPress: () => cancelMutation.mutate(), style: 'destructive' }
    ]);
  };

  useEffect(() => {
    if (action === 'cancel' && consultation && (consultation.status === 'UPCOMING' || consultation.status === 'CONFIRMED')) {
        handleCancel();
    } else if (action === 'reschedule' && consultation && (consultation.status === 'UPCOMING' || consultation.status === 'CONFIRMED')) {
        setDatePickerVisible(true);
    }
  }, [action, consultation]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.xl, gap: 16 },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    content: { padding: 24, paddingBottom: 120 },
    doctorCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 32, gap: 16 },
    doctorName: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    infoText: { fontSize: 16, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textPrimary },
    notesBox: { padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
    notesText: { fontSize: 14, fontFamily: theme.typography.fontFamily, color: theme.colors.textPrimary, lineHeight: 22 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    optionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
    optionBtnActive: { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary },
    optionText: { fontSize: 13, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium },
    optionTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold },
    toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    reviewInput: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, color: theme.colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border },
    smallInput: { backgroundColor: theme.colors.surface, borderRadius: 10, paddingHorizontal: 12, height: 40, marginTop: -8, marginBottom: 16, fontSize: 13, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border },
    recordsSection: { marginTop: 8, paddingVertical: 20, borderTopWidth: 1, borderTopColor: theme.colors.border },
    recordsGrid: { flexDirection: 'row', gap: 12 },
    recordItem: { flex: 1, alignItems: 'center', gap: 6 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recordLabel: { fontSize: 11, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textPrimary }
  }), [theme]);

  const isMeetingAvailable = useMemo(() => {
    if (!consultation?.scheduledAt) return false;
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledAt);
    const diffInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Show button 30 mins before and up to 4 hours after
    return diffInMinutes <= 30 && diffInMinutes >= -240;
  }, [consultation]);

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>;

  if (!styles || !styles.container) return null;

  const isCompleted = consultation?.status === 'COMPLETED';
  const isPendingPayout = consultation?.status === 'PENDING_PAYOUT';
  const isUpcoming = consultation?.status === 'UPCOMING' || consultation?.status === 'CONFIRMED';
  const hasFeedback = !!consultation?.patientFeedback;

  const handleJoinMeeting = () => {
    if (consultation?.meetingLink) {
        Linking.openURL(consultation.meetingLink).catch(() => Alert.alert('Error', 'Could not open link.'));
    } else {
        Alert.alert('Meeting Info', 'The specialist has not provided a link yet.');
    }
  };

  const handleViewFile = (url: string | undefined, title: string) => {
    if (!url) {
        Alert.alert('Not Available', `The ${title.toLowerCase()} has not been uploaded yet.`);
        return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open document.'));
  };

  const handlePrintInvoice = async () => {
    try {
        const html = generateInvoiceHtml(consultation);
        await Print.printAsync({ html });
    } catch (e) {
        Alert.alert('Error', 'Failed to generate invoice.');
    }
  };

  const handleSubmitFeedback = () => {
      reviewMutation.mutate({
          rating,
          comment,
          didSpecialistShow,
          offPlatformContact,
          receiveDiagnosis,
          referredToHospital: referredToHospital === 'Yes',
          hospitalName: referredToHospital === 'Yes' ? hospitalName : null,
          referredToSpecialist: referredToSpecialist === 'Yes',
          specialistName: referredToSpecialist === 'Yes' ? specialistName : null,
      });
  };

  const displaySpecialistName = consultation?.specialist?.fullName || consultation?.specialist?.user?.email?.split('@')[0] || 'Specialist';
  const avatarName = consultation?.specialist?.fullName || consultation?.specialist?.user?.email || 'User';
  const specialistPhone = consultation?.specialist?.user?.phoneNumber;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Appointment Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <Avatar name={avatarName} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{displaySpecialistName}</Text>
            <Badge label={consultation?.status} variant={isCompleted ? 'success' : isPendingPayout ? 'warning' : 'info'} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { roomId: consultation.id, otherUserName: displaySpecialistName, otherPhone: specialistPhone })}>
            <ChatCircleDots color={theme.colors.primary} size={32} weight="fill" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <CalendarIcon size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{safeFormat(consultation?.scheduledAt || consultation?.createdAt, 'PPPP')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{safeFormat(consultation?.scheduledAt || consultation?.createdAt, 'p')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={[styles.infoRow, { justifyContent: 'space-between' }]}><Text style={{ color: theme.colors.textSecondary }}>Fee Paid</Text><Text style={{ fontFamily: theme.typography.fontFamilyBold }}>NGN {Number(consultation?.totalFee).toLocaleString()}</Text></View>
          <View style={[styles.infoRow, { justifyContent: 'space-between' }]}><Text style={{ color: theme.colors.textSecondary }}>Payout Status</Text><Badge label={consultation?.payoutStatus} variant="neutral" /></View>
        </View>

        {isCompleted && (
            <View style={styles.recordsSection}>
                <Text style={styles.sectionTitle}>Medical Records</Text>
                <View style={styles.recordsGrid}>
                    <TouchableOpacity 
                        style={[styles.recordItem, !consultation.prescriptionUrl && { opacity: 0.4 }]}
                        onPress={() => handleViewFile(consultation.prescriptionUrl, 'Prescription')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
                            <PrescriptionIcon size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.recordLabel}>Prescription</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.recordItem, !consultation.labReportUrl && { opacity: 0.4 }]}
                        onPress={() => handleViewFile(consultation.labReportUrl, 'Lab Report')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                            <FileText size={20} color="#7B1FA2" />
                        </View>
                        <Text style={styles.recordLabel}>Lab Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.recordItem}
                        onPress={handlePrintInvoice}
                    >
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.success + '15' }]}>
                            <DownloadSimple size={20} color={theme.colors.success} />
                        </View>
                        <Text style={styles.recordLabel}>Invoice</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isUpcoming && (
            <>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }}
                    onPress={() => setDatePickerVisible(true)}
                    >
                        <CalendarPlus size={20} color={theme.colors.primary} weight="bold" />
                        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold }}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.error + '10', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }}
                    onPress={handleCancel}
                    >
                        <XCircle size={20} color={theme.colors.error} weight="bold" />
                        <Text style={{ color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold }}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                {isMeetingAvailable ? (
                    <PrimaryButton label="Join Consultation" onPress={handleJoinMeeting} icon={<VideoCamera color="white" weight="fill" size={20} />} />
                ) : (
                    <View style={{ padding: 16, backgroundColor: theme.colors.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                        <Clock size={20} color={theme.colors.textSecondary} />
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                            The join button will appear 30 minutes before your scheduled time.
                        </Text>
                    </View>
                )}
            </>
        )}

        {(isCompleted || isPendingPayout) && !hasFeedback && (
          <PrimaryButton label="Rate Your Experience" variant="outlined" onPress={() => setReviewModalVisible(true)} />
        )}

        {hasFeedback && (
            <View style={{ alignItems: 'center' }}><CheckCircle size={24} color={theme.colors.success} weight="fill" /><Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Feedback Submitted</Text></View>
        )}
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={(date) => {
            setDatePickerVisible(false);
            rescheduleMutation.mutate(date.toISOString());
        }}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={new Date()}
      />

      <Modal visible={reviewModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }}>Patient Feedback</Text>
                        <TouchableOpacity onPress={() => setReviewModalVisible(false)}><X size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Star size={32} color={star <= rating ? '#FFB100' : theme.colors.border} weight={star <= rating ? 'fill' : 'regular'} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>1. Consultation Check</Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>Did the specialist show up on time?</Text>
                    <View style={styles.toggleRow}>
                        {YES_NO.map(y => <TouchableOpacity key={y.value} style={[styles.optionBtn, didSpecialistShow === y.value && styles.optionBtnActive]} onPress={() => setDidSpecialistShow(y.value)}><Text style={[styles.optionText, didSpecialistShow === y.value && styles.optionTextActive]}>{y.label}</Text></TouchableOpacity>)}
                    </View>

                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>Did the specialist request payment outside the platform?</Text>
                    <View style={styles.toggleRow}>
                        {YES_NO.map(y => <TouchableOpacity key={y.value} style={[styles.optionBtn, offPlatformContact === y.value && styles.optionBtnActive]} onPress={() => setOffPlatformContact(y.value)}><Text style={[styles.optionText, offPlatformContact === y.value && styles.optionTextActive]}>{y.label}</Text></TouchableOpacity>)}
                    </View>

                    <Text style={styles.sectionTitle}>2. Quality of Care</Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>Did you receive a diagnosis or next steps?</Text>
                    <View style={styles.toggleRow}>
                        {YES_NO.map(y => <TouchableOpacity key={y.value} style={[styles.optionBtn, receiveDiagnosis === y.value && styles.optionBtnActive]} onPress={() => setReceiveDiagnosis(y.value)}><Text style={[styles.optionText, receiveDiagnosis === y.value && styles.optionTextActive]}>{y.label}</Text></TouchableOpacity>)}
                    </View>

                    <Text style={styles.sectionTitle}>3. Referrals</Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>Were you referred to a hospital?</Text>
                    <View style={styles.toggleRow}>
                        {YES_NO.map(y => <TouchableOpacity key={y.value} style={[styles.optionBtn, referredToHospital === y.value && styles.optionBtnActive]} onPress={() => setReferredToHospital(y.value)}><Text style={[styles.optionText, referredToHospital === y.value && styles.optionTextActive]}>{y.label}</Text></TouchableOpacity>)}
                    </View>
                    {referredToHospital === 'Yes' && <TextInput style={styles.smallInput} placeholder="Hospital Name" value={hospitalName} onChangeText={setHospitalName} />}

                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 }}>Were you referred to another specialist?</Text>
                    <View style={styles.toggleRow}>
                        {YES_NO.map(y => <TouchableOpacity key={y.value} style={[styles.optionBtn, referredToSpecialist === y.value && styles.optionBtnActive]} onPress={() => setReferredToSpecialist(y.value)}><Text style={[styles.optionText, referredToSpecialist === y.value && styles.optionTextActive]}>{y.label}</Text></TouchableOpacity>)}
                    </View>
                    {referredToSpecialist === 'Yes' && <TextInput style={styles.smallInput} placeholder="Specialist Name" value={specialistName} onChangeText={setSpecialistName} />}

                    <TextInput style={[styles.reviewInput, { marginBottom: 20 }]} placeholder="Additional comments (optional)..." multiline value={comment} onChangeText={setComment} />

                    <PrimaryButton label="Submit & Resolve" onPress={handleSubmitFeedback} isLoading={reviewMutation.isPending} disabled={!didSpecialistShow || !offPlatformContact || !receiveDiagnosis} />
                  </ScrollView>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
};
