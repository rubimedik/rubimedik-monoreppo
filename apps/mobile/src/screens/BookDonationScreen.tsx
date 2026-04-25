import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Modal,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, MapPin, Calendar as CalendarIcon, Clock, CheckCircle, Info, Drop, ShieldCheck } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { donationService, BloodRequest } from '../services/donationService';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BackButton } from '../components/BackButton';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

export const BookDonationScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { theme, isDarkMode } = useAppTheme();
  const initialRequestId = route.params?.requestId;
  const rescheduleMatchId = route.params?.rescheduleMatchId;

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [rescheduleMatch, setRescheduleMatch] = useState<any>(null);
  
  // Booking Flow State
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (rescheduleMatchId) {
      fetchRescheduleMatch();
    }
  }, []);

  const fetchRescheduleMatch = async () => {
    try {
      const matches = await donationService.getMyDonations();
      const match = matches.find(m => m.id === rescheduleMatchId);
      if (match) {
        setRescheduleMatch(match);
        if (match.request) {
          setSelectedRequest(match.request);
        }
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await donationService.getRequests();
      setRequests(data.filter(r => r.status === 'PENDING'));
      
      if (initialRequestId) {
        const found = data.find(r => r.id === initialRequestId);
        if (found) setSelectedRequest(found);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisibility(false);
  };

  const handleFinalBook = async () => {
    if (!selectedRequest || !selectedDate) {
      Alert.alert('Selection Required', 'Please pick a hospital request and a preferred date.');
      return;
    }

    setIsBooking(true);
    try {
      if (rescheduleMatchId && rescheduleMatch) {
        await donationService.rescheduleDonation(rescheduleMatchId, selectedDate);
        Alert.alert(
          'Reschedule Successful',
          `Your appointment has been rescheduled to ${safeFormat(selectedDate, 'PPP p')}.`,
          [{ text: 'Great!', onPress: () => navigation.popToTop() }]
        );
      } else {
        await donationService.bookDonation(selectedRequest.id, selectedDate, isAnonymous);
        Alert.alert(
          'Booking Successful',
          `Your appointment at ${selectedRequest.hospital.hospitalProfile?.hospitalName || 'the hospital'} has been scheduled for ${safeFormat(selectedDate, 'PPP p')}. Awaiting hospital confirmation.`,
          [{ text: 'Great!', onPress: () => navigation.popToTop() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Booking Failed', error.response?.data?.message || 'Unable to schedule donation.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderRequestItem = ({ item }: { item: BloodRequest }) => (
    <Card 
      style={[
        styles.requestCard, 
        selectedRequest?.id === item.id && { borderColor: theme.colors.primary, borderWidth: 2 }
      ]} 
      variant="outlined"
      onPress={() => setSelectedRequest(item)}
    >
      <View style={styles.requestHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hospitalName}>{item.hospital.hospitalProfile?.hospitalName || item.hospital.fullName}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color={theme.colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.hospital.hospitalProfile?.address || 'Nearby'}</Text>
          </View>
        </View>
        <Badge 
          label={item.urgency} 
          variant={item.urgency === 'CRITICAL' || item.urgency === 'URGENT' ? 'error' : 'info'} 
        />
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Blood Type</Text>
          <View style={styles.bloodTypeBadge}>
             <Text style={styles.bloodType}>{item.bloodType}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Units</Text>
          <Text style={styles.detailValue}>{Math.max(0, item.units - item.unitsFulfilled)} bags left</Text>
        </View>
      </View>

      {selectedRequest?.id === item.id && (
        <View style={styles.selectionIndicator}>
           <CheckCircle size={20} color={theme.colors.primary} weight="fill" />
           <Text style={styles.selectionText}>Selected</Text>
        </View>
      )}
    </Card>
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
    headerTitle: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    content: { flex: 1 },
    listContainer: { padding: 24, paddingBottom: 100 },
    sectionTitle: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginBottom: 16, paddingHorizontal: 24 },
    requestCard: { padding: 16, marginBottom: 16 },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
    hospitalName: { fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    locationText: { fontSize: 13, color: theme.colors.textSecondary, flex: 1 },
    requestDetails: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 4 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
    bloodTypeBadge: { backgroundColor: theme.colors.error + '10', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    bloodType: { fontSize: 15, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.error },
    detailValue: { fontSize: 15, fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textPrimary },
    selectionIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
    selectionText: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.primary },
    
    footer: {
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    dateTimeCard: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateTimeValue: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    anonymousLabel: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.textPrimary,
    },
    anonymousDesc: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary + '10',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      gap: 10,
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Donation Booking</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>Select a Hospital Request</Text>}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 100 }}>
                <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>No active requests found.</Text>
              </View>
            }
          />
        )}
      </View>

      <View style={styles.footer}>
        {selectedRequest && (
          <>
            <TouchableOpacity 
              style={styles.dateTimeCard} 
              onPress={() => setDatePickerVisibility(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CalendarIcon size={20} color={theme.colors.primary} weight="bold" />
                <Text style={styles.dateTimeValue}>
                  {selectedDate ? safeFormat(selectedDate, 'PPP p') : 'Pick a Date & Time'}
                </Text>
              </View>
              <CaretLeft size={16} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <View style={styles.anonymousRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.anonymousLabel}>Donate Anonymously</Text>
                    <Text style={styles.anonymousDesc}>Hide your name from the hospital records.</Text>
                </View>
                <Switch 
                    value={isAnonymous} 
                    onValueChange={setIsAnonymous}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
            </View>

            <View style={styles.infoBox}>
               <ShieldCheck size={18} color={theme.colors.primary} weight="fill" />
               <Text style={styles.infoText}>Your data is safe. We only share necessary info for the medical procedure.</Text>
            </View>

            <PrimaryButton 
              label="Confirm Booking" 
              onPress={handleFinalBook} 
              isLoading={isBooking}
              disabled={!selectedDate}
            />
          </>
        )}
        {!selectedRequest && (
          <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginBottom: 8 }}>
            Please select a hospital from the list above to proceed.
          </Text>
        )}
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </SafeAreaView>
  );
};
