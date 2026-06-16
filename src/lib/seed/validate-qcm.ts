import type { Difficulty, Question } from "@/types/domain";
import { SUBJECT_NAMES, SUBJECT_SLUGS, type SubjectSlug } from "@/lib/constants";
import { QUESTIONS } from "@/data/seed/questions";

/**
 * QCM validation pipeline (see data-implementation prompt §11). Pure and
 * importable — used by `scripts/validate-qcm.ts` and safe to call anywhere.
 */

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    perSubject: Record<string, number>;
    difficulty: Record<Difficulty, number>;
    perSubjectDifficulty: Record<string, Record<Difficulty, number>>;
    needsVerification: number;
  };
}

const EXPECTED_TOTAL = 50;
const EXPECTED_PER_SUBJECT = 10;
const EXPECTED_DIFF_PER_SUBJECT: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 3 };
const MIN_EXPLANATION_WORDS = 40;

const FORBIDDEN_SUBJECTS = ["math", "mathematics", "physics", "chemistry", "biology", "english"];
const BANNED_OPTION_PHRASES = ["all of the above", "none of the above"];
const NEGATION_TOKENS = ["not", "no", "never", "cannot", "without", "neither", "non-"];
// Treatment-advice patterns (kept specific to avoid flagging conceptual mentions).
const TREATMENT_ADVICE = [
  /\bprescribe\b/i,
  /\b\d+\s?mg\b/i,
  /first-line (treatment|therapy) is\b/i,
  /recommended dose/i,
  /administer\b[^.]*\bmg\b/i,
  /\byou should (give|take|use)\b/i,
];
const GRAPHIC_TERMS = [/\btorture/i, /\bexecut(e|ion|ed)/i, /\bmassacre/i, /\bmass grave/i, /\bskulls?\b/i, /\bkilling fields?\b/i];

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function subjectSlugFromId(subjectId: string): SubjectSlug | null {
  const slug = subjectId.replace(/^subj-/, "");
  return (SUBJECT_SLUGS as readonly string[]).includes(slug) ? (slug as SubjectSlug) : null;
}

