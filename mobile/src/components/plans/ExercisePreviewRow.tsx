import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface ExercisePreviewRowProps {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
}

const ExercisePreviewRow: React.FC<ExercisePreviewRowProps> = ({
  name,
  sets,
  reps,
  weight,
  restSeconds,
}) => {
  const buildInfoText = () => {
    const parts: string[] = [];
    parts.push(`${sets} serie`);
    parts.push(`${reps} rip`);
    if (weight) parts.push(`${weight}kg`);
    if (restSeconds) parts.push(`${restSeconds}sec`);
    return parts.join(' • ');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.exerciseName}>{name}</Text>
      <Text style={styles.exerciseInfo}>{buildInfoText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  exerciseName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});

export default ExercisePreviewRow;
