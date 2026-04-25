import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackButton } from '../components';
import { Lock } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';

export const ChangePasswordScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
        Alert.alert('Error', 'New password must be at least 8 characters long');
        return;
    }
    
    setLoading(true);
    try {
        await api.post('/users/update-password', {
            oldPassword: formData.currentPassword,
            newPassword: formData.newPassword
        });
        Alert.alert('Success', 'Password updated successfully');
        navigation.goBack();
    } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to update password. Please check your current password.';
        Alert.alert('Error', message);
    } finally {
        setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.text,
    },
    content: {
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    desc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    }
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.desc}>
            To protect your account, ensure your new password is at least 8 characters long and contains a mix of letters and numbers.
          </Text>

          <TextInput
            label="Current Password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />

          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />

          <TextInput
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={true}
            leftIcon={<Lock color={theme.colors.textSecondary} size={20} />}
          />

          <PrimaryButton 
            label="Update Password" 
            onPress={handleUpdatePassword} 
            loading={loading}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;
