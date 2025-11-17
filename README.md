# Fitness App MVP

A complete fitness tracking application with AI-powered workout generation, built with React Native (Expo) and Node.js.

## ✅ MVP Complete - All Features Implemented!

### Features
1. **Authentication** - Email/password with profile data
2. **AI Workout Generation** - 4-step questionnaire with GPT-4o-mini
3. **Workout Management** - View, details, and delete plans
4. **Session Tracking** - Timer, set logging, rest timer, metrics

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (Supabase)
- OpenAI GPT-4o-mini
- JWT Authentication

### Mobile
- Expo (React Native) + TypeScript
- React Navigation
- Axios + AsyncStorage

## Quick Start

### Backend
```bash
cd backend
npm install
npm run prisma:migrate
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## API Endpoints

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/workouts/generate` - Generate AI workout
- `GET /api/workouts` - List plans
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/complete` - Finish session

Full documentation: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## Mobile Screens

**Auth Flow**
- Login / Register

**Main App**
- Home (generate workout button)
- Plans List
- Profile

**Workout Generator**
- Goal Selection
- Days Per Week
- Equipment
- Experience Level
- Generating (AI)

**Tracking**
- Plan Details
- Session Tracker (with timer, set logging, rest timer)
- Completion Modal

## Database Schema

- Users (auth + profile)
- WorkoutPlans (AI-generated plans)
- TrainingSessions (sessions per plan)
- Exercises (targets: sets, reps, weight)
- CompletedSessions (tracking with metrics)
- CompletedSets (progressive overload data)

## Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-proj-..."
JWT_SECRET="your-secret-key"
PORT=3000
```

### Mobile
Update API URL in `src/services/api.service.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP:3000/api';
```

## Project Structure
```
fitness-app/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # JWT auth
│   │   ├── utils/          # Prisma, AI service
│   │   └── types/          # TypeScript types
│   └── prisma/             # Database schema + migrations
├── mobile/
│   └── src/
│       ├── screens/        # All app screens
│       ├── navigation/     # React Navigation setup
│       ├── contexts/       # Auth context
│       ├── services/       # API client
│       └── types/          # TypeScript types
└── docs/                   # Product requirements
```

## Key Implementation Details

### Session Tracker
- Uses React hooks for timer management
- Tracks completion state per exercise/set
- Rest timer modal with countdown
- Auto-saves sets to backend
- Server calculates calories + weight lifted

### AI Generation
- Structured prompts for JSON output
- Validates response before saving
- Creates full plan hierarchy in one transaction

### Authentication
- JWT with 30-day expiration
- Auto-injects token in API requests
- Persistent login via AsyncStorage

## Troubleshooting

**Backend won't start**
- Check DATABASE_URL is valid
- Verify OPENAI_API_KEY is set

**Mobile can't connect**
- Use your machine's IP, not localhost
- Example: `http://192.168.1.10:3000/api`

**AI generation fails**
- Verify OpenAI API key
- Check billing/quota

## Production TODOs
- [ ] Use secure JWT_SECRET
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Setup error tracking (Sentry)
- [ ] Optimize database queries
- [ ] Add app icons/splash screen
- [ ] Handle app backgrounding for timer
- [ ] Implement offline sync

## Future Enhancements
- Upload plans (Excel/PDF)
- Training history view
- Progressive overload suggestions
- Exercise videos
- Social features
- Nutrition tracking

## License
MIT