import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { UserRole } from '@repo/shared';

import { useAuthStore } from '../store/useAuthStore';

export type AuthStackParamList = {
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: { role?: UserRole };
  Signup: { role: UserRole };
  OTPVerification: { email: string };
  ForgotPassword: { email?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const { hasSeenOnboarding, isAuthenticated } = useAuthStore();
  
  const initialRoute = (hasSeenOnboarding || isAuthenticated) ? "Login" : "Onboarding";
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};
