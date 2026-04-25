import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { api } from '../services/api';
import { Envelope, Lock, Eye, EyeSlash } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '@repo/shared';
import { useAppTheme } from '../hooks/useAppTheme';
import { notificationService } from '../services/notificationService';
import Constants, { AppOwnership } from 'expo-constants';
import { 
  GoogleSignin, 
  statusCodes 
} from '@react-native-google-signin/google-signin';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleBackendGoogleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { 
        idToken,
        role: UserRole.PATIENT 
      });

      const { user, access_token, refresh_token } = res.data;
      setAuth(user, access_token, refresh_token);
      notificationService.registerForPushNotificationsAsync();
    } catch (error: any) {
      console.error('Backend Google login error:', error);
      Alert.alert('Login Failed', error.response?.data?.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Constants.appOwnership === AppOwnership.Expo) {
      Alert.alert(
        'Not Supported',
        'Google Sign-in is not supported in Expo Go. Please use a development build.'
      );
      return;
    }

    try {
      console.log('--- Google Login Debug ---');
      console.log('Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB);
      console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS);
      
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      // In newer versions, idToken is in response.data.idToken
      // We also check getTokens() as a fallback
      let idToken = response.data?.idToken;
      
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      
      if (idToken) {
        await handleBackendGoogleLogin(idToken);
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Sign In', 'Play services not available or outdated');
      } else {
        console.error('Google Sign In Error:', error);
        Alert.alert('Google Sign In Failed', error.message || 'Unknown error');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      
      if (response.data.twoFactorRequired) {
        navigation.navigate('TwoFactorVerify', { 
            userId: response.data.userId,
            email: response.data.email,
            tempToken: response.data.tempToken
        });
        return;
      }

      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      notificationService.registerForPushNotificationsAsync();
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Something went wrong';
      
      if (error.response) {
        const message = error.response.data?.message;
        errorMessage = Array.isArray(message) ? message.join('\n') : message || 'Server error';
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('not verified')) {
        Alert.alert(
          'Verification Required',
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Verify Now', 
              onPress: () => navigation.navigate('OTPVerification', { email: email.trim() }) 
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.xl,
      flexGrow: 1,
      justifyContent: 'center',
    },
    header: {
      marginBottom: theme.spacing['2xl'],
    },
    title: {
      fontSize: 32,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    form: {
      width: '100%',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: theme.spacing.lg,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 14,
    },
    loginButton: {
      marginTop: theme.spacing.md,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
    },
    googleButton: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
    },
    footerLink: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        enabled={true}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your healthcare journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Envelope color={theme.colors.textSecondary} size={20} />}
              returnKeyType="next"
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <Eye color={theme.colors.textSecondary} size={20} />
                  ) : (
                    <EyeSlash color={theme.colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword', { email })}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton 
              label="Sign In" 
              onPress={handleLogin} 
              isLoading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <SecondaryButton
              label="Continue with Google"
              icon={<Image source={require('../../assets/google-logo.png')} style={{ width: 24, height: 24 }} />}
              onPress={handleGoogleLogin}
              style={styles.googleButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
