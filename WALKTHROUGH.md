# PrepWise - AI Mock Interview Platform

PrepWise is a comprehensive platform built with Next.js 14, Designed to help users prepare for technical and behavioral interviews using AI voice agents.

## Core Features Implemented

### 1. Authentication
- **Firebase Auth**: Secure email/password authentication.
- **Session Management**: Server-side session cookies (7 days) using Firebase Admin SDK.
- **Protected Routes**: Automatic redirection for unauthenticated users in the root layout.

### 2. AI-Powered Generation
- **Voice Setup**: Users talk to an AI agent to define their target role, tech stack, and experience level.
- **Gemini Engine**: The platform uses Google's Gemini 1.5 Flash to generate tailored interview questions based on the voice input.
- **Automation**: Questions are automatically saved to Firestore for the user's practice session.

### 3. Live Mock Interviews
- **Web Speech API**: Uses high-fidelity browser-native speech recognition and synthesis for 100% free voice interaction.
- **Real-time Feedback**: Live transcript display during the interview.
- **Modular Agent**: A reusable `Agent` component that handles both interview setup and the actual mock interview using standard web standards.

### 4. Detailed Feedback System
- **Comprehensive Analysis**: Gemini analyzes the full interview transcript.
- **Scoring**: 0-100 scores across Communication, Technical Knowledge, Problem Solving, Cultural Fit, and Confidence.
- **Actionable Insights**: Highlights specific strengths and areas for improvement with constructive comments.

## Tech Stack
- **Next.js 15+** (App Router, Server Actions)
- **Tailwind CSS v4** (Advanced styling, custom patterns)
- **Firebase** (Firestore Database, Admin SDK, Client SDK)
- **Vercel AI SDK** (Model orchestration)
- **Google Gemini** (LLM for generation and feedback)
- **Web Speech API** (For free, unlimited STT and TTS)
- **Shadcn/UI** (Premium component library)

## Project Structure
- `/app/(auth)`: Sign-in and Sign-up logic with route protection.
- `/app/(root)`: Dashboard, interview generation, mockup room, and fee8dback pages.
- `/app/api/generate-interview`: Backend endpoint for AI question generation.
- `/components`: Reusable UI components including the complex `Agent` voice component.
- `/lib/actions`: Server-side logic for database operations and AI processing.

## Getting Started
1. Fill in the `.env.local` with your Firebase and Google AI keys.
2. Run `npm install`.
3. Start the dev server with `npm run dev`.
4. Register a new account and start practicing!