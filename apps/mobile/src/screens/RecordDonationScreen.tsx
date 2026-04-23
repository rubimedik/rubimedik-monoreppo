import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { CaretLeft, Drop, Calendar as CalendarIcon, User as UserIcon, ListChecks, ArrowRight, Check, CaretDown, Spinner } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

import { Swipeable, Pressable as GHPressable } from 'react-native-gesture-handler';

export const RecordDonationScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const [donorEmail, setDonorEmail] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [donationType, setDonationType] = useState('whole_blood');
  const [units, setUnits] = useState('');
  const [donationDate, setDonationDate] = useState(new Date());
  const [requestId, setRequestId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [showBloodTypePicker, setShowBloodTypePicker] = useState(false);
  const [showDonationTypePicker, setShowDonationTypePicker] = useState(false);
  const [showRequestPicker, setShowRequestPicker] = useState(false);

  const DONATION_TYPES = [
    { label: 'Whole Blood', value: 'whole_blood' },
    { label: 'Platelet', value: 'platelet' },
    { label: 'Double Red Cell', value: 'double_red_cell' },
  ];

  // Fetch match details directly from route params
  const matchIdFromParams = route.params?.matchId;
  
  const { data: matchDetails, isLoading: matchLoading } = useQuery({
    queryKey: ['match-details', matchIdFromParams],
    queryFn: async () => {
      if (!matchIdFromParams) return null;
      const res = await api.get(`/donations/matches/${matchIdFromParams}`);
      return res.data;
    },
    enabled: !!matchIdFromParams,
  });

  // Fetch active requests for picker
  const { data: requests } = useQuery({
    queryKey: ['active-requests'],
    queryFn: async () => {
      const res = await api.get('/donations/requests?status=PENDING');
      return res.data;
    },
  });

  // Auto-fill when match details are loaded
  useEffect(() => {
    if (matchDetails && !matchLoading) {
      console.log('Match details loaded for pre-fill:', matchDetails.id);
      
      // Prefill donor email
      if (matchDetails.donor?.email) {
        setDonorEmail(matchDetails.donor.email);
      }
      
      // Prefill blood type - check donor first, then request
      const bType = matchDetails.donor?.bloodType || matchDetails.request?.bloodType;
      if (bType) {
        setBloodType(bType);
      }
      
      // Prefill donation type
      if (matchDetails.donationType || matchDetails.request?.donationType) {
        setDonationType(matchDetails.donationType || matchDetails.request?.donationType);
      }
      
      // Prefill request ID
      if (matchDetails.request?.id) {
        setRequestId(matchDetails.request.id);
      }
      
      // Prefill date - use current date for recording the actual event
      setDonationDate(new Date());
      
      // Always prefill units as 1 (standard)
      setUnits('1');

      // Set matchId to ensure completion logic works
      setMatchId(matchIdFromParams);
    }
  }, [matchDetails, matchLoading, matchIdFromParams]);

  const donorDisplayName = useMemo(() => {
    if (!matchDetails) return 'Record Donation';
    if (matchDetails.isAnonymous) return 'Anonymous Donor';
    return matchDetails.donor?.fullName || matchDetails.donor?.email?.split('@')[0] || 'Donor';
  }, [matchDetails]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
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
    content: {
      padding: theme.spacing.xl,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      fontFamily: theme.typography.fontFamily,
    },
    form: {
      gap: 20,
    },
    pickerTrigger: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    pickerLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    activeRequestCard: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    submitButton: {
      marginTop: 12,
    },
    dropdownModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    dropdownContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40,
      maxHeight: 400,
    },
    dropdownHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginVertical: 12,
    },
    dropdownTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 16,
    },
    dropdownItem: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    dropdownItemSelected: {
      backgroundColor: theme.colors.primary + '10',
    },
    checkIcon: {
      color: theme.colors.primary,
    },
  }), [theme, isDarkMode, showBloodTypePicker, showDonationTypePicker, showRequestPicker]);

  const recordMutation = useMutation({
    mutationFn: async (data: any) => {
      // If we have a matchId, the backend recordDonation will now handle 
      // updating that specific match to COMPLETED instead of creating a duplicate.
      await api.post('/donations/record', {
        ...data,
        matchId: matchId // Include matchId in the payload
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-stats'] });
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-matches'] });
      queryClient.invalidateQueries({ queryKey: ['hospital-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['donor-stats'] });
      Alert.alert('Success', 'Donation recorded and marked as completed!');
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to record donation.';
      Alert.alert('Error', Array.isArray(message) ? message.join('\n') : message);
    }
  });

  const handleRecord = () => {
    if (!donorEmail || !bloodType || !units || !donationType) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const unitsCount = parseInt(units, 10);
    if (unitsCount > 1) {
      Alert.alert('Error', 'Maximum 1 unit allowed per donation.');
      return;
    }

    recordMutation.mutate({
      donorEmail,
      bloodType,
      donationType,
      units: unitsCount,
      donationDate: donationDate.toISOString(),
      requestId
    });
  };

  const handleRequestSelect = (request: any) => {
    setRequestId(request.id);
    setBloodType(request.bloodType);
    setDonationType(request.donationType || 'whole_blood');
    setShowRequestPicker(false);
  };

  const formatDonationType = (val: string) => {
    return DONATION_TYPES.find(t => t.value === val)?.label || val;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <GHPressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CaretLeft weight="bold" color={theme.colors.textPrimary} size={24} />
          </GHPressable>
          <Text style={styles.headerTitle}>{donorDisplayName}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Recording a donation linked to an active request will automatically update that request's progress.
            </Text>
          </View>

          <View style={styles.form}>
            {matchLoading && (
              <View style={styles.infoCard}>
                <Spinner size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>Loading donor details...</Text>
              </View>
            )}
            <View>
              <Text style={styles.pickerLabel}>Link to Request (Optional)</Text>
              <TouchableOpacity 
                style={[styles.pickerTrigger, requestId ? styles.activeRequestCard : null]} 
                onPress={() => setShowRequestPicker(true)}
                disabled={!!matchId} // Disable if recording from a specific match
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ListChecks size={24} color={requestId ? theme.colors.primary : theme.colors.textSecondary} />
                  <Text style={{ color: requestId ? theme.colors.primary : theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium }}>
                    {requestId && (matchDetails?.request || requests?.find((r:any) => r.id === requestId)) ? `Request for ${(matchDetails?.request || requests?.find((r:any) => r.id === requestId)).hospital?.hospitalProfile?.hospitalName || (matchDetails?.request || requests?.find((r:any) => r.id === requestId)).hospital?.fullName}` : requestId ? 'Request Linked' : 'Select an active request'}
                  </Text>
                </View>
                {!matchId && <CaretDown size={20} color={theme.colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            <TextInput
              label="Donor Email Address"
              placeholder="email@example.com"
              value={donorEmail}
              onChangeText={setDonorEmail}
              editable={!matchId} // Disable if recording from a specific match
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<UserIcon size={20} color={theme.colors.textSecondary} />}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pickerLabel}>Blood Type</Text>
                    <TouchableOpacity 
                        style={[styles.pickerTrigger, bloodType ? styles.activeRequestCard : null]} 
                        onPress={() => setShowBloodTypePicker(true)}
                        disabled={!!matchId}
                    >
                        <Text style={{ color: bloodType ? theme.colors.textPrimary : theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium }}>
                            {bloodType || 'Select'}
                        </Text>
                        {!matchId && <CaretDown size={16} color={theme.colors.textSecondary} />}
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1.5 }}>
                    <Text style={styles.pickerLabel}>Donation Type</Text>
                    <TouchableOpacity 
                        style={[styles.pickerTrigger, donationType ? styles.activeRequestCard : null]} 
                        onPress={() => setShowDonationTypePicker(true)}
                        disabled={!!matchId}
                    >
                        <Text style={{ color: donationType ? theme.colors.textPrimary : theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium }} numberOfLines={1}>
                            {formatDonationType(donationType) || 'Select'}
                        </Text>
                        {!matchId && <CaretDown size={16} color={theme.colors.textSecondary} />}
                    </TouchableOpacity>
                </View>
            </View>

            <TextInput
              label="Units Donated (Bags)"
              placeholder="Enter units donated (Max 1)"
              value={units}
              onChangeText={(text) => {
                const val = text.replace(/[^0-9]/g, '');
                if (val === '' || parseInt(val, 10) <= 1) {
                  setUnits(val);
                } else {
                  Alert.alert('Limit Exceeded', 'Maximum 1 unit allowed per donation.');
                }
              }}
              keyboardType="numeric"
              maxLength={1}
              leftIcon={<Drop size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Donation Date"
              placeholder={safeFormat(donationDate, 'PPP')}
              value={safeFormat(donationDate, 'PPP')}
              editable={false}
              leftIcon={<CalendarIcon size={20} color={theme.colors.textSecondary} />}
            />

            <PrimaryButton 
              label="Confirm & Record" 
              onPress={handleRecord} 
              isLoading={recordMutation.isPending}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>

        {/* Blood Type Dropdown Modal */}
        <Modal visible={showBloodTypePicker} transparent animationType="slide">
          <Pressable style={styles.dropdownModal} onPress={() => setShowBloodTypePicker(false)}>
            <Pressable style={styles.dropdownContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownHandle} />
              <Text style={styles.dropdownTitle}>Select Blood Type</Text>
              {BLOOD_TYPES.map((type) => (
                <TouchableOpacity 
                  key={type}
                  style={[styles.dropdownItem, bloodType === type && styles.dropdownItemSelected]}
                  onPress={() => {
                    setBloodType(type);
                    setShowBloodTypePicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type}</Text>
                  {bloodType === type && <Check style={styles.checkIcon} size={20} weight="bold" />}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Donation Type Dropdown Modal */}
        <Modal visible={showDonationTypePicker} transparent animationType="slide">
          <Pressable style={styles.dropdownModal} onPress={() => setShowDonationTypePicker(false)}>
            <Pressable style={styles.dropdownContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownHandle} />
              <Text style={styles.dropdownTitle}>Select Donation Type</Text>
              {DONATION_TYPES.map((type) => (
                <TouchableOpacity 
                  key={type.value}
                  style={[styles.dropdownItem, donationType === type.value && styles.dropdownItemSelected]}
                  onPress={() => {
                    setDonationType(type.value);
                    setShowDonationTypePicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type.label}</Text>
                  {donationType === type.value && <Check style={styles.checkIcon} size={20} weight="bold" />}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Request Picker Modal */}
        <Modal visible={showRequestPicker} transparent animationType="slide">
          <Pressable style={styles.dropdownModal} onPress={() => setShowRequestPicker(false)}>
            <Pressable style={styles.dropdownContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownHandle} />
              <Text style={styles.dropdownTitle}>Select Request</Text>
              <TouchableOpacity 
                style={[styles.dropdownItem, !requestId && styles.dropdownItemSelected]}
                onPress={() => {
                  setRequestId(null);
                  setBloodType('');
                  setDonationType('whole_blood');
                  setShowRequestPicker(false);
                }}
              >
                <Text style={styles.dropdownItemText}>No Request Linked</Text>
                {!requestId && <Check style={styles.checkIcon} size={20} weight="bold" />}
              </TouchableOpacity>
              {requests?.map((req: any) => (
                <TouchableOpacity 
                  key={req.id}
                  style={[styles.dropdownItem, requestId === req.id && styles.dropdownItemSelected]}
                  onPress={() => handleRequestSelect(req)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownItemText} numberOfLines={1}>
                        {req.title || req.hospital?.hospitalProfile?.hospitalName || req.hospital?.fullName}
                    </Text>
                    {req.title && (
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }} numberOfLines={1}>
                            {req.hospital?.hospitalProfile?.hospitalName || req.hospital?.fullName}
                        </Text>
                    )}
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>{req.bloodType} - {req.units - req.unitsFulfilled} units needed</Text>
                  </View>
                  {requestId === req.id && <Check style={styles.checkIcon} size={20} weight="bold" />}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
