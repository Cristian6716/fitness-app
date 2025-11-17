# Fitness App Backend API Documentation

Base URL: `http://localhost:3000/api`

## Authentication Endpoints

### Register
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "profile": {
    "age": 25,
    "weight": 75,
    "height": 180,
    "fitness_level": "intermediate"
  }
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": { ... }
  }
}
```

### Login
**POST** `/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": { ... }
  }
}
```

---

## Workout Endpoints

All workout endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Generate Workout Plan
**POST** `/workouts/generate`

Generate an AI-powered workout plan.

**Request Body:**
```json
{
  "goal": "muscle_gain",
  "daysPerWeek": 4,
  "equipment": ["barbell", "dumbbells", "machines"],
  "experience": "intermediate"
}
```

**Options:**
- `goal`: `muscle_gain` | `strength` | `endurance` | `general_fitness`
- `daysPerWeek`: 3-6
- `equipment`: Array of equipment types
- `experience`: `beginner` | `intermediate` | `advanced`

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "8-Week Muscle Building Program",
  "durationWeeks": 8,
  "aiGenerated": true,
  "trainingSessions": [
    {
      "id": "uuid",
      "name": "Day 1 - Push",
      "dayNumber": 1,
      "order": 1,
      "exercises": [
        {
          "id": "uuid",
          "name": "Barbell Bench Press",
          "targetSets": 4,
          "targetReps": "8-10",
          "targetWeight": null,
          "restSeconds": 120,
          "notes": "Keep elbows at 45 degrees",
          "order": 1
        }
      ]
    }
  ]
}
```

### Get All Workout Plans
**GET** `/workouts`

Get all workout plans for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "8-Week Muscle Building Program",
    "durationWeeks": 8,
    "aiGenerated": true,
    "trainingSessions": [ ... ]
  }
]
```

### Get Workout Plan by ID
**GET** `/workouts/:id`

Get a specific workout plan with all sessions and exercises.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "8-Week Muscle Building Program",
  "durationWeeks": 8,
  "trainingSessions": [ ... ]
}
```

### Delete Workout Plan
**DELETE** `/workouts/:id`

Delete a workout plan and all associated data.

**Response:** `200 OK`
```json
{
  "message": "Workout deleted successfully"
}
```

---

## Session Tracking Endpoints

All session endpoints require authentication.

### Start Session
**POST** `/sessions/:id/start`

Start tracking a training session.

**Parameters:**
- `:id` - Training session ID

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "sessionId": "training-session-uuid",
  "userId": "user-uuid",
  "startedAt": "2025-11-04T17:00:00.000Z",
  "completedAt": "2025-11-04T17:00:00.000Z",
  "totalDurationSeconds": 0,
  "caloriesBurned": 0,
  "totalWeightLifted": 0
}
```

### Log Set
**POST** `/sessions/:id/log-set`

Log a completed set during a training session.

**Parameters:**
- `:id` - Completed session ID

**Request Body:**
```json
{
  "exerciseId": "uuid",
  "setNumber": 1,
  "actualReps": 10,
  "actualWeight": 80
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "completedSessionId": "uuid",
  "exerciseId": "uuid",
  "setNumber": 1,
  "actualReps": 10,
  "actualWeight": 80,
  "completedAt": "2025-11-04T17:05:00.000Z"
}
```

### Complete Session
**POST** `/sessions/:id/complete`

Finalize a training session with metrics and feedback.

**Parameters:**
- `:id` - Completed session ID

**Request Body:**
```json
{
  "rating": 4,
  "notes": "Great workout, felt strong today"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "sessionId": "training-session-uuid",
  "userId": "user-uuid",
  "startedAt": "2025-11-04T17:00:00.000Z",
  "completedAt": "2025-11-04T18:15:00.000Z",
  "totalDurationSeconds": 4500,
  "caloriesBurned": 425,
  "totalWeightLifted": 5200,
  "rating": 4,
  "notes": "Great workout, felt strong today",
  "completedSets": [ ... ]
}
```

**Metrics Calculation:**
- `totalDurationSeconds`: Time from start to completion
- `caloriesBurned`: `(totalWeightLifted × 0.05) + (durationMinutes × 5)`
- `totalWeightLifted`: Sum of all `(reps × weight)` for all sets

### Get Session History
**GET** `/sessions/:id/history`

Get all completed sessions for a specific training session.

**Parameters:**
- `:id` - Training session ID

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "sessionId": "training-session-uuid",
    "startedAt": "2025-11-04T17:00:00.000Z",
    "completedAt": "2025-11-04T18:15:00.000Z",
    "totalDurationSeconds": 4500,
    "caloriesBurned": 425,
    "totalWeightLifted": 5200,
    "rating": 4,
    "notes": "Great workout",
    "completedSets": [ ... ]
  }
]
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "error": "Missing required fields"
}
```

**401 Unauthorized**
```json
{
  "error": "Access token required"
}
```

**403 Forbidden**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict**
```json
{
  "error": "User already exists"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```
