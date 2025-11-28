import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Vibration,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import SwipeableSetRow from './SwipeableSetRow';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SetData {
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  actualReps?: number;
  actualWeight?: number;
  completed: boolean;
}

interface ExerciseCardProps {
  exerciseId: string;
  name: string;
  sets: SetData[];
  restSeconds: number;
  notes: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSetComplete: (setNumber: number) => void;
  onSetUncomplete: (setNumber: number) => void;
  onUpdateSet: (setNumber: number, field: 'actualReps' | 'actualWeight', value: number) => void;
  onAddSet: () => void;
  onDeleteSet: (setNumber: number) => void;
  onDuplicateSet: (setNumber: number) => void;
  onShowInfo: () => void;
  previousWorkoutData?: {
    setNumber: number;
    reps: number;
    weight: number;
  }[];
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exerciseId,
  name,
  sets,
  restSeconds,
  notes,
  isExpanded,
  onToggleExpand,
  onSetComplete,
  onSetUncomplete,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onDuplicateSet,
  onShowInfo,
  previousWorkoutData = [],
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const completedSets = sets.filter((s) => s.completed).length;
  const totalSets = sets.length;
  const activeSetIndex = sets.findIndex((s) => !s.completed);

  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
    Vibration.vibrate(20);
  }, [onToggleExpand]);

  const handleSetComplete = useCallback(
    (setNumber: number) => {
      const set = sets.find((s) => s.setNumber === setNumber);
      if (set?.completed) {
        onSetUncomplete(setNumber);
      } else {
        onSetComplete(setNumber);
      }
    },
    [sets, onSetComplete, onSetUncomplete]
  );

  const renderCollapsedView = () => (
    <TouchableOpacity
      style={styles.collapsedContainer}
      onPress={handleToggleExpand}
      activeOpacity={0.7}
    >
      <View style={styles.collapsedContent}>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.progressText}>
          {completedSets}/{totalSets} set completati
        </Text>
      </View>
      <Text style={styles.arrowIcon}>▼</Text>
    </TouchableOpacity>
  );

  const renderExpandedView = () => (
    <View style={styles.expandedContainer}>
      {/* Header */}
      <TouchableOpacity
        style={styles.expandedHeader}
        onPress={handleToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.exerciseName}>{name}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onShowInfo();
            }}
            style={styles.infoButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.arrowIcon}>▲</Text>
      </TouchableOpacity>

      {/* Sets Table */}
      <View style={styles.setsTable}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.setColumn]}>SET</Text>
          <Text style={[styles.tableHeaderText, styles.targetColumn]}>TARGET</Text>
          <Text style={[styles.tableHeaderText, styles.completedColumn]}>COMPLETATO</Text>
          <View style={styles.checkColumn} />
        </View>

        {/* Sets Rows */}
        {sets.map((set, index) => {
          const isActive = index === activeSetIndex;
          const previousData = previousWorkoutData.find((p) => p.setNumber === set.setNumber);

          return (
            <SwipeableSetRow
              key={`${exerciseId}-${set.setNumber}`}
              set={set}
              isActive={isActive}
              onSetComplete={handleSetComplete}
              onUpdateSet={onUpdateSet}
              onDeleteSet={onDeleteSet}
              onDuplicateSet={onDuplicateSet}
              previousData={previousData}
            />
          );
        })}
      </View>

      {/* Add Set Button */}
      <TouchableOpacity
        style={styles.addSetButton}
        onPress={onAddSet}
        activeOpacity={0.7}
      >
        <Text style={styles.addSetText}>+ Aggiungi Set</Text>
      </TouchableOpacity>

      {/* Notes Section */}
      {notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Note:</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      {isExpanded ? renderExpandedView() : renderCollapsedView()}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Collapsed State
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  collapsedContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  arrowIcon: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },

  // Expanded State
  expandedContainer: {
    padding: theme.spacing.md,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  infoIcon: {
    fontSize: theme.fontSize.md,
  },

  // Sets Table
  setsTable: {
    marginTop: theme.spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tableHeaderText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  setColumn: {
    width: 40,
    alignItems: 'center',
  },
  targetColumn: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  completedColumn: {
    width: 120,
  },
  checkColumn: {
    width: 40,
    alignItems: 'center',
  },

  // Set Row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  activeSetRow: {
    backgroundColor: theme.colors.primaryLight,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  completedSetRow: {
    opacity: 0.6,
  },
  setNumberText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  targetText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  previousDataText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center',
  },
  inputCompleted: {
    backgroundColor: theme.colors.disabled,
  },
  inputSeparator: {
    marginHorizontal: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: theme.colors.success,
  },
  checkIcon: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.white,
  },

  // Add Set Button
  addSetButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },

  // Notes Section
  notesSection: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.borderRadius.sm,
  },
  notesLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default memo(ExerciseCard);
