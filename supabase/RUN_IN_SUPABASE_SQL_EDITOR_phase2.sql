-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul Phase 2 — My QCM / QCM Studio (user-created question sets)
--
-- Additive only. Does not touch the official question bank, quiz flow,
-- reports, or any existing table. Safe to run more than once.
-- Owner-only RLS on every table (defense-in-depth; the app layer also
-- enforces ownership because the service-role client bypasses RLS).
-- ════════════════════════════════════════════════════════════════

-- ── user_qcm_sets: a student's private practice set ───────────────
create table if not exists public.user_qcm_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null,
  custom_subject text,
  topic_id uuid references public.topics(id) on delete set null,
  custom_topic text,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  exam_date date,
  tags text[] not null default '{}',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_qcm_sets_owner_idx on public.user_qcm_sets(owner_id);

-- ── user_qcm_questions: the questions inside a set ────────────────
create table if not exists public.user_qcm_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.user_qcm_sets(id) on delete cascade,
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  source_note text,
  tags text[] not null default '{}',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_qcm_questions_set_idx on public.user_qcm_questions(set_id);
create index if not exists user_qcm_questions_owner_idx on public.user_qcm_questions(owner_id);

-- ── user_qcm_sessions: lightweight practice results (accuracy / last) ─
create table if not exists public.user_qcm_sessions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.user_qcm_sets(id) on delete cascade,
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  score_percent numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists user_qcm_sessions_set_idx on public.user_qcm_sessions(set_id);
create index if not exists user_qcm_sessions_owner_idx on public.user_qcm_sessions(owner_id);

-- ── keep updated_at fresh (touch_updated_at() defined in 0002_rls) ──
drop trigger if exists touch_user_qcm_sets on public.user_qcm_sets;
create trigger touch_user_qcm_sets before update on public.user_qcm_sets
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_user_qcm_questions on public.user_qcm_questions;
create trigger touch_user_qcm_questions before update on public.user_qcm_questions
  for each row execute function public.touch_updated_at();

-- ── Row Level Security: owner-only on all three tables ────────────
alter table public.user_qcm_sets      enable row level security;
alter table public.user_qcm_questions enable row level security;
alter table public.user_qcm_sessions  enable row level security;

-- Sets: the owner has full control; nobody else can read private drafts.
-- (Sharing is intentionally NOT enabled yet — see Phase 2B moderation plan.)
drop policy if exists user_qcm_sets_owner on public.user_qcm_sets;
create policy user_qcm_sets_owner on public.user_qcm_sets
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Questions: owner-only. Ownership is denormalised onto the row so the
-- policy stays a simple, fast equality check.
drop policy if exists user_qcm_questions_owner on public.user_qcm_questions;
create policy user_qcm_questions_owner on public.user_qcm_questions
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Practice sessions: owner-only.
drop policy if exists user_qcm_sessions_owner on public.user_qcm_sessions;
create policy user_qcm_sessions_owner on public.user_qcm_sessions
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Reload PostgREST schema cache so the new tables are queryable immediately.
notify pgrst, 'reload schema';
