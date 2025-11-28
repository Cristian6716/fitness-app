import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import apiService from '../../services/api.service';
import { WorkoutPlan } from '../../types/api.types';
import { CustomHeader } from '../../components/CustomHeader';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

interface WeeklyStats {
  workoutsThisWeek: number;
  volumeThisWeek: number;
  lastWorkoutDate: string | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<any | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    workoutsThisWeek: 0,
    volumeThisWeek: 0,
    lastWorkoutDate: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const loadData = async () => {
    try {
      // Fetch active plans
      const plans = await apiService.getWorkouts();
      const active = plans.find((p) => p.status === 'active');
      setActivePlan(active || null);

      // TODO: Determine today's workout based on schedule
      // For now, just take the first session if plan exists
      if (active && active.trainingSessions.length > 0) {
        setTodayWorkout(active.trainingSessions[0]);
      }

      // Fetch weekly stats
      try {
        const stats = await apiService.getWeeklyStats();
        setWeeklyStats(stats);
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
        // Keep default values on error
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const getFormattedDate = () => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ];
    const now = new Date();
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  };

  const getDaysSinceLastWorkout = () => {
    if (!weeklyStats.lastWorkoutDate) return null;
    const last = new Date(weeklyStats.lastWorkoutDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
        const uploadResult = await apiService.uploadWorkoutPlan(file);
        setUploadProgress('Analisi completata!');

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress('');

          if (!uploadResult || !uploadResult.parsedData) {
            Alert.alert('Errore', 'Impossibile analizzare il file.');
            return;
          }

          // Navigate to review screen
          navigation.navigate('ReviewImportedPlan', {
            parsedData: uploadResult.parsedData,
            warnings: uploadResult.warnings,
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Home" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Home" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </View>

        {/* Next Workout Section */}
        {activePlan && todayWorkout ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Prossimo Allenamento</Text>
            <Text style={styles.workoutName}>{todayWorkout.name}</Text>
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="barbell" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {todayWorkout.exercises?.length || 0} esercizi
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>~60 min</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('Session', {
                  sessionId: todayWorkout.id,
                  sessionName: todayWorkout.name,
                })
              }
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Inizia Allenamento</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.heroCard}>
            <Ionicons name="fitness" size={48} color={theme.colors.textLight} />
            <Text style={styles.noPlanTitle}>Non hai un piano attivo</Text>
            <Text style={styles.noPlanSubtitle}>
              Crea o importa un piano per iniziare
            </Text>
            <View style={styles.noPlanButtons}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PersonalInfo')}
              >
                <LinearGradient
                  colors={theme.colors.gradientPrimary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButton}
                >
                  <Text style={styles.ctaButtonText}>Genera Piano</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaButtonSecondary}
                onPress={handleImportPlan}
              >
                <Text style={styles.ctaButtonTextSecondary}>
                  Importa Piano
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Questa Settimana</Text>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Ionicons name="fitness" size={24} color={theme.colors.white} />
              <Text style={styles.statValue}>{weeklyStats.workoutsThisWeek}</Text>
              <Text style={styles.statLabel}>Allenamenti</Text>
            </LinearGradient>
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Ionicons name="barbell" size={24} color={theme.colors.white} />
              <Text style={styles.statValue}>
                {(weeklyStats.volumeThisWeek / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.statLabel}>kg sollevati</Text>
            </LinearGradient>
            <LinearGradient
              colors={theme.colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Ionicons name="calendar" size={24} color={theme.colors.white} />
              <Text style={styles.statValue}>
                {getDaysSinceLastWorkout() !== null ? getDaysSinceLastWorkout() : '-'}
              </Text>
              <Text style={styles.statLabel}>
                {getDaysSinceLastWorkout() !== null ? 'giorni fa' : 'Nessuno'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Azioni Rapide</Text>

          {/* Prima Riga: I Miei Piani + Nuovo Piano */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Plans')}
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <Ionicons name="list" size={32} color={theme.colors.white} />
                <Text style={styles.actionText}>I Miei Piani</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PersonalInfo')}
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCard}
              >
                <Ionicons name="add-circle" size={32} color={theme.colors.white} />
                <Text style={styles.actionText}>Nuovo Piano</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Seconda Riga: Statistiche + Impostazioni */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardDisabled]}
              onPress={() => navigation.navigate('Statistics')}
            >
              <Ionicons name="bar-chart" size={32} color={theme.colors.textLight} />
              <Text style={[styles.actionText, styles.actionTextDisabled]}>
                Statistiche
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardDisabled]}
              disabled
            >
              <Ionicons name="settings" size={32} color={theme.colors.textLight} />
              <Text style={[styles.actionText, styles.actionTextDisabled]}>Impostazioni</Text>
              <Text style={styles.comingSoon}>Presto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Upload Progress Modal */}
      <Modal visible={isUploading} transparent={true} animationType="fade">
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.uploadText}>{uploadProgress}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  heroCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  workoutName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  startButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  startButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  noPlanTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  noPlanSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  noPlanButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  ctaButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  ctaButtonSecondary: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ctaButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  ctaButtonTextSecondary: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 100,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionCardDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  actionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  actionTextDisabled: {
    color: theme.colors.textLight,
  },
  comingSoon: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: theme.colors.cardBackground,
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
});

export default HomeScreen;
