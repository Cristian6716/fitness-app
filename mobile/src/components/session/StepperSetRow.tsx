import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AntDesign } from '@expo/vector-icons';
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

interface StepperSetRowProps {
  set: SetData;
  isActive: boolean;
  isCardFocused?: boolean;
  onSetComplete: (setNumber: number) => void;
  onUpdateSet: (setNumber: number, field: 'actualReps' | 'actualWeight', value: number) => void;
  onDeleteSet: (setNumber: number) => void;
  onDuplicateSet: (setNumber: number) => void;
  previousData?: {
    reps: number;
    weight: number;
  };
}

const LONG_PRESS_DELAY = 150;
const LONG_PRESS_INTERVAL = 100;

const StepperSetRow: React.FC<StepperSetRowProps> = ({
  set,
  isActive,
  isCardFocused,
  onSetComplete,
  onUpdateSet,
  onDeleteSet,
  onDuplicateSet,
  previousData,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [showRepsModal, setShowRepsModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [tempReps, setTempReps] = useState('');
  const [tempWeight, setTempWeight] = useState('');

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressInterval = useRef<NodeJS.Timeout | null>(null);

  // Parse target reps (e.g., "8-10" -> 8)
  const getDefaultReps = useCallback(() => {
    const match = set.targetReps.match(/\d+/);
    return match ? parseInt(match[0], 10) : 10;
  }, [set.targetReps]);

  const getDefaultWeight = useCallback(() => {
    return set.targetWeight;
  }, [set.targetWeight]);

  const currentReps = set.actualReps ?? getDefaultReps();
  const currentWeight = set.actualWeight ?? getDefaultWeight();

  // Check if user has actively set values
  const hasUserReps = set.actualReps !== undefined;
  const hasUserWeight = set.actualWeight !== undefined;

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (longPressInterval.current) clearInterval(longPressInterval.current);
    };
  }, []);

  const clearLongPressTimers = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
    }
  };

  // Stepper handlers
  const handleIncrement = useCallback(
    (field: 'actualReps' | 'actualWeight', increment: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const currentValue = field === 'actualReps' ? currentReps : currentWeight;

      if (field === 'actualWeight') {
        // For weight, use 0.5kg increments and round to 1 decimal
        const newValue = Math.max(0, Math.round((currentValue + increment * 0.5) * 10) / 10);
        onUpdateSet(set.setNumber, field, newValue);
      } else {
        // For reps, use integer increments
        const newValue = Math.max(0, currentValue + increment);
        onUpdateSet(set.setNumber, field, newValue);
      }
    },
    [currentReps, currentWeight, onUpdateSet, set.setNumber]
  );

  const handleLongPressStart = useCallback(
    (field: 'actualReps' | 'actualWeight', increment: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleIncrement(field, increment);

      longPressTimer.current = setTimeout(() => {
        longPressInterval.current = setInterval(() => {
          handleIncrement(field, increment * 5);
        }, LONG_PRESS_INTERVAL);
      }, LONG_PRESS_DELAY);
    },
    [handleIncrement]
  );

  const handleLongPressEnd = useCallback(() => {
    clearLongPressTimers();
  }, []);

  // Manual input handlers
  const handleRepsPress = () => {
    if (!set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTempReps(currentReps.toString());
      setShowRepsModal(true);
    }
  };

  const handleWeightPress = () => {
    if (!set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTempWeight(currentWeight.toString());
      setShowWeightModal(true);
    }
  };

  const handleRepsSubmit = () => {
    const value = parseInt(tempReps, 10);
    if (!isNaN(value) && value > 0) {
      onUpdateSet(set.setNumber, 'actualReps', value);
    }
    setShowRepsModal(false);
  };

  const handleWeightSubmit = () => {
    const value = parseFloat(tempWeight);
    if (!isNaN(value) && value >= 0) {
      onUpdateSet(set.setNumber, 'actualWeight', value);
    }
    setShowWeightModal(false);
  };

  // Set completion handler
  const handleSetComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSetComplete(set.setNumber);
  };

  // Long Press on Row - Show Action Menu
  const handleRowLongPress = () => {
    if (set.completed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', 'Duplica Set', 'Elimina Set'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onDuplicateSet(set.setNumber);
          } else if (buttonIndex === 2) {
            onDeleteSet(set.setNumber);
          }
        }
      );
    } else {
      Alert.alert(
        'Azioni Set',
        'Cosa vuoi fare con questo set?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Duplica Set',
            onPress: () => onDuplicateSet(set.setNumber),
          },
          {
            text: 'Elimina Set',
            onPress: () => onDeleteSet(set.setNumber),
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.setRow,
          isActive && (isCardFocused ? styles.activeSetRowFocused : styles.activeSetRow),
          set.completed && styles.completedSetRow,
        ]}
        onLongPress={handleRowLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Center Column - Target Info + Controls */}
        <View style={styles.centerColumn}>
          {/* Target Info Row with Set Number */}
          <View style={styles.targetInfoRow}>
            <Text style={[styles.setNumberText, isCardFocused && styles.textWhite]}>{set.setNumber}</Text>
            <Text style={[styles.targetInfoText, isCardFocused && styles.textWhiteOpacity]}>
              Target: {set.targetReps} • {set.targetWeight}kg
            </Text>
          </View>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            {/* Reps Stepper */}
            <View style={styles.stepperGroup}>
              {isActive && <Text style={[styles.stepperLabel, isCardFocused && styles.textWhiteOpacity]}>reps</Text>}
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPressIn={() => handleLongPressStart('actualReps', -1)}
                  onPressOut={handleLongPressEnd}
                  disabled={set.completed}
                  activeOpacity={0.6}
                >
                  <AntDesign
                    name="minus"
                    size={16}
                    color={set.completed ? theme.colors.textLight : (isCardFocused ? theme.colors.white : theme.colors.primary)}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inputBox, isCardFocused && styles.inputBoxFocused]}
                  onPress={handleRepsPress}
                  disabled={set.completed}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.inputText,
                    !hasUserReps && (isCardFocused ? styles.inputPlaceholderFocused : styles.inputPlaceholder),
                    set.completed && styles.inputCompleted,
                    isCardFocused && styles.textWhite
                  ]}>
                    {currentReps}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPressIn={() => handleLongPressStart('actualReps', 1)}
                  onPressOut={handleLongPressEnd}
                  disabled={set.completed}
                  activeOpacity={0.6}
                >
                  <AntDesign
                    name="plus"
                    size={16}
                    color={set.completed ? theme.colors.textLight : (isCardFocused ? theme.colors.white : theme.colors.primary)}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weight Stepper */}
            <View style={styles.stepperGroup}>
              {isActive && <Text style={[styles.stepperLabel, isCardFocused && styles.textWhiteOpacity]}>kg</Text>}
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPressIn={() => handleLongPressStart('actualWeight', -1)}
                  onPressOut={handleLongPressEnd}
                  disabled={set.completed}
                  activeOpacity={0.6}
                >
                  <AntDesign
                    name="minus"
                    size={16}
                    color={set.completed ? theme.colors.textLight : (isCardFocused ? theme.colors.white : theme.colors.primary)}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inputBox, isCardFocused && styles.inputBoxFocused]}
                  onPress={handleWeightPress}
                  disabled={set.completed}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.inputText,
                    !hasUserWeight && (isCardFocused ? styles.inputPlaceholderFocused : styles.inputPlaceholder),
                    set.completed && styles.inputCompleted,
                    isCardFocused && styles.textWhite
                  ]}>
                    {Number(currentWeight) % 1 === 0 ? currentWeight : currentWeight.toFixed(1)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPressIn={() => handleLongPressStart('actualWeight', 1)}
                  onPressOut={handleLongPressEnd}
                  disabled={set.completed}
                  activeOpacity={0.6}
                >
                  <AntDesign
                    name="plus"
                    size={16}
                    color={set.completed ? theme.colors.textLight : (isCardFocused ? theme.colors.white : theme.colors.primary)}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox - Right */}
            <TouchableOpacity
              style={[
                styles.checkbox,
                set.completed && styles.checkboxCompleted,
                isCardFocused && !set.completed && styles.checkboxFocused
              ]}
              onPress={handleSetComplete}
            >
              {set.completed && (
                <AntDesign name="check" size={18} color={theme.colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Reps Input Modal */}
      <Modal
        visible={showRepsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRepsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRepsModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ripetizioni</Text>
            <TextInput
              style={styles.modalInput}
              value={tempReps}
              onChangeText={setTempReps}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleRepsSubmit}
              placeholderTextColor={theme.colors.textLight}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRepsModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleRepsSubmit}
              >
                <Text style={styles.modalButtonText}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Weight Input Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWeightModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Peso (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempWeight}
              onChangeText={setTempWeight}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleWeightSubmit}
              placeholderTextColor={theme.colors.textLight}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleWeightSubmit}
              >
                <Text style={styles.modalButtonText}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  activeSetRow: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
  },
  completedSetRow: {
    opacity: 0.6,
  },

  // Set Number - Compact
  setNumberText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },

  // Center Column
  centerColumn: {
    flex: 1,
    gap: 2,
  },
  targetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  targetInfoText: {
    fontSize: 10,
    color: theme.colors.textLight,
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },

  // Stepper Group
  stepperGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  stepperLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    marginBottom: 2,
    alignSelf: 'center',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: '100%',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input Box (center number)
  inputBox: {
    flex: 1,
    minWidth: 40,
    height: 32,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  inputPlaceholder: {
    color: theme.colors.textLight,
  },
  inputCompleted: {
    color: theme.colors.textSecondary,
  },

  // Checkbox
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 320,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
  modalButtonTextCancel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },

  // Focused Card Styles
  activeSetRowFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
  },
  textWhite: {
    color: theme.colors.white,
  },
  textWhiteOpacity: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputBoxFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputPlaceholderFocused: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxFocused: {
    borderColor: theme.colors.white,
    backgroundColor: 'transparent',
  },
});

export default StepperSetRow;
