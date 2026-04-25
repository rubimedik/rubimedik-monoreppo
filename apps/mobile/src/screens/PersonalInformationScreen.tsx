import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput, PrimaryButton, Card, Avatar, Select, BackButton } from '../components';
import { CaretLeft, User as UserIcon, Phone, IdentificationCard, FileText, Certificate, Bank, Drop, MapPin, Gps, Note, Medal } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '@repo/shared';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];
const HEALTH_CONDITIONS = [
  'Healthy - No known conditions',
  'Anemia',
  'Sickle Cell Trait',
  'Sickle Cell Disease',
  'Diabetes',
  'Hypertension',
  'Heart Condition',
  'Blood Disorder',
  'Other',
];

// Ensure arrays are properly typed
const bloodGroups: string[] = BLOOD_GROUPS;
const genotypes: string[] = GENOTYPES;
const healthConditions: string[] = HEALTH_CONDITIONS;

export const PersonalInformationScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSpecialist = user?.activeRole === UserRole.SPECIALIST;
  const isDonor = user?.activeRole === UserRole.DONOR;
  const isHospital = user?.activeRole === UserRole.HOSPITAL;
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    bloodGroup: '',
    genotype: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    healthCondition: '',
    lastDonationDate: '',
    medicalNotes: '',
    donationGoal: '5',
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    scrollContent: {
      padding: theme.spacing.xl,
      paddingBottom: 40,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: theme.spacing['2xl'],
    },
    changeAvatarBtn: {
      marginTop: 12,
    },
    changeAvatarText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    form: {
      gap: theme.spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 16,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    infoBox: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
    },
    footer: {
      padding: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    locationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '15',
      marginTop: 12,
    },
    locationBtnText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
    },
  }), [theme, isDarkMode]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      // Basic info
      const res = await api.get('/users/me');
      const baseData = res.data;
      
      try {
        // Extended profile info for donors/patients
        const profileRes = await api.get('/users/profile');
        return { ...baseData, ...profileRes.data };
      } catch (err) {
        // It's possible the profile doesn't exist yet
        return baseData;
      }
    }
  });

  const { data: specialistProfile, isLoading: isSpecLoading } = useQuery({
    queryKey: ['specialist-profile', user?.id],
    queryFn: async () => {
      if (!isSpecialist) return null;
      const res = await api.get(`/specialists/user/${user?.id}`);
      return res.data;
    },
    enabled: isSpecialist
  });

  const { data: hospitalProfile, isLoading: isHospitalLoading } = useQuery({
    queryKey: ['hospital-profile', user?.id],
    queryFn: async () => {
      if (!isHospital) return null;
      const res = await api.get(`/hospitals/user/${user?.id}`);
      return res.data;
    },
    enabled: isHospital
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        bloodGroup: profile.bloodType || profile.bloodGroup || '',
        genotype: profile.genotype || '',
        address: profile.patientProfile?.address || profile.address || '',
        city: profile.patientProfile?.city || profile.city || '',
        state: profile.patientProfile?.state || profile.state || '',
        latitude: profile.patientProfile?.latitude ? String(profile.patientProfile.latitude) : profile.latitude ? String(profile.latitude) : '',
        longitude: profile.patientProfile?.longitude ? String(profile.patientProfile.longitude) : profile.longitude ? String(profile.longitude) : '',
        healthCondition: profile.patientProfile?.healthCondition || profile.healthCondition || '',
        lastDonationDate: profile.lastDonationDate || '',
        medicalNotes: profile.patientProfile?.medicalNotes || profile.medicalNotes || '',
        donationGoal: profile.donationGoal ? String(profile.donationGoal) : '5',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Send data to /users/me (PATCH)
        const res = await api.patch('/users/me', data);
        return res.data;
      } catch (error: any) {
        console.error('Profile update failed:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      Alert.alert('Success', 'Profile information updated successfully');
      navigation.goBack();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update profile details. Please try again.';
      const errorMessage = Array.isArray(message) ? message.join('\n') : message;
      Alert.alert('Update Error', errorMessage);
    }
  });

  const handleSave = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    
    // Create a clean payload to avoid sending UI-only fields
    const payload: any = {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      bloodGroup: formData.bloodGroup,
      genotype: formData.genotype,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      healthCondition: formData.healthCondition,
      medicalNotes: formData.medicalNotes,
      donationGoal: parseInt(formData.donationGoal) || 5,
    };

    // Convert coordinates to numbers for the backend
    if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
    if (formData.longitude) payload.longitude = parseFloat(formData.longitude);
    
    updateMutation.mutate(payload);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Location permission is required to find nearby hospitals.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Attempt reverse geocoding
      let city = formData.city;
      let state = formData.state;
      let address = formData.address;

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          city = place.city || place.subregion || formData.city;
          state = place.region || formData.state;
          address = `${place.name || ''} ${place.street || ''} ${place.district || ''}`.trim() || formData.address;
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
      }

      setFormData({
        ...formData,
        latitude: String(latitude),
        longitude: String(longitude),
        city,
        state,
        address,
      });
      Alert.alert('Success', 'Location information updated from your GPS!');
    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error', 
        'Could not get your current location. Please ensure location services are enabled on your device.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpdateAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        
        const formData = new FormData();
        const fileToUpload = {
          uri: asset.uri,
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg'
        };
        
        // @ts-ignore
        formData.append('file', fileToUpload);

        Alert.alert('Uploading...', 'Please wait while we update your profile picture.');

        const response = await api.post('/users/upload', formData, {
          transformRequest: (data) => data,
        });

        if (response.data?.url) {
          await api.patch('/users/me', { avatarUrl: response.data.url });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error: any) {
      console.error('Avatar upload err details:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Failed to upload image. Please try again.';
      Alert.alert('Upload Error', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  };

  if (isLoading || (isSpecialist && isSpecLoading) || (isHospital && isHospitalLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Avatar name={profile?.fullName || profile?.email} uri={profile?.avatarUrl} size={100} />
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={handleUpdateAvatar}>
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              leftIcon={<UserIcon color={theme.colors.textSecondary} size={20} />}
            />

            <TextInput
              label="Phone Number"
              placeholder="e.g. +234 800 000 0000"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
              leftIcon={<Phone color={theme.colors.textSecondary} size={20} />}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>

            {isDonor && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Donor Information</Text>
                <Select
                  label="Blood Group"
                  placeholder="Select blood group"
                  value={formData.bloodGroup}
                  options={bloodGroups}
                  onChange={(val) => setFormData({ ...formData, bloodGroup: val })}
                />
                <Select
                  label="Genotype"
                  placeholder="Select genotype"
                  value={formData.genotype}
                  options={genotypes}
                  onChange={(val) => setFormData({ ...formData, genotype: val })}
                />
                
                <TextInput
                  label="Donation Milestone Goal"
                  placeholder="e.g. 10"
                  value={formData.donationGoal}
                  onChangeText={(text) => setFormData({ ...formData, donationGoal: text })}
                  keyboardType="numeric"
                  leftIcon={<Medal color={theme.colors.textSecondary} size={20} />}
                />
                
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Health Information</Text>
                <Select
                  label="Health Condition"
                  placeholder="Select health condition"
                  value={formData.healthCondition}
                  options={healthConditions}
                  onChange={(val) => setFormData({ ...formData, healthCondition: val })}
                />
                <TextInput
                  label="Medical Notes"
                  placeholder="Any relevant medical information"
                  value={formData.medicalNotes}
                  onChangeText={(text) => setFormData({ ...formData, medicalNotes: text })}
                  multiline
                  numberOfLines={3}
                  leftIcon={<Note color={theme.colors.textSecondary} size={20} />}
                />
                
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Location</Text>
                <TextInput
                  label="Address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  leftIcon={<MapPin color={theme.colors.textSecondary} size={20} />}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="State"
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.locationBtn}
                  onPress={getCurrentLocation}
                >
                  <Gps size={20} color={theme.colors.primary} />
                  <Text style={styles.locationBtnText}>
                    {formData.latitude ? 'Location Updated ✓' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isHospital && hospitalProfile && (
              <>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Hospital Information</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('HospitalProfileUpdate')}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Hospital Name</Text>
                  <Text style={styles.infoValue}>{hospitalProfile.hospitalName || 'Not set'}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{hospitalProfile.address || 'Not set'}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>License Number</Text>
                  <Text style={styles.infoValue}>{hospitalProfile.licenseNumber || 'Not set'}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Hospital Document</Text>
                  <View style={styles.row}>
                    <Certificate size={18} color={hospitalProfile.documentUrl ? theme.colors.success : theme.colors.textSecondary} />
                    <Text style={[styles.infoValue, { marginLeft: 8 }]}>
                      {hospitalProfile.documentUrl ? 'Document Uploaded' : 'Not Uploaded'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {isSpecialist && specialistProfile && (
              <>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Professional Information</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SpecialistProfileUpdate')}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Specialization</Text>
                  <Text style={styles.infoValue}>{specialistProfile.specialty || 'Not set'}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>License Number</Text>
                  <Text style={styles.infoValue}>{specialistProfile.licenseNumber || 'Not set'}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Short Bio</Text>
                  <Text style={styles.infoValue} numberOfLines={3}>
                    {specialistProfile.bio || 'No bio added yet.'}
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Certification</Text>
                  <View style={styles.row}>
                    <Certificate size={18} color={specialistProfile.certificationUrl ? theme.colors.success : theme.colors.textSecondary} />
                    <Text style={[styles.infoValue, { marginLeft: 8 }]}>
                      {specialistProfile.certificationUrl ? 'Document Uploaded' : 'Not Uploaded'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Account Details</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SpecialistProfileUpdate')}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Bank Name</Text>
                  <View style={styles.row}>
                    <Bank size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoValue, { marginLeft: 8 }]}>{specialistProfile.bankName || 'Not set'}</Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Account Number</Text>
                  <Text style={styles.infoValue}>{specialistProfile.accountNumber || 'Not set'}</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <PrimaryButton 
          label="Save Changes" 
          onPress={handleSave} 
          isLoading={updateMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
};
