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

interface PlanInfoEditViewProps {
  name: string;
  frequency?: number;
  durationWeeks?: number;
  hasUnsavedChanges: boolean;
  onNameChange: (value: string) => void;
  onFrequencyChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onSave: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

const PlanInfoEditView: React.FC<PlanInfoEditViewProps> = ({
  name,
  frequency,
  durationWeeks,
  hasUnsavedChanges,
  onNameChange,
  onFrequencyChange,
  onDurationChange,
  onSave,
  onFinish,
  onCancel,
}) => {
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
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informazioni Piano</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nome Piano</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={onNameChange}
            placeholder="Es: Scheda Upper/Lower"
            placeholderTextColor={theme.colors.textLight}
            editable={true}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Frequenza (giorni/sett)</Text>
            <TextInput
              style={styles.input}
              value={frequency?.toString() || ''}
              onChangeText={(value) => onFrequencyChange(parseInt(value) || 4)}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={theme.colors.textLight}
              editable={true}
            />
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Durata (settimane)</Text>
            <TextInput
              style={styles.input}
              value={durationWeeks?.toString() || ''}
              onChangeText={(value) => onDurationChange(parseInt(value) || 4)}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={theme.colors.textLight}
              editable={true}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Le sessioni sotto non sono modificabili in questa vista.
            Torna alla modalità anteprima per modificarle.
          </Text>
        </View>
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    lineHeight: 20,
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

export default PlanInfoEditView;
