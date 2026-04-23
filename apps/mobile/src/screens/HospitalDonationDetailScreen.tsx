import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretLeft, Calendar, User, Drop, ListChecks, Clock, MapPin, Phone, Envelope } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { safeFormat } from '../utils/dateUtils';
import { Badge, BackButton, PrimaryButton } from '../components';
import { DonationStatus } from '@repo/shared';
import { Pressable as GHPressable } from 'react-native-gesture-handler';

export const HospitalDonationDetailScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { matchId } = route.params;

  const { data: match, isLoading, error } = useQuery({
    queryKey: ['hospital-match-detail', matchId],
    queryFn: async () => {
      const res = await api.get(`/donations/matches/${matchId}`);
      return res.data;
    },
    enabled: !!matchId,
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 16,
    },
    content: {
      padding: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      gap: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    footer: {
      padding: 24,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    }
  }), [theme, isDarkMode]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textSecondary }}>Failed to load donation details.</Text>
      </View>
    );
  }

  const donorName = match.isAnonymous ? 'Anonymous Donor' : (match.donor?.fullName || 'Donor');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Donation Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Badge 
              label={match.status} 
              variant={
                match.status === DonationStatus.COMPLETED ? 'success' : 
                match.status === DonationStatus.ACCEPTED ? 'info' : 
                match.status === DonationStatus.PENDING ? 'warning' : 'error'
              } 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donor Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}><User size={20} color={theme.colors.primary} weight="fill" /></View>
              <View>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{donorName}</Text>
              </View>
            </View>
            {!match.isAnonymous && (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}><Envelope size={20} color={theme.colors.primary} weight="fill" /></View>
                  <View>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoValue}>{match.donor?.email}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}><Drop size={20} color={theme.colors.error} weight="fill" /></View>
                  <View>
                    <Text style={styles.infoLabel}>Blood Group</Text>
                    <Text style={styles.infoValue}>{match.donor?.bloodType || match.request?.bloodType}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}><ListChecks size={20} color={theme.colors.success} weight="fill" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Target Request</Text>
                <Text style={styles.infoValue}>{match.request?.title || 'General Request'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}><Drop size={20} color={theme.colors.primary} weight="fill" /></View>
              <View>
                <Text style={styles.infoLabel}>Donation Type</Text>
                <Text style={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                  {(match.donationType || match.request?.donationType || 'Whole Blood').replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}><Calendar size={20} color={theme.colors.primary} weight="fill" /></View>
              <View>
                <Text style={styles.infoLabel}>Scheduled Date</Text>
                <Text style={styles.infoValue}>{safeFormat(match.scheduledDate || match.createdAt, 'PPP')}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}><Clock size={20} color={theme.colors.primary} weight="fill" /></View>
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{safeFormat(match.scheduledDate || match.createdAt, 'p')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {match.status === DonationStatus.ACCEPTED && (
        <View style={styles.footer}>
          <PrimaryButton 
            label="Record Donation" 
            onPress={() => navigation.navigate('RecordDonation', { matchId: match.id })}
          />
        </View>
      )}
    </SafeAreaView>
  );
};
