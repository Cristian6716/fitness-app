import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

interface SessionEditItemProps {
  sessionNumber: number;
  name: string;
  exercises: Exercise[];
  onNameChange: (value: string) => void;
  onExerciseUpdate: (exerciseIndex: number, field: keyof Exercise, value: any) => void;
  onExerciseDelete: (exerciseIndex: number) => void;
  onAddExercise: () => void;
  onSessionDelete: () => void;
}

const SessionEditItem: React.FC<SessionEditItemProps> = ({
  sessionNumber,
  name,
  exercises,
  onNameChange,
  onExerciseUpdate,
  onExerciseDelete,
  onAddExercise,
  onSessionDelete,
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

  return (
    <View style={styles.container}>
      {/* Session header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{sessionNumber}</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={onNameChange}
            placeholder="Nome sessione"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>
        <TouchableOpacity
          style={styles.deleteSessionButton}
          onPress={handleDeleteSession}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteSessionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Exercises list */}
      <View style={styles.body}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerLeft: {
    flex: 1,
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
    marginLeft: theme.spacing.sm,
  },
  deleteSessionIcon: {
    fontSize: 24,
  },
  body: {
    padding: theme.spacing.md,
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
});

export default SessionEditItem;
