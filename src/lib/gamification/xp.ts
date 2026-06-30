import { differenceInCalendarDays, parseISO } from "date-fns";
import type { QuizMode } from "@/types/domain";

/** Cumulative XP required to *reach* each level (index 0 = level 1). */
export const LEVEL_THRESHOLDS = [
  0, 200, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500,
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/** The level a given total XP corresponds to (1-based). */
export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** Progress within the current level, for the dashboard XP bar. */
export function levelProgress(xp: number): {
  level: number;
  levelFloor: number;
  nextThreshold: number | null;
  intoLevel: number;
  span: number;
  percent: number;
} {
  const level = levelForXp(xp);
  const levelFloor = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold =
    level < MAX_LEVEL ? LEVEL_THRESHOLDS[level] : null;
  const intoLevel = xp - levelFloor;
  const span = nextThreshold === null ? intoLevel : nextThreshold - levelFloor;
  const percent = nextThreshold === null ? 100 : Math.round((intoLevel / span) * 100);
  return { level, levelFloor, nextThreshold, intoLevel, span, percent };
}

/**
 * XP earned for a completed quiz, following the spec's rules:
 *   correct answer +10, complete quiz +20, 80%+ bonus +30,
 *   100% bonus +80, challenge mode +25.
 */
export function computeQuizXp(params: {
  correctCount: number;
  totalQuestions: number;
  mode: QuizMode;
}): number {
  const { correctCount, totalQuestions, mode } = params;
  const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  let xp = correctCount * 10 + 20;
  if (scorePercent >= 100) xp += 80;
  else if (scorePercent >= 80) xp += 30;
  if (mode === "challenge") xp += 25;

  return xp;
}

/**
 * Streak update following the spec:
 *  - completed today already → unchanged
 *  - last study was yesterday → +1
 *  - older / never → reset to 1
 * `today` is injectable for testing; defaults to now.
 */
export function computeStreak(params: {
  currentStreak: number;
  lastStudyDate: string | null;
  today?: Date;
}): { streakCount: number; lastStudyDate: string } {
  const today = params.today ?? new Date();
  const todayIso = toIsoDate(today);

  if (!params.lastStudyDate) {
    return { streakCount: 1, lastStudyDate: todayIso };
  }

  const diff = differenceInCalendarDays(today, parseISO(params.lastStudyDate));
  if (diff <= 0) {
    // Already studied today — keep the streak as-is.
    return { streakCount: Math.max(1, params.currentStreak), lastStudyDate: todayIso };
  }
  if (diff === 1) {
    return { streakCount: params.currentStreak + 1, lastStudyDate: todayIso };
  }
  return { streakCount: 1, lastStudyDate: todayIso };
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
