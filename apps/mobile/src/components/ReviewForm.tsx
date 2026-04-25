import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { PrimaryButton } from './PrimaryButton';
import { CaretLeft, Star } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { donationService, Review } from '../services/donationService';

export const ReviewForm: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const { requestId, hospitalId, reviewId, matchId, role } = route.params || {};

  const isHospitalReviewing = role === 'HOSPITAL';

  const { data: existingReview } = useQuery({
    queryKey: ['review', reviewId || matchId],
    queryFn: async () => {
      if (reviewId) {
        const reviews = await donationService.getHospitalReviews(hospitalId);
        return reviews.find(r => r.id === reviewId) || null;
      }
      return null;
    },
    enabled: !!reviewId && !!hospitalId && !isHospitalReviewing,
  });

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    }
  }, [existingReview]);

  const isEditing = !!reviewId;

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isHospitalReviewing 
        ? donationService.submitDonorFeedback({ matchId, rating: data.rating, comment: data.comment })
        : donationService.createReview(data),
    onSuccess: () => {
      if (isHospitalReviewing) {
        queryClient.invalidateQueries({ queryKey: ['hospital-matches'] });
        queryClient.invalidateQueries({ queryKey: ['hospital-pending-reviews'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['request-reviews', requestId] });
        queryClient.invalidateQueries({ queryKey: ['my-review', requestId] });
        queryClient.invalidateQueries({ queryKey: ['hospital-reviews', hospitalId] });
        queryClient.invalidateQueries({ queryKey: ['hospital-rating', hospitalId] });
      }
      Alert.alert('Success', 'Thank you for your feedback!');
      handleSuccess();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      donationService.updateReview(reviewId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-reviews', requestId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', requestId] });
      queryClient.invalidateQueries({ queryKey: ['hospital-reviews', hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['hospital-rating', hospitalId] });
      Alert.alert('Success', 'Review updated!');
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update review');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Required', 'Please write a comment');
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ rating, comment });
    } else {
      createMutation.mutate({ requestId, hospitalId, rating, comment });
    }
  };

  const handleSuccess = () => {
    navigation.goBack();
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginLeft: 12,
    },
    content: { padding: 16 },
    sectionTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    starContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    star: {
      padding: 4,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    submitButton: { marginTop: 24 },
  }), [theme, rating, comment]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CaretLeft weight="bold" color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isHospitalReviewing ? 'Review Donor' : isEditing ? 'Edit Review' : 'Leave Feedback'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {isHospitalReviewing ? 'How would you rate this donor?' : 'How was your donation experience?'}
        </Text>

        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              onPressIn={() => setHoverRating(star)}
              onPressOut={() => setHoverRating(0)}
              style={styles.star}
            >
              <Star
                size={36}
                weight={star <= (hoverRating || rating) ? 'fill' : 'regular'}
                color={star <= (hoverRating || rating) ? '#fbbf24' : theme.colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          {isHospitalReviewing ? 'Donor Feedback' : 'Your Comment'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={isHospitalReviewing ? "Share your feedback about the donor..." : "Share your experience at the hospital..."}
          placeholderTextColor={theme.colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />

        <PrimaryButton
          label={isEditing ? 'Update Review' : 'Submit Review'}
          onPress={handleSubmit}
          isLoading={isPending}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
};