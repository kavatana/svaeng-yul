import * as repo from "@/lib/store/repo";
import type { DataRepository } from "@/lib/data/types";

export const memoryRepository: DataRepository = {
  listSubjects: async () => repo.listSubjects(),
  getSubject: async (id) => repo.getSubject(id),
  getSubjectBySlug: async (slug) => repo.getSubjectBySlug(slug),
      
  listQuestions: async (filter) => repo.listQuestions(filter),
  getQuestion: async (id) => repo.getQuestion(id),
  createQuestion: async (input) => repo.createQuestion(input),
  archiveQuestion: async (id) => repo.archiveQuestion(id),

  getProfile: async (userId) => repo.getProfile(userId),
  startQuizSession: async (params) => repo.startQuizSession(params),
  getSession: async (id) => repo.getSession(id),
  listSessions: async (userId) => repo.listSessions(userId),
  getSessionAnswers: async (sessionId) => repo.getSessionAnswers(sessionId),
  submitQuizSession: async (params) => repo.submitQuizSession(params),
  getStoredResult: async (sessionId, userId) => repo.getStoredResult(sessionId, userId),
    overallAccuracy: async (userId) => repo.overallAccuracy(userId),

  listBadges: async () => repo.listBadges(),
  getEarnedBadgeIds: async (userId) => repo.getEarnedBadgeIds(userId),

  createHintRequest: async (input) => {
    repo.createHintRequest(input);
  },
  createReport: async (input) => repo.createReport(input),
  attachAiVerdict: async (reportId, ai) => repo.attachAiVerdict(reportId, ai),
  listReports: async (status) => repo.listReports(status),
  getReport: async (id) => repo.getReport(id),
  reviewReport: async (input) => repo.reviewReport(input),

  listPosts: async (status) => repo.listPosts(status),
  listAllPosts: async () => repo.listAllPosts(),
  getPostBySlug: async (slug) => repo.getPostBySlug(slug),
  getPost: async (id) => repo.getPost(id),
  createPost: async (input) => repo.createPost(input),
  updatePost: async (id, patch) => repo.updatePost(id, patch),
  savedPostIds: async (userId) => repo.savedPostIds(userId),
  toggleSavedPost: async (userId, postId) => repo.toggleSavedPost(userId, postId),

  listChallenges: async () => repo.listChallenges(),
  getChallengeProgress: async (userId, challengeId) =>
    repo.getChallengeProgress(userId, challengeId),

  listQcmSets: async (ownerId, opts) => repo.listQcmSets(ownerId, opts),
  getQcmSet: async (setId, ownerId) => repo.getQcmSet(setId, ownerId),
  createQcmSet: async (input) => repo.createQcmSet(input),
  updateQcmSet: async (setId, ownerId, patch) => repo.updateQcmSet(setId, ownerId, patch),
  deleteQcmSet: async (setId, ownerId) => repo.deleteQcmSet(setId, ownerId),
  listQcmQuestions: async (setId, ownerId, opts) =>
    repo.listQcmQuestions(setId, ownerId, opts),
  getQcmQuestion: async (questionId, ownerId) => repo.getQcmQuestion(questionId, ownerId),
  createQcmQuestion: async (input) => repo.createQcmQuestion(input),
  updateQcmQuestion: async (questionId, ownerId, patch) =>
    repo.updateQcmQuestion(questionId, ownerId, patch),
  deleteQcmQuestion: async (questionId, ownerId) =>
    repo.deleteQcmQuestion(questionId, ownerId),
  recordQcmPractice: async (input) => repo.recordQcmPractice(input),
  qcmDashboardStats: async (ownerId) => repo.qcmDashboardStats(ownerId),

  listStudentProfiles: async () => repo.listStudentProfiles(),
  adminStats: async () => repo.adminStats(),
  adminWeakSubjects: async () => repo.adminWeakSubjects(),
  subjectStats: async (userId, subjectId) => repo.subjectStats(userId, subjectId),
};
