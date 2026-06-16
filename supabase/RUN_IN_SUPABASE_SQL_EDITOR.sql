-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — full Supabase setup for SQL Editor
-- Run this in the Supabase Dashboard SQL Editor before `npm run seed:qcm`.
-- Safe to rerun: tables/indexes use IF NOT EXISTS; triggers/policies are
-- dropped and recreated without weakening RLS.
-- ════════════════════════════════════════════════════════════════

-- ================================
-- 0001_init.sql
-- ================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
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

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  color text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
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

create table if not exists public.questions (
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
create index if not exists questions_subject_idx on public.questions(subject_id);
create index if not exists questions_topic_idx on public.questions(topic_id);
create index if not exists questions_status_idx on public.questions(status);

create table if not exists public.quiz_sessions (
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
create index if not exists quiz_sessions_user_idx on public.quiz_sessions(user_id);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option text check (selected_option in ('A','B','C','D')),
  is_correct boolean not null default false,
  time_spent_seconds integer not null default 0,
  hint_used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists quiz_answers_session_idx on public.quiz_answers(session_id);

create table if not exists public.hint_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  hint_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.answer_reports (
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
create index if not exists answer_reports_status_idx on public.answer_reports(admin_status);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text,
  condition_type text,
  condition_value integer,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.posts (
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

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.challenges (
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

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_value integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

-- ================================
-- 0002_rls.sql
-- ================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_questions on public.questions;
create trigger touch_questions before update on public.questions
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_posts on public.posts;
create trigger touch_posts before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_challenge_progress on public.challenge_progress;
create trigger touch_challenge_progress before update on public.challenge_progress
  for each row execute function public.touch_updated_at();

alter table public.profiles            enable row level security;
alter table public.subjects            enable row level security;
alter table public.topics              enable row level security;
alter table public.questions           enable row level security;
alter table public.quiz_sessions       enable row level security;
alter table public.quiz_answers        enable row level security;
alter table public.hint_requests       enable row level security;
alter table public.answer_reports      enable row level security;
alter table public.badges              enable row level security;
alter table public.user_badges         enable row level security;
alter table public.posts               enable row level security;
alter table public.saved_posts         enable row level security;
alter table public.study_groups        enable row level security;
alter table public.study_group_members enable row level security;
alter table public.challenges          enable row level security;
alter table public.challenge_progress  enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists subjects_read on public.subjects;
create policy subjects_read on public.subjects
  for select to authenticated using (true);
drop policy if exists subjects_admin on public.subjects;
create policy subjects_admin on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists topics_read on public.topics;
create policy topics_read on public.topics
  for select to authenticated using (true);
drop policy if exists topics_admin on public.topics;
create policy topics_admin on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists questions_read_published on public.questions;
create policy questions_read_published on public.questions
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists questions_admin on public.questions;
create policy questions_admin on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists quiz_sessions_own on public.quiz_sessions;
create policy quiz_sessions_own on public.quiz_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists quiz_sessions_admin_read on public.quiz_sessions;
create policy quiz_sessions_admin_read on public.quiz_sessions
  for select to authenticated using (public.is_admin());

drop policy if exists quiz_answers_own on public.quiz_answers;
create policy quiz_answers_own on public.quiz_answers
  for all to authenticated using (
    exists (select 1 from public.quiz_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quiz_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );
drop policy if exists quiz_answers_admin_read on public.quiz_answers;
create policy quiz_answers_admin_read on public.quiz_answers
  for select to authenticated using (public.is_admin());

drop policy if exists hint_requests_own on public.hint_requests;
create policy hint_requests_own on public.hint_requests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists answer_reports_insert_own on public.answer_reports;
create policy answer_reports_insert_own on public.answer_reports
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists answer_reports_select_own on public.answer_reports;
create policy answer_reports_select_own on public.answer_reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists answer_reports_admin_update on public.answer_reports;
create policy answer_reports_admin_update on public.answer_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges
  for select to authenticated using (true);
drop policy if exists badges_admin on public.badges;
create policy badges_admin on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_badges_own on public.user_badges;
create policy user_badges_own on public.user_badges
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists user_badges_insert_own on public.user_badges;
create policy user_badges_insert_own on public.user_badges
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select to authenticated using (status = 'published' or public.is_admin());
drop policy if exists posts_admin on public.posts;
create policy posts_admin on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists saved_posts_own on public.saved_posts;
create policy saved_posts_own on public.saved_posts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists study_groups_read on public.study_groups;
create policy study_groups_read on public.study_groups
  for select to authenticated using (true);
drop policy if exists study_groups_admin on public.study_groups;
create policy study_groups_admin on public.study_groups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_group_members_read on public.study_group_members;
create policy study_group_members_read on public.study_group_members
  for select to authenticated using (true);
drop policy if exists study_group_members_own on public.study_group_members;
create policy study_group_members_own on public.study_group_members
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists challenges_read on public.challenges;
create policy challenges_read on public.challenges
  for select to authenticated using (true);
drop policy if exists challenges_admin on public.challenges;
create policy challenges_admin on public.challenges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists challenge_progress_own on public.challenge_progress;
create policy challenge_progress_own on public.challenge_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ================================
-- 0003_seed_metadata_fields.sql
-- ================================

alter table public.questions
  add column if not exists verification_status text
    check (verification_status in ('verified','needs_instructor_verification')),
  add column if not exists cognitive_level text
    check (cognitive_level in ('recall','understanding','application','analysis')),
  add column if not exists local_context_note text,
  add column if not exists hint_seed text,
  add column if not exists seed_key text;

-- PostgREST upsert conflict inference needs a non-partial unique index.
drop index if exists public.questions_seed_key_idx;
create unique index if not exists questions_seed_key_idx
  on public.questions(seed_key);

alter table public.challenges
  add column if not exists seed_key text;

drop index if exists public.challenges_seed_key_idx;
create unique index if not exists challenges_seed_key_idx
  on public.challenges(seed_key);

-- ================================
-- 0004_quiz_session_questions.sql
-- ================================

create table if not exists public.quiz_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_id),
  unique (session_id, order_index)
);

create index if not exists quiz_session_questions_session_idx
  on public.quiz_session_questions(session_id);

create index if not exists quiz_session_questions_question_idx
  on public.quiz_session_questions(question_id);

alter table public.quiz_session_questions enable row level security;

drop policy if exists quiz_session_questions_read_own on public.quiz_session_questions;
create policy quiz_session_questions_read_own on public.quiz_session_questions
  for select to authenticated using (
    exists (
      select 1
      from public.quiz_sessions s
      where s.id = session_id
        and (s.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists quiz_session_questions_admin_all on public.quiz_session_questions;
create policy quiz_session_questions_admin_all on public.quiz_session_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
