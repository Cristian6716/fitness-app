// Auth Types
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

// Workout Types
export interface GenerateWorkoutRequest {
  // Mandatory fields
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  goal: string;
  daysPerWeek: number;
  equipment: string[];

  // Optional fields
  goalDetails?: string;
  sessionDuration?: number;
  scheduleNotes?: string;
  equipmentDetails?: string;
  experienceLevel?: string;
  experienceDetails?: string;
  limitations?: string;
  weakPoints?: string;
  cardioPreference?: string;
  cardioDetails?: string;
  splitPreference?: string;
  currentWeights?: {
    benchPress?: number;
    squat?: number;
    deadlift?: number;
    militaryPress?: number;
    pullUps?: 'bodyweight' | 'weighted' | 'cant';
    pullUpsWeight?: number;
    other?: string;
  };
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
  // Extended fields for Plans screen
  status?: 'active' | 'archived' | 'completed' | 'inactive';
  frequency?: number; // days per week
  splitType?: string; // Push/Pull/Legs, Upper/Lower, etc
  totalSessions?: number;
  completedSessions?: number;
  lastSessionDate?: string;
  completedDate?: string;
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

// Stats Types
export interface WeeklyVolumeData {
  week: number;
  volume: number;
  sessions: number;
}

export interface StatsSummary {
  totalSessions: number;
  completedSessions: number;
  avgDuration: number; // in minutes
  totalVolume: number; // in kg
  currentStreak: number;
}

export interface RecentSession {
  id: string;
  sessionName: string;
  completedAt: string;
  duration: number | null; // in minutes
  volume: number;
  rating: number | null;
  notes: string | null;
}

export interface PlanStatsResponse {
  weeklyVolume: WeeklyVolumeData[];
  summary: StatsSummary;
  recentSessions: RecentSession[];
}

// News Types
export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  source: string;
  sourceUrl: string; // REQUIRED - original article URL
  imageUrl?: string;
  category: string;
  sponsored: boolean;
  publishedAt: string;
  content?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  total: number;
}
