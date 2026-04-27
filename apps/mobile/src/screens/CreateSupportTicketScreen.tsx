import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CaretLeft, CaretDown, CheckCircle, Info } from 'phosphor-react-native';
import { PrimaryButton, BackButton, Select, Card } from '../components';
import { SupportTicketCategory, UserRole } from '@repo/shared';

export const CreateSupportTicketScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<SupportTicketCategory>(route.params?.category || SupportTicketCategory.GENERAL_INQUIRY);
  const [subject, setSubject] = useState(route.params?.subject || '');
  const [message, setMessage] = useState('');
  const [consultationId, setConsultationId] = useState<string | undefined>(route.params?.consultationId);
  const [donationMatchId, setDonationMatchId] = useState<string | undefined>();

  useEffect(() => {
    // Clear selections if category changes
    setConsultationId(undefined);
    setDonationMatchId(undefined);
  }, [category]);

  const isMedicalDispute = category === SupportTicketCategory.BILLING_DISPUTE || category === SupportTicketCategory.CONSULTATION_DISPUTE;
  const isDonationDispute = category === SupportTicketCategory.DONATION_DISPUTE;
  const isAnyDispute = isMedicalDispute || isDonationDispute;

  // Fetch data based on dispute type
  const { data: relatedItems, isLoading: isDataLoading } = useQuery({
    queryKey: ['ticket-related-items', category],
    queryFn: async () => {
      if (isMedicalDispute) {
        const res = await api.get('/consultations/my');
        return res.data;
      } else if (isDonationDispute) {
        // If hospital, get hospital matches. If donor, get my donations.
        const endpoint = user?.activeRole === UserRole.HOSPITAL ? '/donations/hospital/matches' : '/donations/my';
        const res = await api.get(endpoint);
        return res.data;
      }
      return [];
    },
    enabled: isAnyDispute
  });

  const isMedicalRole = user?.activeRole === UserRole.PATIENT || user?.activeRole === UserRole.SPECIALIST;
  const isDonationRole = user?.activeRole === UserRole.DONOR || user?.activeRole === UserRole.HOSPITAL;

  const categories = useMemo(() => [
    { label: 'General Inquiry', value: SupportTicketCategory.GENERAL_INQUIRY },
    ...(isMedicalRole ? [
        { label: 'Consultation Dispute', value: SupportTicketCategory.CONSULTATION_DISPUTE },
        { label: 'Billing / Payout Dispute', value: SupportTicketCategory.BILLING_DISPUTE }
    ] : []),
    { label: 'Technical Issue', value: SupportTicketCategory.TECHNICAL_ISSUE },
    { label: 'Account Access', value: SupportTicketCategory.ACCOUNT_ISSUE },
    ...(isDonationRole ? [{ label: 'Donation Issue', value: SupportTicketCategory.DONATION_DISPUTE }] : []),
  ], [isMedicalRole, isDonationRole]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/support/tickets', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      Alert.alert('Ticket Created', 'Your support ticket has been created. Our AI assistant will help you initially, and can escalate to a human agent if needed.', [
          { text: 'Open Chat', onPress: () => navigation.replace('Chat', { 
              roomId: data.chatRoom.id, 
              otherUserName: 'Support Chat',
              isSupport: true 
          }) }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create support ticket');
    }
  });

  const handleSubmit = () => {
    if (!subject.trim()) return Alert.alert('Error', 'Please enter a subject');
    if (!message.trim()) return Alert.alert('Error', 'Please enter your message');
    
    createMutation.mutate({
      category,
      subject,
      initialMessage: message,
      consultationId,
      donationMatchId
    });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingHorizontal: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 12,
    },
    content: { padding: 24 },
    label: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      fontFamily: theme.typography.fontFamily,
      fontSize: 15,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textArea: {
      minHeight: 150,
      textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 6,
        fontStyle: 'italic',
    },
    consultationCard: {
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectedConsultation: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '05',
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>New Support Ticket</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>What can we help you with?</Text>
          <Select 
            options={categories}
            value={category}
            onChange={(val: any) => setCategory(val as SupportTicketCategory)}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput 
            style={styles.input}
            placeholder="Brief summary of the issue"
            value={subject}
            onChangeText={setSubject}
          />

          {isAnyDispute ? (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>Select Related {isMedicalDispute ? 'Consultation' : 'Donation'}</Text>
                {isDataLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 10 }} />
                ) : relatedItems && relatedItems.length > 0 ? (
                    relatedItems.slice(0, 5).map((item: any) => {
                        const isSelected = isMedicalDispute ? consultationId === item.id : donationMatchId === item.id;
                        const title = isMedicalDispute 
                            ? (item.specialist?.user?.fullName || 'Medical Session')
                            : (user?.activeRole === UserRole.HOSPITAL ? (item.donor?.fullName || 'Donor') : (item.request?.hospital?.hospitalProfile?.hospitalName || 'Hospital'));
                            
                        const date = new Date(item.scheduledAt || item.scheduledDate || item.createdAt).toLocaleDateString();
                        const subTitle = isMedicalDispute ? item.status : `${item.request?.bloodType || ''} • ${item.status}`;

                        return (
                            <TouchableOpacity 
                                key={item.id} 
                                style={[styles.consultationCard, isSelected && styles.selectedConsultation]}
                                onPress={() => {
                                    if (isMedicalDispute) setConsultationId(item.id);
                                    else setDonationMatchId(item.id);
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{title}</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{date} • {subTitle}</Text>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <Text style={styles.helperText}>No {isMedicalDispute ? 'consultations' : 'donations'} found to dispute.</Text>
                )}
              </View>
          ) : null}

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Provide as much detail as possible..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />
          <Text style={styles.helperText}>Rubimedik Support AI will respond to you instantly.</Text>

          <View style={{ marginTop: 40, marginBottom: 60 }}>
            <PrimaryButton 
              label="Create Ticket" 
              onPress={handleSubmit}
              isLoading={createMutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
