# Fitness App MVP - Claude Code Development Prompt

## Project Overview
Build a mobile fitness app with AI workout generation and training tracking.

## Tech Stack
- Mobile: Expo (React Native) + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Supabase
- ORM: Prisma
- AI: OpenAI API (GPT-4o-mini)

## Documentation
All requirements are in `/docs` folder:
- PRD.md: Full product requirements
- DATA_MODELS.md: Database schema
- USER_FLOWS.md: User interaction flows
- TECH_STACK.md: Technical decisions

## Development Phases

### Phase 1: Project Setup
1. Initialize backend (Node + Express + TypeScript + Prisma)
2. Initialize mobile (Expo + TypeScript)
3. Setup Supabase connection
4. Create Prisma schema from DATA_MODELS.md
5. Setup OpenAI SDK

### Phase 2: Backend API
Build REST API endpoints:
- POST /auth/register
- POST /auth/login
- POST /workouts/generate (AI integration)
- POST /workouts/upload (Excel/PDF parsing)
- GET/POST /workouts
- GET/POST /sessions
- POST /sessions/:id/complete
- POST /sets/log

### Phase 3: Mobile App
Build screens in order:
1. Auth (register/login)
2. Main screen (generate/upload buttons)
3. AI generator (question flow)
4. Plan overview
5. Session tracker (with timers)
6. Session report

### Phase 4: Integration & Testing
- Connect mobile to backend API
- Test all user flows
- Handle offline scenarios
- Test timer reliability

## Key Requirements
- TypeScript strict mode
- Error handling everywhere
- Input validation (backend + frontend)
- Async storage for offline functionality
- Background timer support (iOS/Android)

## MVP Scope
Include ONLY:
✅ AI workout generation (4 questions)
✅ Excel/PDF upload
✅ Full workout tracker with timers
✅ Session reports with metrics
✅ User feedback collection

Exclude:
❌ Photo upload
❌ Social features
❌ Advanced analytics
❌ Gamification

## Start Here
Begin with Phase 1. Ask clarifying questions if requirements are unclear.