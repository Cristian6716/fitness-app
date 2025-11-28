import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import StepperSetRow from './StepperSetRow';

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

interface ExerciseCardFocusedProps {
  exerciseId: string;
  name: string;
  sets: SetData[];
  restSeconds: number;
  notes: string;
  isExpanded: boolean;
  isFocused: boolean;
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

const ExerciseCardFocused: React.FC<ExerciseCardFocusedProps> = ({
  exerciseId,
  name,
  sets,
  restSeconds,
  notes,
  isExpanded,
  isFocused,
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
  const isCompleted = completedSets === totalSets;

  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text style={[styles.exerciseName, isFocused && styles.textWhite]} numberOfLines={1}>{name}</Text>
        <View style={styles.progressInfo}>
          <View style={[styles.progressBarSmall, isFocused && styles.progressBarWhiteBackground]}>
            <View
              style={[
                styles.progressFillSmall,
                { width: `${(completedSets / totalSets) * 100}%` },
                isFocused && styles.progressFillWhite
              ]}
            />
          </View>
          <Text style={[styles.progressText, isFocused && styles.textWhiteOpacity]}>
            {completedSets}/{totalSets} {isCompleted && '✓'}
          </Text>
        </View>
      </View>
      <Text style={[styles.arrowIcon, isFocused && styles.textWhiteOpacity]}>▼</Text>
    </TouchableOpacity>
  );

  const renderExpandedView = () => (
    <View style={styles.expandedContainer}>
      {/* Header */}
      <View style={styles.expandedHeader}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleToggleExpand}
          activeOpacity={0.7}
        >
          <Text style={[styles.exerciseName, isFocused && styles.textWhite]}>{name}</Text>
          <Text style={[styles.arrowIcon, isFocused && styles.textWhiteOpacity]}>▲</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShowInfo}
          style={[styles.infoButton, isFocused && styles.infoButtonFocused]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.infoIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBar, isFocused && styles.progressBarWhiteBackground]}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedSets / totalSets) * 100}%` },
              isFocused && styles.progressFillWhite
            ]}
          />
        </View>
        <Text style={[styles.progressTextExpanded, isFocused && styles.textWhiteOpacity]}>
          {completedSets}/{totalSets} set completati
          {isCompleted && ' 🎉'}
        </Text>
      </View>

      {/* Sets List */}
      <View style={styles.setsContainer}>
        {sets.map((set, index) => {
          const isActive = index === activeSetIndex;
          const previousData = previousWorkoutData.find((p) => p.setNumber === set.setNumber);

          return (
            <StepperSetRow
              key={`${exerciseId}-${set.setNumber}`}
              set={set}
              isActive={isActive}
              isCardFocused={isFocused}
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
        style={[styles.addSetButton, isFocused && styles.addSetButtonFocused]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAddSet();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.addSetIcon, isFocused && styles.textWhite]}>+</Text>
        <Text style={[styles.addSetText, isFocused && styles.textWhite]}>Aggiungi Set</Text>
      </TouchableOpacity>

      {/* Notes Section */}
      {notes && (
        <View style={[styles.notesSection, isFocused && styles.notesSectionFocused]}>
          <Text style={[styles.notesLabel, isFocused && styles.textWhiteOpacity]}>📝 Note</Text>
          <Text style={[styles.notesText, isFocused && styles.textWhite]}>{notes}</Text>
        </View>
      )}

      {/* Rest Timer Info */}
      {restSeconds > 0 && (
        <View style={[styles.restInfo, isFocused && styles.restInfoFocused]}>
          <Text style={[styles.restInfoText, isFocused && styles.textWhite]}>⏱️ Riposo: {restSeconds}s</Text>
        </View>
      )}
    </View>
  );

  // Determine card style based on focus state
  const getCardStyle = () => {
    if (isCompleted) {
      return [styles.card, styles.cardCompleted];
    }
    if (isFocused) {
      return [styles.card, styles.cardFocused];
    }
    return [styles.card, styles.cardUnfocused];
  };

  if (isFocused) {
    return (
      <LinearGradient
        colors={theme.colors.gradientCard as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={getCardStyle()}
      >
        {isExpanded ? renderExpandedView() : renderCollapsedView()}
      </LinearGradient>
    );
  }

  return (
    <View style={getCardStyle()}>
      {isExpanded ? renderExpandedView() : renderCollapsedView()}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Focus Mode States
  cardFocused: {
    opacity: 1,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardUnfocused: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardCompleted: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.backgroundSecondary,
  },

  // Collapsed State
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  collapsedContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  exerciseName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    minWidth: 60,
  },
  arrowIcon: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  // Expanded State
  expandedContainer: {
    padding: theme.spacing.lg,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: theme.spacing.md,
  },
  infoButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  infoIcon: {
    fontSize: theme.fontSize.lg,
  },

  // Progress Section
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  progressTextExpanded: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },

  // Sets Container
  setsContainer: {
    gap: theme.spacing.xs,
  },

  // Add Set Button
  addSetButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addSetIcon: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  addSetText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },

  // Notes Section
  notesSection: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  notesLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },

  // Rest Info
  restInfo: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  restInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },

  // Focused State Overrides
  textWhite: {
    color: theme.colors.white,
  },
  textWhiteOpacity: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarWhiteBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFillWhite: {
    backgroundColor: theme.colors.white,
  },
  infoButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  addSetButtonFocused: {
    borderColor: theme.colors.white,
  },
  notesSectionFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: theme.colors.white,
  },
  restInfoFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default memo(ExerciseCardFocused);
