/**
 * Seed barrel.
 *
 * The seed data now lives in granular modules under `src/data/seed/`
 * (subjects, topics, questions, posts, challenges, source-registry). This file
 * keeps the original `@/data/seed` import surface intact so the in-memory store
 * and the rest of the app continue to work unchanged.
 */
import type { Badge } from "@/types/domain";
import { BADGE_DEFS } from "@/lib/gamification/badges";

export { SUBJECTS } from "@/data/seed/subjects";
export { TOPICS } from "@/data/seed/topics";
export { QUESTIONS } from "@/data/seed/questions";
export { POSTS } from "@/data/seed/posts";
export { CHALLENGES } from "@/data/seed/challenges";
export { SOURCES } from "@/data/seed/source-registry";

export const BADGES: Badge[] = BADGE_DEFS.map((b) => ({
  id: `badge-${b.key}`,
  name: b.name,
  description: b.description,
  icon: b.icon,
  conditionType: b.conditionType,
  conditionValue: b.conditionValue,
}));
