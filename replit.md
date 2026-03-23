# Workspace

## Overview

**Intervex** — AI-powered real-time interview practice web app. pnpm monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind + Framer Motion + Recharts + TanStack Query
- **AI**: OpenAI (gpt-5.2) via `@workspace/integrations-openai-ai-server`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── interview-copilot/  # React+Vite frontend
├── lib/
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations/       # OpenAI integration
```

## Application Features

### Intervex
AI-powered mock interview practice with:
- 4-step new session wizard (Basics → Resume → Settings → Review)
- AI-generated personalized questions (from resume + company + persona)
- Voice recording or text answers
- Real-time analysis: clarity, confidence, tech depth, communication (0-10)
- STAR score (0-10) + STAR feedback
- Tone analysis badge (confident/nervous/enthusiastic etc.)
- Filler word detection & count
- Side-by-side answer comparison (original vs improved)
- Countdown timer (timed mode, configurable per-question)
- Hired / Borderline / Not Hired verdict overlay at session end
- Performance dashboard: streak tracker, 8 achievement badges, score history chart, weak areas bar chart
- Drill Mode: focuses questions on weakest area from dashboard

### Verdict Thresholds
- Hired: ≥ 7.5
- Borderline: ≥ 5.5
- Not Hired: < 5.5

### 8 Badge System
first_hire, practice_pro, tech_master, seven_day_streak, perfect_score, star_storyteller, comeback_kid, century

## Key Files

### Backend
- `artifacts/api-server/src/routes/index.ts` — route registration
- `artifacts/api-server/src/routes/sessions.ts` — CRUD + end session
- `artifacts/api-server/src/routes/analyze.ts` — AI analysis (STAR, tone, filler)
- `artifacts/api-server/src/routes/generate-questions.ts` — AI question generation
- `artifacts/api-server/src/routes/answers.ts` — save answers
- `artifacts/api-server/src/routes/dashboard.ts` — stats, badges, streak

### Frontend
- `artifacts/interview-copilot/src/lib/api.ts` — all API calls (direct fetch, no generated client)
- `artifacts/interview-copilot/src/pages/new-session.tsx` — 4-step wizard
- `artifacts/interview-copilot/src/pages/active-session.tsx` — interview session with timer, analysis
- `artifacts/interview-copilot/src/pages/dashboard.tsx` — performance dashboard

## Critical Notes

- **Do NOT use `@workspace/api-client-react`** — causes duplicate React instances. All API calls go through `src/lib/api.ts` with direct fetch.
- Vite config: `dedupe: ["react", "react-dom", "@tanstack/react-query"]` — must stay.
- API runs on port 8080; frontend on `$PORT`; API prefix is `/api`.
- Use `gpt-5.2` model for all AI routes.
- DB push: `pnpm --filter @workspace/db run push` (fallback: `push-force`).

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (`composite: true`). Run `pnpm run typecheck` from root for full type check.

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`
