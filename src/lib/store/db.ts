import { v4 as uuid } from "uuid";
import type {
  AnswerReport,
  Badge,
  Challenge,
  ChallengeProgress,
  Post,
  Profile,
  Question,
  QuizAnswer,
  QuizSession,
  Subject,
  UserBadge,
  UserQcmQuestion,
  UserQcmSession,
  UserQcmSet,
} from "@/types/domain";
import {
  BADGES,
  CHALLENGES,
  POSTS,
  QUESTIONS,
  SUBJECTS,
  TOPICS,
} from "@/data/seed";

/**
 * In-memory store backing DEMO MODE. It is a singleton kept on `globalThis`
 * so Next.js dev hot-reloads don't wipe it. Data resets on full server
 * restart — which is fine for a credential-free demo.
 */
export interface Credential {
  email: string;
  password: string;
  userId: string;
}

export interface ResultMeta {
  leveledUp: boolean;
  newLevel: number;
  newBadgeKeys: string[];
}

export interface StoreState {
  profiles: Profile[];
  credentials: Credential[];
  resultMeta: Record<string, ResultMeta>;
  subjects: Subject[];
  questions: Question[];
  sessions: QuizSession[];
  answers: QuizAnswer[];
  reports: AnswerReport[];
  hintRequests: Array<{
    id: string;
    userId: string;
    sessionId: string | null;
    questionId: string;
    hintText: string;
    createdAt: string;
  }>;
  badges: Badge[];
  userBadges: UserBadge[];
  posts: Post[];
  savedPosts: Array<{ userId: string; postId: string }>;
  challenges: Challenge[];
  challengeProgress: ChallengeProgress[];
  userQcmSets: UserQcmSet[];
  userQcmQuestions: UserQcmQuestion[];
  userQcmSessions: UserQcmSession[];
}

export const DEMO_STUDENT_ID = "user-demo-student";
export const DEMO_ADMIN_ID = "user-demo-admin";

