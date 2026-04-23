import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput as RNTextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput, PrimaryButton, Select, Badge, Avatar, BackButton } from '../components';
import { 
  CaretLeft, 
  FileArrowUp, 
  CheckCircle, 
  Clock, 
  WarningCircle,
  Bank as BankIcon,
  Calendar as CalendarIcon,
  Package,
  Plus,
  Phone,
  File,
  Trash,
  Minus,
  MapPin,
  GraduationCap,
  CaretDown,
  CaretUp
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SpecialistStackParamList } from '../navigation/SpecialistNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<SpecialistStackParamList, 'SpecialistProfileUpdate'>;

const PREDEFINED_BENEFITS = [
  'Written prescription',
  '7-day follow-up chat',
  'Treatment plan',
  'Video consultation HD',
  'Lab test referral',
  'Referral letter'
];

const DAYS = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
];

export const SpecialistProfileUpdateScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'INFO' | 'PACKAGES' | 'AVAILABILITY' | 'PAYOUT'>('INFO');

  // Basic Info
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [certificationUrl, setCertificationUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [location, setLocation] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);

  // Packages
  const [consultationPackages, setConsultationPackages] = useState<any[]>([]);
  const [expandedPackage, setExpandedPackage] = useState<number | null>(0);

  // Availability
  const [availability, setAvailability] = useState<any>({
      mon: { active: true, start: '09:00', end: '17:00' },
      tue: { active: true, start: '09:00', end: '17:00' },
      wed: { active: true, start: '09:00', end: '17:00' },
      thu: { active: true, start: '09:00', end: '17:00' },
      fri: { active: true, start: '09:00', end: '17:00' },
      sat: { active: false, start: '09:00', end: '17:00' },
      sun: { active: false, start: '09:00', end: '17:00' },
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);

  // Fetch Admin Config for Dropdowns
  const { data: config } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await api.get('/admin/config');
      return res.data;
    }
  });

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const res = await api.get('/payments/banks');
      return res.data;
    }
  });

  const bankOptions = useMemo(() => {
    if (!banks) return [];
    return banks.map((b: any) => ({
      label: b.name,
      value: b.code
    }));
  }, [banks]);

  const packageOptions = useMemo(() => {
    return (config?.packageNames || ['Quick Consultation', 'Standard Consultation', 'Premium Consultation']).map((p: string) => ({
      label: p,
      value: p
    }));
  }, [config]);

  const typeOptions = useMemo(() => {
    return (config?.consultationTypes || ['video', 'call', 'in-person']).map((t: string) => ({
      label: t.charAt(0).toUpperCase() + t.slice(1),
      value: t
    }));
  }, [config]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['specialist-profile', user?.id],
    queryFn: async () => {
      const res = await api.get('/specialists/user/' + user?.id);
      return res.data;
    }
  });

  useEffect(() => {
    if (profile) {
      setSpecialty(profile.specialty || '');
      setLicenseNumber(profile.licenseNumber || '');
      setBio(profile.bio || '');
      setCertificationUrl(profile.certificationUrl || '');
      setPhoneNumber(profile.phoneNumber || '');
      setYearsOfExperience(profile.yearsOfExperience?.toString() || '');
      setLocation(profile.location || '');
      setBankName(profile.bankName || '');
      setAccountNumber(profile.accountNumber || '');
      setAccountName(profile.accountName || '');
      setConsultationPackages(profile.consultationPackages || []);
      if (profile.availabilitySlots) setAvailability(profile.availabilitySlots);

      if (profile.bankName && banks) {
          const bank = banks.find((b: any) => b.name === profile.bankName);
          if (bank) setBankCode(bank.code);
      }
    }
  }, [profile, banks]);

  const addPackage = () => {
    if (consultationPackages.length >= 3) {
      Alert.alert('Limit Reached', 'You can only have up to 3 consultation packages.');
      return;
    }

    // Find the first available package name that isn't used
    const usedNames = consultationPackages.map(p => p.name);
    const availableName = (config?.packageNames || ['Quick Consultation', 'Standard Consultation', 'Premium Consultation'])
        .find((name: string) => !usedNames.includes(name));

    if (!availableName) {
        Alert.alert('Error', 'All available package types have been used. Please edit existing ones instead.');
        return;
    }

    const newIdx = consultationPackages.length;
    setConsultationPackages([...consultationPackages, { 
        id: Math.random().toString(36).substr(2, 9),
        name: availableName, 
        price: '10000', 
        type: 'video', 
        duration: '30', 
        benefits: [] 
    }]);
    setExpandedPackage(newIdx);
  };

  const removePackage = (index: number) => {
    const newPkgs = [...consultationPackages];
    newPkgs.splice(index, 1);
    setConsultationPackages(newPkgs);
    setExpandedPackage(null);
  };

  const updatePackage = (index: number, field: string, value: any) => {
    if (field === 'name') {
        const isDuplicate = consultationPackages.some((p, i) => i !== index && p.name === value);
        if (isDuplicate) {
            Alert.alert('Duplicate Name', 'You already have a package with this name. Please choose a different tier.');
            return;
        }
    }
    const newPkgs = [...consultationPackages];
    newPkgs[index] = { ...newPkgs[index], [field]: value };
    setConsultationPackages(newPkgs);
  };

  const togglePredefinedBenefit = (pkgIndex: number, benefit: string) => {
      const newPkgs = [...consultationPackages];
      if (!newPkgs[pkgIndex].benefits) newPkgs[pkgIndex].benefits = [];
      const idx = newPkgs[pkgIndex].benefits.indexOf(benefit);
      if (idx === -1) {
          newPkgs[pkgIndex].benefits.push(benefit);
      } else {
          newPkgs[pkgIndex].benefits.splice(idx, 1);
      }
      updatePackage(pkgIndex, 'benefits', newPkgs[pkgIndex].benefits);
  };

  const addBenefit = (pkgIndex: number, benefit: string) => {
      if (!benefit.trim()) return;
      const newPkgs = [...consultationPackages];
      if (!newPkgs[pkgIndex].benefits) newPkgs[pkgIndex].benefits = [];
      if (!newPkgs[pkgIndex].benefits.includes(benefit.trim())) {
        newPkgs[pkgIndex].benefits.push(benefit.trim());
        updatePackage(pkgIndex, 'benefits', newPkgs[pkgIndex].benefits);
      }
  };

  const removeBenefit = (pkgIndex: number, benefitIndex: number) => {
      const newPkgs = [...consultationPackages];
      newPkgs[pkgIndex].benefits.splice(benefitIndex, 1);
      updatePackage(pkgIndex, 'benefits', newPkgs[pkgIndex].benefits);
  };

  const resolveAccountName = async (num: string, code: string) => {
    if (num.length === 10 && code) {
      setIsResolvingAccount(true);
      try {
        const res = await api.get(`/payments/resolve-account?account_number=${num}&bank_code=${code}`);
        if (res.data?.account_name) {
          setAccountName(res.data.account_name);
        }
      } catch (e) {
        console.error('Failed to resolve account');
      } finally {
        setIsResolvingAccount(false);
      }
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      resolveAccountName(accountNumber, bankCode);
    }
  }, [accountNumber, bankCode]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/specialists/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-profile'] });
      Alert.alert('Success', 'Professional profile updated successfully.');
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile.';
      const msgText = Array.isArray(message) ? message.join('\n') : message;
      Alert.alert('Update Failed', msgText);
    }
  });

  const handleSave = () => {
    if (!specialty || !licenseNumber) {
      Alert.alert('Error', 'Specialty and license number are required.');
      return;
    }

    if (consultationPackages.length === 0) {
        Alert.alert('Error', 'Please add at least one consultation package.');
        return;
    }

    for (const pkg of consultationPackages) {
        const price = Number(pkg.price);
        if (!pkg.name) {
            Alert.alert('Error', 'Package name is required.');
            return;
        }
        if (isNaN(price) || price < 10000 || price > 50000) {
            Alert.alert('Error', `Price for ${pkg.name} must be between ₦10,000 and ₦50,000.`);
            return;
        }
    }

    updateMutation.mutate({
      specialty,
      licenseNumber,
      bio,
      certificationUrl,
      bankName,
      accountNumber,
      accountName,
      phoneNumber,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
      location,
      consultationPackages,
      availabilitySlots: availability
    });
  };

  const handleUploadCertification = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setLocalPreview(asset.uri);
        
        const formData = new FormData();
        const fileToUpload = {
          uri: asset.uri,
          name: asset.name || `cert_${Date.now()}.${asset.uri.split('.').pop()}`,
          type: asset.mimeType || (asset.uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        };
        
        // @ts-ignore
        formData.append('file', fileToUpload);

        Alert.alert('Uploading...', 'Your certification is being securely uploaded.');

        const response = await api.post('/users/upload', formData, {
          transformRequest: (data) => data,
        });

        if (response.data?.url) {
          setCertificationUrl(response.data.url);
          Alert.alert('Success', 'Certification uploaded successfully!');
        }
      }
    } catch (error: any) {
      console.error('Upload err details:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Failed to upload certification.';
      Alert.alert('Upload Error', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  };

  const updateAvailability = (day: string, field: string, value: any) => {
      setAvailability({
          ...availability,
          [day]: { ...availability[day], [field]: value }
      });
  };

  const onTimeConfirm = (date: Date) => {
      if (!date || isNaN(date.getTime())) {
          setTimePickerVisible(false);
          return;
      }
      const timeString = safeFormat(date, 'HH:mm');
      if (activeDay && activeTimeField) {
          updateAvailability(activeDay, activeTimeField, timeString);
      }
      setTimePickerVisible(false);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabBtn: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 12,
        fontFamily: theme.typography.fontFamilySemiBold,
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontFamily: theme.typography.fontFamilyBold,
    },
    content: {
      padding: theme.spacing.xl,
      paddingBottom: 100,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
    },
    statusText: {
      flex: 1,
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyMedium,
      lineHeight: 18,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    instructionText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 16,
        lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      marginTop: 8,
    },
    uploadCard: {
      height: 160,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      gap: 8,
      marginBottom: 16,
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    uploadOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    uploadedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.success + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    uploadedText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.success,
    },
    packageCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageTitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    benefitText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontFamily,
    },
    addBenefitRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    benefitInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 13,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addBenefitBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPackageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary,
        gap: 8,
    },
    addPackageText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.primary,
    },
    saveButton: {
      marginHorizontal: 24,
      marginBottom: 24,
    },
    predefinedBenefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    predefinedBenefitText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.textPrimary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 12,
        marginTop: 4,
        fontFamily: theme.typography.fontFamilyMedium,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: 12,
    },
    dayName: {
        flex: 1,
        fontSize: 15,
        fontFamily: theme.typography.fontFamilySemiBold,
        color: theme.colors.textPrimary,
        textTransform: 'capitalize',
    },
    timeInput: {
        width: 85,
        height: 44,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
    }
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
  };

  const renderInfoTab = () => (
      <View>
          {!profile?.isApproved && (
            <View style={[styles.statusBanner, { backgroundColor: profile?.certificationUrl ? '#FFF8E1' : theme.colors.lightRedTint }]}>
              {profile?.certificationUrl ? (
                <>
                  <Clock size={24} color={theme.colors.warning} weight="fill" />
                  <Text style={[styles.statusText, { color: '#856404' }]}>
                    Verification pending. You can still use the app while we review your credentials.
                  </Text>
                </>
              ) : (
                <>
                  <WarningCircle size={24} color={theme.colors.error} weight="fill" />
                  <Text style={[styles.statusText, { color: theme.colors.error }]}>
                    Please upload your medical license or certification to become a verified specialist.
                  </Text>
                </>
              )}
            </View>
          )}

          <TextInput
              label="Medical Specialty"
              placeholder="e.g. Cardiologist"
              value={specialty}
              onChangeText={setSpecialty}
              leftIcon={<Package size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Medical License Number"
              placeholder="e.g. MD-123456"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />

            <TextInput
              label="Years of Experience"
              placeholder="e.g. 5"
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
              keyboardType="numeric"
              leftIcon={<GraduationCap size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Location / Clinic Address"
              placeholder="e.g. Lagos, Nigeria"
              value={location}
              onChangeText={setLocation}
              leftIcon={<MapPin size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Contact Phone Number"
              placeholder="e.g. +234 800 000 0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Short Bio"
              placeholder="Describe your experience and expertise..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Medical License / Certification (PDF/Image)</Text>
            <TouchableOpacity 
              style={styles.uploadCard} 
              onPress={handleUploadCertification}
            >
              {localPreview || (certificationUrl && certificationUrl.startsWith('http')) ? (
                <>
                  {isImage(localPreview || certificationUrl) ? (
                    <Image 
                      source={{ uri: localPreview || certificationUrl }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <View style={styles.uploadedBadge}>
                      <File size={32} color={theme.colors.primary} weight="fill" />
                      <Text style={styles.uploadedText}>Document Selected</Text>
                    </View>
                  )}
                  <View style={styles.uploadOverlay}>
                     <View style={styles.uploadedBadge}>
                        <CheckCircle size={18} color={theme.colors.success} weight="fill" />
                        <Text style={styles.uploadedText}>Change Document</Text>
                     </View>
                  </View>
                </>
              ) : (
                <>
                  <FileArrowUp size={32} color={theme.colors.textSecondary} weight="light" />
                  <Text style={styles.uploadText}>Upload License</Text>
                </>
              )}
            </TouchableOpacity>
      </View>
  );

  const renderPackagesTab = () => (
      <View>
          <Text style={styles.instructionText}>
              Set up your consultation tiers. Price must be between ₦10,000 and ₦50,000.
            </Text>

            {consultationPackages.map((pkg, index) => {
              const isExpanded = expandedPackage === index;
              const priceNum = Number(pkg.price);
              const isPriceError = pkg.price !== '' && (isNaN(priceNum) || priceNum < 10000 || priceNum > 50000);

              return (
              <View key={index} style={styles.packageCard}>
                <TouchableOpacity 
                    style={[styles.packageHeader, isExpanded && { marginBottom: 16 }]} 
                    onPress={() => setExpandedPackage(isExpanded ? null : index)}
                >
                  <Text style={styles.packageTitle}>{pkg.name || `Package #${index + 1}`}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => removePackage(index)}>
                        <Trash size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                    {isExpanded ? <CaretUp size={20} color={theme.colors.textSecondary} /> : <CaretDown size={20} color={theme.colors.textSecondary} />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                <View>
                    <Select
                    label="Package Name"
                    options={packageOptions}
                    value={pkg.name}
                    onChange={(val) => updatePackage(index, 'name', val)}
                    />

                    <Select
                    label="Consultation Type"
                    options={typeOptions}
                    value={pkg.type}
                    onChange={(val) => updatePackage(index, 'type', val)}
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                label="Price (NGN)"
                                placeholder="10000 - 50000"
                                value={pkg.price.toString()}
                                onChangeText={(val) => updatePackage(index, 'price', val)}
                                keyboardType="numeric"
                            />
                            {isPriceError && <Text style={styles.errorText}>Price must be ₦10k - ₦50k</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                label="Duration (Mins)"
                                placeholder="e.g. 15"
                                value={pkg.duration?.toString() || ''}
                                onChangeText={(val) => updatePackage(index, 'duration', val.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Consultation Benefits</Text>
                    
                    <View style={{ marginBottom: 16 }}>
                        {PREDEFINED_BENEFITS.map((benefit) => {
                            const isSelected = pkg.benefits?.includes(benefit);
                            return (
                                <TouchableOpacity 
                                    key={benefit} 
                                    style={styles.predefinedBenefitRow}
                                    onPress={() => togglePredefinedBenefit(index, benefit)}
                                >
                                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                                        {isSelected && <CheckCircle size={16} color="white" weight="bold" />}
                                    </View>
                                    <Text style={styles.predefinedBenefitText}>{benefit}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.label}>Additional Custom Benefits</Text>
                    <View style={{ marginBottom: 8 }}>
                        {pkg.benefits?.filter((b: string) => !PREDEFINED_BENEFITS.includes(b)).map((benefit: string, bIndex: number) => (
                        <View key={bIndex} style={styles.benefitItem}>
                            <Text style={styles.benefitText}>• {benefit}</Text>
                            <TouchableOpacity onPress={() => removeBenefit(index, pkg.benefits.indexOf(benefit))}>
                                <Minus size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        ))}
                    </View>

                    <BenefitInput 
                    onAdd={(val) => addBenefit(index, val)} 
                    theme={theme} 
                    styles={styles} 
                    />
                </View>
                )}
              </View>
            )})}

            {consultationPackages.length < 3 && (
              <TouchableOpacity style={styles.addPackageBtn} onPress={addPackage}>
                <Plus size={20} color={theme.colors.primary} />
                <Text style={styles.addPackageText}>Add New Package</Text>
              </TouchableOpacity>
            )}
      </View>
  );

  const renderAvailabilityTab = () => (
      <View>
          <Text style={styles.instructionText}>Set your weekly available hours for consultations.</Text>
          {DAYS.map((day) => (
              <View key={day.value} style={styles.dayRow}>
                  <Text style={styles.dayName}>{day.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Switch 
                        value={availability[day.value]?.active}
                        onValueChange={(v) => updateAvailability(day.value, 'active', v)}
                        trackColor={{ true: theme.colors.primary }}
                      />
                      {availability[day.value]?.active && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity 
                                style={styles.timeInput}
                                onPress={() => {
                                    setActiveDay(day.value);
                                    setActiveTimeField('start');
                                    setTimePickerVisible(true);
                                }}
                            >
                                <Text style={styles.timeText}>{availability[day.value].start}</Text>
                            </TouchableOpacity>
                            <Text style={{ color: theme.colors.textSecondary }}>-</Text>
                            <TouchableOpacity 
                                style={styles.timeInput}
                                onPress={() => {
                                    setActiveDay(day.value);
                                    setActiveTimeField('end');
                                    setTimePickerVisible(true);
                                }}
                            >
                                <Text style={styles.timeText}>{availability[day.value].end}</Text>
                            </TouchableOpacity>
                          </View>
                      )}
                  </View>
              </View>
          ))}

          <DateTimePickerModal
            isVisible={timePickerVisible}
            mode="time"
            isDarkModeEnabled={isDarkMode}
            themeVariant={isDarkMode ? 'dark' : 'light'}
            accentColor={theme.colors.primary}
            onConfirm={onTimeConfirm}
            onCancel={() => setTimePickerVisible(false)}
            date={new Date()}
          />
      </View>
  );

  const renderPayoutTab = () => (
      <View>
           <Select
              label="Bank Name"
              options={bankOptions}
              value={bankCode}
              onChange={(val) => {
                  setBankCode(val);
                  const bank = banks.find((b: any) => b.code === val);
                  if (bank) setBankName(bank.name);
              }}
              leftIcon={<BankIcon size={20} color={theme.colors.textSecondary} />}
            />
            <TextInput
              label="Account Number"
              placeholder="10 digit number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
            />
            
            <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>Account Name</Text>
                <View style={[styles.packageCard, { marginBottom: 0, padding: 16, backgroundColor: theme.colors.surface }]}>
                    {isResolvingAccount ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                        <Text style={{ fontSize: 16, fontFamily: theme.typography.fontFamilyBold, color: accountName ? theme.colors.textPrimary : theme.colors.textMuted }}>
                            {accountName || 'Enter account number and select bank'}
                        </Text>
                    )}
                </View>
            </View>
      </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Professional Profile</Text>
        </View>

        <View style={styles.tabsContainer}>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'INFO' && styles.activeTabBtn]}
                onPress={() => setActiveTab('INFO')}
            >
                <Text style={[styles.tabText, activeTab === 'INFO' && styles.activeTabText]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'PACKAGES' && styles.activeTabBtn]}
                onPress={() => setActiveTab('PACKAGES')}
            >
                <Text style={[styles.tabText, activeTab === 'PACKAGES' && styles.activeTabText]}>Packages</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'AVAILABILITY' && styles.activeTabBtn]}
                onPress={() => setActiveTab('AVAILABILITY')}
            >
                <Text style={[styles.tabText, activeTab === 'AVAILABILITY' && styles.activeTabText]}>Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'PAYOUT' && styles.activeTabBtn]}
                onPress={() => setActiveTab('PAYOUT')}
            >
                <Text style={[styles.tabText, activeTab === 'PAYOUT' && styles.activeTabText]}>Payout</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'INFO' && renderInfoTab()}
          {activeTab === 'PACKAGES' && renderPackagesTab()}
          {activeTab === 'AVAILABILITY' && renderAvailabilityTab()}
          {activeTab === 'PAYOUT' && renderPayoutTab()}
        </ScrollView>

        <PrimaryButton 
          label="Save All Changes" 
          onPress={handleSave} 
          isLoading={updateMutation.isPending}
          style={styles.saveButton}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const BenefitInput = ({ onAdd, theme, styles }: { onAdd: (val: string) => void, theme: any, styles: any }) => {
    const [text, setText] = useState('');
    return (
      <View style={styles.addBenefitRow}>
        <RNTextInput
          style={styles.benefitInput}
          placeholder="Add custom benefit"
          placeholderTextColor={theme.colors.textMuted}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity 
          style={styles.addBenefitBtn}
          onPress={() => {
              if (!text.trim()) return;
              onAdd(text);
              setText('');
          }}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
};
