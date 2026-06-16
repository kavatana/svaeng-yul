/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnswerReport,
  Badge,
  Challenge,
  ContentStatus,
  Difficulty,
  OptionKey,
  Post,
  Profile,
  Question,
  QuizAnswer,
  QuizSession,
  ReportStatus,
  Subject,
  SubjectStats,
  UserRole,
} from "@/types/domain";
import type { DataRepository, QuestionFilter } from "@/lib/data/types";
import { shuffle, slugify } from "@/lib/utils";
import { gradeQuiz, type SubmittedAnswer } from "@/lib/quiz/scoring";
import { computeQuizXp, computeStreak, levelForXp } from "@/lib/gamification/xp";
import { evaluateBadges } from "@/lib/gamification/badges";
import type { SubjectSlug } from "@/lib/constants";

const nowIso = () => new Date().toISOString();

function db() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Live Supabase data writes require the server-only service role key.",
    );
  }
  return createAdminClient();
}

function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function optionKey(value: string): OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D" ? value : "A";
}

function contentStatus(value: string): ContentStatus {
  if (value === "published" || value === "archived" || value === "draft") return value;
  return "draft";
}

function difficulty(value: string): Difficulty {
  if (value === "easy" || value === "hard" || value === "medium") return value;
  return "medium";
}

function reportStatus(value: string): ReportStatus {
  if (
    value === "approved" ||
    value === "rejected" ||
    value === "changed_answer" ||
    value === "improved_explanation" ||
    value === "marked_ambiguous"
  ) {
    return value;
  }
  return "pending";
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: (row.role === "admin" ? "admin" : "student") as UserRole,
    school: row.school,
    studyYear: row.study_year,
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    streakCount: row.streak_count ?? 0,
    lastStudyDate: row.last_study_date,
    createdAt: row.created_at,
  };
}

function mapSubject(row: any): Subject {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    icon: row.icon ?? "BookOpen",
    color: row.color ?? "",
    orderIndex: row.order_index ?? 0,
  };
}



function mapQuestion(row: any): Question {
  return {
    id: row.id,
    subjectId: row.subject_id,
        questionText: row.question_text,
    options: {
      A: row.option_a,
      B: row.option_b,
      C: row.option_c,
      D: row.option_d,
    },
    correctOption: optionKey(row.correct_option),
    explanation: row.explanation,
    difficulty: difficulty(row.difficulty),
    sourceReference: row.source_reference,
    status: contentStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    verificationStatus: row.verification_status ?? undefined,
    cognitiveLevel: row.cognitive_level ?? undefined,
    localContextNote: row.local_context_note ?? null,
    hintSeed: row.hint_seed ?? null,
  };
}

function mapSession(row: any, questionIds: string[] = []): QuizSession {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
        mode: row.mode,
    totalQuestions: row.total_questions ?? 0,
    correctCount: row.correct_count ?? 0,
    scorePercent: Number(row.score_percent ?? 0),
    xpEarned: row.xp_earned ?? 0,
    timePerQuestionSeconds: 60,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    questionIds,
  };
}

function mapAnswer(row: any): QuizAnswer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    selectedOption: row.selected_option ? optionKey(row.selected_option) : null,
    isCorrect: Boolean(row.is_correct),
    timeSpentSeconds: row.time_spent_seconds ?? 0,
    hintUsed: Boolean(row.hint_used),
  };
}

function mapReport(row: any): AnswerReport {
  return {
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    sessionId: row.session_id,
    studentReason: row.student_reason,
    referenceNote: row.reference_note,
    aiVerdict: row.ai_verdict,
    aiConfidence: row.ai_confidence,
    aiReason: row.ai_reason,
    aiSuggestedAction: row.ai_suggested_action,
    adminStatus: reportStatus(row.admin_status),
    adminNote: row.admin_note,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function mapBadge(row: any): Badge {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon ?? "Sparkles",
    conditionType: row.condition_type ?? "",
    conditionValue: row.condition_value ?? 0,
  };
}

function mapPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    subjectId: row.subject_id,
    category: row.category ?? "Study Tips",
    authorName: "Svaeng-Yul Team",
    status: contentStatus(row.status),
    readTimeMinutes: row.read_time_minutes ?? 1,
    createdAt: row.created_at,
  };
}

function mapChallenge(row: any): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subjectId: row.subject_id,
    targetType: row.target_type ?? "questions_answered",
    targetValue: row.target_value ?? 0,
    xpReward: row.xp_reward ?? 0,
    badgeName: row.badge_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

function qcmVisibility(value: string): "private" | "shared" {
  return value === "shared" ? "shared" : "private";
}

