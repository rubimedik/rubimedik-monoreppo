import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  RefreshControl,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { 
  User as UserIcon,
  CaretRight as CaretRightIcon, 
  ShieldCheck, 
  Bell, 
  Question, 
  SignOut,
  CreditCard, 
  Bank,
  ShareNetwork,
  Lock,
  FileText,
  Info,
  PencilSimple,
  ClockCounterClockwise,
  CheckCircle
} from 'phosphor-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';
import { UserRole } from '@repo/shared';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const ProfileScreen = () => {
  const { user, logout, setActiveRole } = useAuthStore();
  const navigation = useNavigation<any>();
  const { theme, isDarkMode, toggleTheme } = useAppTheme();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Load preferences
  React.useEffect(() => {
    AsyncStorage.getItem('skip_role_confirmation').then(val => {
      if (val === 'true') setDontAskAgain(true);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    setTimeout(() => setRefreshing(false), 500);
  };

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      const baseData = res.data;
      
      try {
        const profileRes = await api.get('/users/profile');
        return { ...baseData, ...profileRes.data };
      } catch (err) {
        return baseData;
      }
    },
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await api.patch('/users/me', { activeRole: role });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (data.activeRole) {
        setActiveRole(data.activeRole as UserRole);
        Alert.alert('Success', `Switched to ${data.activeRole.toLowerCase()} mode`);
      }
    },
    onError: (error: any) => {
      console.error('Role switch error:', error.response?.data || error.message);
      
      const message = error.response?.data?.message || '';
      if (message.includes('setup') || message.includes('profile')) {
          // If setup is needed, we handle it in the confirmRoleSwitch logic or here
          Alert.alert('Setup Required', 'You need to complete your profile before using this role.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Set Up Now', onPress: () => {
                  if (pendingRole === UserRole.SPECIALIST) navigation.navigate('SpecialistProfileUpdate');
                  else if (pendingRole === UserRole.HOSPITAL) navigation.navigate('HospitalProfileUpdate');
                  else if (pendingRole === UserRole.DONOR) navigation.navigate('PersonalInformation');
              }}
          ]);
      } else {
        Alert.alert('Error', message || 'Failed to switch role.');
      }
    }
  });

  const handleSwitchRequest = async (role: UserRole) => {
    if (user?.activeRole === role) return;

    // Check if user already HAS the role
    const hasRole = user?.roles?.includes(role);

    if (hasRole || dontAskAgain) {
      switchRoleMutation.mutate(role);
      return;
    }

    setPendingRole(role);
    setShowConfirmationModal(true);
  };

  const confirmRoleSwitch = async () => {
    if (!pendingRole) return;
    
    if (dontAskAgain) {
      await AsyncStorage.setItem('skip_role_confirmation', 'true');
    }

    setShowConfirmationModal(false);
    switchRoleMutation.mutate(pendingRole);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            queryClient.clear();
            logout();
          } 
        },
      ]
    );
  };

  const openUrl = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const menuItems = useMemo(() => {
    const items = [
      { id: 'personal', title: 'Personal Information', icon: UserIcon, color: '#1976D2', screen: 'PersonalInformation' },
      { id: 'bank', title: 'Bank Account', icon: Bank, color: '#2E7D32', screen: 'BankAccount' },
      { id: 'cards', title: 'Saved Cards', icon: CreditCard, color: '#673AB7', screen: 'SavedCards' },
      { id: 'notifications', title: 'Notifications', icon: Bell, color: '#FFB100', screen: 'NotificationSettings' },
      { id: 'security', title: 'Security & Password', icon: ShieldCheck, color: '#1B5E20', screen: 'Security' },
      { id: 'referral', title: 'Refer & Earn', icon: ShareNetwork, color: theme.colors.primary, screen: 'Referrals' },
      { id: 'help', title: 'Help & Support', icon: Question, color: theme.colors.textSecondary, screen: 'HelpSupport' },
    ];

    // Add Care History for Patients
    if (user?.activeRole === UserRole.PATIENT) {
        items.splice(1, 0, { id: 'history', title: 'My Care History', icon: ClockCounterClockwise, color: theme.colors.success, screen: 'CareHistory' });
    }

    // Hide items for donors
    if (user?.activeRole === UserRole.DONOR) {
        return items.filter(item => item.id !== 'referral' && item.id !== 'notifications' && item.id !== 'bank');
    }

    // Hide items for hospitals
    if (user?.activeRole === UserRole.HOSPITAL) {
        return items.filter(item => item.id !== 'notifications');
    }

    return items;
  }, [theme, user?.activeRole]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      marginBottom: 24,
    },
    avatar: {
      marginBottom: 16,
    },
    userName: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 12,
    },
    roleBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    section: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    menuCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuTitle: {
      flex: 1,
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      marginHorizontal: 24,
      borderRadius: 16,
      backgroundColor: theme.colors.error + '10',
      gap: 12,
      marginTop: 8,
    },
    logoutText: {
      color: theme.colors.error,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 16,
    },
    versionInfo: {
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 16,
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      fontFamily: theme.typography.fontFamily,
    },
    editBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBtnText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    roleToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    roleOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    roleOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    roleText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    roleTextActive: {
      color: 'white',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      gap: 16,
    },
    modalIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary + '10',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    modalDesc: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 10,
      marginBottom: 8,
    },
    checkbox: {
      width: 22,
      height: 22,
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
    checkboxLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalBtn: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary,
    },
    cancelBtnText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textSecondary,
    },
    confirmBtnText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: 'white',
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: theme.colors.surface,
        marginHorizontal: 24,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    themeLabel: {
        fontSize: 15,
        fontFamily: theme.typography.fontFamilyMedium,
        color: theme.colors.textPrimary,
    }
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <Avatar uri={profile?.avatarUrl} name={profile?.fullName || user?.email} size={80} style={styles.avatar} />
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('PersonalInformation')}>
            <PencilSimple size={16} color="white" weight="bold" />
          </TouchableOpacity>
          <Text style={styles.userName}>{profile?.fullName || user?.email?.split('@')[0] || 'User'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Roles</Text>
          <View style={styles.roleToggleContainer}>
            {[UserRole.PATIENT, UserRole.DONOR, UserRole.SPECIALIST, UserRole.HOSPITAL].map((role) => (
              <TouchableOpacity 
                key={role}
                style={[styles.roleOption, user?.activeRole === role && styles.roleOptionActive]}
                onPress={() => handleSwitchRequest(role as UserRole)}
              >
                <Text style={[styles.roleText, user?.activeRole === role && styles.roleTextActive]}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        <View style={styles.themeToggle}>
            <Text style={styles.themeLabel}>Dark Mode</Text>
            <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuCard}>{menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => item.screen ? navigation.navigate(item.screen as any) : null}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.color + '15' }]}>
                    <Icon size={20} color={item.color} weight="fill" />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <CaretRightIcon size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <SignOut size={20} color={theme.colors.error} weight="bold" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Rubimedik v1.0.0 (Alpha)</Text>
        </View>
      </ScrollView>

      {/* Role Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Info size={32} color={theme.colors.primary} weight="duotone" />
            </View>
            <Text style={styles.modalTitle}>Register as {pendingRole?.toLowerCase()}?</Text>
            <Text style={styles.modalDesc}>
              You are about to enable the {pendingRole?.toLowerCase()} role for your account. 
              This will allow you to access features specific to this role.
            </Text>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setDontAskAgain(!dontAskAgain)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, dontAskAgain && styles.checkboxChecked]}>
                {dontAskAgain && <CheckCircle size={16} color="white" weight="bold" />}
              </View>
              <Text style={styles.checkboxLabel}>Don't ask me again</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={confirmRoleSwitch}
              >
                <Text style={styles.confirmBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
