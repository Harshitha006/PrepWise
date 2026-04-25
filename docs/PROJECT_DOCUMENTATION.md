# PrepWise — Complete Project Documentation

## 1) Problem Statement

Modern interview preparation is often:
- **Expensive** (paid mock interview platforms and coaching sessions)
- **Generic** (non-personalized questions that ignore a candidate’s resume)
- **Fragmented** (resume review, practice, and feedback are split across tools)
- **Low fidelity** (typing-only practice vs realistic spoken interview conditions)

### Objective
Build a single platform that helps users practice interviews end-to-end using:
1. Resume-aware question generation
2. Voice-based mock interview sessions
3. AI feedback and skill-gap analysis
4. Persistent user progress tracking

---

## 2) Solution Overview

PrepWise is a full-stack Next.js application that combines:
- **Firebase Authentication + Firestore** for identity and persistence
- **Google Gemini** for generation, analysis, and feedback
- **Web Speech API** for browser-native speech recognition and speech synthesis
- **Shadcn/Tailwind UI** for responsive product UX

The platform transforms a user’s resume and target role into a guided interview workflow:
**upload/analyze resume → generate tailored questions → conduct voice interview → save results → generate actionable feedback**.

---

## 3) Architecture (High-Level)

### Frontend Layer
- Next.js App Router pages and client components handle:
  - authentication entry and protected routes
  - resume upload and analysis views
  - interview setup/session UX
  - feedback/results dashboards

### Application/API Layer
- Next.js Route Handlers in `app/api/*` perform:
  - resume parsing (PDF/text)
  - ATS and skill-gap analysis
  - interview question generation
  - transcript feedback generation
  - session/result persistence

### Data/Infra Layer
- Firebase Admin SDK for secure server-side auth/session validation and Firestore access
- Firebase Client SDK for browser auth and user context

### AI/Analysis Layer
- Gemini models are used for:
  - structured resume extraction
  - skill-gap detection against role/JD
  - interview question generation
  - per-answer and overall interview evaluation

---

## 4) End-to-End Workflow

## Stage A — User Access & Identity
1. User signs in/up.
2. Session cookie is created and validated server-side.
3. Protected routes redirect unauthenticated users to sign-in.

## Stage B — Resume Intake & Analysis
1. User submits resume text or PDF.
2. Backend parses/normalizes text.
3. AI extracts structured profile data (skills, experience, projects, education).
4. Optional analyzers compute ATS score and skill-gap insights.
5. Results are persisted and exposed to preparation pages.

## Stage C — Interview Preparation
1. User chooses preparation flow and target context.
2. System loads profile/resume insights.
3. Backend generates personalized questions (technical/behavioral/situational/resume-based).
4. Interview session metadata and question set are stored.

## Stage D — Live Mock Interview
1. Session page loads the interview agent.
2. Voice interaction runs in browser using Web Speech API.
3. Candidate responses are tracked question-by-question.
4. On completion, answers + metadata are posted to persistence APIs.

## Stage E — Post-Interview Feedback
1. Transcript/answers are sent to feedback API.
2. AI produces:
   - overall score
   - rubric/category scores
   - answer-level strengths/improvements
   - recommended practice next steps
3. Results are displayed in feedback pages and tracked for user progress.

---

## 5) Module Breakdown

## A. Authentication & Session Management
- **Files:** `lib/actions/auth.action.ts`, `firebase/admin.ts`, `firebase/client.ts`, `app/(root)/layout.tsx`
- Responsibilities:
  - create/verify session cookies
  - fetch current user profile
  - guard private routes
  - initialize Firebase client/admin safely

## B. Resume Intelligence
- **Files:** `app/api/parse-resume/route.ts`, `app/api/upload-resume/route.ts`, `services/*resume*`, `services/atsScorer.ts`
- Responsibilities:
  - PDF/text ingestion
  - normalization and extraction
  - structured resume model generation
  - ATS-related scoring and analysis

## C. Skill Gap & Career Readiness
- **Files:** `app/api/skill-gap/route.ts`, `app/api/analyze-skill-gap/route.ts`, `services/skillGapAnalyzer.ts`, `services/skillAssessmentEngine.ts`
- Responsibilities:
  - compare candidate profile vs target role/JD
  - derive present/missing/partial skills
  - prioritize skills to improve

## D. Interview Generation & Delivery
- **Files:** `app/api/generate-interview/route.ts`, `app/api/generate-questions/route.ts`, `components/InterviewPrepareClient.tsx`, `components/InterviewAgent.tsx`, `components/InterviewSessionClient.tsx`
- Responsibilities:
  - generate personalized question sets
  - orchestrate live interview session UX
  - collect and serialize answers

