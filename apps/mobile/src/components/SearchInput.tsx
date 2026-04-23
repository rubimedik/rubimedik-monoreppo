import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { MagnifyingGlass, XCircle } from 'phosphor-react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  onClear,
}) => {
  const { theme } = useAppTheme();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.surface }, 
      style
    ]}>
      <MagnifyingGlass 
        color={theme.colors.textSecondary} 
        size={20} 
        style={styles.searchIcon} 
      />
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <XCircle color={theme.colors.textMuted} size={20} weight="fill" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
  },
  searchIcon: {
    marginRight: 8, 
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular', 
    fontSize: 14,
  },
});
