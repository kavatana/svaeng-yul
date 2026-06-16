-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — persisted randomized quiz question mapping
-- Additive and idempotent. Safe to run after 0001–0003.
-- ════════════════════════════════════════════════════════════════

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

-- Direct student writes stay closed. Server-side quiz creation uses the
-- service role, while admins may inspect/repair mappings if needed.
drop policy if exists quiz_session_questions_admin_all on public.quiz_session_questions;
create policy quiz_session_questions_admin_all on public.quiz_session_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
