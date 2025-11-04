# User Flows

## 1. Registration Flow
1. User opens app → Registration screen
2. Enter email + password
3. Enter basic info: age, weight, height, fitness level
4. → Main screen

## 2. AI Workout Generation Flow
1. Main screen → "Generate Workout" button
2. Question screen 1: Goal (muscle gain/strength/endurance)
3. Question screen 2: Days per week (3-6)
4. Question screen 3: Equipment available (gym/home/bodyweight)
5. Question screen 4: Experience level (beginner/intermediate/advanced)
6. → Loading (AI generates plan)
7. → Plan overview screen (name, duration, sessions list)
8. → User can start first session or view full plan

## 3. Workout Tracking Flow
1. Select training session from plan
2. → Session screen showing exercises list
3. Tap exercise → Expand to show sets
4. For each set:
   - Show: target reps, target weight, rest time
   - Tap "Complete" → Log actual reps/weight (or skip)
   - Timer auto-starts for rest period
5. Complete all sets → Mark exercise done
6. Complete all exercises → Session summary
7. Session summary:
   - Total duration
   - Calories burned
   - Total weight lifted
   - Rating (1-5 stars)
   - Notes field
8. Save → Back to main screen

## 4. Upload Plan Flow (Excel/PDF)
1. Main screen → "Upload Plan" button
2. File picker → Select Excel or PDF
3. → Loading (parse file)
4. → Plan preview/edit screen
5. Confirm → Plan saved
6. → Main screen with uploaded plan