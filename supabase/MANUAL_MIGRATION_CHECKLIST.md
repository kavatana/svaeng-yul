# Svaeng-Yul Manual Supabase Migration Checklist

Use this when the remote Supabase database has no Svaeng-Yul app schema yet.
Do not paste secrets into chat, and do not commit `.env.local`.

## 1. Apply the SQL

1. Open the Supabase Dashboard.
2. Open the Svaeng-Yul project.
3. Go to **SQL Editor**.
4. Open local file `supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql`.
5. Paste the full SQL into the SQL Editor.
6. Run the SQL.
7. Confirm it completes without errors.

## 2. Confirm Tables Exist

The migration should create these public tables:

- `profiles`
- `subjects`
- `topics`
- `questions`
- `quiz_sessions`
- `quiz_session_questions`
- `quiz_answers`
- `hint_requests`
- `answer_reports`
- `badges`
- `user_badges`
- `posts`
- `saved_posts`
- `challenges`
- `challenge_progress`

Run this in SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

## 3. Confirm RLS Is Enabled

Run this in SQL Editor:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Expected: every Svaeng-Yul app table should show `rowsecurity = true`.

## 4. Confirm Seed Counts Before Seeding

These counts may be `0` immediately after migration and before `npm run seed:qcm`:

```sql
select count(*) from subjects;
select count(*) from topics;
select count(*) from questions;
select count(*) from posts;
select count(*) from challenges;
select count(*) from badges;
```

## 5. Return To Terminal And Seed

From the project root:

```bash
npm run seed:qcm
npm run seed:qcm
```

Run it twice. The second run confirms idempotency and should not create duplicate seed rows.

Expected seeded counts:

- `subjects`: 5
- `questions`: 50
- `posts`: 8
- `challenges`: 5
- `badges`: badge catalog seeded
- `topics`: seed topic count from `src/data/seed/topics.ts`

## 6. Confirm Seed Counts After Seeding

Run:

```sql
select count(*) from subjects;
select count(*) from topics;
select count(*) from questions;
select count(*) from posts;
select count(*) from challenges;
select count(*) from badges;
```

Also verify no duplicate questions by seed key:

```sql
select seed_key, count(*)
from questions
where seed_key is not null
group by seed_key
having count(*) > 1;
```

Expected: zero rows.

## 7. Start App And Run Live Smoke Test

After migration and two successful seed runs:

```bash
npm run dev
```

Then run the live student/admin smoke test:

- Create a student account.
- Create an admin account.
- Promote the admin with `profiles.role = 'admin'`.
- Student: login, open `/home`, start quiz, request hint, report a question, submit quiz, view result.
- Admin: open admin pages, view questions, import CSV, review reports, create/archive questions.

Do not run this smoke test until the migration and seed verification steps pass.
