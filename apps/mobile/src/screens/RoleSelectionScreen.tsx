import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { User as UserIcon, Stethoscope, Drop, Hospital as HospitalIcon, CaretRight as CaretRightIcon } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserRole } from '@repo/shared';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;

const roles = [
  {
    id: UserRole.PATIENT,
    title: 'Patient',
    description: 'Find specialists, book consultations, and manage your health.',
    icon: UserIcon,
    color: '#1976D2',
  },
  {
    id: UserRole.SPECIALIST,
    title: 'Specialist',
    description: 'Provide teleconsultations, manage referrals, and earn.',
    icon: Stethoscope,
    color: '#D32F2F',
  },
  {
    id: UserRole.DONOR,
    title: 'Blood Donor',
    description: 'Register to donate blood and help save lives.',
    icon: Drop,
    color: '#C62828',
  },
  {
    id: UserRole.HOSPITAL,
    title: 'Hospital',
    description: 'Manage blood requests and patient referrals.',
    icon: HospitalIcon,
    color: '#1B5E20',
  },
];

export const RoleSelectionScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleRoleSelect = (role: UserRole) => {
    navigation.navigate('Signup', { role });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl, paddingBottom: theme.spacing['2xl'] }]}>
        <View style={[styles.header, { marginTop: theme.spacing.xl, marginBottom: theme.spacing['2xl'] }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold }]}>Join Rubimedik</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Select your role to get started with the platform</Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <TouchableOpacity 
                key={role.id}
                style={[styles.roleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => handleRoleSelect(role.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: role.color + '15' }]}>
                  <Icon color={role.color} size={28} weight="fill" />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilySemiBold }]}>{role.title}</Text>
                  <Text style={[styles.roleDescription, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{role.description}</Text>
                </View>
                <CaretRightIcon color={theme.colors.textSecondary} size={20} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.footer, { marginTop: theme.spacing['2xl'] }]}
          onPress={() => navigation.navigate('Login', {})}
        >
          <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Already have an account? </Text>
          <Text style={[styles.footerLink, { color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold }]}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
  },
  header: {
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  roleList: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
  },
});
