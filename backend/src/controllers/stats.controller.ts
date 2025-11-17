import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  getDateRange,
  calculateAvgDuration,
  calculateGlobalStreak,
} from '../utils/statsHelpers';

export const getWeeklyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    // Calculate start and end of the current week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    // Count completed sessions this week
    const workoutsThisWeek = await prisma.completedSession.count({
      where: {
        userId,
        completedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
    });

    // Calculate total volume this week
    const sessionsThisWeek = await prisma.completedSession.findMany({
      where: {
        userId,
        completedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      select: {
        totalWeightLifted: true,
      },
    });

    const volumeThisWeek = sessionsThisWeek.reduce(
      (sum, session) => sum + (session.totalWeightLifted || 0),
      0
    );

    // Find the last workout date
    const lastSession = await prisma.completedSession.findFirst({
      where: {
        userId,
      },
      orderBy: {
        completedAt: 'desc',
      },
      select: {
        completedAt: true,
      },
    });

    res.status(200).json({
      workoutsThisWeek,
      volumeThisWeek: Math.round(volumeThisWeek), // Round to nearest kg
      lastWorkoutDate: lastSession?.completedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get global user statistics across all plans
 * GET /api/stats/global?period=week|month|year|all
 */
export const getGlobalStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const period = (req.query.period as string) || 'week'; // week, month, year, all

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    console.log(`📊 Getting global stats for user ${userId}, period: ${period}`);

    // Calculate date range
    const { startDate, endDate } = getDateRange(period);

    // Query all completed sessions in the period
    const sessions = await prisma.completedSession.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
          not: null,
        },
      },
      include: {
        completedSets: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    console.log(`📊 Found ${sessions.length} sessions for period ${period}`);

    // Calculate aggregate metrics
    const totalSessions = sessions.length;
    const totalVolume = sessions.reduce(
      (sum, s) => sum + (s.totalWeightLifted || 0),
      0
    );
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.totalDurationSeconds || 0),
      0
    );
    const avgDuration = calculateAvgDuration(sessions);
    const currentStreak = await calculateGlobalStreak(userId);

    // Get last workout
    const lastWorkout =
      sessions.length > 0 ? sessions[sessions.length - 1].completedAt : null;

    // Count total sets and reps
    const totalSets = sessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
    const totalReps = sessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);

    const stats = {
      period,
      totalSessions,
      totalVolume: Math.round(totalVolume),
      totalDuration: Math.round(totalDuration / 60), // Convert to minutes
      avgDuration, // in minutes
      totalSets,
      totalReps,
      currentStreak,
      lastWorkout: lastWorkout ? lastWorkout.toISOString() : null,
    };

    console.log(`✅ Global stats calculated:`, stats);

    res.status(200).json(stats);
  } catch (error: any) {
    console.error('❌ Error fetching global stats:', error);
    res.status(500).json({ error: 'Errore recupero statistiche globali' });
  }
};
