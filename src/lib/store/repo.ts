import { v4 as uuid } from "uuid";
import { store, DEMO_STUDENT_ID } from "@/lib/store/db";
import type {
  AnswerReport,
  ContentStatus,
  Difficulty,
  OptionKey,
  Post,
  Profile,
  Question,
  QuizMode,
  QuizQuestion,
  QuizResult,
  QuizSession,
  ReportStatus,
  SubjectStats,
  UserQcmQuestion,
  UserQcmSession,
  UserQcmSet,
  UserQcmSetSummary,
  UserRole,
} from "@/types/domain";
import type {
  CreateQcmQuestionInput,
  CreateQcmSetInput,
  RecordQcmPracticeInput,
  UpdateQcmQuestionInput,
  UpdateQcmSetInput,
} from "@/lib/data/types";
import { shuffle } from "@/lib/utils";
import { gradeQuiz, type SubmittedAnswer } from "@/lib/quiz/scoring";
import { computeQuizXp, computeStreak, levelForXp } from "@/lib/gamification/xp";
import { evaluateBadges } from "@/lib/gamification/badges";
import { SUBJECT_META, type SubjectSlug } from "@/lib/constants";

const nowIso = () => new Date().toISOString();

/* ── Subjects & topics ────────────────────────────────── */
export function listSubjects() {
  return [...store.subjects].sort((a, b) => a.orderIndex - b.orderIndex);
}
export function getSubject(id: string) {
  return store.subjects.find((s) => s.id === id) ?? null;
}
export function getSubjectBySlug(slug: string) {
  return store.subjects.find((s) => s.slug === slug) ?? null;
}

/* ── Questions ────────────────────────────────────────── */
export interface ResultMeta {
  leveledUp: boolean;
  newLevel: number;
  newBadgeKeys: string[];
}
export interface QuestionFilter {
  subjectId?: string;
  difficulty?: Difficulty;
  status?: ContentStatus;
  search?: string;
}
export function listQuestions(filter: QuestionFilter = {}): Question[] {
  return store.questions.filter((q) => {
    if (filter.subjectId && q.subjectId !== filter.subjectId) return false;
    if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter.status && q.status !== filter.status) return false;
    if (filter.search && !q.questionText.toLowerCase().includes(filter.search.toLowerCase()))
      return false;
    return true;
  });
}
export function getQuestion(id: string) {
  return store.questions.find((q) => q.id === id) ?? null;
}
export function createQuestion(input: Omit<Question, "id" | "createdAt" | "updatedAt">): Question {
  const q: Question = { ...input, id: uuid(), createdAt: nowIso(), updatedAt: nowIso() };
  store.questions.push(q);
  return q;
}
export function updateQuestion(id: string, patch: Partial<Question>): Question | null {
  const q = getQuestion(id);
  if (!q) return null;
  Object.assign(q, patch, { updatedAt: nowIso() });
  return q;
}
export function archiveQuestion(id: string) {
  return updateQuestion(id, { status: "archived" });
}

/* ── Profiles ─────────────────────────────────────────── */
export function getProfile(userId: string) {
  return store.profiles.find((p) => p.userId === userId) ?? null;
}
export function createProfile(input: {
  userId: string;
  fullName: string;
  role?: UserRole;
}): Profile {
  const profile: Profile = {
    id: uuid(),
    userId: input.userId,
    fullName: input.fullName,
    avatarUrl: null,
    role: input.role ?? "student",
    school: null,
    studyYear: null,
    xp: 0,
    level: 1,
    streakCount: 0,
    lastStudyDate: null,
    createdAt: nowIso(),
  };
  store.profiles.push(profile);
  return profile;
}
export function updateProfile(userId: string, patch: Partial<Profile>): Profile | null {
  const p = getProfile(userId);
  if (!p) return null;
  Object.assign(p, patch);
  return p;
}

/* ── Quiz sessions ────────────────────────────────────── */
function pickQuestions(params: {
  userId: string;
  subjectId: string;
  mode: QuizMode;
  count: number;

  startQuestionIndex?: number;
}): Question[] {
  let pool = store.questions.filter(
    (q) => q.subjectId === params.subjectId && q.status === "published",
  );


  return shuffle(pool).slice(0, params.count);
}

