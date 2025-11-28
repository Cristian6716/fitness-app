import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api.service';
import { Theme } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface StatsData {
    totalWorkouts: number;
    totalVolume: number;
    workoutsPerWeek: { week: string; count: number }[];
    lastWorkoutDate: string | null;
}

export const StatisticsScreen = () => {
    const navigation = useNavigation();
    const { theme: currentTheme, mode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<StatsData | null>(null);

    const styles = React.useMemo(() => getStyles(currentTheme), [currentTheme]);

    const fetchStats = async () => {
        try {
            const data = await apiService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer} edges={['top']}>
                <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            </SafeAreaView>
        );
    }

    const maxWorkouts = stats?.workoutsPerWeek.reduce((max, item) => Math.max(max, item.count), 0) || 1;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Statistiche</Text>
                <Ionicons
                    name="close"
                    size={24}
                    color={currentTheme.colors.text}
                    onPress={() => navigation.goBack()}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{stats?.totalWorkouts || 0}</Text>
                        <Text style={styles.summaryLabel}>Allenamenti Totali</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>
                            {stats?.totalVolume ? (stats.totalVolume / 1000).toFixed(1) : '0'}k
                        </Text>
                        <Text style={styles.summaryLabel}>Volume (kg)</Text>
                    </View>
                </View>

                {/* Chart Section */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Frequenza Settimanale</Text>
                    <Text style={styles.chartSubtitle}>Ultimi 30 giorni</Text>

                    <View style={styles.chartContainer}>
                        {stats?.workoutsPerWeek.map((item, index) => {
                            const heightPercentage = (item.count / Math.max(maxWorkouts, 4)) * 100; // Scale to max or at least 4
                            return (
                                <View key={index} style={styles.barContainer}>
                                    <Text style={styles.barValue}>{item.count > 0 ? item.count : ''}</Text>
                                    <View style={[styles.bar, { height: `${Math.max(heightPercentage, 2)}%` }]} />
                                    <Text style={styles.barLabel}>{item.week}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Additional Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={currentTheme.colors.primary} />
                        <Text style={styles.infoText}>
                            Ultimo allenamento: {stats?.lastWorkoutDate ? new Date(stats.lastWorkoutDate).toLocaleDateString('it-IT') : 'Mai'}
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerTitle: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.lg,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        marginHorizontal: theme.spacing.xs,
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    chartCard: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    chartTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 150,
        paddingBottom: theme.spacing.sm,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
        flex: 1,
    },
    bar: {
        width: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 6,
        marginBottom: 8,
    },
    barValue: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    barLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    infoCard: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    infoText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
});
