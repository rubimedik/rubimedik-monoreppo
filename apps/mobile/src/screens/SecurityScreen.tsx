import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { Lock, ShieldCheck, Fingerprint } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

export const SecurityScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    form: {
      gap: theme.spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing['2xl'],
    },
    securityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.card,
    },
    securityIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.lightRedTint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    securityTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
    },
    securityDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    }
  }), [theme]);

  const handleUpdatePassword = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    // Simulate API call
    Alert.alert('Success', 'Password updated successfully');
    navigation.goBack();
  };

  const toggleBiometric = (value: boolean) => {
    setIsBiometricEnabled(value);
    Alert.alert(
      value ? 'Biometrics Enabled' : 'Biometrics Disabled',
      value ? 'You can now use Touch ID / Face ID to sign in.' : 'Biometric sign-in has been disabled.'
    );
  };

  const toggle2FA = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Setup Two-Factor Auth',
        'Would you like to enable 2FA? We will send a code to your email for every new login.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIs2FAEnabled(false) },
          { text: 'Enable', onPress: () => setIs2FAEnabled(true) }
        ]
      );
    } else {
      setIs2FAEnabled(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.form}>
          <TextInput
            label="Current Password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />
          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />
          <TextInput
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />
          <PrimaryButton 
            label="Update Password" 
            onPress={handleUpdatePassword} 
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Biometrics</Text>
        <Card style={styles.securityCard} variant="outlined">
          <View style={styles.securityIcon}>
            <Fingerprint color={theme.colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Touch ID / Face ID</Text>
            <Text style={styles.securityDesc}>Use biometrics to sign in quickly and securely.</Text>
          </View>
          <Switch 
            value={isBiometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </Card>

        <Text style={styles.sectionTitle}>Account Security</Text>
        <Card style={styles.securityCard} variant="outlined">
          <View style={styles.securityIcon}>
            <ShieldCheck color={theme.colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
            <Text style={styles.securityDesc}>Add an extra layer of security to your account.</Text>
          </View>
          <Switch 
            value={is2FAEnabled}
            onValueChange={toggle2FA}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