function mapQcmSet(row: any): import("@/types/domain").UserQcmSet {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? null,
    subjectId: row.subject_id ?? null,
    customSubject: row.custom_subject ?? null,
            visibility: qcmVisibility(row.visibility),
    examDate: row.exam_date ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQcmQuestion(row: any): import("@/types/domain").UserQcmQuestion {
  return {
    id: row.id,
    setId: row.set_id,
    ownerId: row.owner_id,
    questionText: row.question_text,
    options: { A: row.option_a, B: row.option_b, C: row.option_c, D: row.option_d },
    correctOption: optionKey(row.correct_option),
    explanation: row.explanation,
    difficulty: difficulty(row.difficulty),
    sourceNote: row.source_note ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQcmSession(row: any): import("@/types/domain").UserQcmSession {
  return {
    id: row.id,
    setId: row.set_id,
    ownerId: row.owner_id,
    totalQuestions: row.total_questions ?? 0,
    correctCount: row.correct_count ?? 0,
    scorePercent: Number(row.score_percent ?? 0),
    createdAt: row.created_at,
  };
}

async function fetchSessionQuestionIds(sessionId: string): Promise<string[]> {
  const { data, error } = await db()
    .from("quiz_session_questions")
    .select("question_id")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });
  assertNoError(error, "Load quiz session questions");
  return (data ?? []).map((r: any) => r.question_id);
}

async function fetchQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db().from("questions").select("*").in("id", ids);
  assertNoError(error, "Load questions by id");
  const byId = new Map((data ?? []).map((r: any) => [r.id, mapQuestion(r)]));
  return ids.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
}

async function loadSessionQuestions(sessionId: string): Promise<Question[]> {
  return fetchQuestionsByIds(await fetchSessionQuestionIds(sessionId));
}

async function loadSession(sessionId: string): Promise<QuizSession | null> {
  const { data, error } = await db()
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  assertNoError(error, "Load quiz session");
  if (!data) return null;
  return mapSession(data, await fetchSessionQuestionIds(sessionId));
}

async function answersForCompletedSessions(userId: string, subjectId?: string) {
  let sessionQuery = db()
    .from("quiz_sessions")
    .select("id")
    .eq("user_id", userId)
    .not("completed_at", "is", null);
  if (subjectId) sessionQuery = sessionQuery.eq("subject_id", subjectId);
  const { data: sessions, error: sessionError } = await sessionQuery;
  assertNoError(sessionError, "Load completed sessions");
  const sessionIds = (sessions ?? []).map((s: any) => s.id);
  if (sessionIds.length === 0) return [];

  const { data: answers, error: answerError } = await db()
    .from("quiz_answers")
    .select("*")
    .in("session_id", sessionIds);
  assertNoError(answerError, "Load quiz answers");
  return (answers ?? []).map(mapAnswer);
}

async function earnedBadgeRows(userId: string): Promise<any[]> {
  const { data, error } = await db()
    .from("user_badges")
    .select("badge_id,badges(*)")
    .eq("user_id", userId);
  assertNoError(error, "Load earned badges");
  return data ?? [];
}

async function earnedBadges(userId: string): Promise<Badge[]> {
  return (await earnedBadgeRows(userId))
    .map((row: any) => row.badges)
    .filter(Boolean)
    .map(mapBadge);
}

async function advanceChallenges(userId: string, subjectId: string, questionsAnswered: number) {
  const { data: challenges, error } = await db()
    .from("challenges")
    .select("*")
    .or(`subject_id.is.null,subject_id.eq.${subjectId}`);
  assertNoError(error, "Load challenges");

  for (const row of challenges ?? []) {
    const challenge = mapChallenge(row);
    if (
      challenge.targetType !== "questions_answered" &&
      challenge.targetType !== "questions_completed"
    ) {
      continue;
    }
    const { data: existing, error: existingError } = await db()
      .from("challenge_progress")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("user_id", userId)
      .maybeSingle();
    assertNoError(existingError, "Load challenge progress");

    const nextValue = Math.min(
      challenge.targetValue,
      (existing?.progress_value ?? 0) + questionsAnswered,
    );
    const completedAt =
      nextValue >= challenge.targetValue
        ? existing?.completed_at ?? nowIso()
        : existing?.completed_at ?? null;

    const { error: upsertError } = await db().from("challenge_progress").upsert(
      {
        challenge_id: challenge.id,
        user_id: userId,
        progress_value: nextValue,
        completed_at: completedAt,
        updated_at: nowIso(),
      },
      { onConflict: "challenge_id,user_id" },
    );
    assertNoError(upsertError, "Update challenge progress");
  }
}

