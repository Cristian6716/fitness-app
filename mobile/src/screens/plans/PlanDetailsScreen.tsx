import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { WorkoutPlan, TrainingSession, PlanStatsResponse } from '../../types/api.types';
import apiService from '../../services/api.service';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { StatCard, SimpleBarChart, StatusBadge, RecentSessionItem } from '../../components/stats';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 card visibili, con padding

type PlanDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetails'>;
  route: RouteProp<RootStackParamList, 'PlanDetails'>;
};

// Onboarding Progress Card Component
const OnboardingProgressCard: React.FC<{ completedSessions: number }> = ({ completedSessions }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const REQUIRED_SESSIONS = 3;
  const progress = Math.min(completedSessions, REQUIRED_SESSIONS);

  return (
    <View style={styles.onboardingCard}>
      <View style={styles.onboardingIconContainer}>
        <LinearGradient
          colors={[theme.colors.primary + '20', theme.colors.primaryDarker + '20']}
          style={styles.onboardingIconGradient}
        >
          <Ionicons name="trophy-outline" size={40} color={theme.colors.primary} />
        </LinearGradient>
      </View>

      <Text style={styles.onboardingTitle}>Inizia il tuo percorso</Text>
      <Text style={styles.onboardingText}>
        Completa {REQUIRED_SESSIONS} sessioni per sbloccare il grafico del volume e le statistiche avanzate.
      </Text>

      {/* Progress Blocks */}
      <View style={styles.progressBlocksContainer}>
        {[...Array(REQUIRED_SESSIONS)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBlock,
              index < progress && styles.progressBlockCompleted,
            ]}
          >
            {index < progress && (
              <Ionicons name="checkmark" size={16} color={theme.colors.white} />
            )}
          </View>
        ))}
      </View>

      <Text style={styles.onboardingProgress}>
        {progress}/{REQUIRED_SESSIONS} sessioni completate
      </Text>
    </View>
  );
};

const PlanDetailsScreen: React.FC<PlanDetailsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const { planId } = route.params;
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [stats, setStats] = useState<PlanStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlanData();
  }, []);

  const loadPlanData = async () => {
    try {
      const [planData, statsData] = await Promise.all([
        apiService.getWorkoutById(planId),
        apiService.getPlanStats(planId, 4),
      ]);

      setPlan(planData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading plan data:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati del piano');
      navigation.goBack();
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlanData();
  };

  const handleSessionPress = (session: TrainingSession) => {
    navigation.navigate('Session', {
      sessionId: session.id,
      sessionName: session.name,
    });
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}k`;
    }
    return kg.toString();
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const getAccentColor = (index: number): string => {
    const colors = [theme.colors.primary, '#4CAF50', '#FF9800', '#9C27B0'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['bottom']}>
        <Text style={styles.errorText}>Piano non trovato</Text>
      </SafeAreaView>
    );
  }

  const currentWeekVolume = stats?.weeklyVolume[stats.weeklyVolume.length - 1]?.volume || 0;
  const completedSessions = stats?.summary.completedSessions || 0;
  const hasUnlockedStats = completedSessions >= 3;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {plan?.name ? (
            (() => {
              // Separa il nome del piano in due parti (es. "Scheda 4 giorni - Upper/Lower")
              const parts = plan.name.split(/[-–—]/);
              const mainTitle = parts[0].trim();
              const subtitle = parts[1]?.trim();

              return (
                <>
                  <Text style={styles.headerTitleMain} numberOfLines={1}>
                    {mainTitle}
                  </Text>
                  {subtitle && (
                    <Text style={styles.headerTitleSub} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </>
              );
            })()
          ) : (
            <Text style={styles.headerTitleMain}>Caricamento...</Text>
          )}
        </View>
        {/* Spazio vuoto per bilanciare layout */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Section */}
        {stats && (
          <>
            {/* Conditional: Onboarding Card OR Weekly Volume Chart */}
            {hasUnlockedStats ? (
              <SimpleBarChart data={stats.weeklyVolume} currentWeekVolume={currentWeekVolume} />
            ) : (
              <OnboardingProgressCard completedSessions={completedSessions} />
            )}

            {/* KPI Cards - Scroll Orizzontale */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + 8}
              decelerationRate="fast"
              contentContainerStyle={styles.kpiScroll}
            >
              <StatCard
                icon="💪"
                value={stats.summary.completedSessions}
                label="Sessioni"
                subtitle={`su ${stats.summary.totalSessions}`}
                style={styles.kpiCard}
              />
              <StatCard
                icon="⏱️"
                value={`${Math.round(stats.summary.avgDuration)}`}
                label="Durata Media"
                subtitle="minuti"
                style={styles.kpiCard}
              />
              <StatCard
                icon="📊"
                value={`${formatVolume(stats.summary.totalVolume)}kg`}
                label="Volume Totale"
                subtitle="questa settimana"
                style={styles.kpiCard}
              />
              <StatCard
                icon="🔥"
                value={stats.summary.currentStreak}
                label="Streak"
                subtitle="giorni consecutivi"
                style={styles.kpiCard}
              />
            </ScrollView>

            {/* Recent Sessions */}
            {stats.recentSessions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sessioni Recenti</Text>
                {stats.recentSessions.slice(0, 5).map((session) => (
                  <RecentSessionItem
                    key={session.id}
                    session={session}
                    formatRelativeTime={formatRelativeTime}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Training Sessions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessioni di Allenamento</Text>

          {plan.trainingSessions.map((session, index) => {
            const accentColor = getAccentColor(index);
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => handleSessionPress(session)}
                activeOpacity={0.7}
              >
                {/* Colored Vertical Pill */}
                <View style={[styles.sessionPill, { backgroundColor: accentColor }]} />

                {/* Content Container */}
                <View style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDay}>Day {session.dayNumber}</Text>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <View style={styles.sessionMeta}>
                      <Ionicons
                        name="barbell-outline"
                        size={14}
                        color={theme.colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.sessionMetaText}>
                        {session.exercises.length} Esercizi
                      </Text>
                    </View>
                  </View>

                  {/* Start Button */}
                  <View style={[styles.startButton, { backgroundColor: accentColor }]}>
                    <Ionicons name="play" size={20} color={theme.colors.white} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  headerTitleMain: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  headerTitleSub: {
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },

  // KPI Cards - Scroll Orizzontale
  kpiScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  kpiCard: {
    width: cardWidth,
    marginRight: 8,
    minHeight: 100,
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },

  // Session Cards - Modern Clean Style with Vertical Pill
  sessionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    minHeight: 110,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sessionPill: {
    width: 6,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: theme.borderRadius.xl,
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionDay: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sessionName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 24,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  startButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // Onboarding Progress Card Styles
  onboardingCard: {
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  onboardingIconContainer: {
    marginBottom: theme.spacing.md,
  },
  onboardingIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  onboardingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  progressBlocksContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  progressBlock: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlockCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  onboardingProgress: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
});

export default PlanDetailsScreen;
