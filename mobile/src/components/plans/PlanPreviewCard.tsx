import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface PlanPreviewCardProps {
  name: string;
  frequency?: number;
  durationWeeks?: number;
  isAiGenerated?: boolean;
  isEditMode: boolean;
}

const PlanPreviewCard: React.FC<PlanPreviewCardProps> = ({
  name,
  frequency,
  durationWeeks,
  isAiGenerated,
  isEditMode,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.planName}>{name}</Text>
      <View style={styles.metaRow}>
        {frequency && (
          <Text style={styles.metaText}>{frequency} giorni/sett</Text>
        )}
        {frequency && durationWeeks && <Text style={styles.separator}>•</Text>}
        {durationWeeks && (
          <Text style={styles.metaText}>{durationWeeks} settimane</Text>
        )}
      </View>
      {isAiGenerated && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🤖 Generato AI</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
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
  planName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default PlanPreviewCard;
