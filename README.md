# Svaeng-Yul 🌙

> Practice QCM. Find weak points. Understand faster.

A calm, dark-mode, mobile-first QCM practice platform for Cambodian healthcare /
medical / nursing students. Built around one loop: **Practice → Feedback → Weak
Area → Retry → Mastery.** Visual direction: **Midnight Study Clinic** — dreamy
dark mode, soft glowing cards, late-night study mood.

**Live demo:** [svaeng-yul-demo.vercel.app](https://svaeng-yul-demo.vercel.app)
— runs in demo mode (no setup, no account needed; tap **Demo student** or
**Demo admin** to explore).

## Two ways to run

Svaeng-Yul runs in **two modes**, decided automatically by environment variables:

| Mode | When | Data |
|---|---|---|
| **Demo** (default) | No Supabase env set | In-memory store seeded with the 5 subjects, 50 questions, badges, posts, challenges, and demo accounts. Resets on server restart. |
| **Live** | Supabase env set | Real Supabase Auth + Postgres + Row Level Security. |

This lets you explore the entire app — quizzes, XP, badges, AI hints, admin
review — with **zero setup**, then wire up Supabase when ready.

## Quick start (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. On the login screen, tap **Demo student** or
**Demo admin** to jump straight in. (Or sign in with `student@svaeng.app` /
`admin@svaeng.app`, password `password`.)

> Works great on a phone — open the dev URL on your device on the same network
> (add your machine's LAN IP to `allowedDevOrigins` in `next.config.ts`).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** + **shadcn/ui** (base-ui primitives)
- **Supabase** Auth + Postgres + RLS (live mode)
- **Anthropic SDK** for AI hints & dispute analysis
- **Zod** validation, **React Hook Form**-ready forms, **date-fns**, **sonner** toasts

## The core loop

1. Sign in → personalized **home** with one clear recommended action.
2. Pick a **subject → topic → mode** (Practice / Timed / Weak Area / Challenge).
3. Answer one question at a time, with a countdown timer in timed modes.
4. Stuck? Ask the **AI for a hint** — it gives a conceptual clue, never the answer.
5. Submit → **server-side scoring**, instant result: score, XP, streak, level,
   badges, weak areas, per-question explanations.
6. Spot a wrong answer key? **Report it.** AI analyzes the dispute and suggests a
   verdict; an **admin** makes the final call. AI never changes content itself.

## Project structure

```
src/
  app/
    (auth)/         login, register
    (student)/      home, subjects, quiz, my-qcm, posts, leaderboard, profile
    admin/          dashboard, questions, import, reports, posts, users, analytics
    api/            ai/hint, ai/dispute, quiz/start, quiz/submit, reports/create
  components/       layout, student, quiz, qcm, admin, posts, gamification, ui
  lib/
    auth/           session + server actions (sign in/up/out, profile)
    data/           repository API (memory + Supabase) — single data layer
    qcm/            My QCM server actions (user-created practice sets)
    quiz/           server-side scoring
    gamification/   XP, levels, streaks, badges
    ai/             Anthropic client, hint (+ safety check), dispute analysis
    csv/            CSV import parser/validator
    supabase/       browser / server / admin clients (live mode)
    validators.ts   Zod schemas
  data/seed.ts      demo seed content
supabase/
  migrations/       0001_init.sql through 0005_user_qcm.sql
  seed.sql          structural seed (subjects, topics, badges, posts, challenges)
public/
  sample-questions.csv   importable question set (also seeds live-mode questions)
```

## Going live with Supabase

1. Create a Supabase project. Copy `.env.local.example` → `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
2. Run the migrations (Supabase SQL editor or CLI), in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_seed_metadata_fields.sql`
   - `supabase/migrations/0004_quiz_session_questions.sql`
   - `supabase/migrations/0005_user_qcm.sql`
3. Run `npm run seed:qcm` to seed subjects, topics, questions, badges, posts,
   and challenges idempotently.
4. Restart the dev server. The app now uses real auth + Postgres + RLS.

> **Make yourself an admin:** after signing up, set your `profiles.role` to
> `admin` in the Supabase table editor.

### Security notes (live mode)

- **Scoring is always server-side** — the client only sends selected options.
- **RLS** protects every table; students can never update a `correct_option` or
  `explanation` (no student UPDATE policy on `questions`). See `0002_rls.sql`.
- Admin routes are protected server-side via `requireAdmin()`.
- The service-role key is server-only and never shipped to the client.

## AI

Set `AI_HINT_PROVIDER=ollama` and `OLLAMA_HINT_MODEL=qwen2.5:14b` to use a
local Ollama model for live quiz hints. Set `ANTHROPIC_API_KEY` only if you
want live admin dispute suggestions; without it, the app returns safe canned
hints and a neutral dispute verdict, so everything still works.

- **Hints** (`/api/ai/hint`, Ollama or Haiku) — conceptual clues only. A
  safety check (`lib/ai/safety.ts`) rejects any hint that names or reveals an
  option and substitutes a safe fallback.
- **Dispute analysis** (`/api/ai/dispute`, Opus by default) — conservative
  verdict + confidence + suggested admin action. **Never edits content.**

Models are configurable via `OLLAMA_HINT_MODEL`, `ANTHROPIC_HINT_MODEL`, and
`ANTHROPIC_DISPUTE_MODEL`.

## Seed data & QCM bank

A large practice bank of **~1,750 QCM** across 5 subjects (nursing, history,
demography, embryology, infectious disease) lives in `src/data/seed/`. It powers demo
mode automatically. **Important: this bank is machine-assembled and NOT yet
instructor-verified** — answer keys and explanations are pending human review, so every
item is flagged `needs_instructor_verification` until a qualified instructor signs off. See **[docs/seed-data.md](docs/seed-data.md)** for details,
plus `data/admin-upload-test-plan.md` and `data/instructor-review-checklist.md`.

```bash
npm run validate:qcm     # validate the bank (distribution + risk rules)
npm run export:qcm-csv    # regenerate data/* artifacts + public/sample-questions.csv
npm run seed:qcm          # seed a live Supabase project (needs env + migrations 0001–0005)
```

> Educational practice only. The bank is **not yet instructor-verified** — all items
> are flagged `needs_instructor_verification`; answer keys and explanations still need
> review by a qualified instructor. Not final exam content, and not medical advice.

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

---

For study practice only. Not medical diagnosis or treatment advice.
