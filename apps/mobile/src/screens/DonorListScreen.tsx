import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { BackButton } from '../components';
import { MagnifyingGlass, Funnel, Phone, ChatCircleDots } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

interface Donor {
  id: string;
  fullName: string;
  bloodType: string;
  location: string;
  lastDonated: string;
  isAvailable: boolean;
  phoneNumber: string;
}

const MOCK_DONORS: Donor[] = [
  { id: '1', fullName: 'John Doe', bloodType: 'O+', location: 'Lagos, Nigeria', lastDonated: '2023-12-15', isAvailable: true, phoneNumber: '+2348012345678' },
  { id: '2', fullName: 'Jane Smith', bloodType: 'A-', location: 'Ibadan, Nigeria', lastDonated: '2024-01-20', isAvailable: true, phoneNumber: '+2348022345678' },
  { id: '3', fullName: 'Robert Brown', bloodType: 'B+', location: 'Abuja, Nigeria', lastDonated: '2023-11-10', isAvailable: false, phoneNumber: '+2348032345678' },
  { id: '4', fullName: 'Emily Davis', bloodType: 'AB+', location: 'Lagos, Nigeria', lastDonated: '2024-02-05', isAvailable: true, phoneNumber: '+2348042345678' },
  { id: '5', fullName: 'Michael Wilson', bloodType: 'O-', location: 'Port Harcourt, Nigeria', lastDonated: '2023-10-25', isAvailable: true, phoneNumber: '+2348052345678' },
  { id: '6', fullName: 'Sarah Johnson', bloodType: 'A+', location: 'Lagos, Nigeria', lastDonated: '2024-03-01', isAvailable: true, phoneNumber: '+2348062345678' },
];

const BLOOD_TYPES = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const DonorListScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('All');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: theme.colors.textPrimary },
    
    searchContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.textPrimary,
    },
    filterBtn: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },

    filterContainer: { marginBottom: 16 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    bloodTypeFilter: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeBloodTypeFilter: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    bloodTypeFilterText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: theme.colors.textSecondary,
    },
    activeBloodTypeFilterText: {
      color: theme.colors.textPrimary,
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    donorCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    donorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.lightRedTint,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    avatarText: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: theme.colors.textPrimary,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
    details: { flex: 1, gap: 2 },
    donorName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: theme.colors.textPrimary },
    donorLocation: { fontSize: 13, color: theme.colors.textSecondary, fontFamily: 'Inter_400Regular' },
    lastDonated: { fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic', fontFamily: 'Inter_400Regular' },
    bloodTypeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.lightRedTint,
    },
    bloodTypeText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: theme.colors.textPrimary,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.1)' : theme.colors.lightRedTint,
    },
    actionBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: theme.colors.textPrimary,
    },

    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  }), [theme, isDarkMode]);

  const filteredDonors = MOCK_DONORS.filter(donor => {
    const matchesSearch = donor.fullName.toLowerCase().includes(search.toLowerCase()) || 
                         donor.location.toLowerCase().includes(search.toLowerCase());
    const matchesBloodType = selectedBloodType === 'All' || donor.bloodType === selectedBloodType;
    return matchesSearch && matchesBloodType;
  });

  const renderDonorItem = ({ item }: { item: Donor }) => (
    <View style={styles.donorCard}>
      <View style={styles.donorInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? '#4CAF50' : '#FFC107' }]} />
        </View>
        <View style={styles.details}>
          <Text style={styles.donorName}>{item.fullName}</Text>
          <Text style={styles.donorLocation}>{item.location}</Text>
          <Text style={styles.lastDonated}>Last donated: {item.lastDonated}</Text>
        </View>
        <View style={styles.bloodTypeBadge}>
          <Text style={styles.bloodTypeText}>{item.bloodType}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Phone size={20} color={theme.colors.primary} weight="fill" />
          <Text style={styles.actionBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <ChatCircleDots size={20} color={theme.colors.primary} weight="fill" />
          <Text style={styles.actionBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Donor List</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MagnifyingGlass size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search donors by name or location"
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Funnel size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {BLOOD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.bloodTypeFilter,
                selectedBloodType === type && styles.activeBloodTypeFilter
              ]}
              onPress={() => setSelectedBloodType(type)}
            >
              <Text style={[
                styles.bloodTypeFilterText,
                selectedBloodType === type && styles.activeBloodTypeFilterText
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDonors}
        renderItem={renderDonorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No donors found matching your criteria.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};
