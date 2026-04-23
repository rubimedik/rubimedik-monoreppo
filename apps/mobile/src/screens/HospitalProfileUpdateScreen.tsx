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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components';
import { FileArrowUp, CheckCircle, Clock, WarningCircle, MapPin, IdentificationCard, Phone, File } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';

export const HospitalProfileUpdateScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['hospital-profile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/hospitals/user/${user?.id}`);
      return res.data;
    }
  });

  useEffect(() => {
    if (profile) {
      setHospitalName(profile.hospitalName || '');
      setAddress(profile.address || '');
      setLicenseNumber(profile.licenseNumber || '');
      setPhoneNumber(profile.phoneNumber || '');
      setDocumentUrl(profile.documentUrl || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/hospitals/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital-profile'] });
      Alert.alert('Success', 'Hospital profile updated successfully. Document verification may take some time.');
      navigation.goBack();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile.';
      const msgText = Array.isArray(message) ? message.join('\n') : message;
      Alert.alert('Update Failed', msgText);
    }
  });

  const handleSave = () => {
    if (!hospitalName || !address || !licenseNumber) {
      Alert.alert('Error', 'Hospital name, address, and license number are required.');
      return;
    }
    updateMutation.mutate({
      hospitalName,
      address,
      licenseNumber,
      phoneNumber,
      documentUrl
    });
  };

  const handleUploadDocument = async () => {
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
          name: asset.name || `doc_${Date.now()}.${asset.uri.split('.').pop()}`,
          type: asset.mimeType || (asset.uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        };
        
        // @ts-ignore
        formData.append('file', fileToUpload);

        Alert.alert('Uploading...', 'Your document is being securely uploaded.');

        const response = await api.post('/users/upload', formData, {
          transformRequest: (data) => data,
        });

        if (response.data?.url) {
          setDocumentUrl(response.data.url);
          Alert.alert('Success', 'Document uploaded successfully!');
        }
      }
    } catch (error: any) {
      console.error('Upload err details:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Failed to upload document.';
      Alert.alert('Upload Error', Array.isArray(msg) ? msg.join('\n') : msg);
    }
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
    content: {
      padding: theme.spacing.xl,
      paddingBottom: 40,
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
    form: {
      gap: 12,
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
    saveButton: {
      marginTop: 24,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>Hospital Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!profile?.isApproved && (
            <View style={[styles.statusBanner, { backgroundColor: profile?.documentUrl ? '#FFF8E1' : theme.colors.lightRedTint }]}>
              {profile?.documentUrl ? (
                <>
                  <Clock size={24} color={theme.colors.warning} weight="fill" />
                  <Text style={[styles.statusText, { color: '#856404' }]}>
                    Your profile is currently under review. This process usually takes 24-48 hours.
                  </Text>
                </>
              ) : (
                <>
                  <WarningCircle size={24} color={theme.colors.error} weight="fill" />
                  <Text style={[styles.statusText, { color: theme.colors.error }]}>
                    Complete your profile and upload documents to get verified and start receiving blood requests.
                  </Text>
                </>
              )}
            </View>
          )}

          {profile?.isApproved && (
            <View style={[styles.statusBanner, { backgroundColor: '#E8F5E9' }]}>
              <CheckCircle size={24} color={theme.colors.success} weight="fill" />
              <Text style={[styles.statusText, { color: '#1B5E20' }]}>
                Your hospital profile is verified and active.
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Facility Information</Text>
            
            <TextInput
              label="Hospital Registered Name"
              placeholder="e.g. St. Nicholas Hospital"
              value={hospitalName}
              onChangeText={setHospitalName}
            />

            <TextInput
              label="Physical Address"
              placeholder="Full address of the facility"
              value={address}
              onChangeText={setAddress}
              multiline
              leftIcon={<MapPin size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Hospital License Number"
              placeholder="e.g. HOSP-123456"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              leftIcon={<IdentificationCard size={20} color={theme.colors.textSecondary} />}
            />

            <TextInput
              label="Contact Phone Number"
              placeholder="e.g. +234 800 000 0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={theme.colors.textSecondary} />}
            />

            <Text style={styles.label}>Operating License / Registration Document</Text>
            <TouchableOpacity 
              style={styles.uploadCard} 
              onPress={handleUploadDocument}
            >
              {localPreview || (documentUrl && documentUrl.startsWith('http')) ? (
                <>
                  {isImage(localPreview || documentUrl) ? (
                    <Image 
                      source={{ uri: localPreview || documentUrl }} 
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
                  <Text style={styles.uploadText}>Select PDF or Image</Text>
                </>
              )}
            </TouchableOpacity>
            {documentUrl && documentUrl.startsWith('http') && !localPreview && (
              <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                Verified document is securely stored.
              </Text>
            )}

            <PrimaryButton 
              label="Save All Changes" 
              onPress={handleSave} 
              isLoading={updateMutation.isPending}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
