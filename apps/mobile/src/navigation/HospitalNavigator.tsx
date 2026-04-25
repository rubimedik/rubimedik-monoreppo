import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { HospitalDashboardScreen } from '../screens/HospitalDashboardScreen';
import { BloodRequestsScreen } from '../screens/BloodRequestsScreen';
import { DonationsScreen } from '../screens/DonationsScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInformationScreen } from '../screens/PersonalInformationScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ReferralsScreen } from '../screens/ReferralsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { TopUpScreen } from '../screens/TopUpScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { HospitalProfileUpdateScreen } from '../screens/HospitalProfileUpdateScreen';
import { SpecialistAccountScreen } from '../screens/SpecialistAccountScreen';
import { BloodRequestFormScreen } from '../screens/BloodRequestFormScreen';
import { RecordDonationScreen } from '../screens/RecordDonationScreen';
import { DonorListScreen } from '../screens/DonorListScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { WithdrawalScreen } from '../screens/WithdrawalScreen';
import { BankAccountScreen } from '../screens/BankAccountScreen';
import { ProviderDetailsScreen } from '../screens/ProviderDetailsScreen';
import { NativeCardPaymentScreen } from '../screens/NativeCardPaymentScreen';
import { NativeBankTransferScreen } from '../screens/NativeBankTransferScreen';
import { PaymentOTPScreen } from '../screens/PaymentOTPScreen';
import { HospitalDonationMatchesScreen } from '../screens/HospitalDonationMatchesScreen';
import { HospitalDonationDetailScreen } from '../screens/HospitalDonationDetailScreen';
import { BloodRequestDetailScreen } from '../screens/BloodRequestDetailScreen';
import { FulfilledRequestsScreen } from '../screens/FulfilledRequestsScreen';
import { FulfilledRequestDetailScreen } from '../screens/FulfilledRequestDetailScreen';
import { SavedCardsScreen } from '../screens/SavedCardsScreen';
import { RecentActivitiesScreen } from '../screens/RecentActivitiesScreen';
import { TransactionsHistoryScreen } from '../screens/TransactionsHistoryScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { ConsultationDetailScreen } from '../screens/ConsultationDetailScreen';
import { BloodRequestPickerScreen } from '../screens/BloodRequestPickerScreen';
import {
  House as HomeIcon,
  User as UserIcon,
  FirstAidKit,
  Drop,
  ChartLine,
  Wallet,
  Gear
} from 'phosphor-react-native';

import { HospitalReviewsScreen } from '../screens/HospitalReviewsScreen';
import { ReviewForm } from '../components/ReviewForm';

export type HospitalStackParamList = {
  MainTabs: undefined;
  PersonalInformation: undefined;
  Security: undefined;
  NotificationSettings: undefined;
  Referrals: undefined;
  Payment: { amount: number };
  TopUp: { amount?: number };
  HelpSupport: undefined;
  Notifications: undefined;
  HospitalProfileUpdate: undefined;
  BloodRequestForm: undefined;
  Inventory: undefined;
  RecordDonation: { requestId?: string, bloodType?: string, matchId?: string };
  DonorList: undefined;
  ActivityDetail: { activityId: string; title: string; type: string; time: string; message: string };
  Transfer: undefined;
  Withdraw: undefined;
  BankAccount: undefined;
  Wallet: undefined;
  ProviderDetails: { providerId: string; type: 'specialist' | 'hospital' };
  NativeCardPayment: { amount: number };
  NativeBankTransfer: { amount: number };
  PaymentOTP: { reference: string, amount: number };
  HospitalDonationMatches: undefined;
  HospitalDonationDetail: { matchId: string };
  BloodRequestDetail: { requestId: string };
  FulfilledRequests: undefined;
  FulfilledRequestDetail: { requestId: string };

  SavedCards: undefined;
  RecentActivities: { type: 'hospital' | 'specialist' };
  BloodRequestPicker: undefined;
  HospitalReviews: { hospitalId: string; hospitalName?: string };
  ReviewForm: { requestId: string; hospitalId: string; reviewId?: string };
  TransactionHistory: undefined;
  TransactionDetail: { transaction: any };
  ConsultationDetail: { consultationId: string };
};

const Stack = createNativeStackNavigator<HospitalStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme, isDarkMode } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: theme.typography.fontFamilyMedium,
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDarkMode ? 'dark' : 'light'}
            intensity={Platform.OS === 'ios' ? 80 : 100}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HospitalDashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="BloodRequests" 
        component={BloodRequestsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Drop color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="Donations" 
        component={HospitalDonationMatchesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Drop color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="WalletTab" 
        component={WalletScreen} 
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} weight="fill" />,
        }}
      />
    </Tab.Navigator>
  );
};

export const HospitalNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        animation: 'none',
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Referrals" component={ReferralsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HospitalProfileUpdate" component={HospitalProfileUpdateScreen} />
      <Stack.Screen name="BloodRequestForm" component={BloodRequestFormScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="RecordDonation" component={RecordDonationScreen} />
      <Stack.Screen name="DonorList" component={DonorListScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawalScreen} />
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
      <Stack.Screen name="NativeCardPayment" component={NativeCardPaymentScreen} />
      <Stack.Screen name="NativeBankTransfer" component={NativeBankTransferScreen} />
      <Stack.Screen name="PaymentOTP" component={PaymentOTPScreen} />
      <Stack.Screen name="HospitalDonationMatches" component={HospitalDonationMatchesScreen} />
      <Stack.Screen name="HospitalDonationDetail" component={HospitalDonationDetailScreen} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
      <Stack.Screen name="BloodRequestDetail" component={BloodRequestDetailScreen} />
      <Stack.Screen name="FulfilledRequests" component={FulfilledRequestsScreen} />
      <Stack.Screen name="FulfilledRequestDetail" component={FulfilledRequestDetailScreen} />
      <Stack.Screen name="RecentActivities" component={RecentActivitiesScreen} />
      <Stack.Screen name="BloodRequestPicker" component={BloodRequestPickerScreen} />
      <Stack.Screen name="HospitalReviews" component={HospitalReviewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReviewForm" component={ReviewForm} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionHistory" component={TransactionsHistoryScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="ConsultationDetail" component={ConsultationDetailScreen} />
    </Stack.Navigator>
  );
};
