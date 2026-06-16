import { isSupabaseConfigured } from "@/lib/config";
import { SUBJECT_META, type SubjectSlug } from "@/lib/constants";
import { memoryRepository } from "@/lib/data/memory-repository";
import { supabaseRepository } from "@/lib/data/supabase-repository";
import type {
  AttachAiVerdictInput,
  CreateHintRequestInput,
  CreatePostInput,
  CreateQcmQuestionInput,
  CreateQcmSetInput,
  CreateQuestionInput,
  CreateReportInput,
  DataRepository,
  QuestionFilter,
  RecordQcmPracticeInput,
  ReviewReportInput,
  StartQuizParams,
  SubmitQuizParams,
  UpdateQcmQuestionInput,
  UpdateQcmSetInput,
} from "@/lib/data/types";
import type { ContentStatus, ReportStatus } from "@/types/domain";

export type * from "@/lib/data/types";

function data(): DataRepository {
  return isSupabaseConfigured ? supabaseRepository : memoryRepository;
}

export function subjectMeta(slug: string) {
  return SUBJECT_META[slug as SubjectSlug];
}

export const listSubjects = () => data().listSubjects();
export const getSubject = (id: string) => data().getSubject(id);
export const getSubjectBySlug = (slug: string) => data().getSubjectBySlug(slug);

export const listQuestions = (filter?: QuestionFilter) => data().listQuestions(filter);
export const getQuestion = (id: string) => data().getQuestion(id);
export const createQuestion = (input: CreateQuestionInput) => data().createQuestion(input);
export const archiveQuestion = (id: string) => data().archiveQuestion(id);

export const getProfile = (userId: string) => data().getProfile(userId);
export const startQuizSession = (params: StartQuizParams) => data().startQuizSession(params);
export const getSession = (id: string) => data().getSession(id);
export const listSessions = (userId: string) => data().listSessions(userId);
export const getSessionAnswers = (sessionId: string) => data().getSessionAnswers(sessionId);
export const submitQuizSession = (params: SubmitQuizParams) => data().submitQuizSession(params);
export const getStoredResult = (sessionId: string, userId: string) =>
  data().getStoredResult(sessionId, userId);
export const subjectStats = (userId: string, subjectId: string) =>
  data().subjectStats(userId, subjectId);
export const overallAccuracy = (userId: string) => data().overallAccuracy(userId);

export const listBadges = () => data().listBadges();
export const getEarnedBadgeIds = (userId: string) => data().getEarnedBadgeIds(userId);

export const createHintRequest = (input: CreateHintRequestInput) =>
  data().createHintRequest(input);
export const createReport = (input: CreateReportInput) => data().createReport(input);
export const attachAiVerdict = (reportId: string, ai: AttachAiVerdictInput) =>
  data().attachAiVerdict(reportId, ai);
export const listReports = (status?: ReportStatus) => data().listReports(status);
export const getReport = (id: string) => data().getReport(id);
export const reviewReport = (input: ReviewReportInput) => data().reviewReport(input);

export const listPosts = (status?: ContentStatus) => data().listPosts(status);
export const listAllPosts = () => data().listAllPosts();
export const getPostBySlug = (slug: string) => data().getPostBySlug(slug);
export const getPost = (id: string) => data().getPost(id);
export const createPost = (input: CreatePostInput) => data().createPost(input);
export const updatePost = (id: string, patch: Parameters<DataRepository["updatePost"]>[1]) =>
  data().updatePost(id, patch);
export const savedPostIds = (userId: string) => data().savedPostIds(userId);
export const toggleSavedPost = (userId: string, postId: string) =>
  data().toggleSavedPost(userId, postId);

export const listChallenges = () => data().listChallenges();
export const getChallengeProgress = (userId: string, challengeId: string) =>
  data().getChallengeProgress(userId, challengeId);

export const listStudentProfiles = () => data().listStudentProfiles();
export const adminStats = () => data().adminStats();
export const adminWeakSubjects = () => data().adminWeakSubjects();

/* ── My QCM ───────────────────────────────────────────── */
export const listQcmSets = (ownerId: string, opts?: { includeArchived?: boolean }) =>
  data().listQcmSets(ownerId, opts);
export const getQcmSet = (setId: string, ownerId: string) => data().getQcmSet(setId, ownerId);
export const createQcmSet = (input: CreateQcmSetInput) => data().createQcmSet(input);
export const updateQcmSet = (setId: string, ownerId: string, patch: UpdateQcmSetInput) =>
  data().updateQcmSet(setId, ownerId, patch);
export const deleteQcmSet = (setId: string, ownerId: string) =>
  data().deleteQcmSet(setId, ownerId);
export const listQcmQuestions = (
  setId: string,
  ownerId: string,
  opts?: { includeArchived?: boolean },
) => data().listQcmQuestions(setId, ownerId, opts);
export const getQcmQuestion = (questionId: string, ownerId: string) =>
  data().getQcmQuestion(questionId, ownerId);
export const createQcmQuestion = (input: CreateQcmQuestionInput) =>
  data().createQcmQuestion(input);
export const updateQcmQuestion = (
  questionId: string,
  ownerId: string,
  patch: UpdateQcmQuestionInput,
) => data().updateQcmQuestion(questionId, ownerId, patch);
export const deleteQcmQuestion = (questionId: string, ownerId: string) =>
  data().deleteQcmQuestion(questionId, ownerId);
export const recordQcmPractice = (input: RecordQcmPracticeInput) =>
  data().recordQcmPractice(input);
export const qcmDashboardStats = (ownerId: string) => data().qcmDashboardStats(ownerId);
