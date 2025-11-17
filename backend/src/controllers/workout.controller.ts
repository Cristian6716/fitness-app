import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateWorkoutPlan } from '../utils/ai.service';
import { GenerateWorkoutRequest } from '../types/workout.types';
import {
  calculateWeeklyVolume,
  calculateAvgDuration,
  calculateStreak,
} from '../utils/statsHelpers';

export const generateWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    const workoutRequest = req.body as GenerateWorkoutRequest;

    // Validation - mandatory fields
    if (!workoutRequest.age || !workoutRequest.weight || !workoutRequest.height || !workoutRequest.gender) {
      res.status(400).json({ error: 'Età, peso, altezza e genere sono obbligatori' });
      return;
    }

    if (!workoutRequest.goal || !workoutRequest.daysPerWeek || !workoutRequest.equipment) {
      res.status(400).json({ error: 'Obiettivo, giorni a settimana e attrezzatura sono obbligatori' });
      return;
    }

    if (workoutRequest.daysPerWeek < 1 || workoutRequest.daysPerWeek > 7) {
      res.status(400).json({ error: 'I giorni a settimana devono essere tra 1 e 7' });
      return;
    }

    if (workoutRequest.age < 13 || workoutRequest.age > 100) {
      res.status(400).json({ error: 'L\'età deve essere tra 13 e 100 anni' });
      return;
    }

    if (workoutRequest.weight < 30 || workoutRequest.weight > 300) {
      res.status(400).json({ error: 'Il peso deve essere tra 30 e 300 kg' });
      return;
    }

    if (workoutRequest.height < 100 || workoutRequest.height > 250) {
      res.status(400).json({ error: 'L\'altezza deve essere tra 100 e 250 cm' });
      return;
    }

    // Generate workout plan using AI
    const aiPlan = await generateWorkoutPlan(workoutRequest);

    // Archive existing active plan (if present)
    console.log('💾 AI Generation: Checking for existing active plan...');
    const existingActivePlan = await prisma.workoutPlan.findFirst({
      where: {
        userId,
        status: 'active',
      } as any, // Bypass TypeScript cache
    });

    if (existingActivePlan) {
      console.log('💾 AI Generation: Found active plan:', existingActivePlan.id, existingActivePlan.name, '- Archiving...');
      await prisma.workoutPlan.update({
        where: { id: existingActivePlan.id },
        data: { status: 'archived' } as any, // Bypass TypeScript cache
      });
      console.log('✅ AI Generation: Previous plan archived successfully');
    } else {
      console.log('💾 AI Generation: No active plan found, proceeding with creation');
    }

    // Save new plan to database as active
    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        userId,
        name: aiPlan.name,
        durationWeeks: aiPlan.durationWeeks,
        frequency: aiPlan.sessions.length, // Set frequency based on number of sessions
        status: 'active', // New plan is always active
        aiGenerated: true,
        aiPromptData: workoutRequest as any,
        trainingSessions: {
          create: aiPlan.sessions.map((session) => ({
            name: session.name,
            dayNumber: session.dayNumber,
            order: session.order,
            exercises: {
              create: session.exercises.map((exercise) => ({
                name: exercise.name,
                targetSets: exercise.targetSets,
                targetReps: exercise.targetReps,
                targetWeight: exercise.targetWeight,
                restSeconds: exercise.restSeconds,
                notes: exercise.notes,
                order: exercise.order,
              })),
            },
          })),
        },
      },
      include: {
        trainingSessions: {
          include: {
            exercises: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    res.status(201).json(workoutPlan);
  } catch (error) {
    console.error('Generate workout error:', error);
    res.status(500).json({ error: 'Impossibile generare il piano di allenamento' });
  }
};

export const getWorkouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workouts = await prisma.workoutPlan.findMany({
      where: { userId },
      include: {
        trainingSessions: {
          include: {
            exercises: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
};

export const getWorkoutById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workout = await prisma.workoutPlan.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        trainingSessions: {
          include: {
            exercises: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workout) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    res.status(200).json(workout);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
};

export const deleteWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workout = await prisma.workoutPlan.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!workout) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    await prisma.workoutPlan.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
};

export const updateWorkoutStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    console.log('📝 Updating plan status:', id, 'to', status);

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    // Validate status
    if (!status || !['active', 'archived', 'completed', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Status non valido' });
      return;
    }

    // Verify that the plan belongs to the user
    const plan = await prisma.workoutPlan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      res.status(404).json({ error: 'Piano non trovato' });
      return;
    }

    // If status becomes 'active', archive the current active plan
    if (status === 'active') {
      console.log('📝 Archiving other active plans...');
      await prisma.workoutPlan.updateMany({
        where: {
          userId,
          status: 'active',
          id: { not: id },
        },
        data: { status: 'archived' } as any,
      });
      console.log('✅ Other plans archived');
    }

    // Update the requested plan
    const updatedPlan = await prisma.workoutPlan.update({
      where: { id },
      data: { status } as any,
    });

    console.log('✅ Plan status updated:', updatedPlan.id, updatedPlan.status);

    res.status(200).json(updatedPlan);
  } catch (error: any) {
    console.error('❌ Error updating plan status:', error);
    res.status(500).json({ error: 'Errore durante aggiornamento stato piano' });
  }
};

/**
 * Get plan statistics
 * GET /api/workouts/:id/stats?weeks=4
 */
export const getPlanStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id: planId } = req.params;
    const weeks = parseInt(req.query.weeks as string) || 4;

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    console.log(`📊 Getting stats for plan ${planId}, weeks: ${weeks}`);

    // Verify plan belongs to user
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      res.status(404).json({ error: 'Piano non trovato' });
      return;
    }

    // Calculate date range (last N weeks)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Query completed sessions in the period
    const sessions = await prisma.completedSession.findMany({
      where: {
        planId,
        userId,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        completedSets: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    console.log(`📊 Found ${sessions.length} sessions`);

    // Calculate weekly volume
    const weeklyVolume = calculateWeeklyVolume(sessions, weeks);

    // Calculate aggregate metrics
    const completedSessions = sessions.filter((s) => s.completedAt);
    const totalVolume = sessions.reduce(
      (sum, s) => sum + (s.totalWeightLifted || 0),
      0
    );
    const avgDuration = calculateAvgDuration(sessions);
    const currentStreak = await calculateStreak(userId, planId);

    const summary = {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      avgDuration, // in minutes
      totalVolume, // in kg
      currentStreak,
    };

    // Last 5 sessions for details
    const recentSessions = sessions.slice(-5).map((s) => ({
      id: s.id,
      sessionName: s.sessionName,
      completedAt: s.completedAt,
      duration: s.totalDurationSeconds
        ? Math.round(s.totalDurationSeconds / 60)
        : null,
      volume: s.totalWeightLifted,
      rating: s.rating,
      notes: s.notes,
    }));

    console.log(`✅ Stats calculated:`, {
      summary,
      weeklyVolumeLength: weeklyVolume.length,
      recentSessionsLength: recentSessions.length,
    });

    res.status(200).json({
      weeklyVolume,
      summary,
      recentSessions,
    });
  } catch (error: any) {
    console.error('❌ Error fetching plan stats:', error);
    res.status(500).json({ error: 'Errore recupero statistiche' });
  }
};
