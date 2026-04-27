import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchSpecialistsScreen } from '../screens/SearchSpecialistsScreen';
import { SpecialistProfileScreen } from '../screens/SpecialistProfileScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { TopUpScreen } from '../screens/TopUpScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PersonalInformationScreen } from '../screens/PersonalInformationScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ReferralsScreen } from '../screens/ReferralsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { MyAppointmentsScreen } from '../screens/MyAppointmentsScreen';
import { CareHistoryScreen } from '../screens/CareHistoryScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { TransactionsHistoryScreen } from '../screens/TransactionsHistoryScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { ConsultationDetailScreen } from '../screens/ConsultationDetailScreen';
import AgoraCallScreen from '../screens/AgoraCallScreen';
import { AiAssistantScreen } from '../screens/AiAssistantScreen';
import { SymptomCheckerScreen } from '../screens/SymptomCheckerScreen';
import { PaymentOTPScreen } from '../screens/PaymentOTPScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { WithdrawalScreen } from '../screens/WithdrawalScreen';
import { BankAccountScreen } from '../screens/BankAccountScreen';
import { SavedCardsScreen } from '../screens/SavedCardsScreen';
import { NativeCardPaymentScreen } from '../screens/NativeCardPaymentScreen';
import { NativeBankTransferScreen } from '../screens/NativeBankTransferScreen';
import { BloodRequestDetailScreen } from '../screens/BloodRequestDetailScreen';
import { BloodRequestsNearbyScreen } from '../screens/BloodRequestsNearbyScreen';
import { HospitalReviewsScreen } from '../screens/HospitalReviewsScreen';
import { ReviewForm } from '../components/ReviewForm';
import { SupportTicketListScreen } from '../screens/SupportTicketListScreen';
import { CreateSupportTicketScreen } from '../screens/CreateSupportTicketScreen';
import {
  House as HomeIcon,
  MagnifyingGlass,
  User as UserIcon,
  ChatCircleDots,
  Calendar as CalendarIcon,
  Wallet
} from 'phosphor-react-native';

export type PatientStackParamList = {
  MainTabs: undefined;
  SearchSpecialists: undefined;
  SpecialistProfile: { specialistId: string };
  Booking: { specialistId: string; selectedPackage?: any };
  Payment: { amount: number; consultationId: string };
  PaymentOTP: { reference: string; amount: number };
  BloodRequestDetail: { requestId: string };
  BloodRequestsNearby: undefined;
  Notifications: undefined;
  PersonalInformation: undefined;
  Security: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
  Referrals: undefined;
  Wallet: undefined;
  TopUp: { amount?: number };
  HelpSupport: undefined;
  SupportTickets: undefined;
  CreateSupportTicket: { category?: any; subject?: string; consultationId?: string } | undefined;
  CareHistory: undefined;
  ActivityDetail: { activityId: string; title: string; type: string; time: string; message: string };
  Chat: { roomId: string; otherUserName: string; otherPhone?: string; isSupport?: boolean; ticketStatus?: string };
  TransactionHistory: undefined;
  TransactionDetail: { transaction: any };
  ConsultationDetail: { consultationId: string; action?: 'cancel' | 'reschedule' };
  AgoraCall: { channelName: string; token?: string; consultationId: string };
  AiAssistant: undefined;
  SymptomChecker: undefined;
  Transfer: undefined;
  Withdraw: undefined;
  BankAccount: undefined;
  SavedCards: undefined;
  NativeCardPayment: { amount: number; isAddCardOnly?: boolean; redirectTo?: string; returnParams?: any };
  NativeBankTransfer: { amount: number; redirectTo?: string; returnParams?: any };
  HospitalReviews: { hospitalId: string; hospitalName?: string };
  ReviewForm: { requestId: string; hospitalId: string; reviewId?: string };
};

const Stack = createNativeStackNavigator<PatientStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuthStore();

  const { data: appointments } = useQuery({
    queryKey: ['upcoming-count'],
    queryFn: async () => {
        try {
            const [medical, donations] = await Promise.all([
                api.get('/consultations/my'),
                api.get('/donations/my')
            ]);
            return [...(medical.data || []), ...(donations.data || [])];
        } catch (e) {
            return [];
        }
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const upcomingCount = useMemo(() => {
      if (!appointments) return 0;
      return appointments.filter((a: any) => 
        ['UPCOMING', 'CONFIRMED', 'PENDING', 'PENDING_PAYOUT'].includes(a.status)
      ).length;
  }, [appointments]);

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
        try {
            const res = await api.get('/chat/unread-count');
            return res.data;
        } catch (e) {
            return 0;
        }
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });
  
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
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} weight="fill" />,
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={MyAppointmentsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} weight="fill" />,
          tabBarBadge: upcomingCount > 0 ? upcomingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.primary },
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ChatCircleDots color={color} size={size} weight="fill" />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.error },
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

export const PatientNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="SearchSpecialists" component={SearchSpecialistsScreen} />
      <Stack.Screen name="SpecialistProfile" component={SpecialistProfileScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentOTP" component={PaymentOTPScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Referrals" component={ReferralsScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="SupportTickets" component={SupportTicketListScreen} />
      <Stack.Screen name="CreateSupportTicket" component={CreateSupportTicketScreen} />
      <Stack.Screen name="CareHistory" component={CareHistoryScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionsHistoryScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="ConsultationDetail" component={ConsultationDetailScreen} />
      <Stack.Screen name="AgoraCall" component={AgoraCallScreen} />
      <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
      <Stack.Screen name="SymptomChecker" component={SymptomCheckerScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawalScreen} />
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
      <Stack.Screen name="NativeCardPayment" component={NativeCardPaymentScreen} />
      <Stack.Screen name="NativeBankTransfer" component={NativeBankTransferScreen} />
      <Stack.Screen name="BloodRequestDetail" component={BloodRequestDetailScreen} />
      <Stack.Screen name="BloodRequestsNearby" component={BloodRequestsNearbyScreen} />
      <Stack.Screen name="HospitalReviews" component={HospitalReviewsScreen} />
      <Stack.Screen name="ReviewForm" component={ReviewForm} />
    </Stack.Navigator>
  );
};
