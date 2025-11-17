import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { TrainingSession, Exercise, CompletedSession } from '../../types/api.types';
import apiService from '../../services/api.service';

type SessionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Session'>;
  route: RouteProp<RootStackParamList, 'Session'>;
};

interface SetLog {
  setNumber: number;
  reps: string;
  weight: string;
  completed: boolean;
}

interface ExerciseState {
  exerciseId: string;
  expanded: boolean;
  sets: SetLog[];
  allCompleted: boolean;
}

const SessionScreen: React.FC<SessionScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<{ [key: string]: ExerciseState }>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (sessionStarted && !sessionTimerRef.current) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionStarted]);

  useEffect(() => {
    if (restTimeRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowRestTimer(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, [restTimeRemaining]);

  const loadSession = async () => {
    try {
      // In a real app, we'd fetch the session from a workout plan
      // For now, we'll fetch the plan and find the session
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
        Alert.alert('Error', 'Session not found');
        navigation.goBack();
        return;
      }

      setSession(foundSession);

      // Initialize exercise states
      const states: { [key: string]: ExerciseState } = {};
      foundSession.exercises.forEach((exercise) => {
        const sets: SetLog[] = [];
        for (let i = 1; i <= exercise.targetSets; i++) {
          sets.push({
            setNumber: i,
            reps: '',
            weight: exercise.targetWeight?.toString() || '',
            completed: false,
          });
        }
        states[exercise.id] = {
          exerciseId: exercise.id,
          expanded: false,
          sets,
          allCompleted: false,
        };
      });
      setExerciseStates(states);
    } catch (error) {
      Alert.alert('Error', 'Failed to load session');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const completed = await apiService.startSession(sessionId);
      setCompletedSessionId(completed.id);
      setSessionStarted(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId]!,
        expanded: !prev[exerciseId]!.expanded,
      },
    }));
  };

  const completeSet = async (exerciseId: string, setNumber: number, restSeconds: number) => {
    if (!sessionStarted) {
      await startSession();
    }

    const state = exerciseStates[exerciseId]!;
    const set = state.sets.find((s) => s.setNumber === setNumber)!;

    // Log set if user entered reps/weight
    if (completedSessionId && set.reps && set.weight) {
      try {
        await apiService.logSet(completedSessionId, {
          exerciseId,
          setNumber,
          actualReps: parseInt(set.reps) || 0,
          actualWeight: parseFloat(set.weight) || 0,
        });
      } catch (error) {
        console.error('Failed to log set:', error);
      }
    }

    // Mark set as completed
    const updatedSets = state.sets.map((s) =>
      s.setNumber === setNumber ? { ...s, completed: true } : s
    );

    const allCompleted = updatedSets.every((s) => s.completed);

    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId]!,
        sets: updatedSets,
        allCompleted,
      },
    }));

    // Start rest timer
    if (!allCompleted) {
      setRestTimeRemaining(restSeconds);
      setShowRestTimer(true);
    }
  };

  const completeAllSets = (exerciseId: string) => {
    const state = exerciseStates[exerciseId]!;
    const updatedSets = state.sets.map((s) => ({ ...s, completed: true }));

    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId]!,
        sets: updatedSets,
        allCompleted: true,
      },
    }));
  };

  const updateSetValue = (exerciseId: string, setNumber: number, field: 'reps' | 'weight', value: string) => {
    const state = exerciseStates[exerciseId]!;
    const updatedSets = state.sets.map((s) =>
      s.setNumber === setNumber ? { ...s, [field]: value } : s
    );

    setExerciseStates((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId]!,
        sets: updatedSets,
      },
    }));
  };

  const finishWorkout = () => {
    setShowCompletionModal(true);
  };

  const saveAndFinish = async () => {
    if (!completedSessionId) {
      navigation.goBack();
      return;
    }

    setIsCompletingSession(true);
    try {
      await apiService.completeSession(completedSessionId, {
        rating: rating > 0 ? rating : undefined,
        notes: notes || undefined,
      });

      Alert.alert('Success', 'Workout completed!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTabs');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save session');
    } finally {
      setIsCompletingSession(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderExercise = ({ item: exercise }: { item: Exercise }) => {
    const state = exerciseStates[exercise.id];
    if (!state) return null;

    return (
      <View style={styles.exerciseCard}>
        <TouchableOpacity
          style={styles.exerciseHeader}
          onPress={() => toggleExercise(exercise.id)}
        >
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseTarget}>
              {exercise.targetSets} sets × {exercise.targetReps} reps
              {exercise.targetWeight ? ` @ ${exercise.targetWeight}kg` : ''}
            </Text>
            {exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
          </View>
          <View style={[styles.statusBadge, state.allCompleted && styles.statusBadgeCompleted]}>
            <Text style={[styles.statusText, state.allCompleted && styles.statusTextCompleted]}>
              {state.allCompleted ? '✓ Done' : `${state.sets.filter(s => s.completed).length}/${exercise.targetSets}`}
            </Text>
          </View>
        </TouchableOpacity>

        {state.expanded && (
          <View style={styles.setsContainer}>
            {state.sets.map((set) => (
              <View key={set.setNumber} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {set.setNumber}</Text>

                <TextInput
                  style={styles.setInput}
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(value) => updateSetValue(exercise.id, set.setNumber, 'reps', value)}
                  editable={!set.completed}
                />

                <TextInput
                  style={styles.setInput}
                  placeholder="Weight"
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(value) => updateSetValue(exercise.id, set.setNumber, 'weight', value)}
                  editable={!set.completed}
                />

                <TouchableOpacity
                  style={[styles.completeButton, set.completed && styles.completeButtonDone]}
                  onPress={() => completeSet(exercise.id, set.setNumber, exercise.restSeconds)}
                  disabled={set.completed}
                >
                  <Text style={styles.completeButtonText}>
                    {set.completed ? '✓' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {!state.allCompleted && (
              <TouchableOpacity
                style={styles.completeAllButton}
                onPress={() => completeAllSets(exercise.id)}
              >
                <Text style={styles.completeAllButtonText}>Complete All Sets (Quick)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading || !session) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerHeader}>
        <Text style={styles.timerLabel}>Session Time</Text>
        <Text style={styles.timerValue}>{formatTime(sessionTime)}</Text>
      </View>

      <FlatList
        data={session.exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
        <Text style={styles.finishButtonText}>Finish Workout</Text>
      </TouchableOpacity>

      {/* Rest Timer Modal */}
      <Modal visible={showRestTimer} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.restTimerModal}>
            <Text style={styles.restTimerTitle}>Rest Time</Text>
            <Text style={styles.restTimerValue}>
              {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity
              style={styles.skipRestButton}
              onPress={() => {
                setShowRestTimer(false);
                setRestTimeRemaining(0);
              }}
            >
              <Text style={styles.skipRestButtonText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal visible={showCompletionModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <ScrollView>
              <Text style={styles.completionTitle}>Workout Complete!</Text>

              <View style={styles.metricsContainer}>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{formatTime(sessionTime)}</Text>
              </View>

              <Text style={styles.ratingLabel}>Rate Your Workout</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={[styles.star, rating >= star && styles.starFilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.notesLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="How did you feel? Any observations?"
                multiline={true}
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAndFinish}
                disabled={isCompletingSession}
              >
                {isCompletingSession ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save & Finish</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCompletionModal(false)}
                disabled={isCompletingSession}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerHeader: {
    backgroundColor: '#007AFF',
    padding: 16,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#666',
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusTextCompleted: {
    color: '#fff',
  },
  setsContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 50,
  },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 4,
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  completeButtonDone: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completeAllButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  completeAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  finishButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTimerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  restTimerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  restTimerValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 24,
  },
  skipRestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  skipRestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completionModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 24,
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
    color: '#ddd',
  },
  starFilled: {
    color: '#FFD700',
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default SessionScreen;
