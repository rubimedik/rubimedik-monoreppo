import React, { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  NativeScrollEvent, 
  NativeSyntheticEvent,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Stethoscope, Drop, UsersThree, ShieldCheck } from 'phosphor-react-native';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const slidesData = [
  {
    title: 'Consult Experts',
    description: 'Connect with verified medical specialists from the comfort of your home.',
    icon: Stethoscope,
    color: '#EF4444', // theme.colors.primary
  },
  {
    title: 'Save Lives',
    description: 'Become a blood donor or request blood for emergencies in real-time.',
    icon: Drop,
    color: '#C62828',
  },
  {
    title: 'Smart Referrals',
    description: 'Get seamless referrals from specialists to top-rated hospitals.',
    icon: UsersThree,
    color: '#1976D2',
  },
  {
    title: 'Secure & Trusted',
    description: 'Your health data and transactions are protected with industry-grade security.',
    icon: ShieldCheck,
    color: '#1B5E20',
  },
];

export const OnboardingScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const [activeIndex, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { setHasSeenOnboarding } = useAuthStore();

  const styles = useMemo(() => StyleSheet.create({
    ...stylesStatic,
    slide: {
      ...stylesStatic.slide,
      paddingHorizontal: theme.spacing.xl,
    },
    iconContainer: {
      ...stylesStatic.iconContainer,
      marginBottom: theme.spacing['2xl'],
    },
    footer: {
      ...stylesStatic.footer,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing['2xl'],
    },
    pagination: {
      ...stylesStatic.pagination,
      marginBottom: theme.spacing.xl,
    },
  }), [theme]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActivePage(Math.round(index));
  };

  const handleFinish = () => {
    setHasSeenOnboarding(true);
    navigation.navigate('RoleSelection');
  };

  const handleNext = () => {
    if (activeIndex < slidesData.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleFinish();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.skipContainer, { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.md }]}>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamilyMedium }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slidesData.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <View key={index} style={[styles.slide, { paddingHorizontal: theme.spacing.xl }]}>
              <View style={[styles.iconContainer, { backgroundColor: slide.color + '15', marginBottom: theme.spacing['2xl'] }]}>
                <Icon color={slide.color} size={120} weight="fill" />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamilyBold }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{slide.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing['2xl'] }]}>
        <View style={[styles.pagination, { marginBottom: theme.spacing.xl }]}>
          {slidesData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? [styles.activeDot, { backgroundColor: theme.colors.primary }] : [styles.inactiveDot, { backgroundColor: theme.colors.border }],
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          label={activeIndex === slidesData.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const stylesStatic = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
  button: {
    width: '100%',
  },
});