function seedState(): StoreState {
  const profiles: Profile[] = [
    {
      id: "profile-demo-student",
      userId: DEMO_STUDENT_ID,
      fullName: "Dara",
      avatarUrl: null,
      role: "student",
      school: "University of Health Sciences",
      studyYear: "Year 2",
      xp: 820,
      level: 4,
      streakCount: 5,
      lastStudyDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "profile-demo-admin",
      userId: DEMO_ADMIN_ID,
      fullName: "Admin",
      avatarUrl: null,
      role: "admin",
      school: null,
      studyYear: null,
      xp: 0,
      level: 1,
      streakCount: 0,
      lastStudyDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  // A few peer students so the leaderboard feels alive.
  const peers: Array<[string, number, number, number]> = [
    ["Sokha", 1450, 9, 86],
    ["Vichea", 1180, 4, 78],
    ["Bopha", 640, 2, 72],
    ["Rithy", 2030, 12, 81],
    ["Maly", 360, 1, 69],
  ];
  for (const [name, xp, streak] of peers) {
    const userId = `user-peer-${name.toLowerCase()}`;
    profiles.push({
      id: `profile-${userId}`,
      userId,
      fullName: name,
      avatarUrl: null,
      role: "student",
      school: "University of Health Sciences",
      studyYear: "Year 2",
      xp,
      level: 1,
      streakCount: streak,
      lastStudyDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }

  const credentials: Credential[] = [
    { email: "student@svaeng.app", password: "password", userId: DEMO_STUDENT_ID },
    { email: "admin@svaeng.app", password: "password", userId: DEMO_ADMIN_ID },
  ];

  // Award the demo student a couple of starter badges.
  const userBadges: UserBadge[] = [
    { id: uuid(), userId: DEMO_STUDENT_ID, badgeId: "badge-first-qcm", earnedAt: "2026-01-02T00:00:00.000Z" },
    { id: uuid(), userId: DEMO_STUDENT_ID, badgeId: "badge-streak-3", earnedAt: "2026-01-04T00:00:00.000Z" },
  ];

  // Seed some history for the demo student so weak-area detection has data.
  const sessions: QuizSession[] = [];
  const answers: QuizAnswer[] = [];
  const infection = SUBJECTS.find((s) => s.slug === "infection-disease-agents")!;
  const infQuestions = QUESTIONS.filter((q) => q.subjectId === infection.id).slice(0, 5);
  if (infQuestions.length) {
    const sessionId = "session-seed-1";
    sessions.push({
      id: sessionId,
      userId: DEMO_STUDENT_ID,
      subjectId: infection.id,
        mode: "random_practice",
      timePerQuestionSeconds: 60,
    totalQuestions: infQuestions.length,
      correctCount: 2,
      scorePercent: Math.round((2 / infQuestions.length) * 100),
      xpEarned: 60,
      startedAt: "2026-01-05T20:00:00.000Z",
      completedAt: "2026-01-05T20:08:00.000Z",
      questionIds: infQuestions.map((q) => q.id),
    });
    infQuestions.forEach((q, i) => {
      answers.push({
        id: uuid(),
        sessionId,
        questionId: q.id,
        selectedOption: i < 2 ? q.correctOption : "A",
        isCorrect: i < 2,
        timeSpentSeconds: 30,
        hintUsed: false,
      });
    });
  }

  // ── 3 mock AI-dispute reports (admin demo only; never shown in quizzes) ──
  const reports: AnswerReport[] = [];
  const addReport = (
    questionId: string,
    r: {
      studentReason: string;
      referenceNote: string | null;
      aiVerdict: AnswerReport["aiVerdict"];
      aiConfidence: number;
      aiReason: string;
      aiSuggestedAction: string;
      createdAt: string;
    },
  ) => {
    if (!QUESTIONS.some((q) => q.id === questionId)) return;
    reports.push({
      id: uuid(),
      userId: DEMO_STUDENT_ID,
      questionId,
      sessionId: null,
      studentReason: r.studentReason,
      referenceNote: r.referenceNote,
      aiVerdict: r.aiVerdict,
      aiConfidence: r.aiConfidence,
      aiReason: r.aiReason,
      aiSuggestedAction: r.aiSuggestedAction,
      adminStatus: "pending",
      adminNote: null,
      reviewedBy: null,
      createdAt: r.createdAt,
      reviewedAt: null,
    });
  };
  addReport("q-demography-005", {
    studentReason:
      "WHO/World Bank list maternal mortality around 137 for 2023, but this says 154. Which one is correct?",
    referenceNote: "WHO/World Bank modeled estimate, 2023",
    aiVerdict: "improve_explanation",
    aiConfidence: 78,
    aiReason:
      "Both figures are valid but come from different sources and years. The stem correctly fixes CDHS 2021–22 (≈154), so the answer key is right; the confusion is about a different modeled estimate.",
    aiSuggestedAction:
      "Keep the current answer; add one sentence to the explanation distinguishing the CDHS survey figure from the WHO/World Bank modeled estimate.",
    createdAt: "2026-01-06T20:10:00.000Z",
  });
  addReport("q-history-002", {
    studentReason:
      "I read that exactly 45 doctors survived — shouldn't one of the options be that number?",
    referenceNote: null,
    aiVerdict: "keep_current_answer",
    aiConfidence: 88,
    aiReason:
      "The exact survivor count is historically disputed (commonly cited between roughly 40 and 50). The question deliberately uses qualitative wording to avoid forcing a choice between disputed numbers, which is the safer and fairer approach.",
    aiSuggestedAction:
      "Keep the current answer and wording. Do not introduce a disputed exact number as an option.",
    createdAt: "2026-01-07T19:40:00.000Z",
  });
  addReport("q-infection-007", {
    studentReason:
      "Other parasites can also come from freshwater fish, so this feels like it could have more than one answer.",
    referenceNote: null,
    aiVerdict: "mark_ambiguous",
    aiConfidence: 61,
    aiReason:
      "Opisthorchis viverrini is the best fit for raw freshwater fish in the Mekong teaching context, so the key is defensible. However, the stem could be read broadly, so a small clarification would remove any ambiguity.",
    aiSuggestedAction:
      "Optionally narrow the stem (e.g. specify the liver fluke / bile-duct context) or strengthen the explanation; otherwise keep the answer.",
    createdAt: "2026-01-08T21:05:00.000Z",
  });

  // ── one demo "My QCM" set so demo mode shows the feature populated ──
  const demoSetId = uuid();
  const userQcmSets: UserQcmSet[] = [
    {
      id: demoSetId,
      ownerId: DEMO_STUDENT_ID,
      title: "Nursing Midterm Practice",
      description: "My own questions for the hand-hygiene section of the midterm.",
      subjectId: null,
      customSubject: "Fundamental of Nursing Sciences",
              visibility: "private",
      examDate: "2026-07-01",
      tags: ["midterm", "infection-control"],
      isArchived: false,
      createdAt: "2026-01-05T09:00:00.000Z",
      updatedAt: "2026-01-05T09:00:00.000Z",
    },
  ];
  const userQcmQuestions: UserQcmQuestion[] = [
    {
      id: uuid(),
      setId: demoSetId,
      ownerId: DEMO_STUDENT_ID,
      questionText: "What is the single most effective action to prevent healthcare-associated infection?",
      options: {
        A: "Wearing gloves at all times",
        B: "Hand hygiene at the right moments",
        C: "Using antibiotics early",
        D: "Isolating every patient",
      },
      correctOption: "B",
      explanation:
        "Hand hygiene performed at the WHO 'five moments' is the most effective, evidence-based way to prevent transmission.",
      difficulty: "easy",
      sourceNote: "WHO Five Moments for Hand Hygiene",
      tags: ["hand-hygiene"],
      isArchived: false,
      createdAt: "2026-01-05T09:05:00.000Z",
      updatedAt: "2026-01-05T09:05:00.000Z",
    },
    {
      id: uuid(),
      setId: demoSetId,
      ownerId: DEMO_STUDENT_ID,
      questionText: "Alcohol-based hand rub is preferred over soap and water EXCEPT when hands are:",
      options: {
        A: "Visibly soiled",
        B: "Dry",
        C: "Recently rubbed",
        D: "Warm",
      },
      correctOption: "A",
      explanation:
        "When hands are visibly soiled, wash with soap and water — alcohol rub does not remove visible dirt or some spores.",
      difficulty: "medium",
      sourceNote: null,
      tags: [],
      isArchived: false,
      createdAt: "2026-01-05T09:06:00.000Z",
      updatedAt: "2026-01-05T09:06:00.000Z",
    },
  ];

  return {
    profiles,
    credentials,
    resultMeta: {},
    subjects: [...SUBJECTS],
        questions: [...QUESTIONS],
    sessions,
    answers,
    reports,
    hintRequests: [],
    badges: [...BADGES],
    userBadges,
    posts: [...POSTS],
    savedPosts: [],
    challenges: [...CHALLENGES],
    challengeProgress: [],
    userQcmSets,
    userQcmQuestions,
    userQcmSessions: [],
  };
}

const globalForStore = globalThis as unknown as { __svaengStore?: StoreState };

export const store: StoreState = globalForStore.__svaengStore ?? seedState();
if (!globalForStore.__svaengStore) globalForStore.__svaengStore = store;
