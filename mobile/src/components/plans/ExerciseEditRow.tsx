import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface ExerciseEditRowProps {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
  onNameChange: (value: string) => void;
  onSetsChange: (value: number) => void;
  onRepsChange: (value: string) => void;
  onWeightChange: (value?: number) => void;
  onRestChange: (value: number) => void;
  onDelete: () => void;
}

const ExerciseEditRow: React.FC<ExerciseEditRowProps> = ({
  name,
  sets,
  reps,
  weight,
  restSeconds,
  onNameChange,
  onSetsChange,
  onRepsChange,
  onWeightChange,
  onRestChange,
  onDelete,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {/* Exercise name with delete button */}
      <View style={styles.nameRow}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={onNameChange}
          placeholder="Nome esercizio"
          placeholderTextColor={theme.colors.textLight}
          editable={true}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise details grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Serie</Text>
          <TextInput
            style={styles.detailInput}
            value={sets.toString()}
            onChangeText={(value) => onSetsChange(parseInt(value) || 0)}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Rip</Text>
          <TextInput
            style={styles.detailInput}
            value={reps}
            onChangeText={onRepsChange}
            placeholder="10"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.detailInput}
            value={weight?.toString() || ''}
            onChangeText={(value) => onWeightChange(value ? parseFloat(value) : undefined)}
            keyboardType="decimal-pad"
            placeholder="-"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Rest (sec)</Text>
          <TextInput
            style={styles.detailInput}
            value={restSeconds?.toString() || '90'}
            onChangeText={(value) => onRestChange(parseInt(value) || 90)}
            keyboardType="number-pad"
            placeholder="90"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  nameInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    minHeight: 44,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: 16,
  },
  deleteIcon: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: theme.fontWeight.medium,
  },
  detailInput: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center',
    minHeight: 44,
  },
});

export default ExerciseEditRow;
