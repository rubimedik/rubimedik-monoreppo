import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { PrimaryButton } from '../components/PrimaryButton';
import { Lock } from 'phosphor-react-native';

const TwoFactorVerifyScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setAuth } = useAuthStore();
  
  const { userId, email, tempToken } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      // Set the temporary token in headers for this specific request
      const response = await api.post('/auth/2fa/verify', { userId, code }, {
          headers: { Authorization: `Bearer ${tempToken}` }
      });
      
      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: user.activeRole === 'SPECIALIST' ? 'SpecialistMain' : 'PatientMain' }],
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed. Please check the code.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock color={theme.colors.primary} size={40} weight="duotone" />
          </View>
          
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Two-Factor Authentication</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We've sent a 6-digit verification code to {'\n'}
            <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{email}</Text>
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
              placeholder="000000"
              placeholderTextColor={theme.colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <Text style={[styles.timer, { color: timeLeft < 60 ? theme.colors.error : theme.colors.textSecondary }]}>
            Code expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>

          <PrimaryButton 
            label="Verify & Login" 
            onPress={handleVerify} 
            loading={loading}
            style={{ marginTop: 24 }}
          />

          <TouchableOpacity 
            style={styles.resendBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D32F2F15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  input: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 16,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendBtn: {
    marginTop: 24,
    padding: 12,
  }
});

export default TwoFactorVerifyScreen;
