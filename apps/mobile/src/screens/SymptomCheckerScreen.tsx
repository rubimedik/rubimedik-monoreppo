import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Sparkle, Warning, CheckCircle, Info, ArrowRight } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { BackButton } from '../components/BackButton';

export const SymptomCheckerScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<any>(null);

  const triageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post('/ai/symptom-check', { symptoms: text });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to analyze symptoms. Please try again.');
    }
  });

  const getSeverityColor = (sev: string) => {
      switch (sev) {
          case 'CRITICAL': return '#D32F2F';
          case 'HIGH': return '#F57C00';
          case 'MEDIUM': return '#FBC02D';
          case 'LOW': return '#388E3C';
          default: return theme.colors.textSecondary;
      }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { fontSize: 18, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginLeft: 12 },
    content: { padding: 24 },
    inputCard: { padding: 20, marginBottom: 24 },
    label: { fontSize: 16, fontFamily: theme.typography.fontFamilySemiBold, color: theme.colors.textPrimary, marginBottom: 12 },
    input: { backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB', borderRadius: 12, padding: 16, minHeight: 120, textAlignVertical: 'top', color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border },
    resultCard: { padding: 24, borderRadius: 24, marginBottom: 32 },
    severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
    severityText: { color: 'white', fontSize: 12, fontFamily: theme.typography.fontFamilyBold },
    summary: { fontSize: 20, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, marginBottom: 12 },
    recommendation: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary, marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontFamily: theme.typography.fontFamilyBold, color: theme.colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    specialistItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    specName: { fontSize: 15, fontFamily: theme.typography.fontFamilyMedium, color: theme.colors.textPrimary }
  }), [theme, isDarkMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Sparkle size={24} color={theme.colors.primary} weight="fill" style={{ marginLeft: 12 }} />
        <Text style={styles.headerTitle}>AI Symptom Checker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!result ? (
            <Card style={styles.inputCard}>
                <Text style={styles.label}>How are you feeling today?</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="E.g. I have a sharp pain in my lower back and a mild fever since yesterday..." 
                    multiline 
                    value={symptoms} 
                    onChangeText={setSymptoms}
                />
                <PrimaryButton 
                    label="Analyze Symptoms" 
                    style={{ marginTop: 24 }} 
                    onPress={() => triageMutation.mutate(symptoms)} 
                    isLoading={triageMutation.isPending}
                    disabled={!symptoms.trim()}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 20, alignItems: 'center' }}>
                    <Info size={16} color={theme.colors.textSecondary} />
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, flex: 1 }}>This is an AI tool, not a clinical diagnosis. In case of emergency, call local emergency services immediately.</Text>
                </View>
            </Card>
        ) : (
            <View>
                <Card style={[styles.resultCard, { backgroundColor: getSeverityColor(result.severity) + '10', borderColor: getSeverityColor(result.severity) + '30' }]}>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(result.severity) }]}>
                        <Text style={styles.severityText}>{result.severity} SEVERITY</Text>
                    </View>
                    <Text style={styles.summary}>{result.summary}</Text>
                    <Text style={styles.recommendation}>{result.recommendation}</Text>
                    
                    <PrimaryButton 
                        label="Check Other Symptoms" 
                        variant="outlined" 
                        onPress={() => { setResult(null); setSymptoms(''); }} 
                    />
                </Card>

                {result.specialists && (
                    <View>
                        <Text style={styles.sectionTitle}>Recommended Specialists</Text>
                        {result.specialists.map((spec: string, i: number) => (
                            <TouchableOpacity key={i} style={styles.specialistItem} onPress={() => navigation.navigate('SearchSpecialists', { query: spec })}>
                                <Text style={styles.specName}>{spec}</Text>
                                <ArrowRight size={18} color={theme.colors.primary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
