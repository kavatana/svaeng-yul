# QCM source banks

Raw question banks used as the editorial source material when building the
seed data in `src/data/seed/`. They are kept here for transparency and
provenance only — **the application never imports these files at runtime**.

Each subject's curated questions reference its bank by a stable `sourceId`
label (e.g. `history-json`), not by file path, so these files can be moved or
re-generated without touching the app.

| File                             | Subject                        |
| -------------------------------- | ------------------------------ |
| `demography.json`                | Demography                     |
| `history.json`                   | History                        |
| `nursing_data.json`              | Fundamental of Nursing Sciences|
| `embryoloogie.json`              | Embryology                     |
| `infections_disease_agents.json` | Infection Disease Agents       |
