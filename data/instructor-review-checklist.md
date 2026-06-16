# Instructor Review Checklist — Svaeng-Yul QCM Seed Bank

> This seed bank is suitable for MVP testing and instructor review. It should
> **not** be treated as final medical examination content until reviewed by a
> qualified instructor.

The bank contains **50 questions** (10 per subject; 3 easy / 4 medium / 3 hard
each). Validation passes (`npm run validate:qcm`). A full, readable preview of
every question, its correct answer, and explanation is in
`data/svaeng-yul-qcm-seed-preview.md`.

## How to review

Open `data/svaeng-yul-qcm-seed-preview.md` (or `/admin/questions` in the app).
For each question, confirm:

- [ ] The fact matches your course notes / curriculum.
- [ ] There is exactly **one** best answer; no second option is defensibly correct.
- [ ] Distractors are plausible but not misleading or "trick" wording.
- [ ] The explanation is educational and explains why the answer is right.
- [ ] Any number has its **source and year stated in the stem** (no disputed bare numbers).
- [ ] No clinical diagnosis or treatment advice is implied.
- [ ] Historical wording is respectful and not graphic.
- [ ] Difficulty label fits (easy = recall, medium = apply/compare, hard = analyse).
- [ ] (Optional) A Khmer translation can be added later without changing meaning.
- [ ] Approved for production ✔ / Needs edit ✎ / Reject ✗

## Items explicitly flagged `needs_instructor_verification` (14)

These passed automated checks but contain Cambodia-specific figures/dates or
institutional details that need a human source check. **Confirm or correct each
before promoting it to `verified`.**

| Question ID | Topic | What to verify |
|---|---|---|
| `q-demography-004` | Fertility Trends | TFR ≈ **2.7** against the published **CDHS 2021–22** report. |
| `q-demography-005` | Maternal Health Metrics | MMR ≈ **154 per 100,000** from **CDHS 2021–22** (do not mix with WHO/World Bank modeled ~137). |
| `q-demography-008` | Maternal Health Metrics | Direction of the facility-delivery trend (rising). Exact percentages not asserted. |
| `q-nursing-010` | Nursing Education History | That nursing training was substantially rebuilt after 1979; confirm institutions/dates. |
| `q-history-001` | School for Medical Officers | Founding year **1946**. |
| `q-history-003` | Medical Education Rebuilding | Reopening **~1980**. |
| `q-history-004` | Institutional Origins | Royal School of Medicine **~1950s (1953)**. |
| `q-history-005` | Institutional Origins | Faculty of Medicine and Pharmacy **~early 1960s (1962)**. |
| `q-history-006` | Sala Krahom | "Red Building" association with early training premises. |
| `q-history-008` | Modern MD Curriculum | MD pathway length **~8 years** (current UHS structure). |
| `q-history-009` | BMedSc Pathway | BMedSc after ~6 years + internship/thesis before full MD. |
| `q-infection-005` | Schistosoma Mekongi | Intermediate host **Neotricula aperta** snail; Kratie/Stung Treng association. |
| `q-infection-006` | Opisthorchis Viverrini | Transmission via raw/undercooked freshwater (cyprinid) fish. |
| `q-infection-007` | Gastrointestinal Parasites | Raw-fish exposure → liver fluke (route distinction). |

## Deliberately-safe wording (do not "fix" into disputed numbers)

- **Khmer Rouge workforce (`q-history-002`)** uses the qualitative phrase
  "near-total loss … fewer than 50 trained doctors often cited as surviving."
  Do **not** convert this to a multiple-choice among 40/45/50/60 — the exact
  number is historically disputed and that would be unfair.
- **TFR and MMR** each name a single source + year in the stem so two valid
  sources are never offered as competing answers.

## Sign-off

- Reviewer name: ____________________  Date: ____________
- Subjects reviewed: ☐ Demography ☐ Nursing ☐ History ☐ Infection ☐ Embryology
- Overall: ☐ Approved for student practice ☐ Approved with edits ☐ Needs rework
