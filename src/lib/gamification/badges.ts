import type { SubjectSlug } from "@/lib/constants";

/**
 * Badge catalog. `key` is a stable identifier (also the seed slug).
 * Unlock logic lives in {@link evaluateBadges} so it can run after a quiz.
 */
export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  conditionType: string;
  conditionValue: number;
}

export const BADGE_DEFS: BadgeDef[] = [
  { key: "first-qcm", name: "First QCM", description: "Completed your very first quiz.", icon: "Sparkles", conditionType: "first_quiz", conditionValue: 1 },
  { key: "streak-3", name: "3-Day Streak", description: "Studied three days in a row.", icon: "Flame", conditionType: "streak", conditionValue: 3 },
  { key: "streak-7", name: "7-Day Streak", description: "A full week of practice. Beautiful.", icon: "Flame", conditionType: "streak", conditionValue: 7 },
  { key: "infection-fighter", name: "Infection Fighter", description: "Completed 5 quizzes in Infection Disease Agents.", icon: "Bug", conditionType: "subject_quizzes", conditionValue: 5 },
  { key: "embryology-starter", name: "Embryology Starter", description: "Completed your first Embryology quiz.", icon: "Dna", conditionType: "subject_quizzes", conditionValue: 1 },
  { key: "nursing-core", name: "Nursing Core", description: "Completed 5 quizzes in Nursing Sciences.", icon: "HeartPulse", conditionType: "subject_quizzes", conditionValue: 5 },
  { key: "demography-builder", name: "Demography Builder", description: "Completed 5 quizzes in Demography.", icon: "Users", conditionType: "subject_quizzes", conditionValue: 5 },
  { key: "perfect-10", name: "Perfect 10", description: "Scored 100% on a quiz.", icon: "Star", conditionType: "perfect_score", conditionValue: 100 },
  { key: "comeback-student", name: "Comeback Student", description: "Returned to practice after a break. Welcome back.", icon: "Undo2", conditionType: "comeback", conditionValue: 1 },
  { key: "night-owl", name: "Night Owl", description: "Practiced late at night. Rest well after.", icon: "Moon", conditionType: "night_owl", conditionValue: 1 },
];

/** Which subject each subject-scoped badge belongs to. */
export const SUBJECT_BADGE_MAP: Record<string, SubjectSlug> = {
  "infection-fighter": "infection-disease-agents",
  "embryology-starter": "embryology",
  "nursing-core": "fundamental-of-nursing-sciences",
  "demography-builder": "demography",
};

export interface BadgeContext {
  earnedKeys: Set<string>;
  totalCompletedQuizzes: number; // including the one just finished
  streakCount: number;
  scorePercent: number;
  /** Quizzes completed in the subject just practiced (including this one). */
  subjectQuizCount: number;
  subjectSlug: SubjectSlug;
  /** Local hour (0–23) the quiz was completed. */
  completedHour: number;
  /** True when the previous study day was 2+ days ago (a comeback). */
  isComeback: boolean;
}

/** Returns the badge keys newly unlocked by the just-completed quiz. */
export function evaluateBadges(ctx: BadgeContext): string[] {
  const unlocked: string[] = [];

  const tryUnlock = (key: string, condition: boolean) => {
    if (condition && !ctx.earnedKeys.has(key)) unlocked.push(key);
  };

  tryUnlock("first-qcm", ctx.totalCompletedQuizzes >= 1);
  tryUnlock("streak-3", ctx.streakCount >= 3);
  tryUnlock("streak-7", ctx.streakCount >= 7);
  tryUnlock("perfect-10", ctx.scorePercent >= 100);
  tryUnlock("comeback-student", ctx.isComeback);
  // "Night owl": 21:00–04:59 — the late-night study mood the app is built for.
  tryUnlock("night-owl", ctx.completedHour >= 21 || ctx.completedHour < 5);

  for (const [key, slug] of Object.entries(SUBJECT_BADGE_MAP)) {
    const def = BADGE_DEFS.find((b) => b.key === key);
    if (!def) continue;
    tryUnlock(
      key,
      slug === ctx.subjectSlug && ctx.subjectQuizCount >= def.conditionValue,
    );
  }

  return unlocked;
}
