# Svaeng-Yul

Svaeng-Yul is a mobile-first QCM practice platform for Cambodian healthcare,
medical, and nursing students. It is a learning project focused on quiz flows,
feedback, weak-area review, admin content tools, and safe AI-assisted hints.

## Problem

Students need simple ways to practice questions, understand weak points, and
retry difficult topics. Svaeng-Yul explores a calm study experience built around
one loop: practice, feedback, weak-area review, retry, and mastery.

## Features

- Demo mode with seeded questions and accounts, no external keys required
- Live Supabase mode with Auth, Postgres, and Row Level Security
- Subject, topic, practice, timed, weak-area, and challenge quiz flows
- Server-side scoring, XP, streaks, badges, and weak-area tracking
- AI hint and dispute-analysis routes with safe fallback behavior
- Admin tools for question import, reports, posts, and analytics

## Tech Stack

- Next.js, React, TypeScript
- Tailwind CSS and shadcn/ui-style primitives
- Supabase Auth, Postgres, and RLS for live mode
- Zod validation and server-side quiz scoring
- Optional Ollama or Anthropic-powered AI hints

## Screenshots

Screenshots should be added before this repo is used as a pinned portfolio
project.

Suggested folder:

```text
docs/screenshots/
```

## Run Locally

Demo mode works without Supabase keys:

```bash
npm install
npm run dev
```

Open the local dev URL and use the demo student or demo admin entry points.

## Environment Variables

Copy `.env.example` or `.env.local.example` to `.env.local` and fill real values
locally only.

Important:

- Never commit `.env.local`, `.env.production`, backup env files, or service
  role keys.
- The app stays usable in demo mode when Supabase values are absent.

## Going Live With Supabase

1. Create a Supabase project.
2. Fill local-only environment variables in `.env.local`.
3. Run migrations in `supabase/migrations/` in order.
4. Run `npm run seed:qcm` to seed the live database.
5. Restart the dev server and verify live mode.

## What I Learned

- How to design a full practice loop around student feedback
- How demo mode and live mode can share one data layer
- How Supabase RLS protects student/admin data
- How AI features need fallback behavior and safety boundaries
- Why public repos must never include local env backups

## AI Assistance

This project was built as a learning project with AI-assisted development, while
I reviewed, adjusted, and improved the implementation.

## Status

Active learning project. Demo mode is intended to work without external keys.
Live Supabase mode requires local environment variables and careful key
management.
