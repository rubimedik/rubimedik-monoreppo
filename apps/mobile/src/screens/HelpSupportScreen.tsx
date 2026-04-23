import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { BackButton } from '../components';
import { 
  Envelope, 
  Phone, 
  ChatCircleText, 
  FileText,
  Lock,
  Info,
  CaretRight as CaretRightIcon
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

export const HelpSupportScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link.');
    }
  };

  const supportOptions = useMemo(() => [
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: ChatCircleText,
      color: theme.colors.primary,
      onPress: () => Alert.alert('Coming Soon', 'Live chat support is coming soon!')
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'support@rubimedik.com',
      icon: Envelope,
      color: isDarkMode ? '#60A5FA' : '#1976D2',
      onPress: () => Linking.openURL('mailto:support@rubimedik.com')
    },
    {
      id: 'call',
      title: 'Call Us',
      description: '+234 800 RUBIMEDIK',
      icon: Phone,
      color: isDarkMode ? '#4ADE80' : '#1B5E20',
      onPress: () => Linking.openURL('tel:+234800782463345')
    },
  ], [theme, isDarkMode]);

  const legalOptions = [
    { title: 'Terms of Service', icon: FileText, url: 'https://rubimedik.com/terms.html' },
    { title: 'Privacy Policy', icon: Lock, url: 'https://rubimedik.com/privacy.html' },
    { title: 'FAQ', icon: Info, url: 'https://rubimedik.com/#faq' },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
    },
    content: {
      padding: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.text,
      marginBottom: 16,
    },
    optionsGrid: {
      gap: 16,
    },
    optionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    iconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    optionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    listContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    listItemText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.text,
    },
    footer: {
      marginTop: 48,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    footerSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      opacity: 0.6,
      marginTop: 4,
    }
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} color={theme.colors.text} />
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.optionsGrid}>
          {supportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <TouchableOpacity 
                key={option.id} 
                style={styles.optionCard}
                onPress={option.onPress}
              >
                <View style={[styles.iconWrapper, { backgroundColor: option.color + '15' }]}>
                  <Icon color={option.color} size={28} weight="fill" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Legal & Resources</Text>
        <View style={styles.listContainer}>
          {legalOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.listItem}
                onPress={() => openUrl(option.url)}
              >
                <Icon color={theme.colors.textSecondary} size={20} />
                <Text style={styles.listItemText}>{option.title}</Text>
                <CaretRightIcon color={theme.colors.textSecondary} size={18} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Rubimedik Health Platform</Text>
          <Text style={styles.footerSubtext}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
