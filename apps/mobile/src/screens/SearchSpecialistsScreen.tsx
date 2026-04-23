import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { SearchInput, Card, Badge, Skeleton, Avatar, PrimaryButton, BackButton } from '../components';
import { Funnel, Star, CaretLeft, Sparkle, Info, X, MagnifyingGlass } from 'phosphor-react-native';

const categories = ['All', 'General', 'Cardiology', 'Dentistry', 'Optometry', 'Pediatrics'];

export const SearchSpecialistsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDarkMode } = useAppTheme();
  const [search, setSearch] = useState(route.params?.query || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiSymptoms, setAiSymptoms] = useState('');

  const aiMatchMutation = useMutation({
      mutationFn: async (symptoms: string) => {
          const res = await api.post('/ai/match-specialist', { symptoms });
          return res.data;
      }
  });

  const { data: specialists, isLoading, refetch } = useQuery({
    queryKey: ['specialists', search, selectedCategory, aiMatchMutation.data],
    queryFn: async () => {
      // If AI match data exists and we are in AI mode, use it
      if (isAiMode && aiMatchMutation.data) {
          return aiMatchMutation.data;
      }

      const res = await api.get('/specialists');
      let filtered = res.data;
      
      if (search) {
        filtered = filtered.filter((s: any) => 
          s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          s.specialty?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (selectedCategory !== 'All') {
        filtered = filtered.filter((s: any) => s.specialty === selectedCategory);
      }

      return filtered;
    }
  });

  useEffect(() => {
      if (route.params?.query) {
          setSearch(route.params.query);
      }
  }, [route.params?.query]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    title: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    aiToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 12,
    },
    aiToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
    },
    searchRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    searchInput: {
      flex: 1,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    aiInputContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    aiInput: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.primary + '40',
        minHeight: 100,
        textAlignVertical: 'top',
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontFamily,
    },
    categoriesContainer: {
      marginBottom: theme.spacing.md,
    },
    categoriesScroll: {
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    categoryActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
    },
    categoryActiveText: {
      color: theme.colors.white,
    },
    listContent: {
      padding: theme.spacing.xl,
      paddingTop: 0,
      paddingBottom: Platform.OS === 'ios' ? 120 : 100,
      gap: theme.spacing.md,
    },
    specialistCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    specialistInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    name: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    specialty: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    location: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    price: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    emptyContainer: {
      paddingTop: 100,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    }
  }), [theme, isDarkMode]);

  const renderSpecialist = ({ item }: { item: any }) => {
    const specName = item.user?.fullName || item.user?.email || 'Specialist';
    const displayName = item.user?.fullName || item.user?.email?.split('@')[0] || 'Dr. Specialist';

    return (
      <Card 
        style={styles.specialistCard} 
        onPress={() => navigation.navigate('SpecialistProfile', { specialistId: item.id })}
      >
        <Avatar name={specName} size={64} isVerified={item.isApproved} />
        <View style={styles.specialistInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.ratingRow}>
              <Star color="#FFB100" size={16} weight="fill" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
            </View>
          </View>
          <Text style={styles.specialty}>{item.specialty} • {item.yearsOfExperience || 0} years exp.</Text>
          <Text style={styles.location}>{item.location || 'Online'}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.price}>₦{Number(item.consultationPackages?.[0]?.price || 10000).toLocaleString()}</Text>
            <Badge label="Available" variant="success" />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Find Specialist</Text>
      </View>

      <View style={styles.aiToggle}>
          <TouchableOpacity 
            style={[styles.aiToggleBtn, { backgroundColor: isAiMode ? theme.colors.primary + '15' : 'transparent', borderColor: isAiMode ? theme.colors.primary : theme.colors.border }]}
            onPress={() => setIsAiMode(!isAiMode)}
          >
              <Sparkle size={18} color={isAiMode ? theme.colors.primary : theme.colors.textSecondary} weight={isAiMode ? 'fill' : 'regular'} />
              <Text style={{ fontSize: 13, fontFamily: theme.typography.fontFamilyBold, color: isAiMode ? theme.colors.primary : theme.colors.textSecondary }}>AI Matching</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.aiToggleBtn, { backgroundColor: !isAiMode ? theme.colors.primary + '15' : 'transparent', borderColor: !isAiMode ? theme.colors.primary : theme.colors.border }]}
            onPress={() => setIsAiMode(false)}
          >
              <MagnifyingGlass size={18} color={!isAiMode ? theme.colors.primary : theme.colors.textSecondary} weight={!isAiMode ? 'fill' : 'regular'} />
              <Text style={{ fontSize: 13, fontFamily: theme.typography.fontFamilyBold, color: !isAiMode ? theme.colors.primary : theme.colors.textSecondary }}>Manual Search</Text>
          </TouchableOpacity>
      </View>

      {isAiMode ? (
          <View style={styles.aiInputContainer}>
              <TextInput 
                style={styles.aiInput} 
                placeholder="Describe your symptoms to find the best match (e.g., I've had chest pain and dizziness)..." 
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={aiSymptoms}
                onChangeText={setAiSymptoms}
              />
              <PrimaryButton 
                label="Find Best Matches" 
                style={{ marginTop: 12 }} 
                onPress={() => aiMatchMutation.mutate(aiSymptoms)} 
                isLoading={aiMatchMutation.isPending}
                disabled={!aiSymptoms.trim()}
              />
          </View>
      ) : (
          <>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <View style={styles.searchRow}>
                <SearchInput 
                    value={search} 
                    onChangeText={setSearch} 
                    placeholder="Search by name or specialty..."
                    style={styles.searchInput}
                />
                <TouchableOpacity style={styles.filterButton}>
                    <Funnel color={theme.colors.white} size={24} />
                </TouchableOpacity>
                </View>
            </View>

            <View style={styles.categoriesContainer}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {categories.map((cat) => (
                    <TouchableOpacity 
                    key={cat}
                    style={[
                        styles.categoryChip,
                        selectedCategory === cat && styles.categoryActive
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    >
                    <Text style={[
                        styles.categoryText,
                        selectedCategory === cat && styles.categoryActiveText
                    ]}>
                        {cat}
                    </Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>
          </>
      )}

      {isLoading ? (
        <View style={{ padding: 24 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={120} style={{ marginBottom: 16 }} />)}
        </View>
      ) : (
        <FlatList
          data={specialists}
          renderItem={renderSpecialist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refetch} 
              tintColor={theme.colors.primary} 
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{isAiMode ? 'Describe your symptoms above to find doctors.' : 'No specialists found matching your search.'}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};
