import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useQuery } from '@tanstack/react-query';
import { DonorHomeScreen } from '../screens/DonorHomeScreen';
import { MyAppointmentsScreen } from '../screens/MyAppointmentsScreen';
import { DonationsScreen } from '../screens/DonationsScreen';
import { BookDonationScreen } from '../screens/BookDonationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInformationScreen } from '../screens/PersonalInformationScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ReferralsScreen } from '../screens/ReferralsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { TopUpScreen } from '../screens/TopUpScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { WithdrawalScreen } from '../screens/WithdrawalScreen';
import { BankAccountScreen } from '../screens/BankAccountScreen';
import { ProviderDetailsScreen } from '../screens/ProviderDetailsScreen';
import { NativeCardPaymentScreen } from '../screens/NativeCardPaymentScreen';
import { NativeBankTransferScreen } from '../screens/NativeBankTransferScreen';
import { PaymentOTPScreen } from '../screens/PaymentOTPScreen';
import { BloodRequestDetailScreen } from '../screens/BloodRequestDetailScreen';
import { SavedCardsScreen } from '../screens/SavedCardsScreen';
import { BloodRequestsNearbyScreen } from '../screens/BloodRequestsNearbyScreen';
import { HospitalReviewsScreen } from '../screens/HospitalReviewsScreen';
import { TransactionsHistoryScreen } from '../screens/TransactionsHistoryScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { ConsultationDetailScreen } from '../screens/ConsultationDetailScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { donationService } from '../services/donationService';
import { ReviewForm } from '../components/ReviewForm';
import { 
  House as HomeIcon, 
  User as UserIcon,
  Calendar as CalendarIcon,
  Drop,
  Wallet as WalletIcon
} from 'phosphor-react-native';

export type DonorStackParamList = {
  MainTabs: undefined;
  PersonalInformation: undefined;
  Security: undefined;
  NotificationSettings: undefined;
  Referrals: undefined;
  Payment: { amount: number };
  TopUp: { amount?: number };
  HelpSupport: undefined;
  Notifications: undefined;
  ActivityDetail: { activityId: string; title: string; type: string; time: string; message: string };
  Transfer: undefined;
  Withdraw: undefined;
  BankAccount: undefined;
  Wallet: undefined;
  Donations: undefined;
  BookDonation: { requestId?: string };
  ProviderDetails: { providerId: string; type: 'specialist' | 'hospital' };
  NativeCardPayment: { amount: number; isAddCardOnly?: boolean; redirectTo?: string; returnParams?: any };
  NativeBankTransfer: { amount: number; redirectTo?: string; returnParams?: any };
  PaymentOTP: { reference: string; amount: number };
  BloodRequestDetail: { requestId: string };
  SavedCards: undefined;
  BloodRequestsNearby: undefined;
  HospitalReviews: { hospitalId: string; hospitalName?: string };
  ReviewForm: { requestId: string; hospitalId: string; reviewId?: string };
  TransactionHistory: undefined;
  TransactionDetail: { transaction: any };
  ConsultationDetail: { consultationId: string };
};

const Stack = createNativeStackNavigator<DonorStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useAppTheme();

  const { data: myDonations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationService.getMyDonations(),
  });

  const upcomingCount = myDonations?.filter(d => 
    d.status === 'PENDING' || d.status === 'ACCEPTED'
  ).length || 0;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DonorHomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={MyAppointmentsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <CalendarIcon color={color} size={size} />
              {upcomingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  backgroundColor: theme.colors.error,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {upcomingCount > 9 ? '9+' : upcomingCount}
                  </Text>
                </View>
              )
              }
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Donations" 
        component={DonationsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Drop color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const DonorNavigator = () => {
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
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawalScreen} />
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="BookDonation" component={BookDonationScreen} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
      <Stack.Screen name="NativeCardPayment" component={NativeCardPaymentScreen} />
      <Stack.Screen name="NativeBankTransfer" component={NativeBankTransferScreen} />
      <Stack.Screen name="PaymentOTP" component={PaymentOTPScreen} />
      <Stack.Screen name="BloodRequestDetail" component={BloodRequestDetailScreen} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
      <Stack.Screen name="BloodRequestsNearby" component={BloodRequestsNearbyScreen} />
      <Stack.Screen name="HospitalReviews" component={HospitalReviewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReviewForm" component={ReviewForm} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionHistory" component={TransactionsHistoryScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="ConsultationDetail" component={ConsultationDetailScreen} />
    </Stack.Navigator>
  );
};
