-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — initial schema
-- All tables use UUID primary keys and created_at timestamps.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── profiles ──────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  avatar_url text,
  role text not null default 'student' check (role in ('student','admin')),
  school text,
  study_year text,
  xp integer not null default 0,
  level integer not null default 1,
  streak_count integer not null default 0,
  last_study_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── subjects ──────────────────────────────────────────────────────
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  color text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── topics ────────────────────────────────────────────────────────
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  difficulty_level text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, slug)
);

-- ── questions ─────────────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  source_reference text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_subject_idx on public.questions(subject_id);
create index questions_topic_idx on public.questions(topic_id);
create index questions_status_idx on public.questions(status);

-- ── quiz_sessions ─────────────────────────────────────────────────
create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  topic_id uuid references public.topics(id),
  mode text not null check (mode in ('practice','timed','weak_area','challenge')),
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  score_percent numeric not null default 0,
  xp_earned integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index quiz_sessions_user_idx on public.quiz_sessions(user_id);

-- ── quiz_answers ──────────────────────────────────────────────────
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option text check (selected_option in ('A','B','C','D')),
  is_correct boolean not null default false,
  time_spent_seconds integer not null default 0,
  hint_used boolean not null default false,
  created_at timestamptz not null default now()
);
create index quiz_answers_session_idx on public.quiz_answers(session_id);

-- ── hint_requests ─────────────────────────────────────────────────
create table public.hint_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  hint_text text,
  created_at timestamptz not null default now()
);

-- ── answer_reports ────────────────────────────────────────────────
create table public.answer_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  session_id uuid references public.quiz_sessions(id) on delete set null,
  student_reason text not null,
  reference_note text,
  ai_verdict text,
  ai_confidence integer,
  ai_reason text,
  ai_suggested_action text,
  admin_status text not null default 'pending'
    check (admin_status in ('pending','approved','rejected','changed_answer','improved_explanation','marked_ambiguous')),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index answer_reports_status_idx on public.answer_reports(admin_status);

-- ── badges & user_badges ──────────────────────────────────────────
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text,
  condition_type text,
  condition_value integer,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ── posts & saved_posts ───────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  category text,
  author_id uuid references auth.users(id),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  read_time_minutes integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

-- ── study groups, challenges ──────────────────────────────────────
create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.study_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null,
  target_type text,
  target_value integer,
  xp_reward integer,
  badge_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_value integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);
