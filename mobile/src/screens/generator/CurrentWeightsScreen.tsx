import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, WorkoutData } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type CurrentWeightsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CurrentWeights'>;
  route: RouteProp<RootStackParamList, 'CurrentWeights'>;
};

const CurrentWeightsScreen: React.FC<CurrentWeightsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const params = route.params;
  const [knowsWeights, setKnowsWeights] = useState<'yes' | 'no' | 'dont_know' | null>(null);
  const [benchPress, setBenchPress] = useState('');
  const [squat, setSquat] = useState('');
  const [deadlift, setDeadlift] = useState('');
  const [militaryPress, setMilitaryPress] = useState('');
  const [pullUps, setPullUps] = useState<'bodyweight' | 'weighted' | 'cant' | null>(null);
  const [pullUpsWeight, setPullUpsWeight] = useState('');
  const [other, setOther] = useState('');

  const handleGenerate = () => {
    const workoutData: WorkoutData = {
      ...params as any,
      currentWeights: knowsWeights === 'yes' ? {
        benchPress: benchPress ? parseFloat(benchPress) : undefined,
        squat: squat ? parseFloat(squat) : undefined,
        deadlift: deadlift ? parseFloat(deadlift) : undefined,
        militaryPress: militaryPress ? parseFloat(militaryPress) : undefined,
        pullUps: pullUps || undefined,
        pullUpsWeight: pullUpsWeight ? parseFloat(pullUpsWeight) : undefined,
        other: other.trim() || undefined,
      } : undefined,
    };

    navigation.navigate('Generating', workoutData);
  };

  const handleSkip = () => {
    navigation.navigate('Generating', params as WorkoutData);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Carichi Attuali</Text>
        <Text style={styles.subtitle}>Conosci i tuoi massimali o carichi di lavoro? (opzionale)</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, knowsWeights === 'yes' && styles.optionButtonActive]}
            onPress={() => setKnowsWeights('yes')}
          >
            <Text style={[styles.optionText, knowsWeights === 'yes' && styles.optionTextActive]}>Sì</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, knowsWeights === 'no' && styles.optionButtonActive]}
            onPress={() => setKnowsWeights('no')}
          >
            <Text style={[styles.optionText, knowsWeights === 'no' && styles.optionTextActive]}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, knowsWeights === 'dont_know' && styles.optionButtonActive]}
            onPress={() => setKnowsWeights('dont_know')}
          >
            <Text style={[styles.optionText, knowsWeights === 'dont_know' && styles.optionTextActive]}>Non lo so</Text>
          </TouchableOpacity>
        </View>

        {knowsWeights === 'yes' && (
          <View style={styles.weightsSection}>
            <Text style={styles.sectionTitle}>Inserisci i tuoi carichi (tutti opzionali)</Text>
            <Text style={styles.helper}>Inserisci il tuo 1RM o il peso che usi per 8 reps</Text>

            <Text style={styles.label}>Panca piana (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es: 80"
              value={benchPress}
              onChangeText={setBenchPress}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Squat (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es: 100"
              value={squat}
              onChangeText={setSquat}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Stacco (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es: 120"
              value={deadlift}
              onChangeText={setDeadlift}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Military press (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es: 50"
              value={militaryPress}
              onChangeText={setMilitaryPress}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Trazioni</Text>
            <View style={styles.pullUpsContainer}>
              <TouchableOpacity
                style={[styles.pullUpButton, pullUps === 'bodyweight' && styles.pullUpButtonActive]}
                onPress={() => setPullUps('bodyweight')}
              >
                <Text style={[styles.pullUpText, pullUps === 'bodyweight' && styles.pullUpTextActive]}>
                  Peso corporeo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pullUpButton, pullUps === 'weighted' && styles.pullUpButtonActive]}
                onPress={() => setPullUps('weighted')}
              >
                <Text style={[styles.pullUpText, pullUps === 'weighted' && styles.pullUpTextActive]}>
                  Con zavorra
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pullUpButton, pullUps === 'cant' && styles.pullUpButtonActive]}
                onPress={() => setPullUps('cant')}
              >
                <Text style={[styles.pullUpText, pullUps === 'cant' && styles.pullUpTextActive]}>
                  Non riesco
                </Text>
              </TouchableOpacity>
            </View>

            {pullUps === 'weighted' && (
              <>
                <Text style={styles.label}>Zavorra (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Es: 10"
                  value={pullUpsWeight}
                  onChangeText={setPullUpsWeight}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            <Text style={styles.label}>Altri esercizi</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Es: Rematore bilanciere 60kg x8, Leg press 120kg x10"
              value={other}
              onChangeText={setOther}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {(knowsWeights === 'no' || knowsWeights === 'dont_know') && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Nessun problema! L'AI ti darà indicazioni su come trovare i pesi giusti per partire.
            </Text>
          </View>
        )}

        <Text style={styles.helperBottom}>
          Questa informazione permette all'AI di suggerirti carichi di lavoro precisi fin dalla prima settimana.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Indietro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Salta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateButtonText}>Genera Piano</Text>
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
  optionsContainer: { flexDirection: 'row', gap: theme.spacing.sm + theme.spacing.xs, marginBottom: theme.spacing.lg },
  optionButton: { flex: 1, padding: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  optionButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  optionText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  optionTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  weightsSection: { marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  helper: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginBottom: theme.spacing.md, fontStyle: 'italic' },
  label: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium, color: theme.colors.text, marginBottom: 6, marginTop: theme.spacing.sm + theme.spacing.xs },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm + theme.spacing.xs, fontSize: theme.fontSize.md, marginBottom: theme.spacing.sm, color: theme.colors.text },
  pullUpsContainer: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  pullUpButton: { flex: 1, padding: theme.spacing.sm + theme.spacing.xs, borderWidth: 2, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  pullUpButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  pullUpText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  pullUpTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold },
  textArea: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm + theme.spacing.xs, fontSize: theme.fontSize.md, minHeight: 80, color: theme.colors.text },
  infoBox: { backgroundColor: theme.colors.primaryLight, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md },
  infoText: { fontSize: 15, color: theme.colors.primaryDarker, textAlign: 'center' },
  helperBottom: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginBottom: theme.spacing.lg, fontStyle: 'italic' },
  buttonContainer: { flexDirection: 'row', gap: theme.spacing.sm },
  backButton: { flex: 1, backgroundColor: theme.colors.backgroundSecondary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  backButtonText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  skipButton: { flex: 1, backgroundColor: theme.colors.cardBackground, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  skipButtonText: { color: theme.colors.primary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  generateButton: { flex: 1, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  generateButtonText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
});

export default CurrentWeightsScreen;
