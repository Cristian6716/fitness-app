import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { MainTabParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { WorkoutPlan } from '../../types/api.types';
import apiService from '../../services/api.service';
import { theme } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomHeader } from '../../components/CustomHeader';

type PlansScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Plans'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type PlansScreenProps = {
  navigation: PlansScreenNavigationProp;
};

const PlansScreen: React.FC<PlansScreenProps> = ({ navigation }) => {
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [archivedPlans, setArchivedPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showArchived, setShowArchived] = useState(true);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadPlans(false);
    }, [])
  );

  const loadPlans = async (silent = false) => {
    try {
      // Solo mostra il loading completo al primo caricamento
      if (!silent && !activeWorkoutPlan && archivedPlans.length === 0) {
        setIsLoading(true);
      } else if (!silent) {
        setIsRefreshing(true);
      }
      console.log('📊 === LOADING PLANS START ===');
      const data = await apiService.getWorkouts();

      console.log('📊 Total plans fetched:', data.length);

      // Debug all plans
      data.forEach((plan, idx) => {
        console.log(`📊 Plan ${idx + 1}:`, {
          id: plan.id,
          name: plan.name,
          status: plan.status || 'undefined',
          frequency: plan.frequency,
          aiGenerated: plan.aiGenerated,
          createdAt: plan.createdAt,
        });
      });

      // Separate active from archived (treat undefined status as 'active' for retrocompatibility)
      const active = data.find((p) => !p.status || p.status === 'active') || null;
      const archived = data.filter((p) =>
        p.status === 'archived' ||
        p.status === 'completed' ||
        p.status === 'inactive'
      );

      console.log('📊 Active plan:', active ? `${active.name} (${active.id})` : 'None');
      console.log('📊 Archived plans:', archived.length);
      archived.forEach((p, idx) => {
        console.log(`📊   Archived ${idx + 1}: ${p.name} (${p.id})`);
      });
      console.log('📊 === LOADING PLANS END ===');

      setActiveWorkoutPlan(active);
      setArchivedPlans(archived);
    } catch (error) {
      console.error('📊 Error loading plans:', error);
      // Non mostrare l'alert se stiamo facendo un refresh silenzioso
      if (!silent) {
        Alert.alert('Errore', 'Impossibile caricare i piani di allenamento');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddButtonPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', '🤖 Genera con AI', '📄 Importa Piano'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            navigation.navigate('PersonalInfo');
          } else if (buttonIndex === 2) {
            handleImportPlan();
          }
        }
      );
    } else {
      setShowActionMenu(true);
    }
  };

  const handleImportPlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Errore', 'File troppo grande. Massimo 10MB.');
        return;
      }

      setIsUploading(true);
      setUploadProgress('Caricamento e analisi file...');

      try {
        const result = await apiService.uploadWorkoutPlan(file);
        setUploadProgress('Analisi completata!');

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress('');

          if (!result || !result.parsedData) {
            Alert.alert('Errore', 'Impossibile analizzare il file.');
            return;
          }

          // Navigate to review screen
          navigation.navigate('ReviewImportedPlan', {
            parsedData: result.parsedData,
            warnings: result.warnings,
          });
        }, 300);
      } catch (error: any) {
        setIsUploading(false);
        setUploadProgress('');
        Alert.alert('Errore', error.response?.data?.error || error.message || 'Errore caricamento');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aprire il selettore di file.');
    }
  };

  const showPlanActions = (plan: WorkoutPlan, isActive: boolean) => {
    const options = isActive
      ? ['Annulla', 'Vedi Piano', 'Archivia', 'Elimina']
      : ['Annulla', 'Rivedi Piano', 'Riattiva', 'Elimina'];

    const destructiveIndex = options.indexOf('Elimina');
    const cancelIndex = 0;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: cancelIndex,
        },
        (buttonIndex) => {
          if (options[buttonIndex] === 'Vedi Piano' || options[buttonIndex] === 'Rivedi Piano') {
            navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name });
          } else if (options[buttonIndex] === 'Archivia') {
            handleArchivePlan(plan.id);
          } else if (options[buttonIndex] === 'Riattiva') {
            handleReactivatePlan(plan.id);
          } else if (options[buttonIndex] === 'Elimina') {
            handleDeletePlan(plan.id);
          }
        }
      );
    } else {
      // Android: show custom modal with same options
      Alert.alert(
        'Azioni Piano',
        'Cosa vuoi fare?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: isActive ? 'Vedi Piano' : 'Rivedi Piano',
            onPress: () => navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name }),
          },
          {
            text: isActive ? 'Archivia' : 'Riattiva',
            onPress: () => (isActive ? handleArchivePlan(plan.id) : handleReactivatePlan(plan.id)),
          },
          { text: 'Elimina', onPress: () => handleDeletePlan(plan.id), style: 'destructive' },
        ]
      );
    }
  };

  const handleArchivePlan = async (planId: string) => {
    Alert.alert('Archivia Piano', 'Vuoi archiviare questo piano?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Archivia',
        onPress: async () => {
          try {
            await apiService.updateWorkoutStatus(planId, 'archived');
            Alert.alert('Successo', 'Piano archiviato');
            loadPlans();
          } catch (error) {
            Alert.alert('Errore', 'Impossibile archiviare il piano');
          }
        },
      },
    ]);
  };

  const handleReactivatePlan = async (planId: string) => {
    const message = activeWorkoutPlan
      ? 'Il piano attuale verrà archiviato. Continuare?'
      : 'Vuoi riattivare questo piano?';

    Alert.alert('Riattiva Piano', message, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Riattiva',
        onPress: async () => {
          try {
            console.log('🔄 Reactivating plan:', planId);
            console.log('🔄 Current active plan:', activeWorkoutPlan?.id);

            // Archive current active plan if exists
            if (activeWorkoutPlan) {
              console.log('🔄 Archiving current active plan...');
              await apiService.updateWorkoutStatus(activeWorkoutPlan.id, 'archived');
            }

            // Activate selected plan
            console.log('🔄 Activating selected plan...');
            await apiService.updateWorkoutStatus(planId, 'active');
            console.log('🔄 Plan reactivated successfully');
            Alert.alert('Successo', 'Piano riattivato');
            loadPlans();
          } catch (error: any) {
            console.error('🔄 Reactivate error:', error.message);
            console.error('🔄 Error response:', error.response?.data);
            Alert.alert('Errore', `Impossibile riattivare: ${error.response?.data?.error || error.message}`);
          }
        },
      },
    ]);
  };

  const handleDeletePlan = (planId: string) => {
    Alert.alert(
      'Elimina Piano',
      'Sei sicuro? Perderai tutti i dati e progressi di questo piano.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteWorkout(planId);
              Alert.alert('Successo', 'Piano eliminato');
              loadPlans();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il piano');
            }
          },
        },
      ]
    );
  };

  const calculateProgress = (plan: WorkoutPlan): number => {
    if (!plan.totalSessions || plan.totalSessions === 0) return 0;
    const completed = plan.completedSessions || 0;
    return Math.round((completed / plan.totalSessions) * 100);
  };

  const getTimeSinceLastSession = (lastSessionDate?: string): string => {
    if (!lastSessionDate) return 'Mai';
    const now = new Date();
    const lastDate = new Date(lastSessionDate);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return '1 giorno fa';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return `${Math.floor(diffDays / 30)} mesi fa`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFrequencyText = (frequency?: number): string => {
    if (!frequency) return 'Frequenza da definire';
    return `${frequency}x/settimana`;
  };

  const renderActivePlanCard = (plan: WorkoutPlan) => {
    const progress = calculateProgress(plan);
    const currentWeek = Math.ceil((plan.completedSessions || 0) / (plan.frequency || 4));

    return (
      <View style={styles.section} key={plan.id}>
        <Text style={styles.sectionTitle}>Piano Attivo</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name })}
          onLongPress={() => showPlanActions(plan, true)}
        >
          <LinearGradient
            colors={theme.colors.gradientCard as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeCard}
          >
            <Text style={styles.activeCardName}>{plan.name.toUpperCase()}</Text>

            <View style={styles.activeCardInfo}>
              <Text style={styles.activeCardInfoText}>
                📅 {plan.durationWeeks} settimane • {getFrequencyText(plan.frequency)}
              </Text>
              {plan.splitType && <Text style={styles.activeCardInfoText}>🎯 {plan.splitType}</Text>}
              {plan.aiGenerated && <Text style={styles.activeCardInfoText}>⚡ Generato AI</Text>}
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
            <Text style={styles.progressWeekText}>
              Settimana {currentWeek}/{plan.durationWeeks}
            </Text>

            <TouchableOpacity
              style={styles.activePlanButton}
              onPress={() => navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name })}
            >
              <Text style={styles.activePlanButtonText}>Continua Allenamento ▶</Text>
            </TouchableOpacity>

            <Text style={styles.lastSessionText}>
              Ultima sessione: {getTimeSinceLastSession(plan.lastSessionDate)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleArchivePlan(plan.id)}
          >
            <Text style={styles.quickActionText}>📥 Archivia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionDanger]}
            onPress={() => handleDeletePlan(plan.id)}
          >
            <Text style={[styles.quickActionText, styles.quickActionDangerText]}>🗑️ Elimina</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderArchivedSection = () => {
    if (archivedPlans.length === 0) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowArchived(!showArchived)}
        >
          <Text style={styles.sectionTitle}>Piani Archiviati ({archivedPlans.length})</Text>
          <Text style={styles.sectionToggle}>{showArchived ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showArchived &&
          archivedPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.archivedCard}
              onPress={() => navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name })}
              onLongPress={() => showPlanActions(plan, false)}
            >
              <Text style={styles.archivedCardName}>📦 {plan.name}</Text>
              <Text style={styles.archivedCardDate}>
                Archiviato il {formatDate(plan.completedDate || plan.createdAt)}
              </Text>
              <Text style={styles.archivedCardInfo}>
                {plan.durationWeeks} settimane • {getFrequencyText(plan.frequency)}
              </Text>

              <View style={styles.archivedActions}>
                <TouchableOpacity
                  style={styles.archivedButton}
                  onPress={() => navigation.navigate('PlanDetails', { planId: plan.id, planName: plan.name })}
                >
                  <Text style={styles.archivedButtonText}>Rivedi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.archivedButton}
                  onPress={() => handleReactivatePlan(plan.id)}
                >
                  <Text style={styles.archivedButtonText}>Riattiva</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}>
                  <Text style={styles.archivedDeleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!activeWorkoutPlan && archivedPlans.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CustomHeader title="I Tuoi Piani" />

        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateEmoji}>💪</Text>
          <Text style={styles.emptyStateTitle}>Nessun piano di allenamento</Text>
          <Text style={styles.emptyStateSubtitle}>
            Genera un piano personalizzato con l'AI o importa il tuo
          </Text>

          <View style={styles.emptyStateButtons}>
            <TouchableOpacity
              style={styles.emptyStatePrimaryButton}
              onPress={() => navigation.navigate('PersonalInfo')}
            >
              <Text style={styles.emptyStatePrimaryButtonText}>🤖 Genera con AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptyStateSecondaryButton}
              onPress={handleImportPlan}
            >
              <Text style={styles.emptyStateSecondaryButtonText}>📄 Carica Piano</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CustomHeader title="I Tuoi Piani" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeWorkoutPlan && renderActivePlanCard(activeWorkoutPlan)}
        {renderArchivedSection()}

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PersonalInfo')}
          >
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomButton}
            >
              <Text style={styles.bottomButtonText}>🤖 Genera Nuovo Piano</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleImportPlan}
          >
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bottomButtonGradientBorder}
            >
              <View style={styles.bottomButtonSecondaryInner}>
                <Text style={styles.bottomButtonTextSecondary}>
                  📄 Importa Piano
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={isUploading} transparent={true} animationType="fade">
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.uploadText}>{uploadProgress}</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                navigation.navigate('PersonalInfo');
              }}
            >
              <Text style={styles.actionMenuItemText}>🤖 Genera con AI</Text>
            </TouchableOpacity>

            <View style={styles.actionMenuDivider} />

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActionMenu(false);
                handleImportPlan();
              }}
            >
              <Text style={styles.actionMenuItemText}>📄 Importa Piano</Text>
            </TouchableOpacity>

            <View style={styles.actionMenuDivider} />

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => setShowActionMenu(false)}
            >
              <Text style={[styles.actionMenuItemText, styles.actionMenuCancel]}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 28,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: theme.spacing.xl,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionToggle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  // Active Plan Card
  activeCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activeCardName: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  activeCardInfo: {
    marginBottom: theme.spacing.md,
  },
  activeCardInfoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.overlayLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    minWidth: 40,
  },
  progressWeekText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  activePlanButton: {
    width: '100%',
    backgroundColor: theme.colors.white,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  activePlanButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
  },
  lastSessionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.overlayMedium,
    textAlign: 'center',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  quickActionDanger: {
    borderColor: theme.colors.error,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickActionDangerText: {
    color: theme.colors.error,
  },

  // Archived Plans
  archivedCard: {
    width: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm + 4,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  archivedCardName: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  archivedCardDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  archivedCardInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  archivedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archivedButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  archivedButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  archivedDeleteText: {
    fontSize: 20,
    paddingHorizontal: 8,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  emptyStateButtons: {
    width: '100%',
    gap: 12,
  },
  emptyStatePrimaryButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  emptyStatePrimaryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  emptyStateSecondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  emptyStateSecondaryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  // Legacy button (kept for compatibility)
  generateFirstPlanButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  generateFirstPlanButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },

  // Bottom Buttons
  bottomButtons: {
    paddingHorizontal: 16,
    paddingTop: theme.spacing.md,
    paddingBottom: 24,
    gap: 12,
  },
  bottomButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomButtonGradientBorder: {
    width: '100%',
    padding: 2,
    borderRadius: 8,
  },
  bottomButtonSecondaryInner: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  bottomButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Upload Progress Modal
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },

  // Android Action Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
  },
  actionMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionMenuItemText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  actionMenuCancel: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: 16,
  },
});

export default PlansScreen;
