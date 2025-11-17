import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type GoalScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GoalSelection'>;
  route: RouteProp<RootStackParamList, 'GoalSelection'>;
};

const goals = [
  { id: 'muscle_gain', label: '💪 Aumentare massa muscolare', description: 'Costruisci massa muscolare' },
  { id: 'strength', label: '🏋️ Aumentare forza', description: 'Aumenta la forza generale' },
  { id: 'fat_loss', label: '🔥 Perdere grasso / Definizione', description: 'Riduci massa grassa e definisci il fisico' },
  { id: 'general_fitness', label: '🎯 Migliorare forma fisica generale', description: 'Rimani sano e attivo' },
  { id: 'endurance', label: '🏃 Resistenza / Performance sportiva', description: 'Migliora resistenza e prestazioni' },
];

const GoalScreen: React.FC<GoalScreenProps> = ({ navigation, route }) => {
  const { personalInfo } = route.params;
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [goalDetails, setGoalDetails] = useState('');

  const handleNext = () => {
    if (selectedGoal) {
      navigation.navigate('Frequency', {
        personalInfo,
        goal: selectedGoal,
        goalDetails: goalDetails.trim() || undefined,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
            <Text style={styles.title}>Qual è il tuo obiettivo principale?</Text>
            <Text style={styles.subtitle}>Seleziona quello che meglio si adatta al tuo obiettivo</Text>

            <View style={styles.optionsContainer}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.optionCard, selectedGoal === goal.id && styles.optionCardActive]}
                  onPress={() => setSelectedGoal(goal.id)}
                >
                  <Text
                    style={[styles.optionLabel, selectedGoal === goal.id && styles.optionLabelActive]}
                  >
                    {goal.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      selectedGoal === goal.id && styles.optionDescriptionActive,
                    ]}
                  >
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Aggiungi dettagli (opzionale)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Es: voglio migliorare la panca di 20kg"
              value={goalDetails}
              onChangeText={setGoalDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.button, !selectedGoal && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!selectedGoal}
            >
              <Text style={styles.buttonText}>Continua</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  optionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.fontSize.md,
    minHeight: 80,
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  optionLabelActive: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  optionDescriptionActive: {
    color: theme.colors.primaryDarker,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default GoalScreen;
