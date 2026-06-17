import { z } from "zod";

export const optionKeySchema = z.enum(["A", "B", "C", "D"]);
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const quizModeSchema = z.enum(["practice", "timed", "weak_area", "challenge"]);
export const statusSchema = z.enum(["draft", "published", "archived"]);

/* ── Auth ─────────────────────────────────────────────── */
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Tell us your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Tell us your name"),
  school: z.string().max(120).optional().or(z.literal("")),
  studyYear: z.string().max(40).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

/* ── Quiz ─────────────────────────────────────────────── */
export const quizSetupSchema = z.object({
  subjectId: z.string().min(1, "Pick a subject"),
  mode: quizModeSchema,
  count: z.coerce.number().int().min(1, "At least 1 question").max(500, "Too many questions"),
  timePerQuestionSeconds: z.coerce.number().int().min(5, "At least 5 seconds").max(600, "Max 10 minutes"),
});

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  selectedOption: optionKeySchema.nullable(),
  timeSpentSeconds: z.number().int().min(0).max(60 * 60),
  hintUsed: z.boolean().default(false),
});

export const submitQuizSchema = z.object({
  sessionId: z.string(),
  answers: z.array(submitAnswerSchema),
});

/* ── Question (admin) ─────────────────────────────────── */
export const questionSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  questionText: z.string().min(8, "Question is too short"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctOption: optionKeySchema,
  explanation: z.string().min(8, "Explanation is required"),
  difficulty: difficultySchema,
  sourceReference: z.string().optional().or(z.literal("")),
  status: statusSchema.default("draft"),
});

/* ── Report ───────────────────────────────────────────── */
export const reportSchema = z.object({
  questionId: z.string().min(1),
  sessionId: z.string().nullable().optional(),
  studentReason: z.string().min(5, "Tell us why this may be wrong"),
  referenceNote: z.string().optional().or(z.literal("")),
});

export const reportReviewSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum([
    "approved",
    "rejected",
    "changed_answer",
    "improved_explanation",
    "marked_ambiguous",
  ]),
  adminNote: z.string().optional().or(z.literal("")),
  newCorrectOption: optionKeySchema.optional(),
  newExplanation: z.string().optional(),
});

/* ── My QCM (user-created sets) ───────────────────────── */
export const qcmVisibilitySchema = z.enum(["private", "shared"]);

export const qcmSetSchema = z
  .object({
    title: z.string().trim().min(3, "Give your set a title (3+ characters)").max(120),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    subjectId: z.string().optional().or(z.literal("")),
    customSubject: z.string().trim().max(80).optional().or(z.literal("")),
    topicId: z.string().optional().or(z.literal("")),
    customTopic: z.string().trim().max(80).optional().or(z.literal("")),
    visibility: qcmVisibilitySchema.default("private"),
    examDate: z.string().optional().or(z.literal("")),
    tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  })
  .refine((d) => Boolean(d.subjectId) || Boolean(d.customSubject), {
    message: "Pick a subject or type your own",
    path: ["subjectId"],
  });

export const qcmQuestionSchema = z
  .object({
    questionText: z.string().trim().min(8, "Question is too short"),
    optionA: z.string().trim().min(1, "Option A is required"),
    optionB: z.string().trim().min(1, "Option B is required"),
    optionC: z.string().trim().min(1, "Option C is required"),
    optionD: z.string().trim().min(1, "Option D is required"),
    correctOption: optionKeySchema,
    explanation: z.string().trim().min(8, "Add a short explanation so future-you understands"),
    difficulty: difficultySchema.default("medium"),
    sourceNote: z.string().trim().max(200).optional().or(z.literal("")),
    tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  })
  .refine(
    (d) => {
      const opts = [d.optionA, d.optionB, d.optionC, d.optionD].map((o) =>
        o.trim().toLowerCase(),
      );
      return new Set(opts).size === opts.length;
    },
    { message: "Options must be different from each other", path: ["optionA"] },
  );

export type QcmSetInput = z.infer<typeof qcmSetSchema>;
export type QcmQuestionInput = z.infer<typeof qcmQuestionSchema>;

/* ── AI route payloads ────────────────────────────────── */
export const hintRequestSchema = z.object({
  sessionId: z.string().optional(),
  questionId: z.string().optional(),
  subject: z.string(),
  topic: z.string(),
  questionText: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  difficulty: difficultySchema,
  studentWeakAreas: z.array(z.string()).optional(),
});

export const disputeRequestSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  questionText: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  currentCorrectOption: optionKeySchema,
  explanation: z.string(),
  studentSelectedOption: optionKeySchema.optional(),
  studentReason: z.string(),
  referenceNote: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type QuizSetupInput = z.infer<typeof quizSetupSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type HintRequest = z.infer<typeof hintRequestSchema>;
export type DisputeRequest = z.infer<typeof disputeRequestSchema>;
