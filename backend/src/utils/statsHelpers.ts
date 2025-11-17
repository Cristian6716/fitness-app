import prisma from './prisma';

/**
 * Calculate weekly volume from sessions
 */
export function calculateWeeklyVolume(sessions: any[], weeks: number) {
  const weeklyData = Array(weeks)
    .fill(null)
    .map((_, i) => ({
      week: i + 1,
      volume: 0,
      sessions: 0,
    }));

  const now = Date.now();

  sessions.forEach((session) => {
    if (!session.completedAt) return;

    const completedDate = new Date(session.completedAt);
    const weekIndex = Math.floor(
      (now - completedDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weekIndex >= 0 && weekIndex < weeks) {
      // Inverti per ordine cronologico (settimana 1 = più recente)
      const dataIndex = weeks - 1 - weekIndex;
      weeklyData[dataIndex].volume += session.totalWeightLifted || 0;
      weeklyData[dataIndex].sessions += 1;
    }
  });

  return weeklyData;
}

/**
 * Calculate average duration in minutes
 */
export function calculateAvgDuration(sessions: any[]): number {
  const validSessions = sessions.filter(
    (s) => s.totalDurationSeconds && s.completedAt
  );
  if (validSessions.length === 0) return 0;

  const totalDuration = validSessions.reduce(
    (sum, s) => sum + s.totalDurationSeconds,
    0
  );
  return Math.round(totalDuration / validSessions.length / 60); // Convert to minutes
}

/**
 * Calculate current workout streak for a specific plan
 */
export async function calculateStreak(
  userId: string,
  planId: string
): Promise<number> {
  // Prendi tutte le sessioni completate ordinate per data (desc)
  const sessions = await prisma.completedSession.findMany({
    where: {
      userId,
      planId,
      completedAt: { not: null },
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      completedAt: true,
    },
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    if (!session.completedAt) continue;

    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 0 || diffDays === 1) {
      // Stesso giorno o giorno precedente
      streak++;
      currentDate = sessionDate;
    } else {
      // Gap trovato, stop
      break;
    }
  }

  return streak;
}

/**
 * Calculate global workout streak (all plans)
 */
export async function calculateGlobalStreak(userId: string): Promise<number> {
  // Prendi tutte le sessioni completate ordinate per data (desc)
  const sessions = await prisma.completedSession.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      completedAt: true,
    },
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Track days we've already counted (to handle multiple workouts per day)
  const countedDays = new Set<string>();

  for (const session of sessions) {
    if (!session.completedAt) continue;

    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);
    const dateKey = sessionDate.toISOString().split('T')[0];

    // Skip if we already counted this day
    if (countedDays.has(dateKey)) continue;

    const diffDays = Math.floor(
      (currentDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 0 || diffDays === 1) {
      // Stesso giorno o giorno precedente
      streak++;
      countedDays.add(dateKey);
      currentDate = sessionDate;
    } else {
      // Gap trovato, stop
      break;
    }
  }

  return streak;
}

/**
 * Get date range based on period
 */
export function getDateRange(period: string): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2020); // Data inizio app
      break;
    default:
      startDate.setDate(startDate.getDate() - 7); // Default to week
  }

  return { startDate, endDate };
}

/**
 * Calculate total volume from completed sets
 */
export function calculateSessionVolume(sets: any[]): number {
  return sets.reduce((sum, set) => {
    const weight = set.actualWeight || 0;
    const reps = set.actualReps || 0;
    return sum + weight * reps;
  }, 0);
}

/**
 * Calculate total reps from completed sets
 */
export function calculateTotalReps(sets: any[]): number {
  return sets.reduce((sum, set) => sum + (set.actualReps || 0), 0);
}
