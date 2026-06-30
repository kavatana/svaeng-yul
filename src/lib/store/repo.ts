import { v4 as uuid } from "uuid";
import { store, DEMO_STUDENT_ID } from "@/lib/store/db";
import type {
  AnswerReport,
  Badge,
  Challenge,
  ContentStatus,
  Difficulty,
  Post,
  Profile,
  QcmDashboardStats,
  Question,
  QuizAnswer,
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
  AdminStats,
  AdminWeakSubject,
  AttachAiVerdictInput,
  CreateHintRequestInput,
  CreatePostInput,
  CreateQcmQuestionInput,
  CreateQcmSetInput,
  CreateReportInput,
  RecordQcmPracticeInput,
  ReviewReportInput,
  UpdateQcmQuestionInput,
  UpdateQcmSetInput,
} from "@/lib/data/types";
import { shuffle } from "@/lib/utils";
import { gradeQuiz, type SubmittedAnswer } from "@/lib/quiz/scoring";
import { computeQuizXp, computeStreak, levelForXp } from "@/lib/gamification/xp";
import { evaluateBadges } from "@/lib/gamification/badges";
import { type SubjectSlug } from "@/lib/constants";

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
  const pool = store.questions.filter(
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

/** Answers from this user's completed sessions, optionally scoped to a subject. */
function answersForCompletedSessions(userId: string, subjectId?: string): QuizAnswer[] {
  const sessionIds = new Set(
    store.sessions
      .filter(
        (s) =>
          s.userId === userId &&
          s.completedAt &&
          (!subjectId || s.subjectId === subjectId),
      )
      .map((s) => s.id),
  );
  return store.answers.filter((a) => sessionIds.has(a.sessionId));
}

export function subjectStats(userId: string, subjectId: string): SubjectStats {
  const totalQuestions = store.questions.filter(
    (q) => q.subjectId === subjectId && q.status === "published",
  ).length;
  const answers = answersForCompletedSessions(userId, subjectId);
  const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
  const correct = answers.filter((a) => a.isCorrect).length;
  return {
    subjectId,
    totalQuestions,
    answered: answeredQuestionIds.size,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
  };
}

export function overallAccuracy(userId: string): number {
  const answers = answersForCompletedSessions(userId);
  if (!answers.length) return 0;
  return Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100);
}

/* ── Badges ───────────────────────────────────────────── */
export function listBadges(): Badge[] {
  return [...store.badges].sort((a, b) => a.name.localeCompare(b.name));
}

export function getEarnedBadgeIds(userId: string): Set<string> {
  return new Set(
    store.userBadges.filter((ub) => ub.userId === userId).map((ub) => ub.badgeId),
  );
}

/* ── Hint requests ────────────────────────────────────── */
export function createHintRequest(input: CreateHintRequestInput): void {
  store.hintRequests.push({
    id: uuid(),
    userId: input.userId,
    sessionId: input.sessionId,
    questionId: input.questionId,
    hintText: input.hintText,
    createdAt: nowIso(),
  });
}

/* ── Answer reports (AI dispute flow) ─────────────────── */
export function createReport(input: CreateReportInput): AnswerReport {
  const report: AnswerReport = {
    id: uuid(),
    userId: input.userId,
    questionId: input.questionId,
    sessionId: input.sessionId,
    studentReason: input.studentReason,
    referenceNote: input.referenceNote,
    aiVerdict: null,
    aiConfidence: null,
    aiReason: null,
    aiSuggestedAction: null,
    adminStatus: "pending",
    adminNote: null,
    reviewedBy: null,
    createdAt: nowIso(),
    reviewedAt: null,
  };
  store.reports.push(report);
  return report;
}

export function attachAiVerdict(reportId: string, ai: AttachAiVerdictInput): void {
  const report = store.reports.find((r) => r.id === reportId);
  if (!report) return;
  report.aiVerdict = ai.verdict as AnswerReport["aiVerdict"];
  report.aiConfidence = ai.confidence;
  report.aiReason = ai.reason;
  report.aiSuggestedAction = ai.action;
}