export const supabaseRepository: DataRepository = {
  async listSubjects() {
    const { data, error } = await db()
      .from("subjects")
      .select("*")
      .order("order_index", { ascending: true });
    assertNoError(error, "List subjects");
    return (data ?? []).map(mapSubject);
  },

  async getSubject(id) {
    const { data, error } = await db().from("subjects").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Get subject");
    return data ? mapSubject(data) : null;
  },

  async getSubjectBySlug(slug) {
    const { data, error } = await db().from("subjects").select("*").eq("slug", slug).maybeSingle();
    assertNoError(error, "Get subject by slug");
    return data ? mapSubject(data) : null;
  },



  async listQuestions(filter: QuestionFilter = {}) {
    let query = db().from("questions").select("*").order("updated_at", { ascending: false });
    if (filter.subjectId) query = query.eq("subject_id", filter.subjectId);
        if (filter.difficulty) query = query.eq("difficulty", filter.difficulty);
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.search) query = query.ilike("question_text", `%${filter.search}%`);
    const { data, error } = await query;
    assertNoError(error, "List questions");
    return (data ?? []).map(mapQuestion);
  },

  async getQuestion(id) {
    const { data, error } = await db().from("questions").select("*").eq("id", id).maybeSingle();
    assertNoError(error, "Get question");
    return data ? mapQuestion(data) : null;
  },

  async createQuestion(input) {
    const { data, error } = await db()
      .from("questions")
      .insert({
        subject_id: input.subjectId,
          question_text: input.questionText,
        option_a: input.options.A,
        option_b: input.options.B,
        option_c: input.options.C,
        option_d: input.options.D,
        correct_option: input.correctOption,
        explanation: input.explanation,
        difficulty: input.difficulty,
        source_reference: input.sourceReference,
        status: input.status,
        verification_status: input.verificationStatus ?? null,
        cognitive_level: input.cognitiveLevel ?? null,
        local_context_note: input.localContextNote ?? null,
        hint_seed: input.hintSeed ?? null,
      })
      .select()
      .single();
    assertNoError(error, "Create question");
    return mapQuestion(data);
  },

  async archiveQuestion(id) {
    const { data, error } = await db()
      .from("questions")
      .update({ status: "archived" })
      .eq("id", id)
      .select()
      .maybeSingle();
    assertNoError(error, "Archive question");
    return data ? mapQuestion(data) : null;
  },

  async getProfile(userId) {
    const { data, error } = await db()
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    assertNoError(error, "Get profile");
    return data ? mapProfile(data) : null;
  },

  async startQuizSession(params) {
    let query = db()
      .from("questions")
      .select("*")
      .eq("subject_id", params.subjectId)
      .eq("status", "published");
    
    const { data, error } = await query;
    assertNoError(error, "Load quiz question pool");
    let pool = (data ?? []).map(mapQuestion);

    

    const picked = shuffle(pool).slice(0, params.count);
    const { data: sessionRow, error: sessionError } = await db()
      .from("quiz_sessions")
      .insert({
        user_id: params.userId,
        subject_id: params.subjectId,
                mode: params.mode,
        total_questions: picked.length,
      })
      .select()
      .single();
    assertNoError(sessionError, "Create quiz session");

    if (picked.length > 0) {
      const { error: mapError } = await db().from("quiz_session_questions").insert(
        picked.map((q, index) => ({
          session_id: sessionRow.id,
          question_id: q.id,
          order_index: index,
        })),
      );
      assertNoError(mapError, "Create quiz question mapping");
    }

    return {
      session: mapSession(sessionRow, picked.map((q) => q.id)),
      questions: picked.map((q) => ({
        id: q.id,
        subjectId: q.subjectId,
          questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
      })),
    };
  },

  async getSession(id) {
    return loadSession(id);
  },

  async listSessions(userId) {
    const { data, error } = await db()
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });
    assertNoError(error, "List sessions");
    const rows = data ?? [];
    const mapped: QuizSession[] = [];
    for (const row of rows) mapped.push(mapSession(row, await fetchSessionQuestionIds(row.id)));
    return mapped;
  },

  async getSessionAnswers(sessionId) {
    const { data, error } = await db()
      .from("quiz_answers")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    assertNoError(error, "Get session answers");
    return (data ?? []).map(mapAnswer);
  },

  async submitQuizSession(params) {
    const session = await loadSession(params.sessionId);
    if (!session || session.userId !== params.userId) return null;
    if (session.completedAt) return supabaseRepository.getStoredResult(session.id, params.userId);

    const questions = await loadSessionQuestions(session.id);
    const submittedById = new Map(params.answers.map((a) => [a.questionId, a]));
    const submitted: SubmittedAnswer[] = questions.map((q) => {
      const answer = submittedById.get(q.id);
      return {
        questionId: q.id,
        selectedOption: answer?.selectedOption ?? null,
        timeSpentSeconds: answer?.timeSpentSeconds ?? 0,
        hintUsed: answer?.hintUsed ?? false,
      };
    });
    const { graded, correctCount, scorePercent } = gradeQuiz(
      questions,
      submitted,
    );

    const xpEarned = computeQuizXp({
      correctCount,
      totalQuestions: questions.length,
      mode: session.mode,
    });

    const profile = await supabaseRepository.getProfile(params.userId);
    let newLevel = profile?.level ?? 1;
    let streakCount = profile?.streakCount ?? 0;
    let leveledUp = false;
    let newBadges: Badge[] = [];

    const { error: deleteAnswersError } = await db()
      .from("quiz_answers")
      .delete()
      .eq("session_id", session.id);
    assertNoError(deleteAnswersError, "Clear quiz answers");

    if (graded.length > 0) {
      const { error: answerError } = await db().from("quiz_answers").insert(
        graded.map((g) => ({
          session_id: session.id,
          question_id: g.questionId,
          selected_option: g.selectedOption,
          is_correct: g.isCorrect,
          time_spent_seconds: g.timeSpentSeconds,
          hint_used: g.hintUsed,
        })),
      );
      assertNoError(answerError, "Insert quiz answers");
    }

    const completedAt = nowIso();
    const { data: updatedSessionRow, error: sessionError } = await db()
      .from("quiz_sessions")
      .update({
        correct_count: correctCount,
        score_percent: scorePercent,
        xp_earned: xpEarned,
        completed_at: completedAt,
      })
      .eq("id", session.id)
      .eq("user_id", params.userId)
      .select()
      .single();
    assertNoError(sessionError, "Update quiz session");

    if (profile) {
      const prevLevel = profile.level;
      const prevLastStudy = profile.lastStudyDate;
      const streak = computeStreak({
        currentStreak: profile.streakCount,
        lastStudyDate: profile.lastStudyDate,
      });
      const nextXp = profile.xp + xpEarned;
      newLevel = levelForXp(nextXp);
      streakCount = streak.streakCount;
      leveledUp = newLevel > prevLevel;

      const { error: profileError } = await db()
        .from("profiles")
        .update({
          xp: nextXp,
          level: newLevel,
          streak_count: streak.streakCount,
          last_study_date: streak.lastStudyDate,
        })
        .eq("user_id", params.userId);
      assertNoError(profileError, "Update profile after quiz");

      const subject = await supabaseRepository.getSubject(session.subjectId);
      const badgeRowsQuery = await db().from("badges").select("*");
      assertNoError(badgeRowsQuery.error, "Load badges");
      const badgeRows = badgeRowsQuery.data ?? [];
      const badgeByKey = new Map(badgeRows.map((b: any) => [b.key as string, b]));
      const earnedRows = await earnedBadgeRows(params.userId);
      const earnedKeys = new Set(
        earnedRows
          .map((row: any) => row.badges?.key as string | undefined)
          .filter((key): key is string => Boolean(key)),
      );

      const { count: subjectCount, error: subjectCountError } = await db()
        .from("quiz_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", params.userId)
        .eq("subject_id", session.subjectId)
        .not("completed_at", "is", null);
      assertNoError(subjectCountError, "Count subject quizzes");

      const { count: totalCount, error: totalCountError } = await db()
        .from("quiz_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", params.userId)
        .not("completed_at", "is", null);
      assertNoError(totalCountError, "Count completed quizzes");

      const isComeback = (() => {
        if (!prevLastStudy) return false;
        const days = (Date.now() - new Date(prevLastStudy).getTime()) / 86_400_000;
        return days >= 2;
      })();

      const unlocked = evaluateBadges({
        earnedKeys,
        totalCompletedQuizzes: totalCount ?? 0,
        streakCount,
        scorePercent,
        subjectQuizCount: subjectCount ?? 0,
        subjectSlug: (subject?.slug ?? "demography") as SubjectSlug,
        completedHour: new Date().getHours(),
        isComeback,
      });

      for (const key of unlocked) {
        const badge = badgeByKey.get(key);
        if (!badge) continue;
        const { error: badgeError } = await db().from("user_badges").upsert(
          { user_id: params.userId, badge_id: badge.id },
          { onConflict: "user_id,badge_id" },
        );
        assertNoError(badgeError, "Unlock badge");
      }
      newBadges = unlocked
        .map((key) => badgeByKey.get(key))
        .filter(Boolean)
        .map(mapBadge);
    }

    await advanceChallenges(params.userId, session.subjectId, questions.length);

    const updatedSession = mapSession(
      updatedSessionRow,
      questions.map((q) => q.id),
    );
    return {
      session: updatedSession,
      answers: graded.map((g) => ({
        id: `${updatedSession.id}-${g.questionId}`,
        sessionId: updatedSession.id,
        questionId: g.questionId,
        selectedOption: g.selectedOption,
        isCorrect: g.isCorrect,
        timeSpentSeconds: g.timeSpentSeconds,
        hintUsed: g.hintUsed,
        question: questions.find((q) => q.id === g.questionId)!,
      })),
      xpEarned,
      newLevel,
      leveledUp,
      streakCount,
      newBadges,
    };
  },

  async getStoredResult(sessionId, userId) {
    const session = await loadSession(sessionId);
    if (!session || session.userId !== userId || !session.completedAt) return null;
    const questions = await loadSessionQuestions(session.id);
    const answers = await supabaseRepository.getSessionAnswers(session.id);
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const profile = await supabaseRepository.getProfile(userId);



    return {
      session,
      answers: answers
        .map((a) => ({ ...a, question: questionById.get(a.questionId)! }))
        .filter((a) => Boolean(a.question)),
      xpEarned: session.xpEarned,
      newLevel: profile?.level ?? 1,
      leveledUp: false,
      streakCount: profile?.streakCount ?? 0,
      newBadges: await earnedBadges(userId),
    };
  },

  async subjectStats(userId, subjectId): Promise<SubjectStats> {
    const { count, error: countError } = await db()
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId)
      .eq("status", "published");
    assertNoError(countError, "Count subject questions");
    const answers = await answersForCompletedSessions(userId, subjectId);
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
    const correct = answers.filter((a) => a.isCorrect).length;
        return {
      subjectId,
      totalQuestions: count ?? 0,
      answered: answeredQuestionIds.size,
      accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    };
  },

  async overallAccuracy(userId) {
    const answers = await answersForCompletedSessions(userId);
    if (!answers.length) return 0;
    return Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100);
  },

  async listBadges() {
    const { data, error } = await db().from("badges").select("*").order("name");
    assertNoError(error, "List badges");
    return (data ?? []).map(mapBadge);
  },

  async getEarnedBadgeIds(userId) {
    return new Set((await earnedBadgeRows(userId)).map((row: any) => row.badge_id as string));
  },

  async createHintRequest(input) {
    if (input.sessionId) {
      const session = await loadSession(input.sessionId);
      if (!session || session.userId !== input.userId) throw new Error("Unknown session");
    }
    const { error } = await db()
      .from("hint_requests")
      .insert({
        user_id: input.userId,
        session_id: input.sessionId,
        question_id: input.questionId,
        hint_text: input.hintText,
      });
    assertNoError(error, "Create hint request");
  },

  async createReport(input) {
    const question = await supabaseRepository.getQuestion(input.questionId);
    if (!question) throw new Error("Unknown question");
    if (input.sessionId) {
      const session = await loadSession(input.sessionId);
      if (!session || session.userId !== input.userId) throw new Error("Unknown session");
    }
    const { data, error } = await db()
      .from("answer_reports")
      .insert({
        user_id: input.userId,
        question_id: input.questionId,
        session_id: input.sessionId,
        student_reason: input.studentReason,
        reference_note: input.referenceNote,
      })
      .select()
      .single();
    assertNoError(error, "Create report");
    return mapReport(data);
  },

  async attachAiVerdict(reportId, ai) {
    const { error } = await db()
      .from("answer_reports")
      .update({
        ai_verdict: ai.verdict,
        ai_confidence: ai.confidence,
        ai_reason: ai.reason,
        ai_suggested_action: ai.action,
      })
      .eq("id", reportId);
    assertNoError(error, "Attach AI verdict");
  },

  async listReports(status) {
    let query = db().from("answer_reports").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("admin_status", status);
    const { data, error } = await query;
    assertNoError(error, "List reports");
    return (data ?? []).map(mapReport);
  },

  async getReport(id) {
    const { data, error } = await db()
      .from("answer_reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Get report");
    return data ? mapReport(data) : null;
  },

  async reviewReport(input) {
    const report = await supabaseRepository.getReport(input.reportId);
    if (!report) return null;

    if (input.action === "changed_answer" && input.newCorrectOption) {
      const { error } = await db()
        .from("questions")
        .update({ correct_option: input.newCorrectOption })
        .eq("id", report.questionId);
      assertNoError(error, "Change answer key");
    }
    if (input.action === "improved_explanation" && input.newExplanation) {
      const { error } = await db()
        .from("questions")
        .update({ explanation: input.newExplanation })
        .eq("id", report.questionId);
      assertNoError(error, "Improve explanation");
    }
    if (input.action === "marked_ambiguous") {
      const { error } = await db()
        .from("questions")
        .update({ status: "draft" })
        .eq("id", report.questionId);
      assertNoError(error, "Mark question ambiguous");
    }

    const { data, error } = await db()
      .from("answer_reports")
      .update({
        admin_status: input.action,
        admin_note: input.adminNote ?? null,
        reviewed_by: input.reviewerId,
        reviewed_at: nowIso(),
      })
      .eq("id", input.reportId)
      .select()
      .single();
    assertNoError(error, "Review report");
    return mapReport(data);
  },

  async listPosts(status = "published") {
    const { data, error } = await db()
      .from("posts")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    assertNoError(error, "List posts");
    return (data ?? []).map(mapPost);
  },

  async listAllPosts() {
    const { data, error } = await db()
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    assertNoError(error, "List all posts");
    return (data ?? []).map(mapPost);
  },

  async getPostBySlug(slug) {
    const { data, error } = await db()
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    assertNoError(error, "Get post by slug");
    return data ? mapPost(data) : null;
  },

  async getPost(id) {
    const { data, error } = await db()
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    assertNoError(error, "Get post");
    return data ? mapPost(data) : null;
  },

  async createPost(input) {
    const { data, error } = await db()
      .from("posts")
      .insert({
        title: input.title,
        slug: input.slug,
        content: input.content,
        subject_id: input.subjectId,
        category: input.category,
        status: input.status,
        read_time_minutes: input.readTimeMinutes,
      })
      .select("*")
      .single();
    assertNoError(error, "Create post");
    return mapPost(data);
  },

  async updatePost(id, patch) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.slug !== undefined) dbPatch.slug = patch.slug;
    if (patch.content !== undefined) dbPatch.content = patch.content;
    if (patch.subjectId !== undefined) dbPatch.subject_id = patch.subjectId;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.readTimeMinutes !== undefined) dbPatch.read_time_minutes = patch.readTimeMinutes;
    const { data, error } = await db()
      .from("posts")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    assertNoError(error, "Update post");
    return data ? mapPost(data) : null;
  },

  async savedPostIds(userId) {
    const { data, error } = await db().from("saved_posts").select("post_id").eq("user_id", userId);
    assertNoError(error, "Saved post ids");
    return new Set((data ?? []).map((r: any) => r.post_id as string));
  },

  async toggleSavedPost(userId, postId) {
    const existing = await db()
      .from("saved_posts")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();
    assertNoError(existing.error, "Find saved post");
    if (existing.data) {
      const { error } = await db().from("saved_posts").delete().eq("id", existing.data.id);
      assertNoError(error, "Unsave post");
      return false;
    }
    const { error } = await db().from("saved_posts").insert({ user_id: userId, post_id: postId });
    assertNoError(error, "Save post");
    return true;
  },

  async listChallenges() {
    const { data, error } = await db().from("challenges").select("*").order("ends_at");
    assertNoError(error, "List challenges");
    return (data ?? []).map(mapChallenge);
  },

  async getChallengeProgress(userId, challengeId) {
    const { data, error } = await db()
      .from("challenge_progress")
      .select("progress_value")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .maybeSingle();
    assertNoError(error, "Challenge progress");
    return data?.progress_value ?? 0;
  },

  async listStudentProfiles() {
    const { data, error } = await db()
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("xp", { ascending: false });
    assertNoError(error, "List students");
    return (data ?? []).map(mapProfile);
  },

  async adminStats() {
    const [questions, published, users, reports, sessions, posts] = await Promise.all([
      db().from("questions").select("*", { count: "exact", head: true }),
      db()
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      db()
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      db()
        .from("answer_reports")
        .select("*", { count: "exact", head: true })
        .eq("admin_status", "pending"),
      db()
        .from("quiz_sessions")
        .select("*", { count: "exact", head: true })
        .not("completed_at", "is", null),
      db().from("posts").select("*", { count: "exact", head: true }),
    ]);
    assertNoError(questions.error, "Count questions");
    assertNoError(published.error, "Count published questions");
    assertNoError(users.error, "Count users");
    assertNoError(reports.error, "Count reports");
    assertNoError(sessions.error, "Count sessions");
    assertNoError(posts.error, "Count posts");
    return {
      totalQuestions: questions.count ?? 0,
      publishedQuestions: published.count ?? 0,
      totalUsers: users.count ?? 0,
      pendingReports: reports.count ?? 0,
      quizzesCompleted: sessions.count ?? 0,
      totalPosts: posts.count ?? 0,
    };
  },

  async adminWeakSubjects() {
    const { data: sessions, error: sessionError } = await db()
      .from("quiz_sessions")
      .select("id")
      .not("completed_at", "is", null);
    assertNoError(sessionError, "Load completed sessions");
    const sessionIds = (sessions ?? []).map((s: any) => s.id);
    if (sessionIds.length === 0) return [];

    const { data: answers, error: answerError } = await db()
      .from("quiz_answers")
      .select("*")
      .in("session_id", sessionIds);
    assertNoError(answerError, "Load answers");

    const questions = await fetchQuestionsByIds([
      ...new Set((answers ?? []).map((a: any) => a.question_id as string)),
    ]);
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const tally = new Map<string, { correct: number; total: number }>();
    for (const row of answers ?? []) {
      const answer = mapAnswer(row);
      const question = questionById.get(answer.questionId);
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
  },

  /* ── My QCM ─────────────────────────────────────────── */
  async listQcmSets(ownerId, opts) {
    let query = db()
      .from("user_qcm_sets")
      .select("*")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });
    if (!opts?.includeArchived) query = query.eq("is_archived", false);
    const { data: setRows, error } = await query;
    assertNoError(error, "List QCM sets");
    const sets = (setRows ?? []).map(mapQcmSet);
    if (sets.length === 0) return [];
    const setIds = sets.map((s) => s.id);

    // Active question counts per set (one query, tallied in memory).
    const { data: qRows, error: qErr } = await db()
      .from("user_qcm_questions")
      .select("set_id")
      .eq("owner_id", ownerId)
      .eq("is_archived", false)
      .in("set_id", setIds);
    assertNoError(qErr, "Count QCM questions");
    const counts = new Map<string, number>();
    for (const r of qRows ?? []) counts.set(r.set_id, (counts.get(r.set_id) ?? 0) + 1);

    // Most recent practice per set.
    const { data: sessRows, error: sErr } = await db()
      .from("user_qcm_sessions")
      .select("set_id, score_percent, created_at")
      .eq("owner_id", ownerId)
      .in("set_id", setIds)
      .order("created_at", { ascending: false });
    assertNoError(sErr, "Load QCM practice history");
    const lastPractice = new Map<string, { at: string; accuracy: number }>();
    for (const r of sessRows ?? []) {
      if (!lastPractice.has(r.set_id)) {
        lastPractice.set(r.set_id, { at: r.created_at, accuracy: Number(r.score_percent ?? 0) });
      }
    }

    // Resolve subject/topic labels.
    const subjectIds = [...new Set(sets.map((s) => s.subjectId).filter(Boolean))] as string[];
    const subjectNames = new Map<string, string>();
    if (subjectIds.length) {
      const { data } = await db().from("subjects").select("id, name").in("id", subjectIds);
      for (const r of data ?? []) subjectNames.set(r.id, r.name);
    }
    return sets.map((s) => {
      const lp = lastPractice.get(s.id);
      return {
        ...s,
        questionCount: counts.get(s.id) ?? 0,
        lastPracticedAt: lp?.at ?? null,
        lastAccuracy: lp ? Math.round(lp.accuracy) : null,
        subjectLabel: s.customSubject || (s.subjectId ? subjectNames.get(s.subjectId) ?? null : null),
        topicLabel: null,
      };
    });
  },

  async getQcmSet(setId, ownerId) {
    const { data, error } = await db()
      .from("user_qcm_sets")
      .select("*")
      .eq("id", setId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    assertNoError(error, "Get QCM set");
    return data ? mapQcmSet(data) : null;
  },

  async createQcmSet(input) {
    const { data, error } = await db()
      .from("user_qcm_sets")
      .insert({
        owner_id: input.ownerId,
        title: input.title,
        description: input.description,
        subject_id: input.subjectId,
        custom_subject: input.customSubject,
        visibility: input.visibility,
        exam_date: input.examDate,
        tags: input.tags,
      })
      .select()
      .single();
    assertNoError(error, "Create QCM set");
    return mapQcmSet(data);
  },

  async updateQcmSet(setId, ownerId, patch) {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.subjectId !== undefined) row.subject_id = patch.subjectId;
    if (patch.customSubject !== undefined) row.custom_subject = patch.customSubject;
    if (patch.visibility !== undefined) row.visibility = patch.visibility;
    if (patch.examDate !== undefined) row.exam_date = patch.examDate;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.isArchived !== undefined) row.is_archived = patch.isArchived;
    if (Object.keys(row).length === 0) return this.getQcmSet(setId, ownerId);
    const { data, error } = await db()
      .from("user_qcm_sets")
      .update(row)
      .eq("id", setId)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();
    assertNoError(error, "Update QCM set");
    return data ? mapQcmSet(data) : null;
  },

  async deleteQcmSet(setId, ownerId) {
    const { error, count } = await db()
      .from("user_qcm_sets")
      .delete({ count: "exact" })
      .eq("id", setId)
      .eq("owner_id", ownerId);
    assertNoError(error, "Delete QCM set");
    return (count ?? 0) > 0;
  },

  async listQcmQuestions(setId, ownerId, opts) {
    let query = db()
      .from("user_qcm_questions")
      .select("*")
      .eq("set_id", setId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });
    if (!opts?.includeArchived) query = query.eq("is_archived", false);
    const { data, error } = await query;
    assertNoError(error, "List QCM questions");
    return (data ?? []).map(mapQcmQuestion);
  },

  async getQcmQuestion(questionId, ownerId) {
    const { data, error } = await db()
      .from("user_qcm_questions")
      .select("*")
      .eq("id", questionId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    assertNoError(error, "Get QCM question");
    return data ? mapQcmQuestion(data) : null;
  },

  async createQcmQuestion(input) {
    // Guard: the set must exist and belong to the same owner.
    const set = await this.getQcmSet(input.setId, input.ownerId);
    if (!set) throw new Error("Unknown set");
    const { data, error } = await db()
      .from("user_qcm_questions")
      .insert({
        set_id: input.setId,
        owner_id: input.ownerId,
        question_text: input.questionText,
        option_a: input.options.A,
        option_b: input.options.B,
        option_c: input.options.C,
        option_d: input.options.D,
        correct_option: input.correctOption,
        explanation: input.explanation,
        difficulty: input.difficulty,
        source_note: input.sourceNote,
        tags: input.tags,
      })
      .select()
      .single();
    assertNoError(error, "Create QCM question");
    // Touch the parent set so "recently edited" stays accurate.
    await db().from("user_qcm_sets").update({ updated_at: nowIso() }).eq("id", input.setId);
    return mapQcmQuestion(data);
  },

  async updateQcmQuestion(questionId, ownerId, patch) {
    const row: Record<string, unknown> = {};
    if (patch.questionText !== undefined) row.question_text = patch.questionText;
    if (patch.options !== undefined) {
      row.option_a = patch.options.A;
      row.option_b = patch.options.B;
      row.option_c = patch.options.C;
      row.option_d = patch.options.D;
    }
    if (patch.correctOption !== undefined) row.correct_option = patch.correctOption;
    if (patch.explanation !== undefined) row.explanation = patch.explanation;
    if (patch.difficulty !== undefined) row.difficulty = patch.difficulty;
    if (patch.sourceNote !== undefined) row.source_note = patch.sourceNote;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.isArchived !== undefined) row.is_archived = patch.isArchived;
    if (Object.keys(row).length === 0) return this.getQcmQuestion(questionId, ownerId);
    const { data, error } = await db()
      .from("user_qcm_questions")
      .update(row)
      .eq("id", questionId)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();
    assertNoError(error, "Update QCM question");
    return data ? mapQcmQuestion(data) : null;
  },

  async deleteQcmQuestion(questionId, ownerId) {
    const { error, count } = await db()
      .from("user_qcm_questions")
      .delete({ count: "exact" })
      .eq("id", questionId)
      .eq("owner_id", ownerId);
    assertNoError(error, "Delete QCM question");
    return (count ?? 0) > 0;
  },

  async recordQcmPractice(input) {
    // Guard: only the owner of the set may record practice against it.
    const set = await this.getQcmSet(input.setId, input.ownerId);
    if (!set) throw new Error("Unknown set");
    const scorePercent = input.totalQuestions
      ? Math.round((input.correctCount / input.totalQuestions) * 100)
      : 0;
    const { data, error } = await db()
      .from("user_qcm_sessions")
      .insert({
        set_id: input.setId,
        owner_id: input.ownerId,
        total_questions: input.totalQuestions,
        correct_count: input.correctCount,
        score_percent: scorePercent,
      })
      .select()
      .single();
    assertNoError(error, "Record QCM practice");
    return mapQcmSession(data);
  },

  async qcmDashboardStats(ownerId) {
    const { count: totalSets } = await db()
      .from("user_qcm_sets")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("is_archived", false);
    const { count: totalQuestions } = await db()
      .from("user_qcm_questions")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("is_archived", false);
    const today = new Date().toISOString().slice(0, 10);
    const { count: examSets } = await db()
      .from("user_qcm_sets")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("is_archived", false)
      .gte("exam_date", today);
    return {
      totalSets: totalSets ?? 0,
      totalQuestions: totalQuestions ?? 0,
      examSets: examSets ?? 0,
    };
  },
};
