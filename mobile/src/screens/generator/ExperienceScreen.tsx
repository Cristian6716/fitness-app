import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type ExperienceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Experience'>;
  route: RouteProp<RootStackParamList, 'Experience'>;
};

const experienceLevels = [
  { id: 'beginner', label: 'Principiante', description: '< 6 mesi' },
  { id: 'intermediate', label: 'Intermedio', description: '6 mesi - 2 anni' },
  { id: 'advanced', label: 'Avanzato', description: '2+ anni' },
  { id: 'prefer_not', label: 'Preferisco non rispondere', description: 'L\'AI adatterà il programma' },
];

const ExperienceScreen: React.FC<ExperienceScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const params = route.params;
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [experienceDetails, setExperienceDetails] = useState('');

  const handleNext = () => {
    navigation.navigate('Limitations', {
      ...params,
      experienceLevel: selectedExperience || undefined,
      experienceDetails: experienceDetails.trim() || undefined,
    });
  };

  const handleSkip = () => {
    navigation.navigate('Limitations', { ...params });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Livello di Esperienza</Text>
        <Text style={styles.subtitle}>Da quanto ti alleni? (opzionale)</Text>

        <View style={styles.optionsContainer}>
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.optionCard,
                selectedExperience === level.id && styles.optionCardActive,
              ]}
              onPress={() => setSelectedExperience(level.id)}
            >
              <Text
                style={[
                  styles.optionLabel,
                  selectedExperience === level.id && styles.optionLabelActive,
                ]}
              >
                {level.label}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  selectedExperience === level.id && styles.optionDescriptionActive,
                ]}
              >
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Esperienza specifica (opzionale)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Es: conosco bene squat e stacco"
          value={experienceDetails}
          onChangeText={setExperienceDetails}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Text style={styles.helper}>
          Questa domanda è opzionale. Se non rispondi, l'AI adatterà il programma in base alle altre informazioni.
        </Text>

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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
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
    marginBottom: theme.spacing.md,
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
    minHeight: 60,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  helper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  skipButton: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  skipButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default ExperienceScreen;
