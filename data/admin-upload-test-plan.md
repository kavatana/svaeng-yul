# Admin Upload Test Plan — Svaeng-Yul QCM Bank

## Goal

Verify that an admin can upload, review, and manage the seed QCM bank, that the
student quiz uses it, and that the report → AI dispute → admin review loop works.

## Test data

| Item | Value |
|---|---|
| Import-safe CSV | `data/svaeng-yul-qcm-seed.import.csv` (11 columns) |
| Full CSV (with metadata) | `data/svaeng-yul-qcm-seed.full.csv` (14 columns) |
| In-app sample link | `public/sample-questions.csv` (same as import-safe) |
| JSON | `data/svaeng-yul-qcm-seed.json` |
| Rows | 50 questions |
| Subjects | Demography, Fundamental of Nursing Sciences, History, Infection Disease Agents, Embryology |
| Topics | 50 (auto-created on import if missing) |
| Per subject | 10 questions (3 easy / 4 medium / 3 hard) |

> Demo mode resets the in-memory store on server restart, so you can re-run the
> happy path repeatedly. In live (Supabase) mode, use `npm run seed:qcm` instead
> of CSV upload for the canonical bank.

## Happy path

1. Sign in as admin (demo: **Demo admin** button, or `admin@svaeng.app` / `password`).
2. Go to `/admin/import`.
3. Choose `data/svaeng-yul-qcm-seed.import.csv` (or the full CSV).
4. Confirm the preview shows **50 valid**, **0 with errors**.
5. Items flagged `needs_instructor_verification` show "· needs verification" in the preview (full CSV only).
6. Click **Import 50 questions**.
7. Go to `/admin/questions`.
8. Filter by each subject in turn.
9. Confirm **10 questions per subject**.
10. Open/scan one question per subject; confirm explanation + source reference are present.
11. Confirm flagged questions show the **"Needs verification"** badge; status is **published**.
12. Sign in as a student (Demo student); start a quiz in each subject.
13. Confirm seeded questions appear and a full quiz can be completed.

## Error-path tests (expect clear row errors, import blocked for bad rows)

Create small CSVs (copy the header, then one bad row each) and confirm the
preview reports the row error and excludes the row:

| Case | How | Expected message (contains) |
|---|---|---|
| Missing subject | blank `subject` | "Unknown subject" |
| Invalid subject name | `subject = Biology` | "Unknown subject" |
| Invalid correct option | `correct_option = E` | "correct_option must be A/B/C/D" |
| Missing explanation | blank `explanation` | "Missing explanation" |
| Invalid difficulty | `difficulty = tricky` | "Difficulty must be easy/medium/hard" |
| Empty option | blank `option_c` | "All four options are required" |
| Missing required column | delete the `explanation` column | "Missing columns: explanation" |
| Extra unsupported column | add `notes` column | imported and **ignored** (no error) |
| Bad CSV quoting | unbalanced `"` in a field | row parses oddly → fix and re-test |

> Duplicate questions: the demo importer does not de-duplicate (each import adds
> rows). The Supabase seed (`seed:qcm`) is idempotent via `seed_key`.

## Report → AI dispute → admin review

1. As a student, start a quiz and **Report** one question (give a reason).
2. Confirm the success toast ("…AI will analyze it and an admin will decide.").
3. The report API runs AI dispute analysis (or the safe fallback verdict when no `ANTHROPIC_API_KEY`).
4. As admin, open `/admin/reports`.
5. Confirm you see: the question + options (current key highlighted), the student's reason, the **source reference + verification badge**, and the **AI suggested verdict + confidence + reasoning**.
6. There are also **3 seeded demo reports** (MMR source confusion → improve explanation; survival number → keep current answer; raw-fish parasite → mark ambiguous).
7. Choose a decision (keep / change answer / improve explanation / mark ambiguous / reject) and submit.
8. Confirm the question content changes **only** after the admin action (e.g. "change answer" updates the key; "mark ambiguous" sets it to draft).

## Phone / iPad checks

- Admin import + tables: usable on tablet/desktop (tables scroll on small screens).
- Student quiz on phone: one question per screen, large tap targets.
- Result page readable; AI hint opens as a bottom sheet; report opens as a bottom sheet.

## Acceptance criteria

- [ ] Import preview reports 50 valid / 0 errors for the seed CSV.
- [ ] After import, each subject shows exactly 10 questions.
- [ ] Flagged questions show "Needs verification" in admin; students see only clean verified sources.
- [ ] Student can complete a quiz using seeded questions.
- [ ] Reporting a question creates a report with an AI verdict visible to admin.
- [ ] Question content changes only after an explicit admin action.
- [ ] Bad CSV rows are reported with clear messages and excluded.
