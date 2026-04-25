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
  Switch,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { Lock, ShieldCheck, Fingerprint, NumberSquareFour } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSecurityStore } from '../store/useSecurityStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import * as LocalAuthentication from 'expo-local-authentication';

export const SecurityScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { isPinEnabled, isBiometricsEnabled, setIsBiometricsEnabled, setIsPinEnabled, savePin, supportedBiometrics, setSupportedBiometrics } = useSecurityStore();
  
  const { user, setUser } = useAuthStore();
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');

  React.useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setSupportedBiometrics(types);
    }
  };

  const biometricLabel = useMemo(() => {
    if (supportedBiometrics.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID / Fingerprint';
    }
    return 'Fingerprint';
  }, [supportedBiometrics]);

  const toggle2FA = async (value: boolean) => {
    if (value) {
        Alert.alert(
            'Enable 2FA', 
            'A verification code will be sent to your email whenever you log in. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Enable', onPress: async () => {
                    try {
                        await api.post('/auth/2fa/toggle', { enable: true });
                        if (user) setUser({ ...user, isTwoFactorEnabled: true });
                        Alert.alert('Success', 'Two-factor authentication enabled.');
                    } catch (error: any) {
                        const message = error.response?.data?.message || 'Could not enable 2FA. Please try again.';
                        Alert.alert('Error', message);
                    }
                }}
            ]
        );
    } else {
        try {
            await api.post('/auth/2fa/toggle', { enable: false });
            if (user) setUser({ ...user, isTwoFactorEnabled: false });
            Alert.alert('Success', 'Two-factor authentication disabled.');
        } catch (error) {
            Alert.alert('Error', 'Could not disable 2FA. Please try again.');
        }
    }
  };
  
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 24,
        gap: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamilyBold,
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    modalDesc: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelModalBtn: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
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

  const toggleBiometric = async (value: boolean) => {
    if (value && !isPinEnabled) {
        Alert.alert('PIN Required', 'Please set up a Security PIN before enabling biometrics.');
        return;
    }
    setIsBiometricsEnabled(value);
  };

  const handleSavePin = async () => {
    if (pin.length !== 4) {
        Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric PIN.');
        return;
    }
    await savePin(pin);
    setPin('');
    setIsPinModalVisible(false);
    Alert.alert('Success', 'Security PIN has been set.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>App Protection</Text>
        
        <Card style={styles.securityCard} variant="outlined">
          <View style={styles.securityIcon}>
            <NumberSquareFour color={theme.colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Security PIN</Text>
            <Text style={styles.securityDesc}>{isPinEnabled ? 'Your app is protected with a PIN.' : 'Set a 4-digit PIN for extra security.'}</Text>
          </View>
          <TouchableOpacity 
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.primary + '15', borderRadius: 8 }}
            onPress={() => setIsPinModalVisible(true)}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>{isPinEnabled ? 'Change' : 'Set PIN'}</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.securityCard} variant="outlined">
          <View style={styles.securityIcon}>
            <Fingerprint color={theme.colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Biometric Unlock</Text>
            <Text style={styles.securityDesc}>Use {biometricLabel} to open the app.</Text>
          </View>
          <Switch 
            value={isBiometricsEnabled}
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
            value={!!user?.isTwoFactorEnabled}
            onValueChange={toggle2FA}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </Card>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Login Credentials</Text>
        <Card style={styles.securityCard} variant="outlined">
          <View style={styles.securityIcon}>
            <Lock color={theme.colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Password</Text>
            <Text style={styles.securityDesc}>Last updated recently</Text>
          </View>
          <TouchableOpacity 
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.primary + '15', borderRadius: 8 }}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>Change</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal 
        visible={isPinModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{isPinEnabled ? 'Change PIN' : 'Set Security PIN'}</Text>
                <Text style={styles.modalDesc}>Enter a 4-digit PIN to secure your app.</Text>
                
                <TextInput 
                    label="PIN"
                    placeholder="0000"
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10 }}
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity 
                        style={[styles.modalBtn, styles.cancelModalBtn]}
                        onPress={() => setIsPinModalVisible(false)}
                    >
                        <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleSavePin}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Save PIN</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

