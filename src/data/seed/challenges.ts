import type { Challenge } from "@/types/domain";

const now = "2026-01-01T00:00:00.000Z";
const end = "2026-12-31T00:00:00.000Z";

/**
 * 5 demo study-group challenges. `targetType: "questions_completed"` is tracked
 * by the quiz engine (see advanceChallenges, which also accepts the legacy
 * "questions_answered" synonym). Badge names match the badge catalog.
 */
export const CHALLENGES: Challenge[] = [
  {
    id: "challenge-demography-starter",
    title: "Demography Starter",
    description: "Complete 10 Demography questions this week to warm up your population-health basics.",
    subjectId: "subj-demography",
    targetType: "questions_completed",
    targetValue: 10,
    xpReward: 120,
    badgeName: "Demography Builder",
    startsAt: now,
    endsAt: end,
  },
  {
    id: "challenge-nursing-safety-sprint",
    title: "Nursing Safety Sprint",
    description: "Answer 15 Nursing Sciences questions, focusing on hand hygiene and patient safety.",
    subjectId: "subj-fundamental-of-nursing-sciences",
    targetType: "questions_completed",
    targetValue: 15,
    xpReward: 150,
    badgeName: "Nursing Core",
    startsAt: now,
    endsAt: end,
  },
  {
    id: "challenge-history-memory-trail",
    title: "History Memory Trail",
    description: "Complete 10 History questions and trace Cambodia's medical-education milestones.",
    subjectId: "subj-history",
    targetType: "questions_completed",
    targetValue: 10,
    xpReward: 120,
    badgeName: null,
    startsAt: now,
    endsAt: end,
  },
  {
    id: "challenge-infection-agent-focus",
    title: "Infection Agent Focus",
    description: "Complete 20 Infection Disease Agents questions and master the agent–vector pairs.",
    subjectId: "subj-infection-disease-agents",
    targetType: "questions_completed",
    targetValue: 20,
    xpReward: 200,
    badgeName: "Infection Fighter",
    startsAt: now,
    endsAt: end,
  },
  {
    id: "challenge-embryology-week-1-3",
    title: "Embryology Week 1–3",
    description: "Answer 12 Embryology questions covering fertilization through gastrulation.",
    subjectId: "subj-embryology",
    targetType: "questions_completed",
    targetValue: 12,
    xpReward: 150,
    badgeName: "Embryology Starter",
    startsAt: now,
    endsAt: end,
  },
];
