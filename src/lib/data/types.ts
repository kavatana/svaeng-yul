import type {
  AnswerReport,
  Badge,
  Challenge,
  ContentStatus,
  Difficulty,
  OptionKey,
  Post,
  Profile,
  QcmDashboardStats,
  QcmVisibility,
  Question,
  QuizAnswer,
  QuizMode,
  QuizQuestion,
  QuizResult,
  QuizSession,
  ReportStatus,
  Subject,
  SubjectStats,
  UserQcmQuestion,
  UserQcmSession,
  UserQcmSet,
  UserQcmSetSummary,
} from "@/types/domain";
import type { SubmittedAnswer } from "@/lib/quiz/scoring";

export interface QuestionFilter {
  subjectId?: string;
  difficulty?: Difficulty;
  status?: ContentStatus;
  search?: string;
}

export interface StartQuizParams {
  userId: string;
  subjectId: string;
  mode: QuizMode;
  count: number;
  timePerQuestionSeconds: number;
}

export interface StartQuizResult {
  session: QuizSession;
  questions: QuizQuestion[];
}

export interface SubmitQuizParams {
  userId: string;
  sessionId: string;
  answers: SubmittedAnswer[];
}

export interface CreateReportInput {
  userId: string;
  questionId: string;
  sessionId: string | null;
  studentReason: string;
  referenceNote: string | null;
}

export interface CreateHintRequestInput {
  userId: string;
  sessionId: string | null;
  questionId: string;
  hintText: string;
}

export interface AttachAiVerdictInput {
  verdict: string;
  confidence: number;
  reason: string;
  action: string;
}

export interface ReviewReportInput {
  reportId: string;
  reviewerId: string;
  action: ReportStatus;
  adminNote?: string;
  newCorrectOption?: OptionKey;
  newExplanation?: string;
}

export interface CreateInput {
  subjectId: string;
  name: string;
}

export type CreateQuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;

export type CreatePostInput = Omit<Post, "id" | "createdAt">;

/* ── My QCM ───────────────────────────────────────────── */
export interface CreateQcmSetInput {
  ownerId: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  customSubject: string | null;
  visibility: QcmVisibility;
  examDate: string | null;
  tags: string[];
}

export interface UpdateQcmSetInput {
  title?: string;
  description?: string | null;
  subjectId?: string | null;
  customSubject?: string | null;
  visibility?: QcmVisibility;
  examDate?: string | null;
  tags?: string[];
  isArchived?: boolean;
}

export interface CreateQcmQuestionInput {
  setId: string;
  ownerId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  difficulty: Difficulty;
  sourceNote: string | null;
  tags: string[];
}

export interface UpdateQcmQuestionInput {
  questionText?: string;
  options?: Record<OptionKey, string>;
  correctOption?: OptionKey;
  explanation?: string;
  difficulty?: Difficulty;
  sourceNote?: string | null;
  tags?: string[];
  isArchived?: boolean;
}

export interface RecordQcmPracticeInput {
  setId: string;
  ownerId: string;
  totalQuestions: number;
  correctCount: number;
}

export interface AdminStats {
  totalQuestions: number;
  publishedQuestions: number;
  totalUsers: number;
  pendingReports: number;
  quizzesCompleted: number;
  totalPosts: number;
}

export interface AdminWeakSubject {
  subjectId: string;
  accuracy: number;
  answered: number;
}

export interface DataRepository {
  listSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | null>;
  getSubjectBySlug(slug: string): Promise<Subject | null>;


  listQuestions(filter?: QuestionFilter): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | null>;
  createQuestion(input: CreateQuestionInput): Promise<Question>;
  archiveQuestion(id: string): Promise<Question | null>;

  getProfile(userId: string): Promise<Profile | null>;
  startQuizSession(params: StartQuizParams): Promise<StartQuizResult>;
  getSession(id: string): Promise<QuizSession | null>;
  listSessions(userId: string): Promise<QuizSession[]>;
  getSessionAnswers(sessionId: string): Promise<QuizAnswer[]>;
  submitQuizSession(params: SubmitQuizParams): Promise<QuizResult | null>;
  getStoredResult(sessionId: string, userId: string): Promise<QuizResult | null>;
  subjectStats(userId: string, subjectId: string): Promise<SubjectStats>;
  overallAccuracy(userId: string): Promise<number>;

  listBadges(): Promise<Badge[]>;
  getEarnedBadgeIds(userId: string): Promise<Set<string>>;

  createHintRequest(input: CreateHintRequestInput): Promise<void>;
  createReport(input: CreateReportInput): Promise<AnswerReport>;
  attachAiVerdict(reportId: string, ai: AttachAiVerdictInput): Promise<void>;
  listReports(status?: ReportStatus): Promise<AnswerReport[]>;
  getReport(id: string): Promise<AnswerReport | null>;
  reviewReport(input: ReviewReportInput): Promise<AnswerReport | null>;

  listPosts(status?: ContentStatus): Promise<Post[]>;
  listAllPosts(): Promise<Post[]>;
  getPostBySlug(slug: string): Promise<Post | null>;
  getPost(id: string): Promise<Post | null>;
  createPost(input: CreatePostInput): Promise<Post>;
  updatePost(id: string, patch: Partial<Post>): Promise<Post | null>;
  savedPostIds(userId: string): Promise<Set<string>>;
  toggleSavedPost(userId: string, postId: string): Promise<boolean>;

  listChallenges(): Promise<Challenge[]>;
  getChallengeProgress(userId: string, challengeId: string): Promise<number>;

  /* ── My QCM (all owner-scoped; ownership enforced in code) ── */
  listQcmSets(ownerId: string, opts?: { includeArchived?: boolean }): Promise<UserQcmSetSummary[]>;
  getQcmSet(setId: string, ownerId: string): Promise<UserQcmSet | null>;
  createQcmSet(input: CreateQcmSetInput): Promise<UserQcmSet>;
  updateQcmSet(setId: string, ownerId: string, patch: UpdateQcmSetInput): Promise<UserQcmSet | null>;
  deleteQcmSet(setId: string, ownerId: string): Promise<boolean>;
  listQcmQuestions(
    setId: string,
    ownerId: string,
    opts?: { includeArchived?: boolean },
  ): Promise<UserQcmQuestion[]>;
  getQcmQuestion(questionId: string, ownerId: string): Promise<UserQcmQuestion | null>;
  createQcmQuestion(input: CreateQcmQuestionInput): Promise<UserQcmQuestion>;
  updateQcmQuestion(
    questionId: string,
    ownerId: string,
    patch: UpdateQcmQuestionInput,
  ): Promise<UserQcmQuestion | null>;
  deleteQcmQuestion(questionId: string, ownerId: string): Promise<boolean>;
  recordQcmPractice(input: RecordQcmPracticeInput): Promise<UserQcmSession>;
  qcmDashboardStats(ownerId: string): Promise<QcmDashboardStats>;

  listStudentProfiles(): Promise<Profile[]>;
  adminStats(): Promise<AdminStats>;
  adminWeakSubjects(): Promise<AdminWeakSubject[]>;
}
