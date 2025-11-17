import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { TrainingSession } from '../../types/api.types';
import apiService from '../../services/api.service';
import { theme } from '../../constants/theme';

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
  notesExpanded: boolean;
  animatedValues: Animated.Value[]; // Animation value per set
  isExpanded: boolean; // NEW: for collapse/expand functionality
}

interface ActiveRestTimer {
  exerciseId: string;
  setNumber: number;
  secondsLeft: number;
}

type SessionStatus = 'not_started' | 'in_progress' | 'paused';

const SessionScreen: React.FC<SessionScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('not_started');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<ExerciseState | null>(null);

  // Edit session modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercises, setEditingExercises] = useState<ExerciseState[]>([]);

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

  useEffect(() => {
    if (activeRestTimer && activeRestTimer.secondsLeft > 0) {
      restTimerRef.current = setInterval(() => {
        setActiveRestTimer((prev) => {
          if (!prev || prev.secondsLeft <= 1) {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            // Vibrate when rest timer completes
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Vibration.vibrate([0, 200, 100, 200]);
            }
            return null;
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, [activeRestTimer?.exerciseId, activeRestTimer?.setNumber]);

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

      const exerciseStates: ExerciseState[] = foundSession.exercises.map((exercise, index) => {
        const sets: SetState[] = [];
        const animatedValues: Animated.Value[] = [];
        for (let i = 1; i <= exercise.targetSets; i++) {
          sets.push({
            setNumber: i,
            targetReps: exercise.targetReps,
            targetWeight: exercise.targetWeight || 0,
            actualReps: undefined,
            actualWeight: undefined,
            completed: false,
          });
          animatedValues.push(new Animated.Value(0));
        }
        return {
          exerciseId: exercise.id,
          name: exercise.name,
          sets,
          restSeconds: exercise.restSeconds,
          notes: '',
          notesExpanded: false,
          animatedValues,
          isExpanded: index === 0, // First exercise expanded by default
        };
      });

      setExercises(exerciseStates);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare la sessione');
      navigation.goBack();
    } finally {
      setIsLoading(false);
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

  const startSessionTimer = () => {
    setSessionStatus('in_progress');
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  const pauseSessionTimer = () => {
    setSessionStatus('paused');
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  const resumeSessionTimer = () => {
    setSessionStatus('in_progress');
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  const cancelSessionTimer = () => {
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
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleSetComplete = async (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    const updatedExercises = [...exercises];

    // Toggle checkbox
    if (set.completed) {
      // Deselect: clear data and animation
      updatedExercises[exerciseIndex].sets[setIndex] = {
        ...set,
        actualReps: undefined,
        actualWeight: undefined,
        completed: false,
      };

      // Animate back to white
      Animated.timing(exercise.animatedValues[setIndex], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Stop rest timer if this is the active resting set
      if (activeRestTimer?.exerciseId === exercise.exerciseId &&
          activeRestTimer?.setNumber === set.setNumber) {
        if (restTimerRef.current) {
          clearInterval(restTimerRef.current);
          restTimerRef.current = null;
        }
        setActiveRestTimer(null);
      }

      setExercises(updatedExercises);

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate(30);
      }
      return;
    }

    // Start backend session if not started
    if (!completedSessionId) {
      await startSessionBackend();
    }

    // REPS: If empty, auto-fill with first number from range
    let finalReps = set.actualReps;
    if (finalReps === undefined || finalReps === 0) {
      const targetRepsMatch = set.targetReps.match(/^(\d+)/);
      finalReps = targetRepsMatch ? parseInt(targetRepsMatch[1]) : 0;
    }

    // KG: If empty, use target weight
    let finalWeight = set.actualWeight;
    if (finalWeight === undefined) {
      finalWeight = set.targetWeight;
    }

    // Validate
    if (!finalReps || finalReps <= 0) {
      Alert.alert('Input non valido', 'Inserisci un numero valido di ripetizioni');
      return;
    }

    if (finalWeight < 0) {
      Alert.alert('Input non valido', 'Inserisci un peso valido');
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }

    // Animate set completion
    Animated.timing(exercise.animatedValues[setIndex], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...set,
      actualReps: finalReps,
      actualWeight: finalWeight,
      completed: true,
    };
    setExercises(updatedExercises);

    if (completedSessionId) {
      try {
        await apiService.logSet(completedSessionId, {
          exerciseId: exercise.exerciseId,
          setNumber: set.setNumber,
          actualReps: finalReps,
          actualWeight: finalWeight,
        });
      } catch (error) {
        console.error('Failed to log set:', error);
      }
    }

    const isLastSet = setIndex === exercise.sets.length - 1;
    if (!isLastSet && exercise.restSeconds > 0) {
      setActiveRestTimer({
        exerciseId: exercise.exerciseId,
        setNumber: set.setNumber,
        secondsLeft: exercise.restSeconds,
      });
    }
  };

  const handleInputChange = (
    exerciseIndex: number,
    setIndex: number,
    field: 'actualReps' | 'actualWeight',
    value: string
  ) => {
    const updatedExercises = [...exercises];

    if (value === '') {
      updatedExercises[exerciseIndex].sets[setIndex][field] = undefined;
    } else if (field === 'actualWeight') {
      // Allow numbers and single decimal point
      if (!/^\d*\.?\d*$/.test(value)) {
        return;
      }
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updatedExercises[exerciseIndex].sets[setIndex][field] = numValue;
      }
    } else if (field === 'actualReps') {
      // Only allow integers for reps
      if (!/^\d+$/.test(value)) {
        return;
      }
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        updatedExercises[exerciseIndex].sets[setIndex][field] = numValue;
      }
    }

    setExercises(updatedExercises);
  };

  const addSet = (exerciseIndex: number) => {
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
    updatedExercises[exerciseIndex].animatedValues.push(new Animated.Value(0));
    setExercises(updatedExercises);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  const toggleExerciseNotes = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].notesExpanded = !updatedExercises[exerciseIndex].notesExpanded;
    setExercises(updatedExercises);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(20);
    }
  };

  const toggleExerciseExpand = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].isExpanded = !updatedExercises[exerciseIndex].isExpanded;
    setExercises(updatedExercises);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(20);
    }
  };

  const calculateProgress = () => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    return { completed: completedSets, total: totalSets };
  };

  const calculateStats = () => {
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
  };

  const handleCompleteWorkout = () => {
    const { completed } = calculateProgress();

    if (completed === 0) {
      Alert.alert('Nessun Set Completato', 'Completa almeno un set prima di terminare l\'allenamento.');
      return;
    }

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }

    setShowCompletionModal(true);
  };

  const saveAndFinish = async () => {
    if (!completedSessionId) {
      navigation.goBack();
      return;
    }

    // Validation: Check if any sets were completed
    const { completed } = calculateProgress();
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

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const skipRestTimer = () => {
    setActiveRestTimer(null);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  const handleShowExerciseInfo = (exerciseIndex: number) => {
    setSelectedExerciseInfo(exercises[exerciseIndex]);
    setShowInfoModal(true);
  };

  const handleEditSession = () => {
    // Copia gli esercizi correnti per l'editing
    setEditingExercises(JSON.parse(JSON.stringify(exercises)));
    setShowEditModal(true);
  };

  const removeExercise = (exerciseIndex: number) => {
    Alert.alert(
      'Rimuovi Esercizio',
      'Sei sicuro di voler rimuovere questo esercizio dalla sessione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = editingExercises.filter((_, idx) => idx !== exerciseIndex);
            setEditingExercises(updatedExercises);
          },
        },
      ]
    );
  };

  const updateExerciseName = (exerciseIndex: number, name: string) => {
    const updatedExercises = [...editingExercises];
    updatedExercises[exerciseIndex].name = name;
    setEditingExercises(updatedExercises);
  };

  const updateExerciseRestSeconds = (exerciseIndex: number, seconds: string) => {
    const updatedExercises = [...editingExercises];
    const numSeconds = parseInt(seconds) || 0;
    updatedExercises[exerciseIndex].restSeconds = numSeconds;
    setEditingExercises(updatedExercises);
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    const updatedExercises = [...editingExercises];
    updatedExercises[exerciseIndex].notes = notes;
    setEditingExercises(updatedExercises);
  };

  const updateSetTargetReps = (exerciseIndex: number, setIndex: number, reps: string) => {
    const updatedExercises = [...editingExercises];
    updatedExercises[exerciseIndex].sets[setIndex].targetReps = reps;
    setEditingExercises(updatedExercises);
  };

  const updateSetTargetWeight = (exerciseIndex: number, setIndex: number, weight: string) => {
    const updatedExercises = [...editingExercises];
    const numWeight = parseFloat(weight) || 0;
    updatedExercises[exerciseIndex].sets[setIndex].targetWeight = numWeight;
    setEditingExercises(updatedExercises);
  };

  const addSetToExercise = (exerciseIndex: number) => {
    const updatedExercises = [...editingExercises];
    const exercise = updatedExercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];

    const newSet: SetState = {
      setNumber: exercise.sets.length + 1,
      targetReps: lastSet.targetReps,
      targetWeight: lastSet.targetWeight,
      actualReps: undefined,
      actualWeight: undefined,
      completed: false,
    };

    updatedExercises[exerciseIndex].sets.push(newSet);
    setEditingExercises(updatedExercises);
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...editingExercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter(
      (_, idx) => idx !== setIndex
    );
    // Rinumera i set
    updatedExercises[exerciseIndex].sets.forEach((set, idx) => {
      set.setNumber = idx + 1;
    });
    setEditingExercises(updatedExercises);
  };

  const saveEditedSession = () => {
    // Ricrea gli animatedValues per ogni set
    const updatedExercises = editingExercises.map((exercise, index) => {
      const animatedValues = exercise.sets.map((set) => {
        const animValue = new Animated.Value(set.completed ? 1 : 0);
        return animValue;
      });

      return {
        ...exercise,
        animatedValues,
        isExpanded: exercise.isExpanded !== undefined ? exercise.isExpanded : (index === 0),
      };
    });

    // Applica le modifiche
    setExercises(updatedExercises);
    setShowEditModal(false);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
  };

  const cancelEditSession = () => {
    setShowEditModal(false);
    setEditingExercises([]);
  };

  const moveExerciseUp = (exerciseIndex: number) => {
    if (exerciseIndex === 0) return;
    const updatedExercises = [...editingExercises];
    const temp = updatedExercises[exerciseIndex];
    updatedExercises[exerciseIndex] = updatedExercises[exerciseIndex - 1];
    updatedExercises[exerciseIndex - 1] = temp;
    setEditingExercises(updatedExercises);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(40);
    }
  };

  const moveExerciseDown = (exerciseIndex: number) => {
    if (exerciseIndex === editingExercises.length - 1) return;
    const updatedExercises = [...editingExercises];
    const temp = updatedExercises[exerciseIndex];
    updatedExercises[exerciseIndex] = updatedExercises[exerciseIndex + 1];
    updatedExercises[exerciseIndex + 1] = temp;
    setEditingExercises(updatedExercises);

    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(40);
    }
  };

  // Calculate progress and stats (must be before early return to follow Rules of Hooks)
  const progress = useMemo(() => calculateProgress(), [exercises]);
  const stats = useMemo(() => calculateStats(), [exercises, elapsedSeconds]);

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* REST TIMER BANNER (only when active) */}
      {activeRestTimer && (
        <LinearGradient
          colors={theme.colors.gradientPrimary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.restTimerBanner}
        >
          <Text style={styles.restTimerText}>
            Riposo: {formatTime(activeRestTimer.secondsLeft)}
          </Text>
          <TouchableOpacity onPress={skipRestTimer} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>×</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((exercise, exerciseIndex) => {
            const completedSets = exercise.sets.filter(s => s.completed).length;
            const totalSets = exercise.sets.length;
            const activeSetIndex = exercise.sets.findIndex(s => !s.completed);

            return (
            <View key={exercise.exerciseId} style={styles.exerciseCard}>
              {/* CARD HEADER */}
              <TouchableOpacity
                style={styles.exerciseCardHeader}
                onPress={() => toggleExerciseExpand(exerciseIndex)}
                activeOpacity={0.7}
              >
                <Text style={styles.chevronIcon}>
                  {exercise.isExpanded ? '▼' : '▶'}
                </Text>
                <View style={styles.exerciseHeaderContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {!exercise.isExpanded && (
                    <Text style={styles.exerciseProgress}>
                      {completedSets}/{totalSets} set completati
                    </Text>
                  )}
                </View>
                <Text style={styles.exerciseIcon}>🏋️</Text>
              </TouchableOpacity>

              {/* CARD CONTENT (EXPANDED) */}
              {exercise.isExpanded && (
                <Animated.View style={styles.exerciseCardContent}>

              <View style={styles.tableHeader}>
                <View style={styles.setColumn}>
                  <Text style={styles.headerText}>SET</Text>
                </View>

                <View style={styles.targetColumn}>
                  <Text style={styles.headerText}>TARGET</Text>
                  <View style={styles.targetSubColumns}>
                    <Text style={styles.subHeaderText}>REPS</Text>
                    <Text style={styles.subHeaderText}>KG</Text>
                  </View>
                </View>

                <View style={styles.completedColumn}>
                  <Text style={styles.headerText}>COMPLETATO</Text>
                  <View style={styles.completedSubColumns}>
                    <Text style={styles.subHeaderText}>REPS</Text>
                    <Text style={styles.subHeaderText}>KG</Text>
                  </View>
                </View>

                <View style={styles.checkboxColumn}>
                  <Text style={styles.headerText}> </Text>
                </View>
              </View>

              {exercise.sets.map((set, setIndex) => {
                const isActiveSet = setIndex === activeSetIndex;
                const isCompleted = set.completed;

                return (
                  <View
                    key={setIndex}
                    style={[
                      styles.setRow,
                      isActiveSet && styles.activeSetRow,
                      isCompleted && styles.completedSetRow,
                    ]}
                  >
                    {/* Active Set Indicator */}
                    {isActiveSet && <View style={styles.activeSetIndicator} />}

                    {/* Set Number */}
                    <View style={styles.setColumn}>
                      <Text style={styles.setNumber}>{set.setNumber}</Text>
                    </View>

                    {/* Target */}
                    <View style={styles.targetColumn}>
                      <View style={styles.targetValues}>
                        <Text style={styles.targetText}>{set.targetReps}</Text>
                        <Text style={styles.targetText}>{set.targetWeight}kg</Text>
                      </View>
                    </View>

                    {/* Completed Inputs */}
                    <View style={styles.completedColumn}>
                      <View style={styles.completedInputs}>
                        <TextInput
                          style={[
                            styles.setInput,
                            isCompleted && styles.setInputCompleted,
                          ]}
                          placeholder=""
                          placeholderTextColor={theme.colors.textLight}
                          keyboardType="numeric"
                          value={set.actualReps?.toString() || ''}
                          onChangeText={(value) =>
                            handleInputChange(exerciseIndex, setIndex, 'actualReps', value)
                          }
                          editable={!isCompleted}
                        />

                        <TextInput
                          style={[
                            styles.setInput,
                            isCompleted && styles.setInputCompleted,
                          ]}
                          placeholder=""
                          placeholderTextColor={theme.colors.textLight}
                          keyboardType="decimal-pad"
                          value={set.actualWeight?.toString() || ''}
                          onChangeText={(value) =>
                            handleInputChange(exerciseIndex, setIndex, 'actualWeight', value)
                          }
                          editable={!isCompleted}
                        />
                      </View>
                    </View>

                    {/* Checkbox */}
                    <View style={styles.checkboxColumn}>
                      <TouchableOpacity
                        style={[
                          styles.setCheckbox,
                          isCompleted && styles.setCheckboxCompleted,
                        ]}
                        onPress={() => handleSetComplete(exerciseIndex, setIndex)}
                      >
                        <Text style={[
                          styles.checkmark,
                          !isCompleted && styles.checkmarkUncompleted
                        ]}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.notesToggle}
                onPress={() => toggleExerciseNotes(exerciseIndex)}
              >
                <Text style={styles.notesToggleText}>💬 Note (opzionale)</Text>
                <Text style={styles.notesToggleIcon}>
                  {exercise.notesExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {exercise.notesExpanded && (
                <TextInput
                  style={styles.notesInput}
                  placeholder="Aggiungi note su questo esercizio..."
                  placeholderTextColor={theme.colors.textLight}
                  multiline
                  numberOfLines={3}
                  value={exercise.notes}
                  onChangeText={(text) => updateExerciseNotes(exerciseIndex, text)}
                />
              )}

              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addSet(exerciseIndex)}
              >
                <Text style={styles.addSetButtonText}>+ Aggiungi Set</Text>
              </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          );
          })}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTTOM CONTROLS - ALWAYS SIDE BY SIDE */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomButtonsContainer}>
          {/* LEFT SIDE: Session Timer or Start Button */}
          <View style={styles.leftBottomButton}>
            {sessionStatus === 'not_started' ? (
              <TouchableOpacity onPress={startSessionTimer}>
                <LinearGradient
                  colors={theme.colors.gradientPrimary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startSessionButton}
                >
                  <Text style={styles.startSessionButtonText}>Inizia Sessione</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.sessionElapsedTime}>{formatTime(elapsedSeconds)}</Text>
                <View style={styles.timerControls}>
                  <TouchableOpacity
                    style={styles.pauseResumeButton}
                    onPress={sessionStatus === 'in_progress' ? pauseSessionTimer : resumeSessionTimer}
                  >
                    <Text style={styles.pauseResumeButtonText}>
                      {sessionStatus === 'in_progress' ? 'Pausa' : 'Riprendi'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.buttonDivider}>|</Text>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelSessionTimer}
                  >
                    <Text style={styles.cancelButtonText}>Annulla</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* RIGHT SIDE: Complete Button */}
          <TouchableOpacity onPress={handleCompleteWorkout} style={styles.completeWorkoutButton}>
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeWorkoutGradient}
            >
              <Text style={styles.completeWorkoutButtonText}>
                Completa{'\n'}Allenamento
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.completionModal}>
              <ScrollView>
                <Text style={styles.completionTitle}>SESSIONE COMPLETATA! 🎉</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={styles.statIcon}>⏱️</Text>
                    <Text style={styles.statLabel}>Durata:</Text>
                    <Text style={styles.statValue}>{Math.floor(elapsedSeconds / 60)} min</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statIcon}>🔥</Text>
                    <Text style={styles.statLabel}>Calorie bruciate:</Text>
                    <Text style={styles.statValue}>{stats.caloriesBurned} kcal</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statIcon}>💪</Text>
                    <Text style={styles.statLabel}>Peso totale sollevato:</Text>
                    <Text style={styles.statValue}>{stats.totalWeightLifted.toLocaleString()} kg</Text>
                  </View>
                </View>

                <Text style={styles.ratingLabel}>⭐ Come è andata la sessione?</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        setRating(star);
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                          Vibration.vibrate(30);
                        }
                      }}
                      style={styles.starButton}
                    >
                      <Text style={[styles.star, rating >= star && styles.starFilled]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.notesLabel}>💬 Note sessione (opzionale)</Text>
                <TextInput
                  style={styles.completionNotesInput}
                  placeholder="Bella giornata, molta energia..."
                  placeholderTextColor={theme.colors.textLight}
                  multiline
                  numberOfLines={4}
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveAndFinish}
                  disabled={isCompletingSession}
                >
                  {isCompletingSession ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Salva e Chiudi</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowCompletionModal(false)}
                  disabled={isCompletingSession}
                >
                  <Text style={styles.modalCancelButtonText}>Annulla</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* INFO EXERCISE MODAL */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModal}>
            <Text style={styles.infoModalTitle}>{selectedExerciseInfo?.name || 'Esercizio'}</Text>
            <ScrollView style={styles.infoModalContent}>
              <Text style={styles.infoModalText}>
                {selectedExerciseInfo
                  ? `Questo esercizio prevede ${selectedExerciseInfo.sets.length} set da ${selectedExerciseInfo.sets[0]?.targetReps} ripetizioni con ${selectedExerciseInfo.sets[0]?.targetWeight}kg di carico.\n\nRiposo tra i set: ${selectedExerciseInfo.restSeconds} secondi.`
                  : 'Nessuna informazione disponibile per questo esercizio.'}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.infoModalButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT SESSION MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={cancelEditSession}
      >
        <SafeAreaView style={styles.editModalContainer} edges={['top', 'bottom']}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={cancelEditSession} style={styles.editModalCancelButton}>
              <Text style={styles.editModalCancelText}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Modifica Sessione</Text>
            <TouchableOpacity onPress={saveEditedSession} style={styles.editModalSaveHeaderButton}>
              <Text style={styles.editModalSaveHeaderText}>Salva</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalContent} keyboardShouldPersistTaps="handled">
            {editingExercises.map((exercise, exerciseIndex) => (
              <View key={exercise.exerciseId} style={styles.editExerciseCard}>
                {/* Header esercizio con reorder e delete */}
                <View style={styles.editExerciseHeader}>
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      onPress={() => moveExerciseUp(exerciseIndex)}
                      disabled={exerciseIndex === 0}
                      style={[styles.reorderButton, exerciseIndex === 0 && styles.reorderButtonDisabled]}
                    >
                      <Text style={styles.reorderButtonText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveExerciseDown(exerciseIndex)}
                      disabled={exerciseIndex === editingExercises.length - 1}
                      style={[styles.reorderButton, exerciseIndex === editingExercises.length - 1 && styles.reorderButtonDisabled]}
                    >
                      <Text style={styles.reorderButtonText}>↓</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeExercise(exerciseIndex)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Nome esercizio editabile */}
                <View style={styles.editInputGroup}>
                  <Text style={styles.editInputLabel}>Nome Esercizio</Text>
                  <TextInput
                    style={styles.editInput}
                    value={exercise.name}
                    onChangeText={(text) => updateExerciseName(exerciseIndex, text)}
                    placeholder="Nome esercizio"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Lista sets editabili */}
                <View style={styles.editSetsSection}>
                  <Text style={styles.editSectionTitle}>Sets</Text>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.editSetRow}>
                      <Text style={styles.editSetNumber}>{set.setNumber}</Text>

                      <View style={styles.editSetInputs}>
                        <View style={styles.editSetInputGroup}>
                          <Text style={styles.editSetInputLabel}>Reps</Text>
                          <TextInput
                            style={styles.editSetInput}
                            value={set.targetReps}
                            onChangeText={(text) => updateSetTargetReps(exerciseIndex, setIndex, text)}
                            keyboardType="numeric"
                            placeholder="0"
                          />
                        </View>

                        <View style={styles.editSetInputGroup}>
                          <Text style={styles.editSetInputLabel}>Kg</Text>
                          <TextInput
                            style={styles.editSetInput}
                            value={set.targetWeight.toString()}
                            onChangeText={(text) => updateSetTargetWeight(exerciseIndex, setIndex, text)}
                            keyboardType="decimal-pad"
                            placeholder="0"
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => removeSetFromExercise(exerciseIndex, setIndex)}
                        style={styles.removeSetButton}
                      >
                        <Text style={styles.removeSetButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSetButtonEdit}
                    onPress={() => addSetToExercise(exerciseIndex)}
                  >
                    <Text style={styles.addSetButtonTextEdit}>+ Aggiungi Set</Text>
                  </TouchableOpacity>
                </View>

                {/* Rest Time */}
                <View style={styles.editInputGroup}>
                  <Text style={styles.editInputLabel}>Riposo (secondi)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={exercise.restSeconds.toString()}
                    onChangeText={(text) => updateExerciseRestSeconds(exerciseIndex, text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                {/* Note esercizio */}
                <View style={styles.editInputGroup}>
                  <Text style={styles.editInputLabel}>Note (opzionale)</Text>
                  <TextInput
                    style={[styles.editInput, styles.editNotesInput]}
                    value={exercise.notes}
                    onChangeText={(text) => updateExerciseNotes(exerciseIndex, text)}
                    placeholder="Aggiungi note..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.editModalFooter}>
            <TouchableOpacity
              style={styles.editModalSaveButton}
              onPress={saveEditedSession}
            >
              <Text style={styles.editModalSaveButtonText}>Salva Modifiche</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  // REST TIMER BANNER
  restTimerBanner: {
    height: 50,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restTimerText: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
    flex: 1,
  },
  skipButton: {
    padding: theme.spacing.sm,
  },
  skipButtonText: {
    fontSize: 32,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  // EXERCISE CARD - ATHLETIC/BOXY STYLE
  exerciseCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 50,
  },
  chevronIcon: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  exerciseHeaderContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  exerciseProgress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  exerciseIcon: {
    fontSize: 22,
  },
  exerciseCardContent: {
    padding: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  infoButton: {
    padding: theme.spacing.xs,
  },
  infoIcon: {
    fontSize: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  setColumn: {
    width: 40,
    alignItems: 'center',
  },
  targetColumn: {
    flex: 1,
    alignItems: 'center',
  },
  completedColumn: {
    flex: 1,
    alignItems: 'center',
  },
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  targetSubColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 8,
    gap: 8,
  },
  completedSubColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 8,
    gap: 8,
  },
  subHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    width: 40,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    position: 'relative',
  },
  activeSetRow: {
    backgroundColor: theme.colors.backgroundTertiary,
  },
  completedSetRow: {
    opacity: 0.7,
  },
  activeSetIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  targetValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
    gap: 8,
  },
  targetText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  completedInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    gap: theme.spacing.sm,
  },
  setInput: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    backgroundColor: theme.colors.white,
    color: theme.colors.text,
  },
  setInputCompleted: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  setCheckbox: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  setCheckboxCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
  },
  checkmarkUncompleted: {
    color: '#D0D0D0',
  },
  notesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notesToggleText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  notesToggleIcon: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  addSetButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  // BOTTOM CONTROLS
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    gap: 1,
    height: 80,
  },
  leftBottomButton: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
    paddingVertical: theme.spacing.sm,
  },
  startSessionButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startSessionButtonText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  sessionElapsedTime: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pauseResumeButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  pauseResumeButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  buttonDivider: {
    fontSize: 14,
    color: theme.colors.borderDark,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.error,
  },
  completeWorkoutButton: {
    flex: 1,
  },
  completeWorkoutGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeWorkoutButtonText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  statIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  star: {
    fontSize: 40,
    color: theme.colors.border,
  },
  starFilled: {
    color: theme.colors.gold,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  completionNotesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  modalCancelButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  // Info Modal
  infoModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.spacing.lg,
    width: '85%',
    maxHeight: '60%',
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  infoModalContent: {
    maxHeight: 300,
  },
  infoModalText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  infoModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  infoModalButtonText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },

  // Edit Modal
  editModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  editModalHeader: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  editModalClose: {
    fontSize: 28,
    color: theme.colors.textSecondary,
  },
  editModalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  editExerciseCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  editExerciseReorder: {
    flexDirection: 'column',
    marginRight: theme.spacing.sm,
  },
  reorderButton: {
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  reorderButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  reorderButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
  },
  editExerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  deleteButtonText: {
    fontSize: 24,
  },
  editExerciseInfo: {
    marginTop: theme.spacing.xs,
  },
  editExerciseInfoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginVertical: 2,
  },
  editModalFooter: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  editModalSaveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  editModalSaveButtonText: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },

  // New Edit Modal Styles
  editModalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editModalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: theme.fontWeight.semibold,
  },
  editModalSaveHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editModalSaveHeaderText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: theme.fontWeight.bold,
  },
  dragHandle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dragHandleText: {
    fontSize: 20,
    color: '#999',
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
    gap: 4,
  },
  editInputGroup: {
    marginBottom: 12,
  },
  editInputLabel: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  editSetsSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  editSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editSetNumber: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    width: 30,
  },
  editSetInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  editSetInputGroup: {
    flex: 1,
  },
  editSetInputLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  editSetInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: 'center',
    backgroundColor: theme.colors.white,
  },
  removeSetButton: {
    marginLeft: 8,
    padding: 6,
  },
  removeSetButtonText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: theme.fontWeight.bold,
  },
  addSetButtonEdit: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetButtonTextEdit: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  editNotesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default SessionScreen;
