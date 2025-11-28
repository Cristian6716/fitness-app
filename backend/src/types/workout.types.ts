export interface CurrentWeights {
  benchPress?: number;
  squat?: number;
  deadlift?: number;
  militaryPress?: number;
  pullUps?: 'bodyweight' | 'weighted' | 'cant';
  pullUpsWeight?: number;
  other?: string;
}

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
  currentWeights?: CurrentWeights;
}

export interface ExerciseData {
  name: string;
  targetSets: number;
  targetReps: string; // e.g., "8-10"
  targetWeight?: number;
  restSeconds: number;
  notes?: string;
  technicalInstructions?: string;
  progressiveOverloadTips?: string;
  physicalCautions?: string;
  order: number;
}

export interface SessionData {
  name: string;
  dayNumber: number;
  order: number;
  exercises: ExerciseData[];
}

export interface AIWorkoutPlan {
  name: string;
  durationWeeks: number;
  sessions: SessionData[];
}
