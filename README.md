# 🎯 Intervex — AI-Powered Interview Practice Platform

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Primary%20DB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5.2-412991?style=for-the-badge&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Practice harder. Interview smarter.**

Intervex is a full-stack AI-powered mock interview platform that simulates real interviews — personalized from your resume, powered by GPT-5.2, with instant 6-dimension feedback, streaks, badges, and a full performance dashboard.

[🔗 View Repository](https://github.com/ibtesaamaslam/Intervex) · [🐛 Report Bug](https://github.com/ibtesaamaslam/Intervex/issues) · [✨ Request Feature](https://github.com/ibtesaamaslam/Intervex/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [User Flow](#-how-it-works--user-flow)
- [New Session Wizard](#-new-session-wizard)
- [Active Interview Session](#-active-interview-session)
- [AI Feedback System](#-ai-feedback-system)
- [Resume Upload & Parsing](#-resume-upload--parsing)
- [Verdict System](#-verdict-system)
- [Performance Dashboard](#-performance-dashboard)
- [Badge System](#-badge-system)
- [Drill Mode](#-drill-mode)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Architecture Decisions](#-architecture-decisions)
- [License](#-license)

---

## 📌 Overview

**Intervex** is a full-stack, AI-powered mock interview practice application that helps candidates prepare for technical and behavioral interviews. Users can practice answering questions by voice or text, receive instant AI-generated feedback on their performance, upload their resume so questions are personalized to their background, and track improvement over time via a performance dashboard with streaks, badges, and score history.

The name **Intervex** captures the idea of being challenged (*vex*) inside an interview — the app doesn't just throw random questions at you; it simulates a real interviewer who has read your resume and knows exactly what to ask.

---

## ✨ Features

### Core Interview Experience

- **Voice or text answers** — speak using your microphone or type your answer
- **AI-generated personalized questions** — tailored from your resume, target company, and interviewer persona
- **Real-time AI feedback** after every answer across 6 scored dimensions
- **Countdown timer** per question (configurable 30–300 seconds) to simulate real pressure
- **Side-by-side comparison** — toggle between your original answer and AI-improved version
- **Follow-up questions** — each answer generates 3 realistic follow-up prompts

### Feedback Dimensions

| Dimension | Range | What It Measures |
|---|---|---|
| **Clarity** | 0–10 | Structure and coherence of your answer |
| **Confidence** | 0–10 | Assertiveness, ownership, decisiveness |
| **Technical Depth** | 0–10 | Relevance and accuracy of technical content |
| **Communication** | 0–10 | Language quality, storytelling, conciseness |
| **STAR Score** | 0–10 | Adherence to Situation → Task → Action → Result |
| **Tone Analysis** | Label | confident / nervous / enthusiastic / monotone / uncertain / composed |
| **Filler Word Count** | Count | um, uh, like, you know, basically, literally + 10 more |

### Resume Intelligence

- **Upload PDF or DOCX** resume (up to 10 MB) with drag-and-drop
- Text extracted server-side using `pdf-parse` and `mammoth`
- AI reads your resume and asks about specific projects, companies, technologies, and accomplishments
- At least half of generated questions reference something directly from your resume

### Session Customization

- **4-step wizard:** Basics → Resume → Settings → Review
- **12 role presets** + custom role input
- **12 company presets** — Google, Meta, Amazon, Apple, Microsoft, Netflix, Stripe, Airbnb, Uber, Spotify, OpenAI, Other
- **3 interviewer personas:** Friendly 😊, Tough 💪, Technical 🧠
- **Timed Mode** with adjustable per-question countdown (30–300s)
- **Drill Mode** targeting your weakest areas from past sessions
- **Target interview date** with days-remaining countdown

---

## 🛠️ Tech Stack

### Frontend — `artifacts/interview-copilot`

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | Latest | Build tool + dev server |
| Tailwind CSS | Latest | Utility-first styling |
| Framer Motion | Latest | Animations and page transitions |
| TanStack Query | Latest | Server state management, caching |
| Wouter | Latest | Lightweight client-side routing |
| Recharts | Latest | Score history and weak areas charts |
| Lucide React | Latest | Icon set |

### Backend — `artifacts/api-server`

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24 | Runtime |
| Express | 5 | HTTP framework |
| TypeScript + tsx | Latest | Language + dev runner |
| Drizzle ORM | Latest | Type-safe database queries |
| PostgreSQL | Latest | Primary database |
| Zod | v4 | Request validation |
| OpenAI | gpt-5.2 | AI question generation and analysis |
| Multer | Latest | Multipart file upload handling |
| pdf-parse | Latest | PDF text extraction |
| mammoth | Latest | DOCX text extraction |
| esbuild | Latest | Production bundle |

### Shared Libraries — `lib/`

| Package | Purpose |
|---|---|
| `@workspace/db` | Drizzle schema + DB client |
| `@workspace/api-zod` | Shared Zod schemas |
| `@workspace/integrations-openai-ai-server` | OpenAI client wrapper |

---

## 📁 Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/                        # Express REST API (port 8080)
│   │   ├── src/
│   │   │   ├── index.ts                   # Entry point — reads PORT, starts server
│   │   │   ├── app.ts                     # Express setup — CORS, JSON, routes at /api
│   │   │   └── routes/
│   │   │       ├── index.ts               # Mounts all sub-routers
│   │   │       ├── health.ts              # GET /api/healthz
│   │   │       ├── sessions.ts            # CRUD sessions + POST /:id/end
│   │   │       ├── questions.ts           # GET /api/questions
│   │   │       ├── analyze.ts             # POST /api/analyze (AI scoring)
│   │   │       ├── answers.ts             # POST /api/answers (save answer + scores)
│   │   │       ├── generate-questions.ts  # POST /api/generate-questions (AI)
│   │   │       ├── parse-resume.ts        # POST /api/parse-resume (PDF/DOCX)
│   │   │       └── dashboard.ts           # GET /api/dashboard (stats + badges)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── interview-copilot/                 # React + Vite frontend
│       ├── src/
│       │   ├── main.tsx                   # React root mount
│       │   ├── App.tsx                    # Router setup
│       │   ├── lib/
│       │   │   ├── api.ts                 # All API calls via direct fetch
│       │   │   └── utils.ts               # cn(), getScoreColor(), getScoreBg()
│       │   ├── pages/
│       │   │   ├── home.tsx               # Landing / session list
│       │   │   ├── new-session.tsx        # 4-step session creation wizard
│       │   │   ├── active-session.tsx     # Live interview session
│       │   │   ├── dashboard.tsx          # Performance dashboard
│       │   │   └── review-session.tsx     # Post-session review
│       │   ├── components/
│       │   │   ├── layout.tsx             # App shell with sidebar
│       │   │   └── ui/
│       │   │       └── score-gauge.tsx    # Circular score display
│       │   └── hooks/
│       │       ├── use-voice.ts           # Web Speech API recording hook
│       │       └── use-toast.ts           # Toast notification hook
│       ├── vite.config.ts                 # Vite config — dedup + fs.strict:false
│       └── package.json
│
└── lib/
    ├── db/                                # @workspace/db
    │   ├── src/
    │   │   ├── index.ts                   # Drizzle client + schema exports
    │   │   └── schema/
    │   │       ├── sessions.ts            # sessions table
    │   │       └── answers.ts             # answers table
    │   └── drizzle.config.ts
    └── api-zod/                           # @workspace/api-zod
        └── src/
            └── index.ts                   # HealthCheckResponse schema
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL (provided automatically by Replit)

### Installation

```bash
# Install all workspace dependencies
pnpm install
```

### Database Setup

```bash
# Push schema to the database
pnpm --filter @workspace/db run push

# Force push if needed (destructive — dev only)
pnpm --filter @workspace/db run push-force
```

### Running in Development

```bash
# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend dev server
pnpm --filter @workspace/interview-copilot run dev
```

### Production Build

```bash
# Typecheck entire workspace
pnpm run typecheck

# Build all packages
pnpm run build
```

---

## 🔄 How It Works — User Flow

```
Visit App
    ↓
New Session → 4-Step Wizard
    ↓
Upload Resume & Configure Settings
    ↓
Session Created
    ↓
AI Generates Personalized Questions
    ↓
Answer Questions (Voice / Text + Timer)
    ↓
Instant AI Feedback — 6 Dimensions
    ↓
End Session
    ↓
Cinematic Verdict Overlay
    ↓
Performance Dashboard
```

---

## 🧙 New Session Wizard

The wizard runs across 4 animated steps:

**Step 1 — Basics**
- Session title (e.g. `Google L5 SWE Practice`)
- Role — 12 presets + custom input
- Company — 12 presets + Other

**Step 2 — Resume**
- Drag-and-drop PDF/DOCX upload or paste text directly
- Server-side parsing with live preview

**Step 3 — Settings**
- Interviewer Persona: Friendly 😊 · Tough 💪 · Technical 🧠
- Timed Mode + slider (30–300s per question)
- Drill Mode toggle
- Target interview date with countdown

**Step 4 — Review**
- Full configuration summary + "Start Session" button

---

## 🎙️ Active Interview Session

- Split-panel responsive layout
- Real-time question display with difficulty & category tags
- Voice input via Web Speech API or text fallback
- Circular SVG countdown timer with live color coding
- Instant feedback with score gauges, tone label, filler word count, strengths & improvements
- Side-by-side comparison mode — your answer vs AI-improved version

---

## 🤖 AI Feedback System

Every answer is analyzed via `POST /api/analyze` using **OpenAI gpt-5.2** with structured JSON output. Filler words are counted server-side via regex for accuracy and speed.

**Detected Filler Words:** `um`, `uh`, `like`, `you know`, `basically`, `literally`, `sort of`, `kind of`, `i mean`, `i guess`, `right`, `so`, `actually`, `just` and more.

**Persona Behavior:**

| Persona | AI Behavior |
|---|---|
| Friendly 😊 | Supportive, balanced, emphasizes positives and encouragement |
| Tough 💪 | Demanding, critical of vague or shallow answers |
| Technical 🧠 | Focuses on precision, depth, and technical correctness |

---

## 📄 Resume Upload & Parsing

- **Endpoint:** `POST /api/parse-resume`
- Accepts `.pdf`, `.doc`, `.docx` (max 10 MB)
- Text extracted, cleaned, and normalized server-side
- Returns parsed text with word count
- AI uses parsed resume to generate questions referencing specific projects, roles, and technologies

---

## 🏆 Verdict System

Session ends with a cinematic animated verdict overlay:

| Score Range | Verdict | Color | Icon |
|---|---|---|---|
| ≥ 7.5 | **You're Hired!** | Emerald Green | 🏆 |
| ≥ 5.5 | **Strong Candidate** | Amber | ⭐ |
| < 5.5 | **Not Selected** | Rose Red | ✗ |

---

## 📊 Performance Dashboard

- **🔥 Streak tracker** with fire emoji and contextual motivational messaging
- **4 stat cards:** total sessions · total questions answered · average overall score · badges earned
- **Skill breakdown gauges** — Clarity / Confidence / Tech Depth / Communication all-time averages
- **Score history line chart** — overall + clarity + technical depth over time (Recharts)
- **Weak areas horizontal bar chart** — 4 skill categories ranked by average score
- **8 achievement badges** with locked / earned visual states
- **Drill Mode CTA** — appears when a weak area is detected, pre-fills the drill session

---

## 🥇 Badge System

| Badge | ID | Earned When |
|---|---|---|
| You're Hired! | `first_hire` | At least 1 session score ≥ 7.5 |
| Practice Pro | `practice_pro` | 5+ total sessions completed |
| Tech Master | `tech_master` | Average technical depth ≥ 8.0 |
| 7-Day Streak | `seven_day_streak` | Current streak ≥ 7 consecutive days |
| Flawless | `perfect_score` | Any single answer scores ≥ 9.5 |
| STAR Storyteller | `star_storyteller` | Average STAR score ≥ 8.0 |
| Comeback Kid | `comeback_kid` | Latest session ≥ first session + 2.0 |
| Century Club | `century` | 100+ total answers submitted |

---

## 🎯 Drill Mode

Drill Mode automatically detects your weakest skill area based on historical performance and generates a targeted practice session focused exclusively on improving that dimension. Activated via the Drill Mode CTA on the dashboard or the toggle in the session wizard.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Create a new session |
| `GET` | `/api/sessions/:id` | Get session by ID |
| `POST` | `/api/sessions/:id/end` | End a session |
| `GET` | `/api/questions` | Get questions |
| `POST` | `/api/generate-questions` | AI-powered question generation |
| `POST` | `/api/analyze` | AI answer scoring (6 dimensions) |
| `POST` | `/api/answers` | Save answer + all dimension scores |
| `POST` | `/api/parse-resume` | Parse uploaded PDF/DOCX resume |
| `GET` | `/api/dashboard` | Fetch stats, scores, and badges |

---

## 🗄️ Database Schema

### `sessions` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | TEXT | Session name |
| `role` | TEXT | Target role |
| `company` | TEXT | Target company |
| `persona` | TEXT | Interviewer persona |
| `resume_text` | TEXT | Parsed resume content |
| `timed_mode` | BOOLEAN | Timer enabled |
| `question_time` | INTEGER | Seconds per question |
| `drill_mode` | BOOLEAN | Drill mode enabled |
| `target_date` | DATE | Target interview date |
| `overall_score` | FLOAT | Final session score |
| `ended_at` | TIMESTAMP | Session end time |
| `created_at` | TIMESTAMP | Session creation time |

### `answers` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key → sessions |
| `question` | TEXT | Question text |
| `answer` | TEXT | User's answer |
| `clarity` | FLOAT | Clarity score (0–10) |
| `confidence` | FLOAT | Confidence score (0–10) |
| `technical_depth` | FLOAT | Technical depth score (0–10) |
| `communication` | FLOAT | Communication score (0–10) |
| `star_score` | FLOAT | STAR framework score (0–10) |
| `tone` | TEXT | Detected tone label |
| `filler_count` | INTEGER | Filler word count |
| `improvements` | TEXT | AI improvement suggestions |
| `strengths` | TEXT | AI-identified strengths |
| `created_at` | TIMESTAMP | Answer submission time |

---

## 🔐 Environment Variables

| Variable | Description | Provided By |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Replit (auto) |
| `PORT` | Port for each service | Replit (auto) |
| `OPENAI_API_KEY` | OpenAI API key | Replit OpenAI Integration |
| `NODE_ENV` | `development` or `production` | Workflow |

---

## 🏛️ Architecture Decisions

- **Direct fetch over generated API client** — avoids module duplication across the monorepo
- **Server-side filler word counting** — exact regex matching, faster and more reliable than client-side
- **ESM + `createRequire` for `pdf-parse`** — resolves CommonJS/ESM interop issues in Node 24
- **`drizzle-kit push` instead of migrations** — faster iteration in Replit development environment
- **Wouter instead of React Router** — lightweight routing with zero configuration overhead
- **Zod v4 for validation** — shared schemas between frontend and backend via `@workspace/api-zod`
- **Framer Motion for verdict overlay** — cinematic animated transitions without complex CSS keyframes

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Ibtesaam Aslam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

<div align="center">

Built with ❤️ by **[Ibtesaam Aslam](https://github.com/ibtesaamaslam)**

⭐ If Intervex helped you land your next role, please consider giving it a star!

</div>
