/**
 * Core domain types for Svaeng-Yul.
 * These mirror the database schema but are the shapes the UI works with.
 */

export type OptionKey = "A" | "B" | "C" | "D";
export type Difficulty = "easy" | "medium" | "hard";
export type QuizMode = "random_practice" | "range_practice";
export type ContentStatus = "draft" | "published" | "archived";
export type UserRole = "student" | "admin";

export type ReportStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changed_answer"
  | "improved_explanation"
  | "marked_ambiguous";

export type AiVerdict =
  | "keep_current_answer"
  | "change_answer"
  | "improve_explanation"
  | "mark_ambiguous";

/** Seed/editorial metadata — see src/data/seed and the instructor review flow. */
export type VerificationStatus = "verified" | "needs_instructor_verification";
export type CognitiveLevel = "recall" | "understanding" | "application" | "analysis";

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  school: string | null;
  studyYear: string | null;
  xp: number;
  level: number;
  streakCount: number;
  lastStudyDate: string | null; // ISO date (yyyy-mm-dd)
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // lucide icon key, see SUBJECT_META
  color: string; // css var token name, e.g. "subject-demography"
  orderIndex: number;
}


export interface Question {
  id: string;
  subjectId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  difficulty: Difficulty;
  sourceReference: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  /* ── Optional editorial metadata (seed bank + admin review) ── */
  verificationStatus?: VerificationStatus;
  cognitiveLevel?: CognitiveLevel;
  /** Cambodia-specific framing note, when relevant. */
  localContextNote?: string | null;
  /** A conceptual seed for the AI hint system — never reveals the answer. */
  hintSeed?: string | null;
}

/** A question as delivered to the quiz client — correct answer is stripped. */
export interface QuizQuestion {
  id: string;
  subjectId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  difficulty: Difficulty;
  localContextNote?: string | null;
}

export interface QuizSession {
  id: string;
  userId: string;
  subjectId: string;
  mode: QuizMode;
  timePerQuestionSeconds: number;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  xpEarned: number;
  startedAt: string;
  completedAt: string | null;
  questionIds: string[];
}

export interface QuizAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOption: OptionKey | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  hintUsed: boolean;
}

export interface AnswerReport {
  id: string;
  userId: string;
  questionId: string;
  sessionId: string | null;
  studentReason: string;
  referenceNote: string | null;
  aiVerdict: AiVerdict | null;
  aiConfidence: number | null;
  aiReason: string | null;
  aiSuggestedAction: string | null;
  adminStatus: ReportStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  subjectId: string | null;
  category: string;
  authorName: string;
  status: ContentStatus;
  readTimeMinutes: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  subjectId: string | null;
  targetType: string;
  targetValue: number;
  xpReward: number;
  badgeName: string | null;
  startsAt: string;
  endsAt: string;
}

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  progressValue: number;
  completedAt: string | null;
}

/* ── My QCM (user-created question sets) ─────────────────────── */

export type QcmVisibility = "private" | "shared";

export interface UserQcmSet {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  customSubject: string | null;

  visibility: QcmVisibility;
  examDate: string | null; // ISO date (yyyy-mm-dd)
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQcmQuestion {
  id: string;
  setId: string;
  ownerId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  difficulty: Difficulty;
  sourceNote: string | null;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQcmSession {
  id: string;
  setId: string;
  ownerId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  createdAt: string;
}

/** A set plus the derived figures the dashboard cards need. */
export interface UserQcmSetSummary extends UserQcmSet {
  questionCount: number;
  lastPracticedAt: string | null;
  lastAccuracy: number | null; // 0–100, from the most recent practice
  /** Resolved label: the linked subject name, or the custom subject text. */
  subjectLabel: string | null;
  topicLabel: string | null;
}

export interface QcmDashboardStats {
  totalSets: number;
  totalQuestions: number;
  examSets: number; // sets with an exam_date in the future
}

/* ── Derived / view-model types ─────────────────────────────── */

export interface SubjectStats {
  subjectId: string;
  totalQuestions: number;
  answered: number;
  accuracy: number; // 0–100
}

export interface QuizResult {
  session: QuizSession;
  answers: Array<QuizAnswer & { question: Question }>;
  xpEarned: number;
  newLevel: number;
  leveledUp: boolean;
  streakCount: number;
  newBadges: Badge[];
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  streakCount: number;
  accuracy: number;
  score: number; // computed leaderboard score
  rank: number;
}
