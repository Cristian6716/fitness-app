export interface StartSessionRequest {
  sessionId: string;
}

export interface LogSetRequest {
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight: number;
}

export interface CompleteSessionRequest {
  rating?: number; // 1-5
  notes?: string;
}

export interface SessionMetrics {
  totalDurationSeconds: number;
  caloriesBurned: number;
  totalWeightLifted: number;
}
