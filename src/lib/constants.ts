import type { Difficulty, QuizMode } from "@/types/domain";

/** The 5 fixed subjects. Slugs are stable identifiers used in seed + CSV import. */
export const SUBJECT_SLUGS = [
  "demography",
  "fundamental-of-nursing-sciences",
  "history",
  "infection-disease-agents",
  "embryology",
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

/** Canonical subject names accepted by the CSV importer (case-insensitive). */
export const SUBJECT_NAMES: Record<SubjectSlug, string> = {
  demography: "Demography",
  "fundamental-of-nursing-sciences": "Fundamental of Nursing Sciences",
  history: "History",
  "infection-disease-agents": "Infection Disease Agents",
  embryology: "Embryology",
};

export interface SubjectMeta {
  slug: SubjectSlug;
  icon: string; // lucide icon name
  /** CSS color token (maps to --color-subject-* in globals.css). */
  colorToken: string;
  /** Raw hex for inline glows / charts. */
  hex: string;
  tagline: string;
}

export const SUBJECT_META: Record<SubjectSlug, SubjectMeta> = {
  demography: {
    slug: "demography",
    icon: "Users",
    colorToken: "subject-demography",
    hex: "#60a5fa",
    tagline: "Populations, rates & public-health indicators",
  },
  "fundamental-of-nursing-sciences": {
    slug: "fundamental-of-nursing-sciences",
    icon: "HeartPulse",
    colorToken: "subject-nursing",
    hex: "#2dd4bf",
    tagline: "Vital signs, safety & compassionate care",
  },
  history: {
    slug: "history",
    icon: "ScrollText",
    colorToken: "subject-history",
    hex: "#f59e0b",
    tagline: "Medical milestones & healthcare history",
  },
  "infection-disease-agents": {
    slug: "infection-disease-agents",
    icon: "Bug",
    colorToken: "subject-infection",
    hex: "#34d399",
    tagline: "Bacteria, viruses, fungi & transmission",
  },
  embryology: {
    slug: "embryology",
    icon: "Dna",
    colorToken: "subject-embryology",
    hex: "#e879f9",
    tagline: "Fertilization, germ layers & development",
  },
};

export interface ModeMeta {
  mode: QuizMode;
  label: string;
  blurb: string;
  icon: string;
}

export const QUIZ_MODES: ModeMeta[] = [
  {
    mode: "practice",
    label: "Random Practice",
    blurb: "Questions pulled randomly from the subject.",
    icon: "Dices",
  },
  {
    mode: "timed",
    label: "Timed Practice",
    blurb: "Practice under time pressure.",
    icon: "Timer",
  },
];



export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const POST_CATEGORIES = [
  "All",
  "Demography",
  "Nursing Sciences",
  "History",
  "Infection Disease Agents",
  "Embryology",
  "Study Tips",
  "Exam Tips",
] as const;

export const MEDICAL_SAFETY_NOTE =
  "For study practice only. Not medical diagnosis or treatment advice.";