export function listReports(status?: ReportStatus): AnswerReport[] {
  return store.reports
    .filter((r) => !status || r.adminStatus === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getReport(id: string): AnswerReport | null {
  return store.reports.find((r) => r.id === id) ?? null;
}

export function reviewReport(input: ReviewReportInput): AnswerReport | null {
  const report = getReport(input.reportId);
  if (!report) return null;

  if (input.action === "changed_answer" && input.newCorrectOption) {
    const q = getQuestion(report.questionId);
    if (q) Object.assign(q, { correctOption: input.newCorrectOption, updatedAt: nowIso() });
  }
  if (input.action === "improved_explanation" && input.newExplanation) {
    const q = getQuestion(report.questionId);
    if (q) Object.assign(q, { explanation: input.newExplanation, updatedAt: nowIso() });
  }
  if (input.action === "marked_ambiguous") {
    const q = getQuestion(report.questionId);
    if (q) Object.assign(q, { status: "draft" as ContentStatus, updatedAt: nowIso() });
  }

  report.adminStatus = input.action;
  report.adminNote = input.adminNote ?? null;
  report.reviewedBy = input.reviewerId;
  report.reviewedAt = nowIso();
  return report;
}

/* ── Posts ────────────────────────────────────────────── */
export function listPosts(status: ContentStatus = "published"): Post[] {
  return store.posts
    .filter((p) => p.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllPosts(): Post[] {
  return [...store.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPostBySlug(slug: string): Post | null {
  return store.posts.find((p) => p.slug === slug) ?? null;
}

export function getPost(id: string): Post | null {
  return store.posts.find((p) => p.id === id) ?? null;
}

export function createPost(input: CreatePostInput): Post {
  const post: Post = { ...input, id: uuid(), createdAt: nowIso() };
  store.posts.push(post);
  return post;
}

export function updatePost(id: string, patch: Partial<Post>): Post | null {
  const post = getPost(id);
  if (!post) return null;
  Object.assign(post, patch);
  return post;
}

export function savedPostIds(userId: string): Set<string> {
  return new Set(
    store.savedPosts.filter((s) => s.userId === userId).map((s) => s.postId),
  );
}

export function toggleSavedPost(userId: string, postId: string): boolean {
  const idx = store.savedPosts.findIndex((s) => s.userId === userId && s.postId === postId);
  if (idx >= 0) {
    store.savedPosts.splice(idx, 1);
    return false;
  }
  store.savedPosts.push({ userId, postId });
  return true;
}

/* ── Challenges ───────────────────────────────────────── */
export function listChallenges(): Challenge[] {
  return [...store.challenges].sort((a, b) => a.endsAt.localeCompare(b.endsAt));
}

export function getChallengeProgress(userId: string, challengeId: string): number {
  return (
    store.challengeProgress.find(
      (p) => p.userId === userId && p.challengeId === challengeId,
    )?.progressValue ?? 0
  );
}

export function advanceChallenges(
  userId: string,
  subjectId: string,
  questionsAnswered: number,
): void {
  for (const challenge of store.challenges) {
    if (challenge.subjectId && challenge.subjectId !== subjectId) continue;
    if (
      challenge.targetType !== "questions_answered" &&
      challenge.targetType !== "questions_completed"
    ) {
      continue;
    }
    const existing = store.challengeProgress.find(
      (p) => p.userId === userId && p.challengeId === challenge.id,
    );
    const nextValue = Math.min(
      challenge.targetValue,
      (existing?.progressValue ?? 0) + questionsAnswered,
    );
    const completedAt =
      nextValue >= challenge.targetValue
        ? existing?.completedAt ?? nowIso()
        : existing?.completedAt ?? null;
    if (existing) {
      existing.progressValue = nextValue;
      existing.completedAt = completedAt;
    } else {
      store.challengeProgress.push({
        challengeId: challenge.id,
        userId,
        progressValue: nextValue,
        completedAt,
      });
    }
  }
}

/* ── My QCM (owner-scoped; ownership enforced here) ───── */
function touchQcmSet(setId: string) {
  const set = store.userQcmSets.find((s) => s.id === setId);
  if (set) set.updatedAt = nowIso();
}

function toQcmSetSummary(set: UserQcmSet): UserQcmSetSummary {
  const questionCount = store.userQcmQuestions.filter(
    (q) => q.setId === set.id && !q.isArchived,
  ).length;
  const lastSession = store.userQcmSessions
    .filter((s) => s.setId === set.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const subjectLabel =
    set.customSubject ||
    (set.subjectId ? getSubject(set.subjectId)?.name ?? null : null);
  return {
    ...set,
    questionCount,
    lastPracticedAt: lastSession?.createdAt ?? null,
    lastAccuracy: lastSession ? Math.round(lastSession.scorePercent) : null,
    subjectLabel,
    topicLabel: null,
  };
}

export function listQcmSets(
  ownerId: string,
  opts?: { includeArchived?: boolean },
): UserQcmSetSummary[] {
  return store.userQcmSets
    .filter((s) => s.ownerId === ownerId && (opts?.includeArchived || !s.isArchived))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toQcmSetSummary);
}

export function getQcmSet(setId: string, ownerId: string): UserQcmSet | null {
  return (
    store.userQcmSets.find((s) => s.id === setId && s.ownerId === ownerId) ?? null
  );
}

export function createQcmSet(input: CreateQcmSetInput): UserQcmSet {
  const set: UserQcmSet = {
    id: uuid(),
    ownerId: input.ownerId,
    title: input.title,
    description: input.description,
    subjectId: input.subjectId,
    customSubject: input.customSubject,
    visibility: input.visibility,
    examDate: input.examDate,
    tags: input.tags,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store.userQcmSets.push(set);
  return set;
}

export function updateQcmSet(
  setId: string,
  ownerId: string,
  patch: UpdateQcmSetInput,
): UserQcmSet | null {
  const set = getQcmSet(setId, ownerId);
  if (!set) return null;
  Object.assign(set, patch, { updatedAt: nowIso() });
  return set;
}

export function deleteQcmSet(setId: string, ownerId: string): boolean {
  const idx = store.userQcmSets.findIndex((s) => s.id === setId && s.ownerId === ownerId);
  if (idx < 0) return false;
  store.userQcmSets.splice(idx, 1);
  store.userQcmQuestions = store.userQcmQuestions.filter((q) => q.setId !== setId);
  store.userQcmSessions = store.userQcmSessions.filter((s) => s.setId !== setId);
  return true;
}

export function listQcmQuestions(
  setId: string,
  ownerId: string,
  opts?: { includeArchived?: boolean },
): UserQcmQuestion[] {
  return store.userQcmQuestions
    .filter(
      (q) =>
        q.setId === setId &&
        q.ownerId === ownerId &&
        (opts?.includeArchived || !q.isArchived),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getQcmQuestion(
  questionId: string,
  ownerId: string,
): UserQcmQuestion | null {
  return (
    store.userQcmQuestions.find((q) => q.id === questionId && q.ownerId === ownerId) ??
    null
  );
}

export function createQcmQuestion(input: CreateQcmQuestionInput): UserQcmQuestion {
  const set = getQcmSet(input.setId, input.ownerId);
  if (!set) throw new Error("Unknown set");
  const question: UserQcmQuestion = {
    id: uuid(),
    setId: input.setId,
    ownerId: input.ownerId,
    questionText: input.questionText,
    options: input.options,
    correctOption: input.correctOption,
    explanation: input.explanation,
    difficulty: input.difficulty,
    sourceNote: input.sourceNote,
    tags: input.tags,
    isArchived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store.userQcmQuestions.push(question);
  touchQcmSet(input.setId);
  return question;
}

export function updateQcmQuestion(
  questionId: string,
  ownerId: string,
  patch: UpdateQcmQuestionInput,
): UserQcmQuestion | null {
  const question = getQcmQuestion(questionId, ownerId);
  if (!question) return null;
  Object.assign(question, patch, { updatedAt: nowIso() });
  touchQcmSet(question.setId);
  return question;
}

export function deleteQcmQuestion(questionId: string, ownerId: string): boolean {
  const idx = store.userQcmQuestions.findIndex(
    (q) => q.id === questionId && q.ownerId === ownerId,
  );
  if (idx < 0) return false;
  const [removed] = store.userQcmQuestions.splice(idx, 1);
  touchQcmSet(removed.setId);
  return true;
}

export function recordQcmPractice(input: RecordQcmPracticeInput): UserQcmSession {
  const set = getQcmSet(input.setId, input.ownerId);
  if (!set) throw new Error("Unknown set");
  const scorePercent = input.totalQuestions
    ? Math.round((input.correctCount / input.totalQuestions) * 100)
    : 0;
  const session: UserQcmSession = {
    id: uuid(),
    setId: input.setId,
    ownerId: input.ownerId,
    totalQuestions: input.totalQuestions,
    correctCount: input.correctCount,
    scorePercent,
    createdAt: nowIso(),
  };
  store.userQcmSessions.push(session);
  return session;
}

export function qcmDashboardStats(ownerId: string): QcmDashboardStats {
  const sets = store.userQcmSets.filter((s) => s.ownerId === ownerId && !s.isArchived);
  const setIds = new Set(sets.map((s) => s.id));
  const totalQuestions = store.userQcmQuestions.filter(
    (q) => q.ownerId === ownerId && !q.isArchived && setIds.has(q.setId),
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const examSets = sets.filter((s) => s.examDate && s.examDate >= today).length;
  return {
    totalSets: sets.length,
    totalQuestions,
    examSets,
  };
}

/* ── Admin / leaderboard ──────────────────────────────── */
export function listStudentProfiles(): Profile[] {
  return store.profiles
    .filter((p) => p.role === "student")
    .sort((a, b) => b.xp - a.xp);
}

export function adminStats(): AdminStats {
  const completedSessions = store.sessions.filter((s) => s.completedAt).length;
  return {
    totalQuestions: store.questions.length,
    publishedQuestions: store.questions.filter((q) => q.status === "published").length,
    totalUsers: store.profiles.filter((p) => p.role === "student").length,
    pendingReports: store.reports.filter((r) => r.adminStatus === "pending").length,
    quizzesCompleted: completedSessions,
    totalPosts: store.posts.length,
  };
}

export function adminWeakSubjects(): AdminWeakSubject[] {
  const answers = store.answers.filter((a) =>
    store.sessions.some((s) => s.id === a.sessionId && s.completedAt),
  );
  const tally = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const question = getQuestion(answer.questionId);
    if (!question) continue;
    const t = tally.get(question.subjectId) ?? { correct: 0, total: 0 };
    t.total += 1;
    if (answer.isCorrect) t.correct += 1;
    tally.set(question.subjectId, t);
  }
  return [...tally.entries()]
    .map(([subjectId, t]) => ({
      subjectId,
      answered: t.total,
      accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
    }))
    .filter((x) => x.answered > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
}