export function startQuizSession(params: {
  userId: string;
  subjectId: string;
  mode: QuizMode;
  count: number;
  timePerQuestionSeconds: number;
  startQuestionIndex?: number;
}): { session: QuizSession; questions: QuizQuestion[] } {
  const picked = pickQuestions(params);
  const session: QuizSession = {
    id: uuid(),
    userId: params.userId,
    subjectId: params.subjectId,
    timePerQuestionSeconds: params.timePerQuestionSeconds,
    mode: params.mode,
    totalQuestions: picked.length,
    correctCount: 0,
    scorePercent: 0,
    xpEarned: 0,
    startedAt: nowIso(),
    completedAt: null,
    questionIds: picked.map((q) => q.id),
  };
  store.sessions.push(session);

  // Strip correct answers + shuffle option presentation order is kept stable
  // (option text only; keys A–D stay aligned with stored correctOption).
  const questions: QuizQuestion[] = picked.map((q) => ({
    id: q.id,
    subjectId: q.subjectId,
    questionText: q.questionText,
    options: q.options,
    difficulty: q.difficulty,
    localContextNote: q.localContextNote,
  }));

  return { session, questions };
}

export function getSession(id: string) {
  return store.sessions.find((s) => s.id === id) ?? null;
}
export function listSessions(userId: string) {
  return store.sessions
    .filter((s) => s.userId === userId && s.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}
export function getSessionAnswers(sessionId: string) {
  return store.answers.filter((a) => a.sessionId === sessionId);
}

/**
 * Submit a quiz: grade server-side, award XP/streak/badges, persist answers,
 * and return the full result. This is the single source of scoring truth.
 */
export function submitQuizSession(params: {
  userId: string;
  sessionId: string;
  answers: SubmittedAnswer[];
}): QuizResult | null {
  const session = getSession(params.sessionId);
  if (!session || session.userId !== params.userId) return null;
  if (session.completedAt) {
    // Idempotent: return the already-computed result.
    return buildResultFromStored(session);
  }

  const questions = session.questionIds
    .map((id) => getQuestion(id))
    .filter((q): q is Question => Boolean(q));

  const { graded, correctCount, scorePercent } = gradeQuiz(questions, params.answers);

  // Persist answers.
  for (const g of graded) {
    store.answers.push({
      id: uuid(),
      sessionId: session.id,
      questionId: g.questionId,
      selectedOption: g.selectedOption,
      isCorrect: g.isCorrect,
      timeSpentSeconds: g.timeSpentSeconds,
      hintUsed: g.hintUsed,
    });
  }

  const xpEarned = computeQuizXp({
    correctCount,
    totalQuestions: questions.length,
    mode: session.mode,
  });

  session.correctCount = correctCount;
  session.scorePercent = scorePercent;
  session.xpEarned = xpEarned;
  session.completedAt = nowIso();

  // Gamification on the profile.
  const profile = getProfile(params.userId);
  let newLevel = profile?.level ?? 1;
  let leveledUp = false;
  let streakCount = profile?.streakCount ?? 0;
  const newBadgeKeys: string[] = [];

  if (profile) {
    const prevLevel = profile.level;
    const prevLastStudy = profile.lastStudyDate;
    const streak = computeStreak({
      currentStreak: profile.streakCount,
      lastStudyDate: profile.lastStudyDate,
    });
    profile.xp += xpEarned;
    profile.level = levelForXp(profile.xp);
    profile.streakCount = streak.streakCount;
    profile.lastStudyDate = streak.lastStudyDate;
    newLevel = profile.level;
    leveledUp = profile.level > prevLevel;
    streakCount = profile.streakCount;

    // Badge evaluation.
    const subject = getSubject(session.subjectId);
    const slug = (subject?.slug ?? "demography") as SubjectSlug;
    const completedSubjectQuizzes = store.sessions.filter(
      (s) => s.userId === params.userId && s.subjectId === session.subjectId && s.completedAt,
    ).length;
    const totalCompleted = store.sessions.filter(
      (s) => s.userId === params.userId && s.completedAt,
    ).length;
    const earnedKeys = new Set(
      store.userBadges
        .filter((ub) => ub.userId === params.userId)
        .map((ub) => ub.badgeId.replace(/^badge-/, "")),
    );
    const isComeback = (() => {
      if (!prevLastStudy) return false;
      const days = (Date.now() - new Date(prevLastStudy).getTime()) / 86_400_000;
      return days >= 2;
    })();

    const unlocked = evaluateBadges({
      earnedKeys,
      totalCompletedQuizzes: totalCompleted,
      streakCount: profile.streakCount,
      scorePercent,
      subjectQuizCount: completedSubjectQuizzes,
      subjectSlug: slug,
      completedHour: new Date().getHours(),
      isComeback,
    });
    for (const key of unlocked) {
      store.userBadges.push({
        id: uuid(),
        userId: params.userId,
        badgeId: `badge-${key}`,
        earnedAt: nowIso(),
      });
      newBadgeKeys.push(key);
    }

    void prevLevel;
  }

  // Advance any matching challenge progress.
  advanceChallenges(params.userId, session.subjectId, questions.length);

  // Persist transient result info so the result page can show it after redirect.
  store.resultMeta[session.id] = {
    leveledUp,
    newLevel,
    newBadgeKeys,
  };

  return {
    session,
    answers: graded.map((g) => ({
      id: uuid(),
      sessionId: session.id,
      questionId: g.questionId,
      selectedOption: g.selectedOption,
      isCorrect: g.isCorrect,
      timeSpentSeconds: g.timeSpentSeconds,
      hintUsed: g.hintUsed,
      question: getQuestion(g.questionId)!,
    })),
    xpEarned,
    newLevel,
    leveledUp,
    streakCount,
    newBadges: store.badges.filter((b) => newBadgeKeys.includes(b.id.replace(/^badge-/, ""))),
  };
}

/** Rebuild a full result for the result page from stored data + result meta. */
export function getStoredResult(sessionId: string, userId: string): QuizResult | null {
  const session = getSession(sessionId);
  if (!session || session.userId !== userId || !session.completedAt) return null;
  const meta = store.resultMeta[sessionId];
  const stored = getSessionAnswers(sessionId);
  return {
    session,
    answers: stored.map((a) => ({ ...a, question: getQuestion(a.questionId)! })),
    xpEarned: session.xpEarned,
    newLevel: meta?.newLevel ?? getProfile(userId)?.level ?? 1,
    leveledUp: meta?.leveledUp ?? false,
    streakCount: getProfile(userId)?.streakCount ?? 0,
    newBadges: store.badges.filter((b) =>
      (meta?.newBadgeKeys ?? []).includes(b.id.replace(/^badge-/, "")),
    ),
          };
}

function buildResultFromStored(session: QuizSession): QuizResult {
  const stored = getSessionAnswers(session.id);
  const profile = getProfile(session.userId);
  return {
    session,
    answers: stored.map((a) => ({ ...a, question: getQuestion(a.questionId)! })),
    xpEarned: session.xpEarned,
    newLevel: profile?.level ?? 1,
    leveledUp: false,
    streakCount: profile?.streakCount ?? 0,
    newBadges: [],
  };
}

/* ── Stats & weak areas ───────────────────────────────── */
/** Convenience for demo: the default student id. */
export const DEFAULT_USER_ID = DEMO_STUDENT_ID;


export function overallAccuracy(userId: string): number { return 0; }
export function listBadges(): any[] { return []; }
export function getEarnedBadgeIds(userId: string): Set<string> { return new Set(); }
export function createHintRequest(input: any): void {}
export function createReport(input: any): any { return {} as any; }
export function attachAiVerdict(reportId: string, ai: any) {}
export function listReports(status?: any): any[] { return []; }
export function getReport(id: string): any { return null; }
export function reviewReport(input: any): any { return null; }
export function listPosts(status?: any): any[] { return []; }
export function listAllPosts(): any[] { return []; }
export function getPostBySlug(slug: string): any { return null; }
export function getPost(id: string): any { return null; }
export function createPost(input: any): any { return {} as any; }
export function updatePost(id: string, patch: any): any { return null; }
export function savedPostIds(userId: string): Set<string> { return new Set(); }
export function toggleSavedPost(userId: string, postId: string): boolean { return false; }
export function listChallenges(): any[] { return []; }
export function getChallengeProgress(userId: string, challengeId: string): number { return 0; }
export function listQcmSets(ownerId: string, opts?: any): any[] { return []; }
export function getQcmSet(setId: string, ownerId: string): any { return null; }
export function createQcmSet(input: any): any { return {} as any; }
export function updateQcmSet(setId: string, ownerId: string, patch: any): any { return null; }
export function deleteQcmSet(setId: string, ownerId: string): boolean { return false; }
export function listQcmQuestions(setId: string, ownerId: string, opts?: any): any[] { return []; }
export function getQcmQuestion(questionId: string, ownerId: string): any { return null; }
export function createQcmQuestion(input: any): any { return {} as any; }
export function updateQcmQuestion(questionId: string, ownerId: string, patch: any): any { return null; }
export function deleteQcmQuestion(questionId: string, ownerId: string): boolean { return false; }
export function recordQcmPractice(input: any): any { return {} as any; }
export function qcmDashboardStats(ownerId: string): any { return { totalSets: 0, totalQuestions: 0, totalPractices: 0 }; }
export function listStudentProfiles(): any[] { return []; }
export function adminStats(): any { return {}; }
export function adminWeakSubjects(): any[] { return []; }
export function advanceChallenges(userId: string, subjectId: string, questionsAnswered: number) {}
