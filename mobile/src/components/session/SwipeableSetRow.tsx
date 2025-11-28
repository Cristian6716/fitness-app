import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  PanResponder,
  Vibration,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

interface SetData {
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  actualReps?: number;
  actualWeight?: number;
  completed: boolean;
}

interface SwipeableSetRowProps {
  set: SetData;
  isActive: boolean;
  onSetComplete: (setNumber: number) => void;
  onUpdateSet: (setNumber: number, field: 'actualReps' | 'actualWeight', value: number) => void;
  onDeleteSet: (setNumber: number) => void;
  onDuplicateSet: (setNumber: number) => void;
  previousData?: {
    reps: number;
    weight: number;
  };
}

const SWIPE_THRESHOLD = 80;
const SWIPE_DELETE_THRESHOLD = -SWIPE_THRESHOLD;
const SWIPE_DUPLICATE_THRESHOLD = SWIPE_THRESHOLD;

const SwipeableSetRow: React.FC<SwipeableSetRowProps> = ({
  set,
  isActive,
  onSetComplete,
  onUpdateSet,
  onDeleteSet,
  onDuplicateSet,
  previousData,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const translateX = useRef(new Animated.Value(0)).current;
  const lastSwipeDirection = useRef<'left' | 'right' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !set.completed, // Only allow swipe if not completed
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && !set.completed;
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swipe distance
        const clampedDx = Math.max(-120, Math.min(120, gestureState.dx));
        translateX.setValue(clampedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_DELETE_THRESHOLD) {
          // Swipe left - Delete
          Vibration.vibrate(40);
          Animated.spring(translateX, {
            toValue: -150,
            useNativeDriver: true,
            tension: 50,
          }).start(() => {
            onDeleteSet(set.setNumber);
          });
        } else if (gestureState.dx > SWIPE_DUPLICATE_THRESHOLD) {
          // Swipe right - Duplicate
          Vibration.vibrate(40);
          Animated.spring(translateX, {
            toValue: 150,
            useNativeDriver: true,
            tension: 50,
          }).start(() => {
            onDuplicateSet(set.setNumber);
            translateX.setValue(0);
          });
        } else {
          // Reset to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
          }).start();
        }
      },
    })
  ).current;

  const handleSetComplete = () => {
    onSetComplete(set.setNumber);
  };

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.deleteAction}>
          <Text style={styles.actionText}>🗑️ Elimina</Text>
        </View>
        <View style={styles.duplicateAction}>
          <Text style={styles.actionText}>📋 Duplica</Text>
        </View>
      </View>

      {/* Swipeable Content */}
      <Animated.View
        style={[
          styles.setRow,
          isActive && styles.activeSetRow,
          set.completed && styles.completedSetRow,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Set Number */}
        <View style={styles.setColumn}>
          <Text style={styles.setNumberText}>{set.setNumber}</Text>
        </View>

        {/* Target */}
        <View style={styles.targetColumn}>
          <Text style={styles.targetText}>
            {set.targetReps} reps · {set.targetWeight} kg
          </Text>
          {previousData && (
            <Text style={styles.previousDataText}>
              Scorsa: {previousData.reps}@{previousData.weight}kg
            </Text>
          )}
        </View>

        {/* Completed Inputs */}
        <View style={styles.completedColumn}>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, set.completed && styles.inputCompleted]}
              value={set.actualReps?.toString() || ''}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                onUpdateSet(set.setNumber, 'actualReps', value);
              }}
              keyboardType="numeric"
              placeholder="reps"
              placeholderTextColor={theme.colors.textLight}
              editable={!set.completed}
            />
            <Text style={styles.inputSeparator}>×</Text>
            <TextInput
              style={[styles.input, set.completed && styles.inputCompleted]}
              value={set.actualWeight?.toString() || ''}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                onUpdateSet(set.setNumber, 'actualWeight', value);
              }}
              keyboardType="decimal-pad"
              placeholder="kg"
              placeholderTextColor={theme.colors.textLight}
              editable={!set.completed}
            />
          </View>
        </View>

        {/* Checkmark Button */}
        <View style={styles.checkColumn}>
          <TouchableOpacity
            style={[
              styles.checkButton,
              set.completed && styles.checkButtonCompleted,
            ]}
            onPress={handleSetComplete}
            disabled={!set.actualReps || !set.actualWeight}
          >
            <Text style={styles.checkIcon}>{set.completed ? '✓' : '○'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: theme.spacing.md,
    width: '50%',
  },
  duplicateAction: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: theme.spacing.md,
    width: '50%',
  },
  actionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  activeSetRow: {
    backgroundColor: theme.colors.primaryLight,
  },
  completedSetRow: {
    opacity: 0.6,
  },
  setColumn: {
    width: 40,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  targetColumn: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
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
  completedColumn: {
    width: 120,
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
  checkColumn: {
    width: 40,
    alignItems: 'center',
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
});

export default SwipeableSetRow;
