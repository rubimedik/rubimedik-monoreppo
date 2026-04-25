import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Card } from '../components/Card';
import { BackButton } from '../components';
import { CaretLeft, Drop, CheckCircle, PenNib, User as UserIcon, FileText, Funnel, MagnifyingGlass, CalendarPlus, XCircle, VideoCamera } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

export const RecentActivitiesScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { type } = route.params || { type: 'hospital' };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: [type === 'hospital' ? 'hospital-activities' : 'specialist-activities'],
    queryFn: async () => {
      const endpoint = type === 'hospital' ? '/hospitals/activities' : '/specialists/activities';
      const res = await api.get(endpoint);
      return res.data;
    },
  });

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    let filtered = activities;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => 
        item.title?.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedFilter) {
      filtered = filtered.filter((item: any) => item.type === selectedFilter);
    }
    
    return filtered;
  }, [activities, searchQuery, selectedFilter]);

  const filterOptions = [
    { label: 'All', value: null },
    { label: 'Consultations', value: 'CONSULTATION_BOOKED' },
    { label: 'Completed', value: 'CONSULTATION_COMPLETED' },
    { label: 'Cancelled', value: 'CONSULTATION_CANCELLED' },
    { label: 'Profile', value: 'PROFILE_UPDATE' },
    { label: 'Meetings', value: 'MEETING_UPDATED' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION_BOOKED':
        return { icon: CalendarPlus, color: theme.colors.primary, bg: theme.colors.primary + '15' };
      case 'CONSULTATION_COMPLETED':
        return { icon: CheckCircle, color: theme.colors.success, bg: theme.colors.success + '15' };
      case 'CONSULTATION_CANCELLED':
        return { icon: XCircle, color: theme.colors.error, bg: theme.colors.error + '15' };
      case 'PROFILE_UPDATE':
        return { icon: UserIcon, color: '#FFAB00', bg: '#FFAB0015' };
      case 'MEETING_UPDATED':
        return { icon: VideoCamera, color: '#1976D2', bg: '#1976D215' };
      default:
        return { icon: FileText, color: theme.colors.textSecondary, bg: theme.colors.surface };
    }
  };

  const navigateToActivity = (title: string, type: string, time: string, message: string) => {
    navigation.navigate('ActivityDetail', { activityId: Math.random().toString(), title, type, time, message });
  };

  const renderItem = ({ item }: { item: any }) => {
    const themeInfo = getActivityIcon(item.type);
    const Icon = themeInfo.icon;
    return (
      <TouchableOpacity 
        onPress={() => navigateToActivity(item.title, item.type, new Date(item.createdAt || item.date).toLocaleString(), item.description)}
        style={styles.activityItem}
      >
        <View style={[styles.activityIcon, { backgroundColor: themeInfo.bg }]}>
          <Icon size={20} color={themeInfo.color} weight="fill" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityTime}>{new Date(item.createdAt || item.date).toLocaleString()}</Text>
        </View>
        <CaretLeft size={16} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
      gap: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    searchContainer: {
      padding: 16,
      paddingBottom: 8,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
    },
    filterContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    filterScroll: {
      flexDirection: 'row',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    filterChipTextActive: {
      color: 'white',
    },
    listContent: {
      padding: 24,
      paddingBottom: 40,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityContent: {
      flex: 1,
      marginLeft: 12,
    },
    activityTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    activityTime: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>All Activities</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MagnifyingGlass size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value || 'all'}
              style={[
                styles.filterChip,
                selectedFilter === option.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent activity found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
