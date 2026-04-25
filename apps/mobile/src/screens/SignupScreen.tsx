import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image,
  Pressable
} from 'react-native';
import { Pressable as GHPressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, PrimaryButton, SecondaryButton, BackButton } from '../components';
import { api } from '../services/api';
import { Envelope, Lock, Eye, EyeSlash, UsersThree, CaretLeft } from 'phosphor-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../hooks/useAppTheme';
import Constants, { AppOwnership } from 'expo-constants';
import { 
  GoogleSignin, 
  statusCodes 
} from '@react-native-google-signin/google-signin';
import { useAuthStore } from '../store/useAuthStore';
import { TouchableOpacity } from 'react-native-gesture-handler';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
type SignupRouteProp = RouteProp<AuthStackParamList, 'Signup'>;

export const SignupScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SignupRouteProp>();
  const { role } = route.params || {};
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleBackendGoogleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { 
        idToken,
        role: role || 'PATIENT'
      });

      const { user, access_token, refresh_token } = res.data;
      setAuth(user, access_token, refresh_token);
    } catch (error: any) {
      console.error('Backend Google signup error:', error);
      Alert.alert('Signup Failed', error.response?.data?.message || 'Server error');
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
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
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

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const trimmedEmail = email.trim();
      await api.post('/auth/signup', { 
        email: trimmedEmail, 
        password, 
        roles: [role], 
        referredBy: referralCode || undefined 
      });
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please verify your email.',
        [{ text: 'OK', onPress: () => navigation.navigate('OTPVerification', { email: trimmedEmail }) }]
      );
    } catch (error: any) {
      console.error('Signup error full:', JSON.stringify(error, null, 2));
      let errorMessage = 'Something went wrong';
      
      if (error.response) {
        console.log('Error response data:', error.response.data);
        const message = error.response.data?.message;
        errorMessage = Array.isArray(message) ? message.join('\n') : message || 'Server error';
      } else if (error.request) {
        console.log('Error request:', error.request);
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert('Signup Failed', errorMessage);
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
      paddingTop: theme.spacing.md,
      flexGrow: 1,
    },
    backButton: {
      marginBottom: theme.spacing.lg,
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    header: {
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    roleText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
      textTransform: 'capitalize',
    },
    form: {
      width: '100%',
    },
    signupButton: {
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
          <BackButton style={styles.backButton} />

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up as a <Text style={styles.roleText}>{role?.toLowerCase() || 'user'}</Text> to join our community
            </Text>
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
              returnKeyType="next"
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

            <TextInput
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
              returnKeyType="next"
            />

            <TextInput
              label="Referral Code (Optional)"
              placeholder="Enter referral code"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              leftIcon={<UsersThree color={theme.colors.textSecondary} size={20} />}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />

            <PrimaryButton 
              label="Create Account" 
              onPress={handleSignup} 
              isLoading={isLoading}
              style={styles.signupButton}
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', {})}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
