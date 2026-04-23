import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { BackButton } from '../components';
import { Check, Trash } from 'phosphor-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { donationService, BloodRequest } from '../services/donationService';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['NORMAL', 'URGENT', 'CRITICAL'];
const DONATION_TYPES = [
  { label: 'Whole Blood', value: 'whole_blood' },
  { label: 'Platelet', value: 'platelet' },
  { label: 'Double Red Cell', value: 'double_red_cell' },
];

export const BloodRequestFormScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  
  const existingRequest = route.params?.request as BloodRequest | undefined;
  const isEditing = !!existingRequest;

  const [title, setTitle] = useState(existingRequest?.title || '');
  const [bloodType, setBloodType] = useState(existingRequest?.bloodType || '');
  const [donationType, setDonationType] = useState(existingRequest?.donationType || 'whole_blood');
  const [units, setUnits] = useState(existingRequest?.units ? String(existingRequest.units) : '');
  const [reason, setReason] = useState(existingRequest?.reason || '');
  const [urgency, setUrgency] = useState(existingRequest?.urgency || 'NORMAL');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16, 
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      justifyContent: 'space-between',
    },
    backButton: {
      marginRight: 12, 
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold', 
      color: theme.colors.textPrimary,
    },
    content: {
      padding: 16, 
    },
    section: {
      marginBottom: 32, 
    },
    label: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold', 
      color: theme.colors.textPrimary,
      marginBottom: 16, 
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24, 
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: 60,
      alignItems: 'center',
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium', 
      color: theme.colors.textSecondary,
    },
    chipTextSelected: {
      color: theme.colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12, 
      padding: 16, 
      fontSize: 16,
      fontFamily: 'Inter_400Regular', 
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
    },
    urgencyContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    urgencyButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12, 
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    urgencyText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold', 
      color: theme.colors.textSecondary,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      height: 56,
      borderRadius: 12, 
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginTop: 16, 
      marginBottom: 16, 
    },
    deleteButton: {
      backgroundColor: 'transparent',
      flexDirection: 'row',
      height: 56,
      borderRadius: 12, 
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.error,
      marginBottom: 32, 
    },
    submitButtonText: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold', 
      color: theme.colors.white,
    },
    deleteButtonText: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold', 
      color: theme.colors.error,
    },
  }), [theme]);

  const createMutation = useMutation({
    mutationFn: donationService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      Alert.alert('Success', 'Blood request created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create blood request');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => donationService.updateRequest(existingRequest!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      Alert.alert('Success', 'Blood request updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update blood request');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => donationService.deleteRequest(existingRequest!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      Alert.alert('Deleted', 'Blood request deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to delete blood request');
    }
  });

  const handleSubmit = () => {
    if (!title || !bloodType || !units || !reason || !donationType) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const data = {
      title,
      bloodType, 
      donationType,
      units: parseInt(units, 10),
      reason,
      urgency,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this blood request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BackButton style={styles.backButton} />
          <Text style={styles.headerTitle}>{isEditing ? 'Update Request' : 'Request Blood'}</Text>
        </View>
        {isEditing && (
          <TouchableOpacity onPress={handleDelete} disabled={isLoading}>
            <Trash color={theme.colors.error} size={24} weight="bold" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Request Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Emergency Surgery for John Doe"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Blood Type Required</Text>
          <View style={styles.chipContainer}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  bloodType === type && styles.chipSelected
                ]}
                onPress={() => setBloodType(type)}
              >
                <Text style={[
                  styles.chipText,
                  bloodType === type && styles.chipTextSelected
                ]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Donation Type</Text>
          <View style={styles.chipContainer}>
            {DONATION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.chip,
                  donationType === type.value && styles.chipSelected
                ]}
                onPress={() => setDonationType(type.value)}
              >
                <Text style={[
                  styles.chipText,
                  donationType === type.value && styles.chipTextSelected
                ]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Units Needed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            value={units}
            onChangeText={setUnits}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.urgencyContainer}>
            {URGENCY_LEVELS.map((level) => {
              const isActive = urgency === level;
              let urgencyStyles = {};
              let textStyles = {};
              
              if (isActive) {
                if (level === 'CRITICAL') {
                  urgencyStyles = { borderColor: theme.colors.error, backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FFEBEE' };
                  textStyles = { color: theme.colors.error };
                } else if (level === 'URGENT') {
                  urgencyStyles = { borderColor: theme.colors.warning, backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FFF3E0' };
                  textStyles = { color: theme.colors.warning };
                } else {
                  urgencyStyles = { borderColor: theme.colors.primary, backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#E3F2FD' };
                  textStyles = { color: theme.colors.primary };
                }
              }
              
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.urgencyButton, urgencyStyles]}
                  onPress={() => setUrgency(level)}
                >
                  <Text style={[styles.urgencyText, textStyles]}>{level}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reason for Request</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Briefly describe why this blood is needed..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Check color={theme.colors.white} weight="bold" size={20} />
              <Text style={styles.submitButtonText}>{isEditing ? 'Update Request' : 'Submit Request'}</Text>
            </>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Trash color={theme.colors.error} weight="bold" size={20} />
            <Text style={styles.deleteButtonText}>Delete Request</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