## E. Feedback & Results
- **Files:** `app/api/interview-feedback/route.ts`, `app/api/generate-feedback/route.ts`, `app/api/save-interview-results/route.ts`, `components/InterviewResults.tsx`
- Responsibilities:
  - evaluate transcript/answers
  - compute section-wise and overall scores
  - store session outcomes and user stats

## F. Shared Data Access & Utilities
- **Files:** `lib/actions/general.action.ts`, `lib/actions/feedback.action.ts`, `lib/utils.ts`, `types/resume.ts`
- Responsibilities:
  - server-side Firestore queries
  - reusable AI feedback orchestration
  - common helpers and domain types

---

## 6) Tech Stack

### Core Runtime & Framework
- **Next.js 16.1.1** (App Router)
- **React 19.2.3**
- **TypeScript 5**

### UI/UX
- **Tailwind CSS v4**
- **Shadcn UI / Radix primitives**
- **Framer Motion**
- **Lucide React**

### Data & Auth
- **Firebase (Client + Admin SDK)**
- **Firestore**
- **Session cookies with server verification**

### AI & Processing
- **Google Gemini** (`@google/generative-ai`, `@ai-sdk/google`, `ai` SDK)
- **pdf-parse** for PDF text extraction
- **Web Speech API** for speech-to-text and text-to-speech

### Validation & Forms
- **Zod**
- **React Hook Form**

---

## 7) Implementation Details

## 7.1 Authentication Implementation
- `setSessionCookie` creates a 7-day HTTP-only cookie after token exchange.
- `getCurrentUser` verifies session cookie and hydrates user profile from Firestore.
- Root layout in protected app group redirects unauthenticated users.
- Firebase Admin initialization is guarded to avoid duplicate initialization under hot reload.

## 7.2 Resume Parsing Implementation
- `parse-resume` API accepts PDF, extracts text, cleans noise, and prompts Gemini for strict JSON output.
- Includes robustness against malformed model responses by boundary parsing fallback.
- Rejects empty/insufficient extraction and returns useful diagnostics.

## 7.3 Skill-Gap Analysis Implementation
- Aggregates explicit resume skills and implied skills from project/experience text.
- Uses Gemini with constrained JSON schema instructions.
- Returns present/missing/partial skills + prioritized learning roadmap + overall match score.

## 7.4 Interview Question Generation Implementation
- Prompt combines resume context, target role, experience level, focus areas, and missing skills.
- Enforces mixed question taxonomy and structured evaluation criteria.
- Returns machine-readable question objects used directly by interview flow.

## 7.5 Live Session + Persistence Implementation
- Client session component loads preparation context via user stats endpoint.
- Interview agent captures responses and completion callback persists results.
- Backend stores session completion, answers, questions, and updates user-level counters.

## 7.6 Feedback Engine Implementation
- Feedback API evaluates each answer plus holistic performance dimensions.
- Generates interview recommendation, next steps, and study topics.
- Output is normalized and score-clamped to avoid invalid ranges.

---

## 8) Data Model (Conceptual)

### Primary Collections
- `users`
  - identity, profile metadata, resume-derived summaries, counts
- `interviewSessions`
  - generated question set, status, timestamps
- `interviewResults`
  - answers, completion metadata, analysis state
- `interviews` / `feedback`
  - interview instances and generated evaluation payloads

### Key Domain Object
- `ParsedResume`
  - personal info, skills (technical/soft/tools/languages), experience, education, projects, certifications, achievements

---

## 9) API Surface (Representative)

- `POST /api/parse-resume`
- `POST /api/upload-resume`
- `POST /api/skill-gap`
- `POST /api/analyze-skill-gap`
- `POST /api/generate-interview`
- `POST /api/generate-questions`
- `POST /api/interview-feedback`
- `POST /api/generate-feedback`
- `POST /api/save-interview-results`
- `GET /api/user-stats`

Additional diagnostic/test endpoints exist for environment and model checks.

---

## 10) Deployment & Environment Requirements

### Required Environment Variables
- Firebase Client keys (`NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin keys (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- Gemini key (`GOOGLE_GENERATIVE_AI_API_KEY`)
- Base URL (`NEXT_PUBLIC_BASE_URL`)

### Local Run
```bash
npm install
npm run dev
```

---

## 11) Strengths of Current Implementation

- End-to-end workflow from resume intake to post-interview feedback
- Resume-aware prompting improves personalization quality
- Voice-based simulation increases realism at zero additional speech API cost
- Structured JSON responses make downstream UI deterministic
- Clear modular split between UI, APIs, services, and data actions

---

## 12) Suggested Next Improvements

1. Add stricter runtime schema validation at every AI response boundary.
2. Add queue/background jobs for long-running analysis tasks.
3. Add per-question audio persistence for replay-based coaching.
4. Add regression tests for prompt-output compatibility.
5. Add analytics dashboards for longitudinal user improvement trends.
