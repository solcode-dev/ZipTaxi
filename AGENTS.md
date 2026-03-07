# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ZipTaxi is a React Native (TypeScript) mobile app for Korean taxi drivers to track daily/monthly revenue, set income goals, and receive AI-powered insights. The UI is entirely in Korean.

## Build and Run Commands

- **Start Metro bundler**: `npx react-native start`
- **Run on Android**: `npx react-native run-android`
- **Run on iOS**: `npx react-native run-ios`
- **Lint**: `npm run lint` (ESLint with `@react-native` config)
- **Run all tests**: `npm test` (Jest with `react-native` preset)
- **Run a single test**: `npx jest __tests__/App.test.tsx`
- **TypeScript check**: `npx tsc --noEmit`
- **Install dependencies**: `npm install`
- **iOS pods**: `cd ios && bundle exec pod install`

## Architecture

### Tech Stack
- **Frontend**: React Native 0.82 + TypeScript
- **Backend/DB**: Firebase (Firestore + Auth) via `@react-native-firebase/*`
- **AI**: OpenAI API (GPT-4o-mini) — API key loaded from `.env` via `react-native-dotenv`
- **Data fetching**: TanStack React Query (QueryClientProvider wraps the app in `App.tsx`)
- **Navigation**: React Navigation (native stack) — all routes defined in `src/navigation/AppNavigator.tsx`
- **Charts**: `react-native-gifted-charts` (BarChart)

### Path Aliases
Configured in both `tsconfig.json` and `babel.config.js` (via `babel-plugin-module-resolver`):
- `@components/*` → `src/components/*`
- `@screens/*` → `src/screens/*`
- `@navigation/*` → `src/navigation/*`
- `@utils/*` → `src/utils/*`
- `@theme/*` → `src/theme/*`
- `@hooks/*` → `src/hooks/*`
- `@assets/*` → `src/assets/*`

### Navigation Flow
`RootStackParamList` in `AppNavigator.tsx` defines four screens:
1. **Login** → entry point, auto-redirects to Dashboard if already authenticated
2. **Signup** → creates Firebase Auth account + Firestore user doc
3. **Dashboard** → main screen showing revenue stats, daily goal, streak, weekly chart
4. **GoalSetting** → set/edit monthly revenue goal (receives `initialGoal` param)

### Firebase Data Model
All data lives in Firestore under `users/{uid}`:
- **User document fields**: `name`, `username`, `email`, `totalRevenue`, `todayRevenue`, `monthlyRevenue`, `monthlyGoal`, `lastRevenueDate`, `currentStreak`, `maxStreak`, `freezeCount`, `lastGoalDate`, `createdAt`, `role`
- **Subcollection `revenues`**: individual revenue records with `amount`, `source` (kakao|card|cash|other), `dateStr` (YYYY-MM-DD), `timestamp`, `note`

Revenue writes use Firestore **transactions** (`runTransaction`) to atomically update both the individual record and the aggregate fields on the user document. Deletion similarly uses transactions to roll back aggregates.

### Auth Pattern
Users register with a plain username (not email). The app appends `@ziptaxi.com` to create a Firebase Auth email (e.g., `myid` → `myid@ziptaxi.com`). This happens in both `LoginScreen` and `SignupScreen`.

### Key Custom Hooks (src/hooks/)
- **useRevenueTracker**: Real-time subscription to user's revenue aggregates; provides `addRevenue` / `deleteRevenue` (both transactional)
- **useDailyGoalCalculator**: Pure computation (no side effects) — derives daily target from monthly goal and current progress, rounds to 100원 units, returns motivational status messages
- **useStreakCalculator**: Tracks consecutive goal-achievement days, awards "freeze tokens" (휴무권) every 7 consecutive days, consumes freezes to cover missed days
- **useWeeklyRevenue**: Queries this week's (Mon–Sun) revenue records and formats data for `react-native-gifted-charts` BarChart

### Theme System
Centralized in `src/theme/index.ts` — provides `colors`, `typography`, `spacing`, and `borderRadius` tokens. All components reference this theme object for consistent styling.

### Shared UI Component
`CustomAlert` (`src/components/CustomAlert.tsx`) is used across all screens as a modal alert replacement (supports confirm/cancel actions). Always use this instead of React Native's built-in `Alert`.

## Environment Variables
The app uses `react-native-dotenv` to load environment variables from `.env` (gitignored). Required variable:
- `OPENAI_API_KEY` — used in `src/ai/openaiService.ts`

Import env vars via `import { VAR_NAME } from '@env'`.

## Commit Convention
Conventional Commits format (see `.gitmessage.txt`): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
