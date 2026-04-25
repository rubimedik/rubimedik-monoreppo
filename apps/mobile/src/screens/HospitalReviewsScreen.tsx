import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { donationService, Review, HospitalRating } from '../services/donationService';
import { Avatar } from '../components/Avatar';
import { BackButton } from '../components';
import { Star, CaretLeft } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

export const HospitalReviewsScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { hospitalId, hospitalName } = route.params || {};

  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ['hospital-rating', hospitalId],
    queryFn: () => donationService.getHospitalRating(hospitalId),
    enabled: !!hospitalId,
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['hospital-reviews', hospitalId],
    queryFn: () => donationService.getHospitalReviews(hospitalId),
    enabled: !!hospitalId,
  });

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={item.donorName || 'Donor'} size={40} />
        <View style={styles.reviewHeaderInfo}>
          <Text style={styles.reviewerName}>{item.donorName || 'Anonymous Donor'}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                weight={star <= item.rating ? 'fill' : 'regular'}
                color={star <= item.rating ? '#fbbf24' : theme.colors.border}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
        </Text>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CaretLeft weight="bold" color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Reviews</Text>
      </View>

      {!ratingLoading && ratingData && (
        <View style={styles.ratingSummary}>
          <Text style={styles.avgRating}>{ratingData.averageRating.toFixed(1)}</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                weight={star <= Math.round(ratingData.averageRating) ? 'fill' : 'regular'}
                color={star <= Math.round(ratingData.averageRating) ? '#fbbf24' : theme.colors.border}
              />
            ))}
          </View>
          <Text style={styles.totalReviews}>{ratingData.totalReviews} reviews</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reviews yet. Be the first to review!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  ratingSummary: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avgRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: { padding: 16 },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewHeaderInfo: { flex: 1, marginLeft: 12 },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});