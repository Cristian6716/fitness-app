import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

type FrequencyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Frequency'>;
  route: RouteProp<RootStackParamList, 'Frequency'>;
};

const sessionDurations = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 75, label: '75+ min' },
];

const FrequencyScreen: React.FC<FrequencyScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { personalInfo, goal, goalDetails } = route.params;
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [scheduleNotes, setScheduleNotes] = useState('');

  const handleNext = () => {
    if (selectedDays) {
      navigation.navigate('Equipment', {
        personalInfo,
        goal,
        goalDetails,
        daysPerWeek: selectedDays,
        sessionDuration: selectedDuration || undefined,
        scheduleNotes: scheduleNotes.trim() || undefined,
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
              <Text style={styles.title}>Frequenza e Durata</Text>
              <Text style={styles.subtitle}>Configuriamo il tuo piano settimanale</Text>

              <Text style={styles.sectionTitle}>Quanti giorni a settimana puoi allenarti? *</Text>
              <View style={styles.daysContainer}>
                {[2, 3, 4, 5, 6].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.dayButton, selectedDays === days && styles.dayButtonActive]}
                    onPress={() => setSelectedDays(days)}
                  >
                    <Text style={[styles.dayText, selectedDays === days && styles.dayTextActive]}>
                      {days}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Quanto tempo hai per sessione? (opzionale)</Text>
              <Text style={styles.helper}>Se non selezioni nulla, assumeremo 60 minuti</Text>
              <View style={styles.durationsContainer}>
                {sessionDurations.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={[
                      styles.durationCard,
                      selectedDuration === duration.value && styles.durationCardActive,
                    ]}
                    onPress={() => setSelectedDuration(duration.value)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selectedDuration === duration.value && styles.durationTextActive,
                      ]}
                    >
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Note orari (opzionale)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Es: solo mattina presto, no weekend"
                value={scheduleNotes}
                onChangeText={setScheduleNotes}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backButtonText}>Indietro</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, !selectedDays && styles.buttonDisabled]}
                  onPress={handleNext}
                  disabled={!selectedDays}
                >
                  <Text style={styles.buttonText}>Continua</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
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
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm + theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  helper: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm + theme.spacing.xs,
    fontStyle: 'italic',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  dayButton: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  dayTextActive: {
    color: theme.colors.white,
  },
  durationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm + theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  durationCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  durationCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  durationText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  durationTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + theme.spacing.xs,
    fontSize: theme.fontSize.md,
    minHeight: 60,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm + theme.spacing.xs,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  button: {
    flex: 2,
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

export default FrequencyScreen;
