import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components';
import { MapPin, Phone, Globe, FileText, Certificate, Clock, ShieldCheck } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const ProviderDetailsScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { providerId, type } = route.params || { providerId: '', type: 'specialist' };

  const { data: details, isLoading } = useQuery({
    queryKey: ['provider-details', providerId, type],
    queryFn: async () => {
      const endpoint = type === 'specialist' ? `/specialists/${providerId}` : `/hospitals/${providerId}`;
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: !!providerId
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
    profileSection: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    name: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginTop: 16,
      textAlign: 'center',
    },
    specialty: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.primary,
      marginTop: 4,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    address: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      maxWidth: '80%',
    },
    badgeRow: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 8,
    },
    section: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    bioText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    infoIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    docCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    docName: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    footer: {
      padding: 24,
      backgroundColor: theme.colors.background,
    }
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const name = type === 'specialist' ? details?.fullName : details?.hospitalName;
  const subTitle = type === 'specialist' ? details?.specialty : 'General Hospital';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>{type === 'specialist' ? 'Specialist Profile' : 'Hospital Details'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={name} size={100} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.specialty}>{subTitle}</Text>
          
          <View style={styles.addressRow}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={styles.address}>{details?.address || 'Address not listed'}</Text>
          </View>

          <View style={styles.badgeRow}>
            {details?.isApproved && <Badge label="Verified Provider" variant="success" />}
            <Badge label={type.toUpperCase()} variant="primary" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {type === 'specialist' ? 'Specialist' : 'Hospital'}</Text>
          <Text style={styles.bioText}>
            {details?.bio || details?.description || `A leading ${type} committed to providing excellent healthcare services to the community.`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          
          {type === 'specialist' && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Certificate size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>License Number</Text>
                <Text style={styles.infoValue}>{details?.licenseNumber || 'Verified'}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Clock size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>Mon - Fri: 09:00 AM - 05:00 PM</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Phone size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>+234 800 RUBIMEDIK</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Documents</Text>
          <TouchableOpacity 
            style={styles.docCard}
            onPress={() => details?.documentUrl && Linking.openURL(details.documentUrl)}
          >
            <FileText size={24} color={theme.colors.primary} weight="fill" />
            <Text style={styles.docName}>Operating License / Certification</Text>
            <ShieldCheck size={20} color={theme.colors.success} weight="fill" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <PrimaryButton 
            label={type === 'specialist' ? "Book Consultation" : "View Inventory"} 
            onPress={() => type === 'specialist' ? navigation.navigate('Booking', { specialistId: providerId }) : navigation.navigate('Inventory')} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
