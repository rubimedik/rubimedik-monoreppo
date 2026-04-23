import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretDown, MagnifyingGlass, X } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Bank {
  name: string;
  code: string;
}

interface BankSelectProps {
  label: string;
  selectedBankCode: string;
  onSelect: (bank: Bank) => void;
  error?: string;
}

export const BankSelect: React.FC<BankSelectProps> = ({ label, selectedBankCode, onSelect, error }) => {
  const { theme } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const { data: banks, isLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const res = await api.get('/payments/banks');
      return res.data as Bank[];
    }
  });

  const selectedBank = banks?.find(b => b.code === selectedBankCode);

  const filteredBanks = banks?.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity 
        style={[
          styles.selector, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          error ? { borderColor: theme.colors.error } : undefined
        ]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectorText, 
          { color: theme.colors.textPrimary },
          !selectedBank && { color: theme.colors.textMuted }
        ]}>
          {selectedBank ? selectedBank.name : 'Select a bank'}
        </Text>
        <CaretDown size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
              <MagnifyingGlass size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                placeholder="Search bank name..."
                placeholderTextColor={theme.colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {isLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item, index) => item.code + index}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.bankItem, { borderBottomColor: theme.colors.surface }]}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                      setSearch('');
                    }}
                  >
                    <Text style={[
                      styles.bankName,
                      { color: theme.colors.textPrimary },
                      item.code === selectedBankCode && [styles.selectedBankName, { color: theme.colors.primary }]
                    ]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16, 
  },
  label: {
    fontSize: 12,
    marginBottom: 4, 
    fontFamily: 'Inter_500Medium', 
  },
  selector: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
  },
  selectorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular', 
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 32, 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold', 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular', 
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  bankItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bankName: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular', 
  },
  selectedBankName: {
    fontFamily: 'Inter_700Bold', 
  }
});