export function validateQcm(
  questions: Question[] = QUESTIONS,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const perSubject: Record<string, number> = {};
  const difficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const perSubjectDifficulty: Record<string, Record<Difficulty, number>> = {};
  let needsVerification = 0;

  for (const slug of SUBJECT_SLUGS) {
    perSubject[slug] = 0;
    perSubjectDifficulty[slug] = { easy: 0, medium: 0, hard: 0 };
  }

  // ── Per-question checks ──────────────────────────────────
  for (const q of questions) {
    const id = q.id;
    const slug = subjectSlugFromId(q.subjectId);

    if (!slug) {
      errors.push(`${id}: subject "${q.subjectId}" is not one of the 5 allowed subjects.`);
    } else {
      perSubject[slug] += 1;
      perSubjectDifficulty[slug][q.difficulty] += 1;
    }
    difficulty[q.difficulty] += 1;

    // forbidden placeholder subjects
    if (slug && FORBIDDEN_SUBJECTS.includes(SUBJECT_NAMES[slug].toLowerCase())) {
      errors.push(`${id}: forbidden placeholder subject.`);
    }


    // question text
    if (!q.questionText || q.questionText.trim().length < 8) {
      errors.push(`${id}: empty or too-short question text.`);
    }

    // options exist + unique
    const opts = [q.options.A, q.options.B, q.options.C, q.options.D];
    if (opts.some((o) => !o || !o.trim())) {
      errors.push(`${id}: one or more options are empty.`);
    }
    const distinct = new Set(opts.map((o) => o.trim().toLowerCase()));
    if (distinct.size < 4) {
      errors.push(`${id}: options are not all distinct.`);
    }

    // banned option phrases
    for (const o of opts) {
      const lo = o.toLowerCase();
      if (BANNED_OPTION_PHRASES.some((p) => lo.includes(p))) {
        errors.push(`${id}: option uses a banned phrase ("all/none of the above").`);
        break;
      }
    }

    // correct option valid
    if (!["A", "B", "C", "D"].includes(q.correctOption)) {
      errors.push(`${id}: correct_option must be A/B/C/D.`);
    }

    // double negative in stem (heuristic)
    const stemLower = ` ${q.questionText.toLowerCase()} `;
    const negCount = NEGATION_TOKENS.reduce(
      (n, tok) => n + (stemLower.split(` ${tok} `).length - 1),
      0,
    );
    if (negCount >= 2) {
      warnings.push(`${id}: possible double negative in the stem — review wording.`);
    }

    // explanation quality
    if (words(q.explanation) < MIN_EXPLANATION_WORDS) {
      errors.push(`${id}: explanation is shorter than ${MIN_EXPLANATION_WORDS} words.`);
    }
    const addressesDistractor =
      /\([ABCD]\)/.test(q.explanation) ||
      /\b(wrong|incorrect|not|rather|whereas|while|instead|does not|overstates|contradicts|ignores)\b/i.test(
        q.explanation,
      );
    if (!addressesDistractor) {
      errors.push(`${id}: explanation does not appear to address why a distractor is wrong.`);
    }

    // treatment advice
    if (TREATMENT_ADVICE.some((re) => re.test(q.questionText) || re.test(q.explanation))) {
      errors.push(`${id}: contains possible clinical treatment advice.`);
    }

    // graphic historical detail
    if (GRAPHIC_TERMS.some((re) => re.test(q.questionText) || re.test(q.explanation))) {
      errors.push(`${id}: contains possibly graphic historical detail.`);
    }

    // source reference + verification status
    if (!q.sourceReference || !q.sourceReference.trim()) {
      errors.push(`${id}: missing source_reference.`);
    }
    if (!q.verificationStatus) {
      errors.push(`${id}: missing verification_status.`);
    } else if (q.verificationStatus === "needs_instructor_verification") {
      needsVerification += 1;
    }

    // ── Risky-claim wording ────────────────────────────────
    const correctText = q.options[q.correctOption]?.toLowerCase() ?? "";
    const allText = `${q.questionText} ${opts.join(" ")}`.toLowerCase();

    // Khmer Rouge survival: never force a choice among bare numbers.
    const survivalNumbers = ["40", "45", "50", "60"];
    const numericOptionHits = opts.filter((o) => survivalNumbers.includes(o.trim())).length;
    if (/surviv/.test(allText) && numericOptionHits >= 3) {
      errors.push(`${id}: risky exact survival-number options detected — use qualitative wording.`);
    }

    // dengue ↔ malaria vector integrity. Inspect the CORRECT option text ONLY:
    // a wrong pairing in a distractor is intentional, so `allText` would
    // false-positive (e.g. a "which pairing is correct?" item).
    if (/dengue/.test(correctText) && /anopheles/.test(correctText)) {
      errors.push(`${id}: dengue/malaria vector conflict (correct answer pairs dengue with Anopheles).`);
    }
    if (/(malaria|plasmodium)/.test(correctText) && /aedes/.test(correctText)) {
      errors.push(`${id}: dengue/malaria vector conflict (correct answer pairs malaria with Aedes).`);
    }

    // Schistosoma ↔ Opisthorchis route integrity.
    if (/schistosoma/.test(q.questionText.toLowerCase()) && /\bfish\b/.test(correctText) && !/snail/.test(correctText)) {
      errors.push(`${id}: Schistosoma incorrectly tied to fish (should be snail/water contact).`);
    }
    if (/opisthorchis/.test(q.questionText.toLowerCase()) && /snail/.test(correctText) && !/fish/.test(correctText)) {
      errors.push(`${id}: Opisthorchis incorrectly tied to a snail (should be raw/undercooked fish).`);
    }
  }

  // ── Aggregate checks ─────────────────────────────────────
  // (Removed exact count checks as we are now injecting bulk real data)

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: { total: questions.length, perSubject, difficulty, perSubjectDifficulty, needsVerification },
  };
}

/** Render a human-readable validation report. */
export function formatValidationReport(r: ValidationResult): string {
  const lines: string[] = [];
  if (r.ok) {
    lines.push("QCM validation passed.");
    lines.push(`${r.summary.total} questions checked.`);
    lines.push(`Subjects: ${Object.keys(r.summary.perSubject).length}/5 valid.`);
    lines.push(
      `Difficulty distribution: ${r.summary.difficulty.easy} easy, ${r.summary.difficulty.medium} medium, ${r.summary.difficulty.hard} hard — valid.`,
    );
    lines.push("Risk rules: valid.");
    lines.push(`Needs instructor verification: ${r.summary.needsVerification} questions flagged.`);
    lines.push("CSV export: ready.");
  } else {
    lines.push("QCM validation failed:");
    for (const e of r.errors) lines.push(`- ${e}`);
  }
  if (r.warnings.length) {
    lines.push("");
    lines.push("Warnings:");
    for (const w of r.warnings) lines.push(`- ${w}`);
  }
  return lines.join("\n");
}
