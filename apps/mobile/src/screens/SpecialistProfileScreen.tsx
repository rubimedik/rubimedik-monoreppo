import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../hooks/useAppTheme';
import { Skeleton } from '../components/Skeleton';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components';
import { Clock, ChatCircleDots, Star } from 'phosphor-react-native';
import { api } from '../services/api';
import { format } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

type ProfileRouteProp = RouteProp<{ params: { specialistId: string } }, 'params'>;

const DAYS = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
];

export const SpecialistProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, isDarkMode } = useAppTheme();
  const route = useRoute<ProfileRouteProp>();
  const { specialistId } = route.params;

  const { data: specialist, isLoading } = useQuery({
    queryKey: ['specialist', specialistId],
    queryFn: async () => {
      const res = await api.get(`/specialists/${specialistId}`);
      return res.data;
    }
  });

  const activeWorkingHours = useMemo(() => {
    if (!specialist?.availabilitySlots) return [];
    const slots = specialist.availabilitySlots;
    return DAYS.filter(d => slots[d.value]?.active).map(d => ({
        day: d.label,
        time: `${slots[d.value].start} - ${slots[d.value].end}`
    }));
  }, [specialist]);

  const derivedName = useMemo(() => {
    if (specialist?.user?.fullName) return specialist.user.fullName;
    if (specialist?.user?.email) return specialist.user.email.split('@')[0];
    return 'Specialist';
  }, [specialist]);

  const avatarName = useMemo(() => {
    return specialist?.user?.fullName || specialist?.user?.email || 'User';
  }, [specialist]);

  const aboutDoctorName = useMemo(() => {
    const namePart = specialist?.user?.fullName ? specialist.user.fullName.split(' ')[1] || specialist.user.fullName : derivedName;
    return `Dr. ${namePart}`;
  }, [specialist, derivedName]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
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
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    chatButton: {
      padding: 4,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    profileSection: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
    },
    avatar: {
      marginBottom: theme.spacing.md,
    },
    name: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    specialty: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-around',
      paddingHorizontal: theme.spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
    },
    section: {
      padding: theme.spacing.xl,
      paddingBottom: 0,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    seeAll: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    aboutText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
    },
    dayLabel: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamilySemiBold,
        color: theme.colors.textPrimary,
        width: 100,
    },
    timeLabel: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily,
        color: theme.colors.textSecondary,
    },
    packageCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    packageInfo: {
      flex: 1,
    },
    packageTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    packageDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    packagePrice: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    reviewCard: {
      padding: theme.spacing.md,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    reviewUser: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    reviewName: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    reviewDate: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    reviewText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.xl,
      backgroundColor: isDarkMode ? theme.colors.background : theme.colors.white,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    bookButton: {
      width: '100%',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
      marginTop: 10,
    }
  }), [theme, isDarkMode]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 24 }} />
          <Skeleton width="60%" height={30} style={{ marginBottom: 12 }} />
          <Skeleton width="40%" height={20} style={{ marginBottom: 32 }} />
          <Skeleton width="100%" height={100} style={{ marginBottom: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>Specialist Profile</Text>
        <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { roomId: specialistId, otherUserName: derivedName })}
        >
          <ChatCircleDots color={theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <Avatar name={avatarName} size={100} isVerified={specialist?.isApproved} style={styles.avatar} />
          <Text style={styles.name}>{derivedName}</Text>
          <Text style={styles.specialty}>{specialist?.specialty}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{specialist?.yearsOfExperience || 0}+</Text>
              <Text style={styles.statLabel}>Exp. Years</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{specialist?.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{specialist?.patientCount || 0}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            {specialist?.bio || `${aboutDoctorName} is a highly experienced specialist in ${specialist?.specialty || 'their field'}.`}
          </Text>
        </View>

        {/* Working Hours Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          {activeWorkingHours.length > 0 ? activeWorkingHours.map((item, index) => (
              <View key={index} style={styles.infoRow}>
                  <Clock color={theme.colors.primary} size={18} weight="fill" />
                  <Text style={styles.dayLabel}>{item.day}</Text>
                  <Text style={styles.timeLabel}>{item.time}</Text>
              </View>
          )) : (
              <Text style={styles.infoText}>Contact for availability</Text>
          )}
        </View>

        {/* Consultation Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Packages</Text>
          {specialist?.consultationPackages?.length > 0 ? (
            specialist.consultationPackages.map((pkg: any, idx: number) => (
              <Card 
                key={idx} 
                style={styles.packageCard} 
                variant="outlined"
                onPress={() => navigation.navigate('Booking', { specialistId, selectedPackage: pkg })}
              >
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>{pkg.name}</Text>
                  <View style={{ marginTop: 4 }}>
                    {pkg.benefits?.map((benefit: string, bIdx: number) => (
                        <Text key={bIdx} style={styles.packageDesc}>• {benefit}</Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.packagePrice}>₦{Number(pkg.price).toLocaleString()}</Text>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>No packages available yet.</Text>
          )}
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews ({specialist?.reviews?.length || 0})</Text>
            {specialist?.reviews?.length > 3 && (
                <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            )}
          </View>
          
          {specialist?.reviews?.length > 0 ? (
              specialist.reviews.slice(0, 3).map((review: any, rIdx: number) => (
                <Card key={rIdx} style={[styles.reviewCard, { marginBottom: 12 }]} variant="flat">
                    <View style={styles.reviewHeader}>
                        <Avatar name={review.patientName || 'Patient'} size={32} />
                        <View style={styles.reviewUser}>
                            <Text style={styles.reviewName}>{review.patientName || 'Patient'}</Text>
                            <Text style={styles.reviewDate}>{safeFormat(review.date, 'PP')}</Text>
                        </View>
                        <View style={styles.ratingRow}>
                            <Star color="#FFB100" size={14} weight="fill" />
                            <Text style={styles.ratingText}>{Number(review.rating).toFixed(1)}</Text>
                        </View>
                    </View>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                </Card>
              ))
          ) : (
              <Text style={styles.emptyText}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          label="Book Appointment" 
          onPress={() => navigation.navigate('Booking', { specialistId })} 
          style={styles.bookButton}
        />
      </View>
    </SafeAreaView>
  );
};
