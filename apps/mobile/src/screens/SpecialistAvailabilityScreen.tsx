import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useMemo } from 'react';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { TextInput } from '../components/TextInput';
import { BackButton } from '../components';
import { Calendar as CalendarIcon, Clock, Plus, Trash, Package } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const SpecialistAvailabilityScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showAddPackage, setShowAddPackage] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', price: '', description: '' });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['specialist-profile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/specialists/user/${user?.id}`);
      return res.data;
    }
  });

  const addPackageMutation = useMutation({
    mutationFn: (pkg: any) => api.post('/specialists/packages', pkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-profile'] });
      Alert.alert('Success', 'Consultation package added.');
      setShowAddPackage(false);
      setNewPkg({ name: '', price: '', description: '' });
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: (pkgId: string) => api.delete(`/specialists/packages/${pkgId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialist-profile'] });
      Alert.alert('Deleted', 'Package removed.');
    }
  });

  const handleAddPackage = () => {
    if (!newPkg.name || !newPkg.price) {
      Alert.alert('Error', 'Please enter name and price.');
      return;
    }
    addPackageMutation.mutate({
      name: newPkg.name,
      price: parseFloat(newPkg.price),
      description: newPkg.description
    });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      color: theme.colors.textPrimary,
    },
    content: {
      padding: theme.spacing.xl,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    addBtnText: {
      color: theme.colors.white,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 12,
    },
    addCard: {
      padding: 16,
      marginBottom: 20,
      gap: 12,
    },
    addActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 8,
    },
    cancelBtn: {
      paddingHorizontal: 16,
    },
    itemCard: {
      padding: 16,
      marginBottom: 12,
    },
    itemTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    itemPrice: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
      marginTop: 2,
    },
    itemDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      marginTop: 4,
    },
    availabilityCard: {
      padding: 24,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    availTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginTop: 12,
    },
    availSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 20,
    },
    setupBtn: {
      backgroundColor: isDarkMode ? theme.colors.background : theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    setupBtnText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 10,
    },
  }), [theme, isDarkMode]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>Availability & Packages</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Consultation Packages</Text>
            <TouchableOpacity onPress={() => setShowAddPackage(!showAddPackage)} style={styles.addBtn}>
              <Plus size={18} color={theme.colors.white} weight="bold" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {showAddPackage && (
            <Card variant="outlined" style={styles.addCard}>
              <TextInput 
                label="Package Name" 
                placeholder="e.g. Initial Consultation" 
                value={newPkg.name}
                onChangeText={(t) => setNewPkg({...newPkg, name: t})}
              />
              <TextInput 
                label="Price (NGN)" 
                placeholder="e.g. 5000" 
                keyboardType="numeric"
                value={newPkg.price}
                onChangeText={(t) => setNewPkg({...newPkg, price: t})}
              />
              <TextInput 
                label="What's included?" 
                placeholder="e.g. 30 mins video call, chat follow-up" 
                value={newPkg.description}
                onChangeText={(t) => setNewPkg({...newPkg, description: t})}
                multiline
              />
              <View style={styles.addActions}>
                <TouchableOpacity onPress={() => setShowAddPackage(false)} style={styles.cancelBtn}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton 
                  label="Save Package" 
                  onPress={handleAddPackage} 
                  isLoading={addPackageMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {profile?.consultationPackages?.length > 0 ? (
            profile.consultationPackages.map((pkg: any) => (
              <Card key={pkg.id} variant="outlined" style={styles.itemCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{pkg.name}</Text>
                    <Text style={styles.itemPrice}>NGN {pkg.price?.toLocaleString()}</Text>
                    <Text style={styles.itemDesc}>{pkg.description}</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    Alert.alert('Delete', 'Remove this package?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deletePackageMutation.mutate(pkg.id) }
                    ]);
                  }}>
                    <Trash size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>No packages added yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <Card variant="outlined" style={styles.availabilityCard}>
            <CalendarIcon size={32} color={theme.colors.primary} />
            <Text style={styles.availTitle}>Manage your schedule</Text>
            <Text style={styles.availSubtitle}>Set your daily availability slots for patient bookings.</Text>
            <TouchableOpacity style={styles.setupBtn}>
              <Text style={styles.setupBtnText}>Setup Calendar</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
