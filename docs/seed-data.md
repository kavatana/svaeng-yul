# Seed data & the QCM bank

Svaeng-Yul ships a verified seed bank of **50 QCM** (10 per subject; 3 easy /
4 medium / 3 hard each), plus topics, sources, posts, and challenges. This doc
explains how it's organized and how to validate, export, and seed it.

> Educational practice only. The bank is MVP/instructor-review material — not
> final medical exam content. 14 questions are flagged
> `needs_instructor_verification` (see `data/instructor-review-checklist.md`).

## Where the data lives

```
src/data/seed/
  source-registry.ts   # 13 sources with reliability + honest citation notes
  subjects.ts          # the 5 fixed subjects (+ SUBJECT_KEY, subjectId helper)
  topics.ts            # 50 topics (TOPIC_SEEDS → TOPICS, slugs, paths)
  questions.ts         # 50 QCM (QUESTION_SEEDS → QUESTIONS, rich metadata)
  posts.ts             # 8 study posts
  challenges.ts        # 5 study-group challenges
src/data/seed.ts       # barrel — re-exports the above (keeps @/data/seed stable)
```

The in-memory demo store (`src/lib/store/db.ts`) consumes the barrel, so the
running app reflects this data immediately in demo mode.

## Question metadata

Each question carries (beyond the importable columns):

- `verificationStatus`: `verified` | `needs_instructor_verification`
- `cognitiveLevel`: `recall` | `understanding` | `application` | `analysis`
- `localContextNote`: Cambodia-specific framing (nullable)
- `hintSeed`: a conceptual seed for the AI hint system (never reveals the answer)

These map to nullable columns added by `supabase/migrations/0003_seed_metadata_fields.sql`.

## Scripts

```bash
npm run validate:qcm     # validates the bank (distribution, risk rules, wording)
npm run export:qcm-csv    # regenerates data/* artifacts + public/sample-questions.csv
npm run seed:qcm          # seeds a live Supabase project (needs env + migrations)
```

`validate:qcm` checks: 50 total, 10/subject, 3/4/3 difficulty split, valid
subjects/topics, non-empty distinct options, explanation length & distractor
coverage, no "all/none of the above", no treatment advice or graphic history,
source + verification present, and risk rules (no disputed survival numbers,
dengue↔malaria and Schistosoma↔Opisthorchis kept distinct).

`export:qcm-csv` writes:

```
data/svaeng-yul-qcm-seed.full.csv      # 14 cols (incl. metadata)
data/svaeng-yul-qcm-seed.import.csv    # 11 cols (admin-importer-safe)
data/svaeng-yul-qcm-seed.csv           # alias of full
data/svaeng-yul-qcm-seed.json          # subjects, topics, questions, sources
data/svaeng-yul-qcm-seed-preview.md    # readable preview (correct answers ✅)
public/sample-questions.csv            # refreshed; powers the admin "sample" link
```

Both export and seed run `validate:qcm` first and abort if it fails, so
artifacts and the DB never receive an invalid bank.

## Loading questions

- **Demo mode:** nothing to do — the store is seeded from `src/data/seed/`.
- **Live (Supabase) mode, canonical:** apply migrations `0001`, `0002`, `0003`,
  set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, then
  `npm run seed:qcm` (idempotent — upserts on slug / `seed_key`).
- **Live mode, via admin UI:** sign in as admin → `/admin/import` → upload
  `data/svaeng-yul-qcm-seed.import.csv` (or `.full.csv` to keep metadata).
  New topics are auto-created.

## CSV format

Importer-safe header (the admin importer also ignores any extra columns):

```
subject,topic,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,source_reference
```

Full header adds: `verification_status,cognitive_level,local_context_note`.

## Related docs

- `data/admin-upload-test-plan.md` — manual test plan for upload + report flow.
- `data/instructor-review-checklist.md` — what an instructor must verify (incl. the 14 flagged items).
