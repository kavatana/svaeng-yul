import type { OptionKey, Question } from "@/types/domain";
import { SUBJECT_NAMES, SUBJECT_SLUGS } from "@/lib/constants";
import { SUBJECTS } from "@/data/seed/subjects";
import { QUESTIONS, QUESTION_SOURCE_IDS } from "@/data/seed/questions";
import { SOURCES } from "@/data/seed/source-registry";

/** Build artifacts (CSV / JSON / preview) from the seed bank. All pure. */

const FULL_HEADERS = [
  "subject",
  "difficulty",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation",
  "source_reference",
  "verification_status",
  "cognitive_level",
  "local_context_note",
];

const IMPORT_HEADERS = FULL_HEADERS.slice(0, 10); // through source_reference

function esc(value: string | null | undefined): string {
  const v = value ?? "";
  // Quote when the field contains a comma, quote, or newline; double inner quotes.
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function subjectName(subjectId: string): string {
  return SUBJECTS.find((s) => s.id === subjectId)?.name ?? "";
}

function row(q: Question, headers: string[]): string {
  const map: Record<string, string> = {
    subject: subjectName(q.subjectId),
    difficulty: q.difficulty,
    question_text: q.questionText,
    option_a: q.options.A,
    option_b: q.options.B,
    option_c: q.options.C,
    option_d: q.options.D,
    correct_option: q.correctOption,
    explanation: q.explanation,
    source_reference: q.sourceReference ?? "",
    verification_status: q.verificationStatus ?? "",
    cognitive_level: q.cognitiveLevel ?? "",
    local_context_note: q.localContextNote ?? "",
  };
  return headers.map((h) => esc(map[h])).join(",");
}

export function toFullCsv(questions: Question[] = QUESTIONS): string {
  return [FULL_HEADERS.join(","), ...questions.map((q) => row(q, FULL_HEADERS))].join("\n") + "\n";
}

export function toImportCsv(questions: Question[] = QUESTIONS): string {
  return [IMPORT_HEADERS.join(","), ...questions.map((q) => row(q, IMPORT_HEADERS))].join("\n") + "\n";
}

export interface SeedJson {
  metadata: Record<string, unknown>;
  subjects: unknown[];
  questions: unknown[];
  sources: unknown[];
}

export function toSeedJson(questions: Question[] = QUESTIONS): SeedJson {
  return {
    metadata: {
      app: "Svaeng-Yul",
      version: "0.1.0",
      generated_from: "Gemini research pack + Claude data engineering prompt",
      warning:
        "Educational practice only. Requires instructor review before production use.",
      total_questions: questions.length,
      generated_at: new Date().toISOString(),
    },
    subjects: SUBJECTS.map((s) => ({ id: s.id, name: s.name, slug: s.slug, description: s.description })),
    questions: questions.map((q) => ({
      id: q.id,
      subject: subjectName(q.subjectId),
      subject_id: q.subjectId,
      difficulty: q.difficulty,
      cognitive_level: q.cognitiveLevel,
      question_text: q.questionText,
      options: q.options,
      correct_option: q.correctOption,
      explanation: q.explanation,
      source_reference: q.sourceReference,
      source_id: QUESTION_SOURCE_IDS[q.id],
      verification_status: q.verificationStatus,
      local_context_note: q.localContextNote,
      hint_seed: q.hintSeed,
    })),
    sources: SOURCES,
  };
}

export function toPreviewMarkdown(questions: Question[] = QUESTIONS): string {
  const lines: string[] = [];
  lines.push("# Svaeng-Yul — QCM Seed Bank Preview");
  lines.push("");
  lines.push("> Educational practice only. Requires instructor review before production use.");
  lines.push("");
  const easy = questions.filter((q) => q.difficulty === "easy").length;
  const medium = questions.filter((q) => q.difficulty === "medium").length;
  const hard = questions.filter((q) => q.difficulty === "hard").length;
  const needsV = questions.filter((q) => q.verificationStatus === "needs_instructor_verification").length;
  lines.push(`**Total:** ${questions.length} questions — ${easy} easy, ${medium} medium, ${hard} hard. ${needsV} flagged for instructor verification.`);
  lines.push("");

  for (const slug of SUBJECT_SLUGS) {
    const subjId = `subj-${slug}`;
    const subjQs = questions.filter((q) => q.subjectId === subjId);
    if (!subjQs.length) continue;
    lines.push(`## ${SUBJECT_NAMES[slug]} (${subjQs.length})`);
    lines.push("");
    for (const q of subjQs) {
      lines.push(`### ${q.id} · ${q.difficulty}`);
      if (q.verificationStatus === "needs_instructor_verification") {
        lines.push("> ⚠️ Needs instructor verification");
      }
      lines.push("");
      lines.push(q.questionText);
      lines.push("");
      for (const k of ["A", "B", "C", "D"] as OptionKey[]) {
        const mark = k === q.correctOption ? " ✅" : "";
        lines.push(`- **${k}.** ${q.options[k]}${mark}`);
      }
      lines.push("");
      lines.push(`**Why:** ${q.explanation}`);
      lines.push("");
      lines.push(`_Source: ${q.sourceReference}_`);
      lines.push("");
    }
  }
  return lines.join("\n");
}
