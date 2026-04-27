import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput as RNTextInput, Modal, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, VideoCamera, ChatCircleDots, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Star, X, MapPin, CalendarPlus, ChatTeardropDots, Microphone } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components/BackButton';
import { format, isValid } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const OUTCOMES = ['Completed successfully', 'Patient no-show', 'Technical issues prevented completion', 'Patient ended session early'];
const SERVICES = ['Diagnosis', 'Treatment recommendation', 'Prescription', 'Referral to another specialist', 'General advice / counselling'];
const FOLLOW_UPS = ['No, case resolved', 'Yes, I\'ll follow up within the platform', 'Yes, referred to another specialist', 'Yes, needs in-person visit'];
const FLAGS = ['Patient was unresponsive', 'Patient was abusive/inappropriate', 'Connection problems', 'Other'];

export const SpecialistAppointmentDetailsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { appointmentId, consultationId } = route.params as any || {};
  const queryClient = useQueryClient();

  const idToFetch = consultationId || appointmentId;

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-details', idToFetch],
    queryFn: async () => {
      const res = await api.get(`/consultations/${idToFetch}`);
      return res.data;
    },
    enabled: !!idToFetch
  });

  const [meetingLink, setMeetingLink] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  // Feedback Form State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [providedServices, setServices] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');

  // Voice to Text logic
  const [recognizing, setRecognizing] = useState(false);

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('stop', () => setRecognizing(false));
  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    setRecognizing(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results[0]?.transcript) {
        setNotes(prev => (prev ? `${prev} ${event.results[0].transcript}` : event.results[0].transcript));
    }
  });

  const startListening = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Permission Denied', 'Please allow microphone access to use voice-to-text.');
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const micPulseStyle = useAnimatedStyle(() => {
    if (!recognizing) return { opacity: 1, scale: 1 };
    return {
        opacity: withRepeat(withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true),
        transform: [{ scale: withRepeat(withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true) }]
    };
  });
  const [flag, setFlag] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [labRequestUrl, setLabRequestUrl] = useState('');
  const [uploadingType, setUploadingType] = useState<'prescription' | 'lab' | null>(null);

  useEffect(() => {
      if (consultation) {
          setMeetingLink(consultation.meetingLink || '');
          setMeetingAddress(consultation.meetingAddress || '');
      }
  }, [consultation]);

  const updateMeetingMutation = useMutation({
      mutationFn: () => api.put(`/consultations/${idToFetch}/meeting-details`, { meetingLink, meetingAddress }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details'] });
          Alert.alert('Updated', 'Meeting details have been updated and the patient will be notified.');
      }
  });

  const feedbackMutation = useMutation({
      mutationFn: (data: any) => api.post(`/consultations/${idToFetch}/feedback`, data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details'] });
          setFeedbackModalVisible(false);
          Alert.alert('Success', 'Feedback submitted. Payout will be processed based on feedback criteria.');
      }
  });

  const completeMutation = useMutation({
    mutationFn: () => api.put(`/consultations/${idToFetch}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-details'] });
      setFeedbackModalVisible(true);
    }
  });

  const rescheduleMutation = useMutation({
      mutationFn: (newDate: string) => api.put(`/consultations/${idToFetch}/reschedule`, { scheduledAt: newDate }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details'] });
          Alert.alert('Success', 'Appointment has been rescheduled.');
      },
      onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to reschedule');
      }
  });

  const cancelMutation = useMutation({
      mutationFn: () => api.put(`/consultations/${idToFetch}/cancel`),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['consultation-details', idToFetch] });
          Alert.alert('Cancelled', 'Consultation has been cancelled.');
          navigation.goBack();
      },
      onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel');
      }
  });

  const handleFileUpload = async (type: 'prescription' | 'lab') => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ 
            type: ['application/pdf', 'image/*'], 
            copyToCacheDirectory: true 
        });
        
        if (!result.canceled && result.assets?.[0]) {
            setUploadingType(type);
            const asset = result.assets[0];
            
            const formData = new FormData();
            
            // Create the file object correctly for React Native Fetch/Axios
            const fileToUpload = {
                uri: asset.uri,
                name: asset.name || `file_${Date.now()}`,
                type: asset.mimeType || 'application/octet-stream'
            };
            
            // @ts-ignore
            formData.append('file', fileToUpload);
            
            const uploadRes = await api.post('/users/upload', formData, { 
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                transformRequest: (data) => data, // Essential for FormData in some axios configs
            });

            if (uploadRes.data?.url) {
                if (type === 'prescription') setPrescriptionUrl(uploadRes.data.url);
                else setLabRequestUrl(uploadRes.data.url);
                Alert.alert('Success', `${type === 'prescription' ? 'Prescription' : 'Lab Request'} uploaded.`);
            }
        }
    } catch (error: any) {
        console.error('Upload error:', error);
        const msg = error.response?.data?.message || error.message || 'Failed to upload document';
        Alert.alert('Upload Error', msg);
    } finally {
        setUploadingType(null);
    }
  };

  const toggleService = (svc: string) => {
      if (providedServices.includes(svc)) {
          setServices(providedServices.filter(s => s !== svc));
      } else {
          setServices([...providedServices, svc]);
      }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.xl, gap: 16 },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    content: { padding: 24, paddingBottom: 180 },
    patientCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: theme.colors.surface, borderRadius: 16, marginBottom: 32, gap: 16 },
    patientName: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    infoText: { fontSize: 16, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textPrimary },
    input: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 16, height: 48, fontSize: 14, color: theme.colors.textPrimary },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    optionBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
    optionBtnActive: { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary },
    optionText: { fontSize: 14, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium },
    optionTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold },
    multiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    feedbackInput: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, color: theme.colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border }
  }), [theme]);

  const isMeetingAvailable = useMemo(() => {
    if (!consultation?.scheduledAt) return false;
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledAt);
    const diffInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Show button 30 mins before and up to 4 hours after
    return diffInMinutes <= 30 && diffInMinutes >= -240;
  }, [consultation]);

  const isHeld = consultation?.payoutStatus === 'HELD';
  const isCompleted = consultation?.status === 'COMPLETED';
  const isPaid = consultation?.payoutStatus === 'PAID';
  const isFinalized = consultation?.status === 'PENDING_PAYOUT' || consultation?.status === 'ARCHIVED';
  const isPendingPayout = isFinalized && !isPaid;
  const isUpcoming = consultation?.status === 'UPCOMING' || consultation?.status === 'CONFIRMED';
  const hasFeedback = !!consultation?.specialistFeedback;

  const activeSupportTicket = useMemo(() => {
    if (!consultation?.supportTickets) return null;
    return consultation.supportTickets.find((t: any) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  }, [consultation]);

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>;

  const displayPatientName = consultation?.patient?.fullName || consultation?.patient?.email?.split('@')[0] || 'Patient';

  const handleStartConsultation = async () => {
    // Check if consultation is within 10 minutes
    if (consultation?.scheduledAt) {
        const now = new Date();
        const startTime = new Date(consultation.scheduledAt);
        const tenMinsBefore = new Date(startTime.getTime() - 10 * 60 * 1000);
        
        if (now < tenMinsBefore) {
            Alert.alert('Too Early', 'You can start this consultation 10 minutes before the scheduled time.');
            return;
        }
    }

    try {
        const response = await api.get(`/consultations/${consultation.id}/token`);
        const { token, channelName, appId } = response.data;

        navigation.navigate('AgoraCall', { 
            channelName, 
            consultationId: consultation.id,
            token,
            appId
        });
    } catch (error) {
        console.error('Error fetching Agora token:', error);
        Alert.alert('Connection Error', 'Could not secure a video connection. Please try again.');
    }
  };

  // Status Badge Logic
  let statusLabel = consultation?.status;
  let statusVariant = 'info';

  if (isHeld) {
      statusLabel = 'Under Review';
      statusVariant = 'error';
  } else if (isPaid || isCompleted) {
      statusLabel = 'Completed';
      statusVariant = 'success';
  } else if (isPendingPayout) {
      statusLabel = 'Pending Payout';
      statusVariant = 'warning';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Consultation Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.patientCard}>
          <Avatar name={displayPatientName} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{displayPatientName}</Text>
            <Badge 
                label={statusLabel} 
                variant={statusVariant} 
            />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { roomId: consultation.id, otherUserName: displayPatientName })}>
            <ChatTeardropDots color={theme.colors.primary} size={32} weight="fill" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}><CalendarIcon size={20} color={theme.colors.primary} /><Text style={styles.infoText}>{safeFormat(consultation?.scheduledAt || consultation?.createdAt, 'PPPP')}</Text></View>
          <View style={styles.infoRow}><Clock size={20} color={theme.colors.primary} /><Text style={styles.infoText}>{safeFormat(consultation?.scheduledAt || consultation?.createdAt, 'p')}</Text></View>
        </View>

        {isUpcoming && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Update Meeting Details</Text>
                <RNTextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Meeting Link or Address" value={meetingLink || meetingAddress} onChangeText={setMeetingLink} />
                <PrimaryButton label="Save Meeting Info" onPress={() => updateMeetingMutation.mutate()} isLoading={updateMeetingMutation.isPending} variant="outlined" />
            </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={[styles.infoRow, { justifyContent: 'space-between' }]}><Text style={{ color: theme.colors.textSecondary }}>Your Payout (80%)</Text><Text style={{ fontFamily: theme.typography.fontFamilyBold, color: theme.colors.success }}>NGN {Number(consultation?.specialistPayout).toLocaleString()}</Text></View>
          <View style={[styles.infoRow, { justifyContent: 'space-between' }]}><Text style={{ color: theme.colors.textSecondary }}>Payout Status</Text><Badge label={consultation?.payoutStatus} variant={isHeld ? 'error' : 'flat'} /></View>
          
          {(isHeld || (isPendingPayout && !hasFeedback)) && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: isHeld ? theme.colors.error + '10' : theme.colors.warning + '10', borderRadius: 8, borderWidth: 1, borderColor: isHeld ? theme.colors.error + '20' : theme.colors.warning + '20' }}>
                <Text style={{ fontSize: 13, color: isHeld ? theme.colors.error : theme.colors.warning, fontFamily: theme.typography.fontFamilyBold, marginBottom: 4 }}>
                    {isHeld ? 'Why is this withheld?' : 'Action Required'}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyMedium }}>
                    {isHeld ? (consultation?.payoutNote || 'Waiting for patient feedback or admin review.') : 'Please submit your consultation feedback to release the payout.'}
                </Text>
                {isHeld && activeSupportTicket && (
                    <TouchableOpacity 
                        style={{ marginTop: 12, backgroundColor: theme.colors.error, paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        onPress={() => navigation.navigate('Chat', { 
                            roomId: activeSupportTicket.id, 
                            otherUserName: 'Rubimedik Support',
                            isSupport: true,
                            ticketStatus: activeSupportTicket.status
                        })}
                    >
                        <ChatTeardropDots color="white" size={18} weight="fill" />
                        <Text style={{ color: 'white', fontFamily: theme.typography.fontFamilyBold, fontSize: 13 }}>Resolve with Support</Text>
                    </TouchableOpacity>
                )}
            </View>
          )}
        </View>
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
                        onPress={() => Alert.alert('Cancel', 'Are you sure you want to cancel this appointment?', [{ text: 'No' }, { text: 'Yes, Cancel', onPress: () => cancelMutation.mutate(), style: 'destructive' }])}
                      >
                          <XCircle size={20} color={theme.colors.error} weight="bold" />
                          <Text style={{ color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold }}>Cancel</Text>
                      </TouchableOpacity>
                  </View>

                  {isMeetingAvailable ? (
                    <PrimaryButton label="Start Consultation" onPress={handleStartConsultation} icon={<VideoCamera color="white" weight="fill" size={20} />} />
                  ) : (
                    <TouchableOpacity 
                        style={{ padding: 16, alignItems: 'center', backgroundColor: theme.colors.success + '15', borderRadius: 12 }}
                        onPress={() => Alert.alert('Confirm Completion', 'Mark this as meeting completed? You must provide feedback to release payment.', [{ text: 'Cancel' }, { text: 'Confirm', onPress: () => completeMutation.mutate() }])}
                    >
                        <Text style={{ color: theme.colors.success, fontFamily: theme.typography.fontFamilyBold }}>End Meeting & Complete</Text>
                    </TouchableOpacity>
                  )}
              </>
          )}

          {isPendingPayout && !hasFeedback && (
              <PrimaryButton label="Submit Meeting Feedback" onPress={() => setFeedbackModalVisible(true)} />
          )}

          {hasFeedback && (
            <View style={{ alignItems: 'center' }}><CheckCircle size={24} color={theme.colors.success} weight="fill" /><Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Feedback Submitted</Text></View>
          )}
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onConfirm={(date) => {
            setDatePickerVisible(false);
            rescheduleMutation.mutate(date.toISOString());
        }}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={new Date()}
        textColor={isDarkMode ? '#FFFFFF' : '#000000'}
      />

      <Modal visible={feedbackModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                          <Text style={{ fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }}>Specialist Feedback</Text>
                          <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}><X size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
                      </View>

                      <Text style={styles.sectionTitle}>1. Consultation Outcome</Text>
                      {OUTCOMES.map(o => (
                          <TouchableOpacity key={o} style={[styles.optionBtn, outcome === o && styles.optionBtnActive]} onPress={() => setOutcome(o)}>
                              <Text style={[styles.optionText, outcome === o && styles.optionTextActive]}>{o}</Text>
                          </TouchableOpacity>
                      ))}

                      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>2. What was provided?</Text>
                      <View style={styles.multiGrid}>
                          {SERVICES.map(s => (
                              <TouchableOpacity key={s} style={[styles.optionBtn, providedServices.includes(s) && styles.optionBtnActive]} onPress={() => toggleService(s)}>
                                  <Text style={[styles.optionText, providedServices.includes(s) && styles.optionTextActive]}>{s}</Text>
                              </TouchableOpacity>
                          ))}
                      </View>

                      <Text style={styles.sectionTitle}>3. Follow-up Needed?</Text>
                      {FOLLOW_UPS.map(f => (
                          <TouchableOpacity key={f} style={[styles.optionBtn, followUp === f && styles.optionBtnActive]} onPress={() => setFollowUp(f)}>
                              <Text style={[styles.optionText, followUp === f && styles.optionTextActive]}>{f}</Text>
                          </TouchableOpacity>
                      ))}

                      {outcome !== 'Completed successfully' && outcome !== '' && (
                          <>
                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>4. What was the issue? (Flag)</Text>
                            {FLAGS.map(fl => (
                                <TouchableOpacity key={fl} style={[styles.optionBtn, flag === fl && styles.optionBtnActive]} onPress={() => setFlag(fl)}>
                                    <Text style={[styles.optionText, flag === fl && styles.optionTextActive]}>{fl}</Text>
                                </TouchableOpacity>
                            ))}
                          </>
                      )}

                      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>5. Consultation Notes (Private)</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <RNTextInput 
                            style={[styles.feedbackInput, { flex: 1 }]} 
                            placeholder="Brief clinical observations..." 
                            multiline 
                            value={notes} 
                            onChangeText={setNotes} 
                        />
                        <Animated.View style={micPulseStyle}>
                            <TouchableOpacity 
                                onPressIn={startListening}
                                onPressOut={stopListening}
                                style={{ 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: 22, 
                                    backgroundColor: recognizing ? theme.colors.error : theme.colors.primary + '15',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 4
                                }}
                            >
                                <Microphone color={recognizing ? 'white' : theme.colors.primary} size={22} weight={recognizing ? "fill" : "regular"} />
                            </TouchableOpacity>
                        </Animated.View>
                      </View>

                      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>6. Medical Records (Optional)</Text>
                      <View style={{ gap: 12, marginBottom: 20 }}>
                          <TouchableOpacity 
                            style={[styles.optionBtn, prescriptionUrl && styles.optionBtnActive, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                            onPress={() => handleFileUpload('prescription')}
                          >
                              <Text style={[styles.optionText, prescriptionUrl && styles.optionTextActive]}>
                                  {prescriptionUrl ? '✓ Prescription Attached' : 'Upload Prescription (PDF/Image)'}
                              </Text>
                              {uploadingType === 'prescription' && <ActivityIndicator size="small" color={theme.colors.primary} />}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[styles.optionBtn, labRequestUrl && styles.optionBtnActive, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                            onPress={() => handleFileUpload('lab')}
                          >
                              <Text style={[styles.optionText, labRequestUrl && styles.optionTextActive]}>
                                  {labRequestUrl ? '✓ Lab Request Attached' : 'Upload Lab Request (PDF/Image)'}
                              </Text>
                              {uploadingType === 'lab' && <ActivityIndicator size="small" color={theme.colors.primary} />}
                          </TouchableOpacity>
                      </View>

                      <PrimaryButton 
                        label="Submit & Process Payout" 
                        style={{ marginTop: 24 }}
                        onPress={() => feedbackMutation.mutate({ outcome, providedServices, followUp, notes, flag, prescriptionUrl, labRequestUrl })}
                        isLoading={feedbackMutation.isPending}
                        disabled={!outcome || !followUp || uploadingType !== null}
                      />
                  </ScrollView>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
};
