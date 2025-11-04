# Data Models

## User
- id: UUID
- email: string
- created_at: timestamp
- profile: JSON (age, weight, height, fitness_level)

## WorkoutPlan
- id: UUID
- user_id: UUID (FK)
- name: string
- duration_weeks: integer
- ai_generated: boolean
- ai_prompt_data: JSON (user answers)
- created_at: timestamp

## TrainingSession
- id: UUID
- plan_id: UUID (FK)
- name: string (e.g., "Day 1 - Push")
- day_number: integer
- order: integer

## Exercise
- id: UUID
- session_id: UUID (FK)
- name: string
- target_sets: integer
- target_reps: string (e.g., "8-10")
- target_weight: float (optional)
- rest_seconds: integer
- order: integer
- notes: string (optional)

## CompletedSession
- id: UUID
- session_id: UUID (FK)
- user_id: UUID (FK)
- started_at: timestamp
- completed_at: timestamp
- total_duration_seconds: integer
- calories_burned: integer (calculated)
- total_weight_lifted: float (calculated)
- rating: integer (1-5, optional)
- notes: text (optional)

## CompletedSet
- id: UUID
- completed_session_id: UUID (FK)
- exercise_id: UUID (FK)
- set_number: integer
- actual_reps: integer
- actual_weight: float
- completed_at: timestamp