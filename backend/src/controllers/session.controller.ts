import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { LogSetRequest, CompleteSessionRequest } from '../types/session.types';
import { calculateSessionVolume, calculateTotalReps } from '../utils/statsHelpers';

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify session exists and belongs to user's workout plan
    const session = await prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        plan: {
          userId,
        },
      },
      include: {
        plan: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Create completed session with denormalized data
    const completedSession = await prisma.completedSession.create({
      data: {
        sessionId,
        userId,
        planId: session.planId,
        planName: session.plan.name, // Denormalized
        sessionName: session.name, // Denormalized
        startedAt: new Date(),
        completedAt: new Date(), // Will be updated when session is completed
        totalDurationSeconds: 0,
        caloriesBurned: 0,
        totalWeightLifted: 0,
      },
    });

    res.status(201).json(completedSession);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

export const logSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id: completedSessionId } = req.params;
    const { exerciseId, setNumber, actualReps, actualWeight } = req.body as LogSetRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validation
    if (!exerciseId || setNumber === undefined || actualReps === undefined || actualWeight === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Verify completed session belongs to user
    const completedSession = await prisma.completedSession.findFirst({
      where: {
        id: completedSessionId,
        userId,
      },
    });

    if (!completedSession) {
      res.status(404).json({ error: 'Completed session not found' });
      return;
    }

    // Get exercise to fetch name for denormalization
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { name: true },
    });

    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    // Create completed set with denormalized exercise name
    const completedSet = await prisma.completedSet.create({
      data: {
        completedSessionId,
        exerciseId,
        exerciseName: exercise.name, // Denormalized
        setNumber,
        actualReps,
        actualWeight: actualWeight || 0,
        completedAt: new Date(),
      },
    });

    res.status(201).json(completedSet);
  } catch (error) {
    console.error('Log set error:', error);
    res.status(500).json({ error: 'Failed to log set' });
  }
};

export const completeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id: completedSessionId } = req.params;
    const { rating, notes } = req.body as CompleteSessionRequest;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get completed session with sets
    const completedSession = await prisma.completedSession.findFirst({
      where: {
        id: completedSessionId,
        userId,
      },
      include: {
        completedSets: true,
      },
    });

    if (!completedSession) {
      res.status(404).json({ error: 'Completed session not found' });
      return;
    }

    // Calculate metrics
    const completedAt = new Date();
    const totalDurationSeconds = Math.floor(
      (completedAt.getTime() - completedSession.startedAt.getTime()) / 1000
    );

    // Calculate total weight lifted (sum of all sets * reps * weight)
    const totalWeightLifted = completedSession.completedSets.reduce(
      (total, set) => total + set.actualReps * (set.actualWeight || 0),
      0
    );

    // Calculate calories burned: (total_weight_lifted × 0.05) + (duration_minutes × 5)
    const durationMinutes = totalDurationSeconds / 60;
    const caloriesBurned = Math.round(totalWeightLifted * 0.05 + durationMinutes * 5);

    // Update completed session
    const updatedSession = await prisma.completedSession.update({
      where: { id: completedSessionId },
      data: {
        completedAt,
        totalDurationSeconds,
        caloriesBurned,
        totalWeightLifted,
        rating,
        notes,
      },
      include: {
        completedSets: {
          orderBy: {
            completedAt: 'asc',
          },
        },
        session: {
          include: {
            exercises: true,
          },
        },
      },
    });

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
};

export const getSessionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify session belongs to user
    const session = await prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        plan: {
          userId,
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get all completed sessions for this training session
    const completedSessions = await prisma.completedSession.findMany({
      where: {
        sessionId,
        userId,
      },
      include: {
        completedSets: {
          include: {
            exercise: true,
          },
          orderBy: {
            setNumber: 'asc',
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    res.status(200).json(completedSessions);
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
};

/**
 * Update completed session (rating, notes, recalculate metrics)
 * PATCH /api/sessions/completed/:sessionId
 */
export const updateCompletedSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { rating, notes } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    console.log(`📝 Updating completed session ${sessionId}`);

    // Verify session belongs to user
    const session = await prisma.completedSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        completedSets: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Sessione non trovata' });
      return;
    }

    // Recalculate metrics from sets
    const totalVolume = calculateSessionVolume(session.completedSets);
    const totalReps = calculateTotalReps(session.completedSets);
    const totalSets = session.completedSets.length;

    // Prepare update data
    const updateData: any = {
      totalWeightLifted: totalVolume,
      totalSets,
      totalReps,
    };

    if (rating !== undefined) {
      // Validate rating (1-5)
      if (rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating deve essere tra 1 e 5' });
        return;
      }
      updateData.rating = rating;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    console.log(`📝 Update data:`, updateData);

    // Update session
    const updatedSession = await prisma.completedSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        completedSets: true,
      },
    });

    console.log(`✅ Session updated:`, {
      id: updatedSession.id,
      volume: updatedSession.totalWeightLifted,
      sets: updatedSession.totalSets,
      reps: updatedSession.totalReps,
    });

    res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error('❌ Error updating completed session:', error);
    res.status(500).json({ error: 'Errore aggiornamento sessione' });
  }
};
