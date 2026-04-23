import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { donationService, HospitalRating } from '../services/donationService';
import { Star } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

interface HospitalRatingBadgeProps {
  hospitalId: string;
  showReviews?: boolean;
}

export const HospitalRatingBadge: React.FC<HospitalRatingBadgeProps> = ({
  hospitalId,
  showReviews = true,
}) => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const { data: rating, isLoading } = useQuery({
    queryKey: ['hospital-rating', hospitalId],
    queryFn: () => donationService.getHospitalRating(hospitalId),
    enabled: !!hospitalId,
  });

  if (isLoading || !rating) {
    return null;
  }

  const content = (
    <View style={styles.container}>
      <Star size={14} weight="fill" color="#fbbf24" />
      <Text style={styles.rating}>{rating.averageRating.toFixed(1)}</Text>
      {showReviews && (
        <Text style={styles.reviews}>({rating.totalReviews})</Text>
      )}
    </View>
  );

  if (!showReviews) {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('HospitalReviews', { hospitalId })}
      style={styles.touchable}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  touchable: {},
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reviews: {
    fontSize: 12,
    color: '#9ca3af',
  },
});