import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type AdvancedScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Advanced'>;
  route: RouteProp<RootStackParamList, 'Advanced'>;
};

const AdvancedScreen: React.FC<AdvancedScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const params = route.params;
  const [weakPoints, setWeakPoints] = useState('');
  const [cardioPreference, setCardioPreference] = useState<string | null>(null);
  const [cardioDetails, setCardioDetails] = useState('');
  const [splitPreference, setSplitPreference] = useState<string | null>(null);

  const cardioOptions = [
    { id: 'no', label: 'No' },
    { id: 'light', label: 'Sì, leggero' },
    { id: 'moderate', label: 'Sì, moderato' },
    { id: 'intense', label: 'Sì, intenso (HIIT)' },
    { id: 'ai_decide', label: 'Lascia decidere all\'AI' },
  ];

  const splitOptions = [
    { id: 'ai_decide', label: 'Lascia decidere all\'AI' },
    { id: 'ppl', label: 'Push/Pull/Legs' },
    { id: 'upper_lower', label: 'Upper/Lower' },
    { id: 'full_body', label: 'Full Body' },
    { id: 'bro_split', label: 'Bro Split' },
  ];

  const handleNext = () => {
    navigation.navigate('CurrentWeights', {
      ...params,
      weakPoints: weakPoints.trim() || undefined,
      cardioPreference: cardioPreference || undefined,
      cardioDetails: cardioDetails.trim() || undefined,
      splitPreference: splitPreference || undefined,
    });
  };

  const handleSkip = () => {
    navigation.navigate('CurrentWeights', { ...params });
  };

  const showSplit = params.experienceLevel === 'intermediate' || params.experienceLevel === 'advanced';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Preferenze Avanzate</Text>
        <Text style={styles.subtitle}>Tutte queste domande sono opzionali</Text>

        <Text style={styles.sectionTitle}>Punti deboli da enfatizzare?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Es: gambe indietro, voglio spalle più grosse"
          value={weakPoints}
          onChangeText={setWeakPoints}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Vuoi includere cardio?</Text>
        <View style={styles.optionsGrid}>
          {cardioOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, cardioPreference === option.id && styles.optionCardActive]}
              onPress={() => setCardioPreference(option.id)}
            >
              <Text style={[styles.optionText, cardioPreference === option.id && styles.optionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {cardioPreference && cardioPreference !== 'no' && cardioPreference !== 'ai_decide' && (
          <>
            <Text style={styles.sectionLabel}>Preferenze cardio</Text>
            <TextInput
              style={styles.textAreaSmall}
              placeholder="Es: solo tapis roulant, no corsa"
              value={cardioDetails}
              onChangeText={setCardioDetails}
              multiline
              textAlignVertical="top"
            />
          </>
        )}

        {showSplit && (
          <>
            <Text style={styles.sectionTitle}>Preferenze per la suddivisione allenamenti?</Text>
            <View style={styles.optionsGrid}>
              {splitOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, splitPreference === option.id && styles.optionCardActive]}
                  onPress={() => setSplitPreference(option.id)}
                >
                  <Text style={[styles.optionText, splitPreference === option.id && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Indietro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Salta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Continua</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, marginBottom: theme.spacing.sm, color: theme.colors.text },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm + theme.spacing.xs, marginTop: theme.spacing.md },
  sectionLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  textArea: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm + theme.spacing.xs, fontSize: theme.fontSize.md, minHeight: 60, marginBottom: theme.spacing.md, color: theme.colors.text },
  textAreaSmall: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm + theme.spacing.xs, fontSize: theme.fontSize.md, minHeight: 50, marginBottom: theme.spacing.md, color: theme.colors.text },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.md },
  optionCard: { flex: 1, minWidth: '45%', padding: theme.spacing.sm + theme.spacing.xs, borderWidth: 2, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  optionCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  optionText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary, textAlign: 'center' },
  optionTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  buttonContainer: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  backButton: { flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  backButtonText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  skipButton: { flex: 1, backgroundColor: theme.colors.cardBackground, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  skipButtonText: { color: theme.colors.primary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  button: { flex: 1, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  buttonText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
});

export default AdvancedScreen;
