-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — helper functions, triggers, and Row Level Security
-- ════════════════════════════════════════════════════════════════

-- ── is_admin(): true when the current user has the admin role ─────
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

-- ── auto-create a profile row when a new auth user signs up ───────
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

-- ── keep updated_at fresh ─────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_questions before update on public.questions
  for each row execute function public.touch_updated_at();
create trigger touch_posts before update on public.posts
  for each row execute function public.touch_updated_at();

-- ── enable RLS everywhere ─────────────────────────────────────────
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

-- ── profiles ──────────────────────────────────────────────────────
-- Anyone signed in may read profiles (leaderboard shows safe fields only,
-- enforced at the query layer). Users update only their own; admins manage all.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── subjects / topics: read by all, write by admins ──────────────
create policy subjects_read on public.subjects
  for select to authenticated using (true);
create policy subjects_admin on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy topics_read on public.topics
  for select to authenticated using (true);
create policy topics_admin on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── questions: students read PUBLISHED only; admins manage all ────
create policy questions_read_published on public.questions
  for select to authenticated using (status = 'published' or public.is_admin());
create policy questions_admin on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Note: there is no student UPDATE policy, so students can never change a
-- correct_option or explanation. Content changes flow only through admins.

-- ── quiz_sessions: students own theirs; admins read all ───────────
create policy quiz_sessions_own on public.quiz_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy quiz_sessions_admin_read on public.quiz_sessions
  for select to authenticated using (public.is_admin());

-- ── quiz_answers: tied to a session the user owns ─────────────────
create policy quiz_answers_own on public.quiz_answers
  for all to authenticated using (
    exists (select 1 from public.quiz_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quiz_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );
create policy quiz_answers_admin_read on public.quiz_answers
  for select to authenticated using (public.is_admin());

-- ── hint_requests: own only ───────────────────────────────────────
create policy hint_requests_own on public.hint_requests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── answer_reports: students create/read own; admins review all ───
create policy answer_reports_insert_own on public.answer_reports
  for insert to authenticated with check (user_id = auth.uid());
create policy answer_reports_select_own on public.answer_reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy answer_reports_admin_update on public.answer_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── badges: read by all; admins manage ───────────────────────────
create policy badges_read on public.badges
  for select to authenticated using (true);
create policy badges_admin on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy user_badges_own on public.user_badges
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy user_badges_insert_own on public.user_badges
  for insert to authenticated with check (user_id = auth.uid());

-- ── posts: read published (or admin); admins manage ──────────────
create policy posts_read on public.posts
  for select to authenticated using (status = 'published' or public.is_admin());
create policy posts_admin on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy saved_posts_own on public.saved_posts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── study groups & challenges ─────────────────────────────────────
create policy study_groups_read on public.study_groups
  for select to authenticated using (true);
create policy study_groups_admin on public.study_groups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy study_group_members_read on public.study_group_members
  for select to authenticated using (true);
create policy study_group_members_own on public.study_group_members
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy challenges_read on public.challenges
  for select to authenticated using (true);
create policy challenges_admin on public.challenges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy challenge_progress_own on public.challenge_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
