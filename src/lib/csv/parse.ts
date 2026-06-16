import { SUBJECT_NAMES, type SubjectSlug } from "@/lib/constants";
import type { CognitiveLevel, Difficulty, OptionKey, VerificationStatus } from "@/types/domain";

export interface ParsedQuestionRow {
  rowNumber: number;
  subjectName: string;
  subjectSlug: SubjectSlug;
  topic: string;
  difficulty: Difficulty;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  sourceReference: string;
  /* Optional metadata — captured when the extra columns are present. */
  verificationStatus: VerificationStatus;
  cognitiveLevel?: CognitiveLevel;
  localContextNote?: string;
}

const COGNITIVE_LEVELS: CognitiveLevel[] = ["recall", "understanding", "application", "analysis"];

export interface RowError {
  rowNumber: number;
  message: string;
}

export interface CsvParseResult {
  valid: ParsedQuestionRow[];
  errors: RowError[];
  totalRows: number;
}

const REQUIRED_HEADERS = [
  "subject",
  "topic",
  "difficulty",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation",
];

/** Parse a single CSV line, honoring quoted fields and escaped quotes (""). */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

/** Split CSV text into rows, respecting quoted fields spanning commas. */
function splitRows(text: string): string[] {
  // Normalize line endings; a naive split on \n is fine because our quoted
  // fields don't contain newlines in the expected format.
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
}

const subjectByName = new Map<string, SubjectSlug>(
  (Object.entries(SUBJECT_NAMES) as [SubjectSlug, string][]).map(([slug, name]) => [
    name.toLowerCase(),
    slug,
  ]),
);

/** Parse + validate a questions CSV against the 5-subject schema. */
export function parseQuestionsCsv(text: string): CsvParseResult {
  const lines = splitRows(text);
  if (lines.length === 0) {
    return { valid: [], errors: [{ rowNumber: 0, message: "File is empty." }], totalRows: 0 };
  }

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) {
    return {
      valid: [],
      errors: [{ rowNumber: 0, message: `Missing columns: ${missing.join(", ")}` }],
      totalRows: 0,
    };
  }

  const idx = (name: string) => header.indexOf(name);
  const valid: ParsedQuestionRow[] = [];
  const errors: RowError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // 1-based, header is row 1
    const cells = parseLine(lines[i]);
    const get = (name: string) => (cells[idx(name)] ?? "").trim();

    const subjectName = get("subject");
    const topic = get("topic");
    const difficultyRaw = get("difficulty").toLowerCase();
    const questionText = get("question_text");
    const optionA = get("option_a");
    const optionB = get("option_b");
    const optionC = get("option_c");
    const optionD = get("option_d");
    const correctRaw = get("correct_option").toUpperCase();
    const explanation = get("explanation");
    const sourceReference = idx("source_reference") >= 0 ? get("source_reference") : "";

    // Optional metadata columns (safe to omit). Admin uploads default to
    // needs_instructor_verification unless the file explicitly says "verified".
    const verificationRaw = idx("verification_status") >= 0 ? get("verification_status").toLowerCase() : "";
    const verificationStatus: VerificationStatus =
      verificationRaw === "verified" ? "verified" : "needs_instructor_verification";
    const cognitiveRaw = idx("cognitive_level") >= 0 ? get("cognitive_level").toLowerCase() : "";
    const cognitiveLevel = (COGNITIVE_LEVELS as string[]).includes(cognitiveRaw)
      ? (cognitiveRaw as CognitiveLevel)
      : undefined;
    const localContextNote = idx("local_context_note") >= 0 ? get("local_context_note") : "";

    const rowErrors: string[] = [];
    const subjectSlug = subjectByName.get(subjectName.toLowerCase());
    if (!subjectSlug) rowErrors.push(`Unknown subject "${subjectName}"`);
    if (!topic) rowErrors.push("Missing topic");
    if (!["easy", "medium", "hard"].includes(difficultyRaw)) rowErrors.push("Difficulty must be easy/medium/hard");
    if (!questionText) rowErrors.push("Missing question_text");
    if (!optionA || !optionB || !optionC || !optionD) rowErrors.push("All four options are required");
    if (!["A", "B", "C", "D"].includes(correctRaw)) rowErrors.push("correct_option must be A/B/C/D");
    if (!explanation) rowErrors.push("Missing explanation");

    if (rowErrors.length || !subjectSlug) {
      errors.push({ rowNumber, message: rowErrors.join("; ") });
      continue;
    }

    valid.push({
      rowNumber,
      subjectName,
      subjectSlug,
      topic,
      difficulty: difficultyRaw as Difficulty,
      questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correctOption: correctRaw as OptionKey,
      explanation,
      sourceReference,
      verificationStatus,
      cognitiveLevel,
      localContextNote: localContextNote || undefined,
    });
  }

  return { valid, errors, totalRows: lines.length - 1 };
}
