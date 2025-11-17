import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth.types';

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, profile } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email e password sono obbligatori' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
      return;
    }

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

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email e password sono obbligatori' });
      return;
    }

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

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
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
