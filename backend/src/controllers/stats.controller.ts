import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper to get a string key for a week (e.g., "Week 42") or just "DD/MM" start of week
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  return `${monday.getDate()}/${monday.getMonth() + 1}`;
}

export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. Get all completed sessions for the user
    const completedSessions = await prisma.completedSession.findMany({
      where: {
        userId: userId,
        completedAt: {
          not: null,
        },
      },
      include: {
        completedSets: true, // Use completedSets relation
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // 2. Calculate Total Workouts
    const totalWorkouts = completedSessions.length;

    // 3. Calculate Total Volume (Weight * Reps for all sets)
    let totalVolume = 0;
    completedSessions.forEach((session) => {
      // Use totalWeightLifted if available (it's an aggregate field in CompletedSession)
      if (session.totalWeightLifted) {
        totalVolume += session.totalWeightLifted;
      } else {
        // Fallback to calculating from sets if aggregate is missing
        session.completedSets.forEach((set) => {
          if (set.actualWeight && set.actualReps) {
            totalVolume += set.actualWeight * set.actualReps;
          }
        });
      }
    });

    // 4. Calculate Workouts per Week (Last 4 weeks)
    const now = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(now.getDate() - 28);

    const last4WeeksSessions = completedSessions.filter(
      (s) => s.completedAt && new Date(s.completedAt) >= fourWeeksAgo
    );

    // Group by week
    const workoutsPerWeekMap = new Map<string, number>();

    // Initialize last 4 weeks with 0
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      const weekKey = getWeekKey(d);
      workoutsPerWeekMap.set(weekKey, 0);
    }

    last4WeeksSessions.forEach((session) => {
      if (session.completedAt) {
        const date = new Date(session.completedAt);
        const weekKey = getWeekKey(date);
        // Only count if it falls in our initialized weeks (it should, based on filter)
        if (workoutsPerWeekMap.has(weekKey)) {
          workoutsPerWeekMap.set(weekKey, (workoutsPerWeekMap.get(weekKey) || 0) + 1);
        }
      }
    });

    // Convert map to array for frontend, reversed to show oldest to newest
    const workoutsPerWeek = Array.from(workoutsPerWeekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .reverse();

    res.json({
      totalWorkouts,
      totalVolume,
      workoutsPerWeek,
      lastWorkoutDate: completedSessions.length > 0 ? completedSessions[0].completedAt : null,
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};

export const getWeeklyStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = await prisma.completedSession.findMany({
      where: {
        userId,
        completedAt: {
          gte: startOfWeek,
        },
      },
      include: {
        completedSets: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const workoutsThisWeek = sessionsThisWeek.length;
    let volumeThisWeek = 0;

    sessionsThisWeek.forEach((session) => {
      if (session.totalWeightLifted) {
        volumeThisWeek += session.totalWeightLifted;
      } else {
        session.completedSets.forEach((set) => {
          if (set.actualWeight && set.actualReps) {
            volumeThisWeek += set.actualWeight * set.actualReps;
          }
        });
      }
    });

    // Get last workout date (could be before this week)
    const lastSession = await prisma.completedSession.findFirst({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });

    res.json({
      workoutsThisWeek,
      volumeThisWeek,
      lastWorkoutDate: lastSession?.completedAt || null,
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ message: 'Error fetching weekly stats' });
  }
};

export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const aggregates = await prisma.completedSession.aggregate({
      where: { userId, completedAt: { not: null } },
      _count: { id: true },
      _sum: { totalWeightLifted: true }
    });

    res.json({
      totalWorkouts: aggregates._count.id,
      totalVolume: aggregates._sum.totalWeightLifted || 0,
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ message: 'Error fetching global stats' });
  }
};
