import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalService, HospitalInventory } from '../services/hospitalService';
import { BackButton } from '../components';
import { Drop, Plus, Minus, PencilSimple } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const InventoryScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useAppTheme();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HospitalInventory | null>(null);
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [units, setUnits] = useState('0');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 16,
    },
    headerTitle: {
      flex: 1,
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 10,
    },
    listContent: {
      padding: theme.spacing.xl,
      paddingBottom: 100, // Space for FAB
    },
    inventoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    bloodTypeBadge: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.colors.error + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    bloodTypeText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.error,
    },
    unitsInfo: {
      flex: 1,
    },
    unitsLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    unitsValue: {
      fontSize: 20,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    updateButton: {
      padding: 10,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
      gap: 16,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: theme.spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      marginBottom: 24,
    },
    inputSection: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    typeChip: {
      width: '22%',
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    typeChipText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    typeChipTextActive: {
      color: 'white',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 4,
    },
    qtyBtn: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
    },
    qtyInput: {
      flex: 1,
      height: 50,
      textAlign: 'center',
      fontSize: 22,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalBtn: {
      flex: 1,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelBtnText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textSecondary,
    },
    saveBtn: {
      backgroundColor: theme.colors.primary,
    },
    saveBtnText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyBold,
      color: 'white',
    },
  }), [theme, isDarkMode]);

  const { data: inventory, isLoading, refetch } = useQuery({
    queryKey: ['hospitalInventory'],
    queryFn: hospitalService.getInventory,
  });

  const updateMutation = useMutation({
    mutationFn: ({ bloodType, units }: { bloodType: string, units: number }) =>
      hospitalService.updateInventory(bloodType, units),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitalInventory'] });
      setIsModalVisible(false);
      Alert.alert('Success', 'Inventory updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update inventory');
    }
  });

  const openModal = (item: HospitalInventory | null = null) => {
    setSelectedItem(item);
    if (item) {
      setSelectedBloodType(item.bloodType);
      setUnits(item.units.toString());
    } else {
      setSelectedBloodType('');
      setUnits('0');
    }
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedBloodType) {
      Alert.alert('Error', 'Please select a blood type');
      return;
    }
    
    const qty = parseInt(units || '0', 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Please enter a valid number of units');
      return;
    }

    updateMutation.mutate({
      bloodType: selectedBloodType,
      units: qty,
    });
  };

  const renderInventoryItem = ({ item }: { item: HospitalInventory }) => (
    <View style={styles.inventoryCard}>
      <View style={styles.bloodTypeBadge}>
        <Text style={styles.bloodTypeText}>{item.bloodType}</Text>
      </View>
      <View style={styles.unitsInfo}>
        <Text style={styles.unitsLabel}>Available Inventory</Text>
        <Text style={styles.unitsValue}>{item.units} Units</Text>
      </View>
      <TouchableOpacity 
        style={styles.updateButton}
        onPress={() => openModal(item)}
      >
        <PencilSimple size={20} color={theme.colors.primary} weight="bold" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <>
          <FlatList
            data={inventory}
            keyExtractor={(item) => item.id}
            renderItem={renderInventoryItem}
            contentContainerStyle={styles.listContent}
            onRefresh={refetch}
            refreshing={isLoading}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Drop size={64} color={theme.colors.border} weight="light" />
                <Text style={styles.emptyText}>No blood inventory recorded.</Text>
              </View>
            }
          />
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => openModal()}
          >
            <Plus size={24} color="white" weight="bold" />
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedItem ? `Update ${selectedItem.bloodType}` : 'Add Blood Type'}
            </Text>
            
            {!selectedItem && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Select Blood Type</Text>
                <View style={styles.typeGrid}>
                  {BLOOD_TYPES.map(type => (
                    <TouchableOpacity 
                      key={type}
                      style={[
                        styles.typeChip,
                        selectedBloodType === type && styles.typeChipActive
                      ]}
                      onPress={() => setSelectedBloodType(type)}
                    >
                      <Text style={[
                        styles.typeChipText,
                        selectedBloodType === type && styles.typeChipTextActive
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Available Units (Bags)</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  onPress={() => setUnits(Math.max(0, parseInt(units || '0') - 1).toString())}
                  style={styles.qtyBtn}
                >
                  <Minus size={24} color={theme.colors.textPrimary} weight="bold" />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={units}
                  onChangeText={setUnits}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <TouchableOpacity 
                  onPress={() => setUnits((parseInt(units || '0') + 1).toString())}
                  style={styles.qtyBtn}
                >
                  <Plus size={24} color={theme.colors.textPrimary} weight="bold" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
