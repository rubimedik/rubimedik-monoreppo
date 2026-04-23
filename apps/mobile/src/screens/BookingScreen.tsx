import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Switch,
  Platform,
  TextInput as RNTextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { TextInput } from '../components/TextInput';
import { BackButton } from '../components';
import { CaretDown, Calendar as CalendarIcon, Clock, CreditCard, Gift, CheckCircle, Package, FileArrowUp, XCircle, File, Plus, Bank as BankIcon, Star } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { PatientStackParamList } from '../navigation/PatientNavigator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as DocumentPicker from 'expo-document-picker';

type BookingRouteProp = RouteProp<PatientStackParamList, 'Booking'>;

const { width } = Dimensions.get('window');

export const BookingScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<BookingRouteProp>();
  const { specialistId, selectedPackage: initialPackage } = route.params || {};
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedPackage, setSelectedPackage] = useState<any>(initialPackage || null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  const [symptoms, setSymptoms] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: specialist, isLoading: isSpecLoading } = useQuery({
    queryKey: ['specialist', specialistId],
    queryFn: async () => {
      const res = await api.get(`/specialists/${specialistId}`);
      return res.data;
    }
  });

  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    }
  });

  const { data: config } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await api.get('/admin/config');
      return res.data;
    }
  });

  const consultationFee = selectedPackage?.price || 0;
  const pointValue = config?.referralPointValue || 500;
  const userPoints = wallet?.points || 0;
  const pointsDiscount = usePoints ? Math.min(userPoints * pointValue, consultationFee) : 0;
  const totalPayable = consultationFee - pointsDiscount;

  const handleFileUpload = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({
              type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
              multiple: true,
              copyToCacheDirectory: true,
          });

          if (!result.canceled && result.assets) {
              const newFiles = [...attachedFiles];
              for (const asset of result.assets) {
                  const formData = new FormData();
                  const fileToUpload = {
                    uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
                    name: asset.name || `file_${Date.now()}`,
                    type: asset.mimeType || 'application/octet-stream'
                  };
                  
                  // @ts-ignore
                  formData.append('file', fileToUpload);
                  
                  const response = await api.post('/users/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      transformRequest: (data) => data,
                  });

                  if (response.data?.url) {
                      newFiles.push({ name: asset.name, url: response.data.url });
                  }
              }
              setAttachedFiles(newFiles);
          }
      } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message || 'Failed to attach file(s).';
          Alert.alert('Upload Error', `Error: ${errorMsg}\n\nPlease ensure you are uploading a valid image or document (PDF/Word).`);
      }
  };

  const removeFile = (index: number) => {
      const newFiles = [...attachedFiles];
      newFiles.splice(index, 1);
      setAttachedFiles(newFiles);
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!finalScheduledAt) throw new Error('Please select date and time');

      const res = await api.post('/consultations/book', {
        specialistId,
        totalFee: Number(consultationFee),
        usePoints,
        symptoms,
        scheduledAt: finalScheduledAt.toISOString(),
        attachments: attachedFiles.map(f => f.url)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      Alert.alert('Booking Confirmed!', 'Your appointment has been scheduled.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) }
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Booking Failed', err?.response?.data?.message || 'Please try again.');
    }
  });

  const availableSlots = useMemo(() => {
    if (!selectedDate || !specialist?.availabilitySlots) return [];
    
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = days[selectedDate.getDay()];
    const availability = specialist.availabilitySlots[dayName];
    
    if (!availability || !availability.active) return [];

    const slots = [];
    let current = availability.start;
    const end = availability.end;
    const duration = Number(selectedPackage?.duration) || 30;

    while (current < end) {
      const [h, m] = current.split(':').map(Number);
      const nextDate = new Date();
      nextDate.setHours(h, m + duration, 0);
      const nextTime = `${nextDate.getHours().toString().padStart(2, '0')}:${nextDate.getMinutes().toString().padStart(2, '0')}`;
      
      if (nextTime > end) break;
      
      slots.push(current);
      current = nextTime;
    }
    return slots;
  }, [selectedDate, specialist, selectedPackage]);

  const handleDateConfirm = (date: Date) => {
      setSelectedDate(date);
      setSelectedSlot(null); // Reset slot when date changes
      setDatePickerVisible(false);
  };

  const finalScheduledAt = useMemo(() => {
      if (!selectedDate || !selectedSlot) return null;
      const [h, m] = selectedSlot.split(':').map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      return d;
  }, [selectedDate, selectedSlot]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    scrollContent: {
      padding: theme.spacing.xl,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    packageOption: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectedPackage: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '05',
    },
    packagePrice: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    dateTimeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dateTimeText: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.textPrimary,
    },
    slotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
    },
    slotBtn: {
        width: (width - 48 - 16) / 3, // 3 columns
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    selectedSlotBtn: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    slotText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    selectedSlotText: {
        color: theme.colors.primary,
    },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        marginTop: 12,
    },
    attachmentText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.primary,
    },
    rewardCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        position: 'relative',
    },
    rewardLabel: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamilyBold,
        color: '#2E7D32',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    rewardBalance: {
        fontSize: 24,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
        marginBottom: 20,
    },
    applyBtn: {
        backgroundColor: '#2E7D32',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    applyBtnText: {
        color: 'white',
        fontSize: 15,
        fontFamily: theme.typography.fontFamilyBold,
    },
    rewardIconBadge: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#C8E6C9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        padding: 20,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    totalValue: {
        fontSize: 20,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    insufficientBox: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.error + '10',
        padding: 12,
        borderRadius: 12,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        marginTop: 8,
        gap: 8,
    },
    fileName: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.textSecondary,
    }
  }), [theme]);

  if (isSpecLoading || isWalletLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const canBook = selectedPackage && selectedDate && selectedSlot;

  if (!styles || !styles.container) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Referral Rewards UI */}
        {userPoints > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Gift size={20} color={theme.colors.textPrimary} weight="fill" />
                <Text style={{ fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }}>Referral Rewards</Text>
            </View>
            <View style={styles.rewardCard}>
                <Text style={styles.rewardLabel}>YOUR BALANCE</Text>
                <Text style={styles.rewardBalance}>{userPoints} Points Available</Text>
                
                <TouchableOpacity 
                    style={[styles.applyBtn, (usePoints || bookMutation.isPending) && { opacity: 0.7 }]} 
                    onPress={() => setUsePoints(!usePoints)}
                    disabled={bookMutation.isPending}
                >
                    <Plus size={18} color="white" weight="bold" />
                    <Text style={styles.applyBtnText}>
                        {usePoints ? 'Points Applied' : `Apply ${userPoints} Points (-₦${(userPoints * pointValue).toLocaleString()})`}
                    </Text>
                </TouchableOpacity>

                <View style={styles.rewardIconBadge}>
                    <Star size={20} color="#2E7D32" weight="fill" />
                </View>
                <Text style={{ fontSize: 11, color: '#2E7D32', marginTop: 12, textAlign: 'center', opacity: 0.8 }}>
                    Points can be used to subsidize consultation costs.
                </Text>
            </View>
          </>
        )}

        {/* Package Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Consultation Package</Text>
          {specialist?.consultationPackages?.length > 0 ? (
              specialist.consultationPackages.map((pkg: any, idx: number) => {
                const pkgId = pkg.id || idx.toString();
                const selectedPkgId = selectedPackage?.id || (selectedPackage ? specialist.consultationPackages.indexOf(selectedPackage).toString() : null);
                const isSelected = selectedPkgId === pkgId;

                return (
                    <TouchableOpacity 
                        key={pkgId} 
                        style={[styles.packageOption, isSelected && styles.selectedPackage]}
                        onPress={() => setSelectedPackage(pkg)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary }}>{pkg.name}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>{pkg.benefits?.join(' • ')}</Text>
                        </View>
                        <Text style={styles.packagePrice}>₦{Number(pkg.price).toLocaleString()}</Text>
                        {isSelected && <CheckCircle size={20} color={theme.colors.primary} weight="fill" />}
                    </TouchableOpacity>
                );
              })
          ) : (
              <View style={[styles.packageOption, { opacity: 0.5 }]}>
                  <Package size={20} color={theme.colors.textSecondary} />
                  <Text style={{ color: theme.colors.textSecondary }}>No packages configured by specialist.</Text>
              </View>
          )}
        </View>

        {/* Date/Time Selection */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Select Date & Time Slot</Text>
            <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setDatePickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <CalendarIcon size={24} color={theme.colors.primary} />
                    <Text style={styles.dateTimeText}>
                        {selectedDate ? safeFormat(selectedDate, 'PPPP') : 'Tap to select date'}
                    </Text>
                </View>
                <CaretDown size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {selectedDate && (
                <View>
                    {availableSlots.length > 0 ? (
                        <View style={styles.slotsContainer}>
                            {availableSlots.map(slot => (
                                <TouchableOpacity 
                                    key={slot} 
                                    style={[styles.slotBtn, selectedSlot === slot && styles.selectedSlotBtn]}
                                    onPress={() => setSelectedSlot(slot)}
                                >
                                    <Text style={[styles.slotText, selectedSlot === slot && styles.selectedSlotText]}>{slot}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={{ marginTop: 12, padding: 16, backgroundColor: theme.colors.error + '10', borderRadius: 8 }}>
                            <Text style={{ fontSize: 13, color: theme.colors.error, textAlign: 'center' }}>
                                Specialist is not available on this day. Please try another date.
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                isDarkModeEnabled={isDarkMode}
                themeVariant={isDarkMode ? 'dark' : 'light'}
                accentColor={theme.colors.primary}
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisible(false)}
                minimumDate={new Date()}
            />
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Symptoms / Additional Notes</Text>
            <TextInput 
                label="Notes"
                placeholder="Briefly describe why you are booking this consultation..."
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={4}
            />
            
            {attachedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                    <File size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => removeFile(index)}>
                        <XCircle size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={styles.attachmentBtn} onPress={handleFileUpload}>
                <FileArrowUp size={20} color={theme.colors.primary} />
                <Text style={styles.attachmentText}>Attach File(s)</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' }}>
                Accepted: Images, PDF, Word, TXT (Max 5MB per file)
            </Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={{ color: theme.colors.textSecondary }}>Consultation Fee</Text>
                    <Text style={{ fontFamily: theme.typography.fontFamilyBold }}>₦{consultationFee.toLocaleString()}</Text>
                </View>

                {usePoints && (
                    <View style={styles.summaryRow}>
                        <Text style={{ color: '#2E7D32' }}>Points Discount</Text>
                        <Text style={{ fontFamily: theme.typography.fontFamilyBold, color: '#2E7D32' }}>-₦{pointsDiscount.toLocaleString()}</Text>
                    </View>
                )}

                <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
                
                <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₦{totalPayable.toLocaleString()}</Text>
                </View>
            </View>

            {wallet?.balance < totalPayable && (
                <View style={styles.insufficientBox}>
                    <Text style={{ flex: 1, fontSize: 12, color: theme.colors.error, fontFamily: theme.typography.fontFamilyMedium }}>
                        Insufficient wallet balance. You need ₦{(totalPayable - wallet.balance).toLocaleString()} more.
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TopUp', { 
                        amount: totalPayable - wallet.balance,
                        redirectTo: 'Booking',
                        returnParams: { specialistId, selectedPackage, symptoms, attachedFiles, usePoints, selectedDateTime }
                    })}>
                        <Text style={{ fontSize: 12, color: theme.colors.error, fontFamily: theme.typography.fontFamilyBold, textDecorationLine: 'underline' }}>Top up</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
            label="Confirm & Pay"
            onPress={() => bookMutation.mutate()}
            disabled={!canBook || wallet?.balance < totalPayable || bookMutation.isPending}
            isLoading={bookMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
};
