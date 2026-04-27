import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card, BackButton } from '../components';
import { CaretLeft, Bell, Envelope, DeviceMobile, Broadcast } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

import { useNotificationStore } from '../store/useNotificationStore';
import { UserRole } from '@repo/shared';
import { useAuthStore } from '../store/useAuthStore';

export const NotificationSettingsScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { settings, updateSetting, syncWithBackend } = useNotificationStore();
  const { user } = useAuthStore();

  const isSpecialist = user?.activeRole === UserRole.SPECIALIST;

  React.useEffect(() => {
    syncWithBackend();
  }, []);

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
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
    },
    scrollContent: {
      padding: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    settingsCard: {
      padding: 4,
      backgroundColor: theme.colors.card,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    settingTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      paddingRight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    }
  }), [theme]);

  const toggleSetting = (key: keyof typeof settings) => {
    updateSetting(key, !settings[key]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <Card style={styles.settingsCard} variant="outlined">
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Appointments</Text>
              <Text style={styles.settingDesc}>Reminders for your upcoming consultations.</Text>
            </View>
            <Switch 
              value={settings.pushAppointments} 
              onValueChange={() => toggleSetting('pushAppointments')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Chat Messages</Text>
              <Text style={styles.settingDesc}>New message alerts from your specialists.</Text>
            </View>
            <Switch 
              value={settings.pushChat} 
              onValueChange={() => toggleSetting('pushChat')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Promotions</Text>
              <Text style={styles.settingDesc}>Offers and health platform updates.</Text>
            </View>
            <Switch 
              value={settings.pushPromotions} 
              onValueChange={() => toggleSetting('pushPromotions')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </Card>

        {!isSpecialist && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Email Notifications</Text>
            <Card style={styles.settingsCard} variant="outlined">
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Medical Reports</Text>
                  <Text style={styles.settingDesc}>Receive copies of your consultation summaries.</Text>
                </View>
                <Switch 
                  value={settings.emailReports} 
                  onValueChange={() => toggleSetting('emailReports')}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Security Alerts</Text>
                  <Text style={styles.settingDesc}>Login alerts and password change confirmations.</Text>
                </View>
                <Switch 
                  value={settings.emailSecurity} 
                  onValueChange={() => toggleSetting('emailSecurity')}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

