import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { Warning, CaretRight as CaretRightIcon } from 'phosphor-react-native';

interface ProfileIncompleteBannerProps {
  bloodType?: string | null;
}

export const ProfileIncompleteBanner: React.FC<ProfileIncompleteBannerProps> = ({ bloodType }) => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const isIncomplete = !bloodType;

  if (!isIncomplete) return null;

  return (
    <TouchableOpacity 
      style={styles.banner}
      onPress={() => navigation.navigate('PersonalInformation')}
    >
      <View style={styles.iconContainer}>
        <Warning size={20} color="#f59e0b" weight="fill" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Add your blood type to start receiving donation requests</Text>
      </View>
      <CaretRightIcon size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

export const BloodTypeRequiredGate: React.FC<{ children: React.ReactNode; bloodType?: string | null }> = ({ 
  children, 
  bloodType 
}) => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  if (!bloodType) {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateContent}>
          <Warning size={48} color="#f59e0b" weight="fill" />
          <Text style={styles.gateTitle}>Blood Type Required</Text>
          <Text style={styles.gateDescription}>
            You need to add your blood type in your profile before you can participate in blood donations.
          </Text>
          <TouchableOpacity 
            style={styles.gateButton}
            onPress={() => navigation.navigate('PersonalInformation')}
          >
            <Text style={styles.gateButtonText}>Add Blood Type</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

export const CompatibilityBadge: React.FC<{ isCompatible: boolean }> = ({ isCompatible }) => {
  return (
    <View style={[styles.badge, isCompatible ? styles.compatibleBadge : styles.incompatibleBadge]}>
      <Text style={[styles.badgeText, isCompatible ? styles.compatibleText : styles.incompatibleText]}>
        {isCompatible ? 'Compatible ✅' : 'Not Compatible ❌'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  subtitle: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  gateContent: {
    alignItems: 'center',
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  gateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  gateButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  gateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compatibleBadge: {
    backgroundColor: '#dcfce7',
  },
  incompatibleBadge: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compatibleText: {
    color: '#16a34a',
  },
  incompatibleText: {
    color: '#dc2626',
  },
});