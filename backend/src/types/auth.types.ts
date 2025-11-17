import { Request } from 'express';

export interface RegisterRequest {
  email: string;
  password: string;
  profile?: {
    age?: number;
    weight?: number;
    height?: number;
    fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    profile: any;
    hasCompletedOnboarding: boolean;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}
