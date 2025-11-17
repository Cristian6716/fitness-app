import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { TrainingSession } from '../../types/api.types';
import apiService from '../../services/api.service';
import { theme } from '../../constants/theme';

// New Components
import SessionHeader from '../../components/session/SessionHeader';
import SessionFooter from '../../components/session/SessionFooter';
import ExerciseCard from '../../components/session/ExerciseCard';

// New Hook
import { useRestTimer } from '../../hooks/useRestTimer';

type SessionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Session'>;
  route: RouteProp<RootStackParamList, 'Session'>;
};

interface SetState {
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  actualReps?: number;
  actualWeight?: number;
  completed: boolean;
}

interface ExerciseState {
  exerciseId: string;
  name: string;
  sets: SetState[];
  restSeconds: number;
  notes: string;
  isExpanded: boolean; // Changed from notesExpanded to generic isExpanded
}

interface PreviousWorkoutData {
  exerciseId: string;
  sets: {
    setNumber: number;
    reps: number;
    weight: number;
  }[];
}

type SessionStatus = 'not_started' | 'in_progress' | 'paused';

const SessionScreen: React.FC<SessionScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;

  // State
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('not_started');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [previousWorkoutData, setPreviousWorkoutData] = useState<PreviousWorkoutData[]>([]);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<ExerciseState | null>(null);

  // Rest Timer Hook
  const {
    isResting,
    restTimeRemaining,
    startRestTimer,
    skipRest,
    pauseRest,
    resumeRest,
  } = useRestTimer();

  // Refs
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRestingExercise = useRef<{ exerciseId: string; setNumber: number } | null>(null);

  // ========== LIFECYCLE ==========

  useEffect(() => {
    loadSession();
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Session Timer Effect
  useEffect(() => {
    if (sessionStatus === 'in_progress' && !sessionTimerRef.current) {
      sessionTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (sessionStatus === 'paused' || sessionStatus === 'not_started') {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionStatus]);

  // ========== DATA LOADING ==========

  const loadSession = async () => {
    try {
      const plans = await apiService.getWorkouts();
      let foundSession: TrainingSession | null = null;

      for (const plan of plans) {
        const found = plan.trainingSessions.find((s) => s.id === sessionId);
        if (found) {
          foundSession = found;
          break;
        }
      }

      if (!foundSession) {
        Alert.alert('Errore', 'Sessione non trovata');
        navigation.goBack();
        return;
      }

      setSession(foundSession);

      // Initialize exercise states
      const exerciseStates: ExerciseState[] = foundSession.exercises.map((exercise) => {
        const sets: SetState[] = [];
        for (let i = 1; i <= exercise.targetSets; i++) {
          sets.push({
            setNumber: i,
            targetReps: exercise.targetReps,
            targetWeight: exercise.targetWeight || 0,
            actualReps: undefined,
            actualWeight: undefined,
            completed: false,
          });
        }
        return {
          exerciseId: exercise.id,
          name: exercise.name,
          sets,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes || '',
          isExpanded: false, // Start collapsed
        };
      });

      setExercises(exerciseStates);

      // Load previous workout data
      await loadPreviousWorkoutData(sessionId);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare la sessione');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreviousWorkoutData = async (sessionId: string) => {
    try {
      const history = await apiService.getSessionHistory(sessionId);
      if (history && history.length > 0) {
        // Get the most recent completed session
        const lastSession = history[0];
        // Parse the data to extract exercise-wise sets
        // Note: This assumes API returns the data in a parseable format
        // You may need to adjust based on actual API response
        setPreviousWorkoutData([]);
      }
    } catch (error) {
      console.log('Could not load previous workout data:', error);
    }
  };

  const startSessionBackend = async () => {
    try {
      const completed = await apiService.startSession(sessionId);
      setCompletedSessionId(completed.id);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile avviare la sessione');
    }
  };

  // ========== SESSION CONTROLS ==========

  const startSessionTimer = () => {
    setSessionStatus('in_progress');
    Vibration.vibrate(30);
  };

  const pauseSessionTimer = () => {
    if (sessionStatus === 'paused') {
      setSessionStatus('in_progress');
      Vibration.vibrate(30);
    } else {
      setSessionStatus('paused');
      Vibration.vibrate(30);
      // Also pause rest timer if active
      if (isResting && currentRestingExercise.current) {
        pauseRest();
      }
    }
  };

  const handleBack = () => {
    if (sessionStatus === 'not_started') {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Annulla Sessione',
      'Sei sicuro? I progressi non saranno salvati.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sì, annulla',
          style: 'destructive',
          onPress: () => {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ========== EXERCISE CONTROLS ==========

  const handleToggleExpand = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].isExpanded = !updatedExercises[exerciseIndex].isExpanded;
    setExercises(updatedExercises);
  };

  const handleSetComplete = async (exerciseIndex: number, setNumber: number) => {
    // Start backend session if not started
    if (!completedSessionId && sessionStatus === 'not_started') {
      await startSessionBackend();
      startSessionTimer();
    }

    const exercise = exercises[exerciseIndex];
    const setIndex = exercise.sets.findIndex((s) => s.setNumber === setNumber);
    const set = exercise.sets[setIndex];

    // Validate inputs
    if (!set.actualReps || set.actualReps <= 0) {
      Alert.alert('Input non valido', 'Inserisci un numero valido di ripetizioni');
      return;
    }

    if (set.actualWeight === undefined || set.actualWeight < 0) {
      Alert.alert('Input non valido', 'Inserisci un peso valido');
      return;
    }

    // Haptic feedback
    Vibration.vibrate(50);

    // Update local state (optimistic update)
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...set,
      completed: true,
    };
    setExercises(updatedExercises);

    // Log to backend
    if (completedSessionId) {
      try {
        await apiService.logSet(completedSessionId, {
          exerciseId: exercise.exerciseId,
          setNumber: set.setNumber,
          actualReps: set.actualReps,
          actualWeight: set.actualWeight,
        });
      } catch (error) {
        console.error('Failed to log set:', error);
        // Revert optimistic update on error
        const revertedExercises = [...exercises];
        revertedExercises[exerciseIndex].sets[setIndex] = set;
        setExercises(revertedExercises);
        Alert.alert('Errore', 'Impossibile salvare il set');
        return;
      }
    }

    // Start rest timer if not last set
    const isLastSet = setIndex === exercise.sets.length - 1;
    if (!isLastSet && exercise.restSeconds > 0) {
      currentRestingExercise.current = {
        exerciseId: exercise.exerciseId,
        setNumber: set.setNumber,
      };
      startRestTimer({
        duration: exercise.restSeconds,
        exerciseName: exercise.name,
        setNumber: set.setNumber,
      });
    }
  };

  const handleSetUncomplete = (exerciseIndex: number, setNumber: number) => {
    const updatedExercises = [...exercises];
    const setIndex = updatedExercises[exerciseIndex].sets.findIndex((s) => s.setNumber === setNumber);

    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      completed: false,
    };

    setExercises(updatedExercises);
    Vibration.vibrate(30);

    // Cancel rest timer if this was the resting set
    if (
      isResting &&
      currentRestingExercise.current?.exerciseId === exercises[exerciseIndex].exerciseId &&
      currentRestingExercise.current?.setNumber === setNumber
    ) {
      skipRest();
      currentRestingExercise.current = null;
    }
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setNumber: number,
    field: 'actualReps' | 'actualWeight',
    value: number
  ) => {
    const updatedExercises = [...exercises];
    const setIndex = updatedExercises[exerciseIndex].sets.findIndex((s) => s.setNumber === setNumber);

    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updatedExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];

    const newSet: SetState = {
      setNumber: exercise.sets.length + 1,
      targetReps: lastSet.targetReps,
      targetWeight: lastSet.targetWeight,
      actualReps: undefined,
      actualWeight: undefined,
      completed: false,
    };

    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets.push(newSet);
    setExercises(updatedExercises);

    Vibration.vibrate(30);
  };

  const handleDeleteSet = (exerciseIndex: number, setNumber: number) => {
    Alert.alert('Rimuovi Set', 'Sei sicuro di voler rimuovere questo set?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rimuovi',
        style: 'destructive',
        onPress: () => {
          const updatedExercises = [...exercises];
          updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter(
            (s) => s.setNumber !== setNumber
          );
          // Renumber sets
          updatedExercises[exerciseIndex].sets.forEach((s, idx) => {
            s.setNumber = idx + 1;
          });
          setExercises(updatedExercises);
          Vibration.vibrate(30);
        },
      },
    ]);
  };

  const handleDuplicateSet = (exerciseIndex: number, setNumber: number) => {
    const updatedExercises = [...exercises];
    const setIndex = updatedExercises[exerciseIndex].sets.findIndex((s) => s.setNumber === setNumber);
    const setToDuplicate = updatedExercises[exerciseIndex].sets[setIndex];

    // Create duplicate set
    const duplicateSet: SetState = {
      setNumber: updatedExercises[exerciseIndex].sets.length + 1,
      targetReps: setToDuplicate.targetReps,
      targetWeight: setToDuplicate.targetWeight,
      actualReps: setToDuplicate.actualReps,
      actualWeight: setToDuplicate.actualWeight,
      completed: false, // Always create as uncompleted
    };

    // Insert duplicate after original set
    updatedExercises[exerciseIndex].sets.splice(setIndex + 1, 0, duplicateSet);

    // Renumber all sets
    updatedExercises[exerciseIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });

    setExercises(updatedExercises);
    Vibration.vibrate(30);
  };

  const handleShowInfo = (exerciseIndex: number) => {
    setSelectedExerciseInfo(exercises[exerciseIndex]);
    setShowInfoModal(true);
  };

  // ========== COMPLETION ==========

  const calculateProgress = useMemo(() => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    return { completed: completedSets, total: totalSets };
  }, [exercises]);

  const calculateStats = useMemo(() => {
    let totalWeightLifted = 0;

    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (set.completed) {
          const reps = set.actualReps || 0;
          const weight = set.actualWeight || 0;
          totalWeightLifted += reps * weight;
        }
      });
    });

    const durationMinutes = elapsedSeconds / 60;
    const caloriesBurned = Math.round(durationMinutes * 5);

    return { totalWeightLifted, caloriesBurned };
  }, [exercises, elapsedSeconds]);

  const handleCompleteWorkout = () => {
    const { completed } = calculateProgress;

    if (completed === 0) {
      Alert.alert('Nessun Set Completato', "Completa almeno un set prima di terminare l'allenamento.");
      return;
    }

    Vibration.vibrate(50);
    setShowCompletionModal(true);
  };

  const saveAndFinish = async () => {
    if (!completedSessionId) {
      navigation.goBack();
      return;
    }

    const { completed } = calculateProgress;
    if (completed === 0) {
      Alert.alert('Nessun Set Completato', 'Completa almeno un set prima di salvare.');
      return;
    }

    setIsCompletingSession(true);
    try {
      await apiService.completeSession(completedSessionId, {
        rating: rating > 0 ? rating : undefined,
        notes: completionNotes || undefined,
      });

      Alert.alert('Successo', 'Allenamento completato!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTabs');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare la sessione');
    } finally {
      setIsCompletingSession(false);
    }
  };

  // ========== RENDER ==========

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return null;
  }

  const renderExerciseCard = ({ item, index }: { item: ExerciseState; index: number }) => {
    const previousData = previousWorkoutData.find((p) => p.exerciseId === item.exerciseId);

    return (
      <ExerciseCard
        exerciseId={item.exerciseId}
        name={item.name}
        sets={item.sets}
        restSeconds={item.restSeconds}
        notes={item.notes}
        isExpanded={item.isExpanded}
        onToggleExpand={() => handleToggleExpand(index)}
        onSetComplete={(setNumber) => handleSetComplete(index, setNumber)}
        onSetUncomplete={(setNumber) => handleSetUncomplete(index, setNumber)}
        onUpdateSet={(setNumber, field, value) => handleUpdateSet(index, setNumber, field, value)}
        onAddSet={() => handleAddSet(index)}
        onDeleteSet={(setNumber) => handleDeleteSet(index, setNumber)}
        onDuplicateSet={(setNumber) => handleDuplicateSet(index, setNumber)}
        onShowInfo={() => handleShowInfo(index)}
        previousWorkoutData={previousData?.sets}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* HEADER - Fixed Top */}
        <SessionHeader
          sessionName={session.name}
          elapsedSeconds={elapsedSeconds}
          onBack={handleBack}
          onEdit={() => {
            Alert.alert('Edit', 'Edit functionality coming soon');
          }}
        />

        {/* EXERCISE LIST - Scrollable Middle */}
        <FlatList
          data={exercises}
          renderItem={renderExerciseCard}
          keyExtractor={(item) => item.exerciseId}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 180 }, // Space for footer
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* FOOTER - Fixed Bottom */}
        <SessionFooter
          isResting={isResting}
          restTimeRemaining={restTimeRemaining}
          onSkipRest={skipRest}
          onCompleteSession={handleCompleteWorkout}
          onPauseSession={pauseSessionTimer}
          sessionStatus={sessionStatus}
          isCompletingSession={isCompletingSession}
        />

        {/* COMPLETION MODAL */}
        <Modal
          visible={showCompletionModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Allenamento Completato! 🎉</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{calculateStats.totalWeightLifted} kg</Text>
                  <Text style={styles.statLabel}>Peso Totale</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.floor(elapsedSeconds / 60)} min</Text>
                  <Text style={styles.statLabel}>Durata</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {calculateProgress.completed}/{calculateProgress.total}
                  </Text>
                  <Text style={styles.statLabel}>Set</Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Come è andata?</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Text style={styles.starIcon}>{star <= rating ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAndFinish}
                disabled={isCompletingSession}
              >
                <Text style={styles.saveButtonText}>
                  {isCompletingSession ? 'Salvataggio...' : 'Salva e Termina'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCompletionModal(false)}
                disabled={isCompletingSession}
              >
                <Text style={styles.cancelButtonText}>Continua Allenamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* INFO MODAL */}
        <Modal
          visible={showInfoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInfoModal(false)}>
            <View style={styles.infoModalContent}>
              {selectedExerciseInfo && (
                <>
                  <Text style={styles.infoModalTitle}>{selectedExerciseInfo.name}</Text>
                  {selectedExerciseInfo.notes && (
                    <Text style={styles.infoModalText}>{selectedExerciseInfo.notes}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.infoModalButton}
                    onPress={() => setShowInfoModal(false)}
                  >
                    <Text style={styles.infoModalButtonText}>Chiudi</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  listContent: {
    paddingTop: theme.spacing.sm,
  },

  // Completion Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  ratingContainer: {
    marginBottom: theme.spacing.xl,
  },
  ratingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  starIcon: {
    fontSize: 36,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },

  // Info Modal
  infoModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 350,
  },
  infoModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoModalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  infoModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  infoModalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default SessionScreen;
