import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

// Validation schema
const measurementSchema = z.object({
    date: z.string().optional(), // ISO string
    weight: z.number().positive().optional(),
    bodyFat: z.number().min(0).max(100).optional(),
    chest: z.number().positive().optional(),
    waist: z.number().positive().optional(),
    hips: z.number().positive().optional(),
    shoulders: z.number().positive().optional(),
    biceps: z.number().positive().optional(),
    forearms: z.number().positive().optional(),
    thighs: z.number().positive().optional(),
    calves: z.number().positive().optional(),
    neck: z.number().positive().optional(),
    notes: z.string().optional(),
});

export const addMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const validation = measurementSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Dati non validi',
                details: validation.error.issues.map(e => e.message)
            });
            return;
        }

        const data = validation.data;
        const date = data.date ? new Date(data.date) : new Date();

        const measurement = await prisma.bodyMeasurement.create({
            data: {
                userId,
                date,
                weight: data.weight,
                bodyFat: data.bodyFat,
                chest: data.chest,
                waist: data.waist,
                hips: data.hips,
                shoulders: data.shoulders,
                biceps: data.biceps,
                forearms: data.forearms,
                thighs: data.thighs,
                calves: data.calves,
                neck: data.neck,
                notes: data.notes,
            },
        });

        // If weight is provided, update user profile weight as well
        if (data.weight) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.profile) {
                const profile = user.profile as any;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        profile: {
                            ...profile,
                            weight: data.weight
                        }
                    }
                });
            }
        }

        logger.info(`Measurement added for user ${userId}`);
        res.status(201).json(measurement);
    } catch (error) {
        logger.error('Error adding measurement:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const getMeasurements = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const measurements = await prisma.bodyMeasurement.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });

        res.json(measurements);
    } catch (error) {
        logger.error('Error fetching measurements:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

export const deleteMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const measurement = await prisma.bodyMeasurement.findFirst({
            where: { id, userId },
        });

        if (!measurement) {
            res.status(404).json({ error: 'Misurazione non trovata' });
            return;
        }

        await prisma.bodyMeasurement.delete({
            where: { id },
        });

        res.json({ message: 'Misurazione eliminata' });
    } catch (error) {
        logger.error('Error deleting measurement:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};
