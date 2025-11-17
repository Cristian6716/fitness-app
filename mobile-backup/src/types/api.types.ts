// Auth Types
export interface RegisterRequest {
  email: string;
  password: string;
  profile: {
    age: number;
    weight: number;
    height: number;
    fitness_level: 'beginner' | 'intermediate' | 'advanced';
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
  };
}

// Workout Types
export interface GenerateWorkoutRequest {
  goal: 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness';
  daysPerWeek: number;
  equipment: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  targetWeight: number | null;
  restSeconds: number;
  notes: string | null;
  order: number;
}

export interface TrainingSession {
  id: string;
  name: string;
  dayNumber: number;
  order: number;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  durationWeeks: number;
  aiGenerated: boolean;
  createdAt: string;
  trainingSessions: TrainingSession[];
}

// Session Tracking Types
export interface CompletedSession {
  id: string;
  sessionId: string;
  userId: string;
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
  caloriesBurned: number;
  totalWeightLifted: number;
  rating: number | null;
  notes: string | null;
}

export interface LogSetRequest {
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight: number;
}

export interface CompleteSessionRequest {
  rating?: number;
  notes?: string;
}
