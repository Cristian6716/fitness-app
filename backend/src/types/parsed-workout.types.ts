/**
 * Types for parsed workout data from uploaded files
 */

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: string; // Can be "10", "8-12", "AMRAP", etc.
  weight?: number;
  restSeconds?: number;
  notes?: string;
}

export interface ParsedSession {
  name: string;
  dayNumber: number;
  exercises: ParsedExercise[];
}

export interface ParsedWorkout {
  name: string;
  durationWeeks?: number;
  frequency?: number; // Number of training sessions per week
  sessions: ParsedSession[];
}

export interface ParserResult {
  success: boolean;
  data?: ParsedWorkout;
  error?: string;
  warnings?: string[];
}
