# Product Requirements Document - Fitness App MVP

## Overview
Mobile fitness app combining AI-generated workout programs with training tracking.

## MVP Features

### 1. User Authentication
- Email/password registration
- Login/logout
- Basic profile (age, weight, height, fitness level)

### 2. AI Workout Generator
**Input Questions:**
- Fitness goal (dropdown: muscle gain, strength, endurance, general fitness)
- Training frequency (3-6 days/week)
- Equipment (checkboxes: barbell, dumbbells, machines, bodyweight, resistance bands)
- Experience level (beginner/intermediate/advanced)

**Output:**
- Workout plan name (AI-generated)
- Duration: 4-12 weeks
- Training sessions with exercises, sets, reps, rest times

**AI Logic:**
- Use OpenAI GPT-4o-mini
- Prompt includes user answers + fitness best practices
- Generate structured JSON response
- Validate output (proper exercise names, realistic rep ranges)

### 3. Upload Workout Plan
**Supported Formats:**
- Excel (.xlsx): Parse to extract plan structure
- PDF: Extract text, parse to structure

**Required Parsing:**
- Plan name
- Sessions (day/name)
- Exercises per session
- Sets, reps, weight (if specified)
- Rest times (if specified, else default 60s)

### 4. Workout Tracker
**Session Screen:**
- Session timer (starts with first exercise)
- Exercise list (expandable)
- Per exercise: name, target sets/reps/weight
- Per set: 
  - Display target
  - "Complete" button → optional log actual reps/weight
  - Auto-start rest timer
  - Visual timer countdown

**Quick Complete:**
- "Complete All Sets" button per exercise (skip granular logging)

**Progressive Overload:**
- Store all logged sets (actual reps/weight)
- Future feature: suggest weight increases based on history

### 5. Session Report
**Calculated Metrics:**
- Total duration (session timer)
- Calories burned: (total_weight_lifted × 0.05) + (duration_minutes × 5)
- Total weight lifted: sum(sets × reps × weight)

**User Input:**
- Rating (1-5 stars)
- Notes (text field)

**Data Usage:**
- Save all feedback
- Future: AI uses feedback to improve future plans

## Out of Scope (Post-MVP)
- Photo upload for plans
- Social features
- Training diary
- Gamification
- Nutrition tracker

## Technical Constraints
- Must work offline (cached plans, sync when online)
- Session timer must not reset if app backgrounded
- Fast load times (<2s for main screens)

## Success Metrics
- User completes AI-generated plan flow
- User logs at least 3 workout sessions
- Session tracking works without bugs
- AI generates valid, usable workout plans