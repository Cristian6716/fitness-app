import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface PlanEditCardProps {
  name: string;
  frequency?: number;
  durationWeeks?: number;
  onNameChange: (value: string) => void;
  onFrequencyChange: (value: number) => void;
  onDurationChange: (value: number) => void;
}

const PlanEditCard: React.FC<PlanEditCardProps> = ({
  name,
  frequency,
  durationWeeks,
  onNameChange,
  onFrequencyChange,
  onDurationChange,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informazioni Piano</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nome Piano</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={onNameChange}
          placeholder="Es: Scheda Upper/Lower"
          placeholderTextColor={theme.colors.textLight}
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
          />
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
    backgroundColor: theme.colors.cardBackground,
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
  },
  halfField: {
    flex: 1,
  },
});

export default PlanEditCard;
