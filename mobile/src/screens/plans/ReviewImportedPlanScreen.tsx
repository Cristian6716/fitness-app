import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import apiService from '../../services/api.service';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';

// Components
import PlanPreviewCard from '../../components/plans/PlanPreviewCard';
import SessionAccordionItem from '../../components/plans/SessionAccordionItem';
import SessionEditView from '../../components/plans/SessionEditView';
import PlanInfoEditView from '../../components/plans/PlanInfoEditView';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewImportedPlan'>;

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
  notes?: string;
}

interface Session {
  name: string;
  dayNumber: number;
  exercises: Exercise[];
}

interface PlanData {
  name: string;
  durationWeeks?: number;
  frequency?: number;
  sessions: Session[];
}

type ViewMode = 'preview' | 'edit-session' | 'edit-plan-info';

const ReviewImportedPlanScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { parsedData, warnings } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [mode, setMode] = useState<ViewMode>('preview');
  const [navigationStack, setNavigationStack] = useState<ViewMode[]>(['preview']);
  const [planData, setPlanData] = useState<PlanData>(parsedData);
  const [originalPlanData, setOriginalPlanData] = useState<PlanData>(parsedData);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());
  const [editingSessionIndex, setEditingSessionIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Session expansion (preview mode only)
  const toggleSessionExpansion = (index: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSessions(newExpanded);
  };

  // Show abandon dialog
  const showAbandonDialog = (onAbandon: () => void) => {
    Alert.alert(
      'Abbandona Modifiche?',
      'Hai modifiche non salvate. Se esci ora, tutte le modifiche andranno perse.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Abbandona',
          style: 'destructive',
          onPress: onAbandon,
        },
      ]
    );
  };

  // Handle back navigation
  const handleBack = () => {
    if (navigationStack.length > 1) {
      // C'è uno stato precedente nello stack
      if (hasUnsavedChanges) {
        // Mostra dialog conferma
        showAbandonDialog(() => {
          // Scarta modifiche e torna indietro
          setPlanData(originalPlanData);
          setHasUnsavedChanges(false);

          // Pop dallo stack
          const newStack = [...navigationStack];
          newStack.pop();
          setNavigationStack(newStack);

          const previousMode = newStack[newStack.length - 1];
          setMode(previousMode);

          if (previousMode === 'preview') {
            setEditingSessionIndex(null);
            setExpandedSessions(new Set());
          }
        });
      } else {
        // Nessuna modifica, torna indietro direttamente
        const newStack = [...navigationStack];
        newStack.pop();
        setNavigationStack(newStack);

        const previousMode = newStack[newStack.length - 1];
        setMode(previousMode);

        if (previousMode === 'preview') {
          setEditingSessionIndex(null);
          setExpandedSessions(new Set());
        }
      }
    } else {
      // Siamo in preview, possiamo uscire completamente
      navigation.goBack();
    }
  };

  // Enter edit modes (push to stack)
  const enterEditSession = (sessionIndex: number) => {
    setOriginalPlanData({ ...planData }); // Backup current state
    setEditingSessionIndex(sessionIndex);
    setNavigationStack([...navigationStack, 'edit-session']);
    setMode('edit-session');
    setHasUnsavedChanges(false);
  };

  const enterEditPlanInfo = () => {
    setOriginalPlanData({ ...planData }); // Backup current state
    setNavigationStack([...navigationStack, 'edit-plan-info']);
    setMode('edit-plan-info');
    setHasUnsavedChanges(false);
  };

  // Exit edit mode (used internally by other functions)
  const exitEditMode = (save: boolean) => {
    if (!save) {
      // Restore original data
      setPlanData(originalPlanData);
    }

    // Pop from stack
    const newStack = [...navigationStack];
    newStack.pop();
    setNavigationStack(newStack);

    setMode('preview');
    setEditingSessionIndex(null);
    setHasUnsavedChanges(false);
    setExpandedSessions(new Set()); // Collapse all
  };

  // Update operations (mark as unsaved)
  const updatePlanField = (field: keyof PlanData, value: any) => {
    setPlanData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const updateSessionField = (sessionIndex: number, field: keyof Session, value: any) => {
    const newSessions = [...planData.sessions];
    newSessions[sessionIndex] = { ...newSessions[sessionIndex], [field]: value };
    setPlanData((prev) => ({ ...prev, sessions: newSessions }));
    setHasUnsavedChanges(true);
  };

  const updateExerciseField = (
    sessionIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: any
  ) => {
    const newSessions = [...planData.sessions];
    const newExercises = [...newSessions[sessionIndex].exercises];
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], [field]: value };
    newSessions[sessionIndex] = { ...newSessions[sessionIndex], exercises: newExercises };
    setPlanData((prev) => ({ ...prev, sessions: newSessions }));
    setHasUnsavedChanges(true);
  };

  // Android back button handler
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBack();
          return true; // Prevent default behavior
        }
      );

      return () => backHandler.remove();
    }, [mode, hasUnsavedChanges, navigationStack, planData, originalPlanData])
  );

  // CRUD operations
  const deleteSession = (sessionIndex: number) => {
    const newSessions = planData.sessions.filter((_, idx) => idx !== sessionIndex);
    setPlanData((prev) => ({ ...prev, sessions: newSessions }));
    setHasUnsavedChanges(true);

    // Exit edit mode and return to preview
    exitEditMode(true);
  };

  const deleteExercise = (sessionIndex: number, exerciseIndex: number) => {
    const newSessions = [...planData.sessions];
    const newExercises = newSessions[sessionIndex].exercises.filter(
      (_, idx) => idx !== exerciseIndex
    );
    newSessions[sessionIndex] = { ...newSessions[sessionIndex], exercises: newExercises };
    setPlanData((prev) => ({ ...prev, sessions: newSessions }));
    setHasUnsavedChanges(true);
  };

  const addExercise = (sessionIndex: number) => {
    const newSessions = [...planData.sessions];
    newSessions[sessionIndex].exercises.push({
      name: 'Nuovo Esercizio',
      sets: 3,
      reps: '10',
      restSeconds: 90,
    });
    setPlanData((prev) => ({ ...prev, sessions: newSessions }));
    setHasUnsavedChanges(true);
  };

  // Save current edit (partial save)
  const saveCurrentEdit = async () => {
    // TODO: Call API to save draft
    // await apiService.savePlanDraft(planData);

    console.log('💾 Saving current edit...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update backup to current state (modifiche ora sono salvate)
    setOriginalPlanData({ ...planData });
    setHasUnsavedChanges(false);

    Alert.alert('Salvato', 'Modifiche salvate correttamente');
  };

  // Finish editing and return to preview (only if no unsaved changes)
  const finishEditing = () => {
    if (hasUnsavedChanges) {
      // Should not happen, but safety check
      Alert.alert(
        'Modifiche non salvate',
        'Salva le modifiche prima di uscire dalla modalità modifica.'
      );
      return;
    }
    exitEditMode(true);
  };

  // Validation
  const validatePlan = (): string[] => {
    const errors: string[] = [];

    if (!planData.name || planData.name.trim().length === 0) {
      errors.push('Il nome del piano è obbligatorio');
    }

    if (planData.sessions.length === 0) {
      errors.push('Il piano deve avere almeno una sessione');
    }

    planData.sessions.forEach((session, idx) => {
      if (!session.name || session.name.trim().length === 0) {
        errors.push(`La sessione ${idx + 1} deve avere un nome`);
      }

      if (session.exercises.length === 0) {
        errors.push(`La sessione "${session.name}" deve avere almeno un esercizio`);
      }

      session.exercises.forEach((exercise, exIdx) => {
        if (!exercise.name || exercise.name.trim().length === 0) {
          errors.push(`Esercizio ${exIdx + 1} nella sessione "${session.name}" deve avere un nome`);
        }
        if (!exercise.sets || exercise.sets <= 0) {
          errors.push(
            `L'esercizio "${exercise.name}" nella sessione "${session.name}" deve avere serie > 0`
          );
        }
      });
    });

    return errors;
  };

  // Final confirmation and save (activate plan)
  const confirmAndSavePlan = async () => {
    const errors = validatePlan();

    if (errors.length > 0) {
      Alert.alert('Errori di Validazione', errors.join('\n\n'));
      return;
    }

    Alert.alert(
      'Conferma Piano',
      'Salvare e attivare questo piano? Gli altri piani attivi verranno archiviati.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma e Salva',
          onPress: async () => {
            setIsSaving(true);

            try {
              console.log('💾 Saving and activating plan...');
              const savedPlan = await apiService.confirmWorkoutPlan(planData);
              console.log('✅ Plan saved and activated:', savedPlan.id);

              Alert.alert('Successo', 'Piano salvato e attivato con successo!', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  },
                },
              ]);
            } catch (error: any) {
              console.error('❌ Error saving plan:', error);
              Alert.alert(
                'Errore',
                error.response?.data?.error || 'Impossibile salvare il piano. Riprova.'
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Annulla Importazione', 'Scartare il piano e tornare indietro?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sì, Annulla',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // Render different views based on mode
  const renderContent = () => {
    if (mode === 'edit-session' && editingSessionIndex !== null) {
      const session = planData.sessions[editingSessionIndex];
      return (
        <SessionEditView
          sessionNumber={editingSessionIndex + 1}
          name={session.name}
          exercises={session.exercises}
          hasUnsavedChanges={hasUnsavedChanges}
          onNameChange={(value) => updateSessionField(editingSessionIndex, 'name', value)}
          onExerciseUpdate={(exIdx, field, value) =>
            updateExerciseField(editingSessionIndex, exIdx, field, value)
          }
          onExerciseDelete={(exIdx) => deleteExercise(editingSessionIndex, exIdx)}
          onAddExercise={() => addExercise(editingSessionIndex)}
          onSessionDelete={() => deleteSession(editingSessionIndex)}
          onSave={saveCurrentEdit}
          onFinish={finishEditing}
          onCancel={() => exitEditMode(false)}
        />
      );
    }

    if (mode === 'edit-plan-info') {
      return (
        <PlanInfoEditView
          name={planData.name}
          frequency={planData.frequency || planData.sessions.length}
          durationWeeks={planData.durationWeeks}
          hasUnsavedChanges={hasUnsavedChanges}
          onNameChange={(value) => updatePlanField('name', value)}
          onFrequencyChange={(value) => updatePlanField('frequency', value)}
          onDurationChange={(value) => updatePlanField('durationWeeks', value)}
          onSave={saveCurrentEdit}
          onFinish={finishEditing}
          onCancel={() => exitEditMode(false)}
        />
      );
    }

    // Preview mode
    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <View style={styles.warningsCard}>
            <Text style={styles.warningsTitle}>⚠️ Attenzione</Text>
            {warnings.map((warning, idx) => (
              <Text key={idx} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        {/* Plan Info Card */}
        <PlanPreviewCard
          name={planData.name}
          frequency={planData.frequency || planData.sessions.length}
          durationWeeks={planData.durationWeeks}
          isEditMode={false}
        />

        {/* Sessions Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sessioni ({planData.sessions.length})</Text>
        </View>

        {/* Sessions List - Collapsible Accordions */}
        {planData.sessions.map((session, index) => (
          <SessionAccordionItem
            key={index}
            sessionNumber={index + 1}
            name={session.name}
            exercises={session.exercises}
            isExpanded={expandedSessions.has(index)}
            onToggle={() => toggleSessionExpansion(index)}
            onEdit={() => enterEditSession(index)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Render header based on mode
  const renderHeader = () => {
    let title = 'Anteprima Piano';
    let rightButtonText = '✏️ Modifica Piano';
    let rightButtonAction = enterEditPlanInfo;

    if (mode === 'edit-session') {
      title = 'Modifica Sessione';
      rightButtonText = '';
      rightButtonAction = () => { };
    } else if (mode === 'edit-plan-info') {
      title = 'Modifica Info Piano';
      rightButtonText = '';
      rightButtonAction = () => { };
    }

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerButtonText}>← Indietro</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{title}</Text>

        {rightButtonText ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={rightButtonAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonTextPrimary}>{rightButtonText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>
    );
  };

  // Render footer only in preview mode
  const renderFooter = () => {
    if (mode !== 'preview') return null;

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Annulla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isSaving && styles.confirmButtonDisabled]}
          onPress={confirmAndSavePlan}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Conferma e Salva Piano</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderHeader()}
        {renderContent()}
        {renderFooter()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerButton: {
    padding: theme.spacing.sm,
    minWidth: 80,
  },
  headerButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  headerButtonTextPrimary: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  warningsCard: {
    backgroundColor: '#FFF9E6',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  warningsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#CC8800',
    marginBottom: 8,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#AA7700',
    marginBottom: 4,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
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
  confirmButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});

export default ReviewImportedPlanScreen;
