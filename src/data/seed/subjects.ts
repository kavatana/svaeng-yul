import type { Subject } from "@/types/domain";
import { SUBJECT_META, SUBJECT_NAMES, type SubjectSlug } from "@/lib/constants";

/**
 * The 5 fixed subjects. IDs stay `subj-<slug>` to match the in-memory store
 * and the rest of the app. The Supabase seed upserts by `slug`.
 */
const subjectDescriptions: Record<SubjectSlug, string> = {
  demography: "Study how populations grow, move, and are measured — and what that means for health planning.",
  "fundamental-of-nursing-sciences": "Core skills, safety, and ethics of compassionate nursing care.",
  history: "Milestones that shaped medicine and Cambodian healthcare.",
  "infection-disease-agents": "The microbes, parasites, and vectors that cause disease — and how they spread.",
  embryology: "How a single cell becomes an organized human body.",
};

/** Short, stable key per subject — used in topic and question IDs. */
export const SUBJECT_KEY: Record<SubjectSlug, string> = {
  demography: "demography",
  "fundamental-of-nursing-sciences": "nursing",
  history: "history",
  "infection-disease-agents": "infection",
  embryology: "embryology",
};

export function subjectId(slug: SubjectSlug): string {
  return `subj-${slug}`;
}

export const SUBJECTS: Subject[] = (Object.keys(SUBJECT_META) as SubjectSlug[]).map(
  (slug, i) => ({
    id: subjectId(slug),
    name: SUBJECT_NAMES[slug],
    slug,
    description: subjectDescriptions[slug],
    icon: SUBJECT_META[slug].icon,
    color: SUBJECT_META[slug].colorToken,
    orderIndex: i,
  }),
);
