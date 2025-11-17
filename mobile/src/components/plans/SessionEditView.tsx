import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { theme } from '../../constants/theme';
import ExerciseEditRow from './ExerciseEditRow';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
}

interface SessionEditViewProps {
  sessionNumber: number;
  name: string;
  exercises: Exercise[];
  hasUnsavedChanges: boolean;
  onNameChange: (value: string) => void;
  onExerciseUpdate: (exerciseIndex: number, field: keyof Exercise, value: any) => void;
  onExerciseDelete: (exerciseIndex: number) => void;
  onAddExercise: () => void;
  onSessionDelete: () => void;
  onSave: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

const SessionEditView: React.FC<SessionEditViewProps> = ({
  sessionNumber,
  name,
  exercises,
  hasUnsavedChanges,
  onNameChange,
  onExerciseUpdate,
  onExerciseDelete,
  onAddExercise,
  onSessionDelete,
  onSave,
  onFinish,
  onCancel,
}) => {
  const handleDeleteSession = () => {
    Alert.alert(
      'Elimina Sessione',
      'Sei sicuro di voler eliminare questa sessione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: onSessionDelete,
        },
      ]
    );
  };

  const handleDeleteExercise = (index: number) => {
    Alert.alert(
      'Elimina Esercizio',
      'Sei sicuro di voler eliminare questo esercizio?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => onExerciseDelete(index),
        },
      ]
    );
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Modifiche non salvate',
        'Vuoi scartare le modifiche non salvate?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sì, Scarta',
            style: 'destructive',
            onPress: onCancel,
          },
        ]
      );
    } else {
      onCancel();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Session Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{sessionNumber}</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={onNameChange}
            placeholder="Nome sessione"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
          <TouchableOpacity
            style={styles.deleteSessionButton}
            onPress={handleDeleteSession}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteSessionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercises list */}
      <View style={styles.exercisesSection}>
        {exercises.map((exercise, index) => (
          <ExerciseEditRow
            key={index}
            name={exercise.name}
            sets={exercise.sets}
            reps={exercise.reps}
            weight={exercise.weight}
            restSeconds={exercise.restSeconds}
            onNameChange={(value) => onExerciseUpdate(index, 'name', value)}
            onSetsChange={(value) => onExerciseUpdate(index, 'sets', value)}
            onRepsChange={(value) => onExerciseUpdate(index, 'reps', value)}
            onWeightChange={(value) => onExerciseUpdate(index, 'weight', value)}
            onRestChange={(value) => onExerciseUpdate(index, 'restSeconds', value)}
            onDelete={() => handleDeleteExercise(index)}
          />
        ))}

        {/* Add exercise button */}
        <TouchableOpacity style={styles.addButton} onPress={onAddExercise}>
          <Text style={styles.addButtonText}>+ Aggiungi Esercizio</Text>
        </TouchableOpacity>
      </View>

      {/* Buttons - INSIDE ScrollView at the bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Annulla</Text>
        </TouchableOpacity>

        {hasUnsavedChanges ? (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Salva Modifica</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
            <Text style={styles.finishButtonText}>Fine</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 80, // Extra space for Android nav bar
  },
  headerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  nameInput: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    minHeight: 48,
  },
  deleteSessionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSessionIcon: {
    fontSize: 24,
  },
  exercisesSection: {
    gap: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  finishButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  finishButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});

export default SessionEditView;
