import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  Platform 
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { CaretDown, X } from 'phosphor-react-native';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: (string | SelectOption)[];
  onChange: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  leftIcon,
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [isVisible, setIsVisible] = useState(false);

  const getOptionLabel = (option: string | SelectOption) => {
    return typeof option === 'string' ? option : option.label;
  };

  const getOptionValue = (option: string | SelectOption) => {
    return typeof option === 'string' ? option : option.value;
  };

  const displayValue = useMemo(() => {
    const selected = options.find(opt => getOptionValue(opt) === value);
    return selected ? getOptionLabel(selected) : value;
  }, [value, options]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
    },
    leftIcon: {
      marginRight: 12,
    },
    value: {
      flex: 1,
      fontSize: 15,
      fontFamily: theme.typography.fontFamily,
      color: value ? theme.colors.textPrimary : theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.textPrimary,
    },
    option: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamilyMedium,
      color: theme.colors.textPrimary,
    },
    selectedOption: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    }
  }), [theme, value, isDarkMode]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.trigger} 
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <Text style={styles.value}>{displayValue || placeholder}</Text>
        <CaretDown size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <X size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) => `${getOptionValue(item)}-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const optValue = getOptionValue(item);
                const optLabel = getOptionLabel(item);
                return (
                  <TouchableOpacity 
                    style={styles.option}
                    onPress={() => {
                      onChange(optValue);
                      setIsVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      value === optValue && styles.selectedOption
                    ]}>
                      {optLabel}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
