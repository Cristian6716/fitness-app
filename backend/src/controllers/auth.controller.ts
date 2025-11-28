import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthResponse } from '../types/auth.types';
import logger from '../utils/logger';

const SALT_ROUNDS = 10;

// Zod Schemas
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  profile: z.object({
    age: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    fitness_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password obbligatoria'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Dati non validi',
        details: validationResult.error.issues.map(e => e.message)
      });
      return;
    }

    const { email, password, profile } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Utente già registrato' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with optional profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: profile || {},
      },
    });

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    };

    logger.info(`New user registered: ${email}`);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Dati non validi',
        details: validationResult.error.issues.map(e => e.message)
      });
      return;
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Credenziali non valide' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenziali non valide' });
      return;
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '30d' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    };

    logger.info(`User logged in: ${email}`);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Non autorizzato' });
      return;
    }

    // Update user's hasCompletedOnboarding flag
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
      },
    });

    res.status(200).json({
      success: true,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
