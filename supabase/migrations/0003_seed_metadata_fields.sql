-- ════════════════════════════════════════════════════════════════
-- Svaeng-Yul — seed/editorial metadata fields
-- Additive and idempotent. Safe to run on a DB that already has 0001+0002.
-- ════════════════════════════════════════════════════════════════

-- ── questions: editorial metadata + a stable upsert key ───────────
alter table public.questions
  add column if not exists verification_status text
    check (verification_status in ('verified','needs_instructor_verification')),
  add column if not exists cognitive_level text
    check (cognitive_level in ('recall','understanding','application','analysis')),
  add column if not exists local_context_note text,
  add column if not exists hint_seed text,
  add column if not exists seed_key text;

-- `seed_key` lets the seed script upsert questions idempotently.
-- PostgREST upsert conflict inference needs a non-partial unique index.
drop index if exists public.questions_seed_key_idx;
create unique index if not exists questions_seed_key_idx
  on public.questions(seed_key);

-- ── challenges: stable upsert key ─────────────────────────────────
alter table public.challenges
  add column if not exists seed_key text;

drop index if exists public.challenges_seed_key_idx;
create unique index if not exists challenges_seed_key_idx
  on public.challenges(seed_key);

-- Note: existing RLS policies on questions/challenges (see 0002_rls.sql)
-- already cover these columns. Students still have no UPDATE policy on
-- questions, so they cannot change verification_status or any answer key.
