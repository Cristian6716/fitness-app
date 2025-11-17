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
import { RootStackParamList } from '../../navigation/AppNavigator';
import { WorkoutPlan, TrainingSession, PlanStatsResponse } from '../../types/api.types';
import apiService from '../../services/api.service';
import { theme } from '../../constants/theme';
import { StatCard, SimpleBarChart, StatusBadge, RecentSessionItem } from '../../components/stats';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 card visibili, con padding

type PlanDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetails'>;
  route: RouteProp<RootStackParamList, 'PlanDetails'>;
};

const PlanDetailsScreen: React.FC<PlanDetailsScreenProps> = ({ navigation, route }) => {
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
            {/* Weekly Volume Chart - Moved to top */}
            <SimpleBarChart data={stats.weeklyVolume} currentWeekVolume={currentWeekVolume} />

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

          {plan.trainingSessions.map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, { borderLeftColor: getAccentColor(index) }]}
              onPress={() => handleSessionPress(session)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDay}>Day {session.dayNumber}</Text>
              </View>

              <Text style={styles.sessionName}>{session.name}</Text>

              <View style={styles.sessionMeta}>
                <Text style={styles.sessionMetaText}>
                  {session.exercises.length} esercizi
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.colors.textLight}
                style={styles.sessionChevron}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  headerTitleSub: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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

  // Session Cards
  sessionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    minHeight: 90,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sessionDay: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  sessionName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sessionMeta: {
    marginBottom: 4,
  },
  sessionMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  sessionChevron: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    marginTop: -12,
  },
});

export default PlanDetailsScreen;
