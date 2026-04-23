import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { AuthNavigator } from './AuthNavigator';
import { PatientNavigator } from './PatientNavigator';
import { SpecialistNavigator } from './SpecialistNavigator';
import { DonorNavigator } from './DonorNavigator';
import { HospitalNavigator } from './HospitalNavigator';
import { UserRole } from '@repo/shared';
import { useAppTheme } from '../hooks/useAppTheme';
import { useNavigation, createNavigationContainerRef } from '@react-navigation/native';
import { useNotifications } from '../hooks/useNotifications';

export const navigationRef = createNavigationContainerRef();

const NotificationHandler = () => {
  const navigation = useNavigation();
  useNotifications(navigation);
  return null;
};

export const RootNavigator = () => {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const { theme, isDarkMode } = useAppTheme();

  if (!isHydrated) {
    return null; // Or a splash screen
  }

  const customTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  const renderNavigator = () => {
    switch (user?.activeRole) {
      case UserRole.PATIENT:
        return <PatientNavigator />;
      case UserRole.SPECIALIST:
        return <SpecialistNavigator />;
      case UserRole.DONOR:
        return <DonorNavigator />;
      case UserRole.HOSPITAL:
        return <HospitalNavigator />;
      default:
        return <PatientNavigator />;
    }
  };

  return (
    <NavigationContainer theme={customTheme} ref={navigationRef}>
      <NotificationHandler />
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : (
        renderNavigator()
      )}
    </NavigationContainer>
  );
};
