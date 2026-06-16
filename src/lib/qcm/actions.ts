"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import {
  createQcmQuestion,
  createQcmSet,
  deleteQcmQuestion,
  deleteQcmSet,
  getQcmQuestion,
  getQcmSet,
  recordQcmPractice,
  updateQcmQuestion,
  updateQcmSet,
} from "@/lib/data";
import { qcmQuestionSchema, qcmSetSchema } from "@/lib/validators";

export interface QcmActionState {
  error?: string;
  ok?: boolean;
}

/** "midterm, infection control" → ["midterm", "infection control"] */
function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return [...new Set(raw.split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 8);
}

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/* ── Sets ─────────────────────────────────────────────── */
export async function createQcmSetAction(
  _prev: QcmActionState,
  formData: FormData,
): Promise<QcmActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };

  const parsed = qcmSetSchema.safeParse({
    title: str(formData.get("title")),
    description: str(formData.get("description")),
    subjectId: str(formData.get("subjectId")),
    customSubject: str(formData.get("customSubject")),
            visibility: str(formData.get("visibility")) || "private",
    examDate: str(formData.get("examDate")),
    tags: parseTags(formData.get("tags")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid set" };
  const d = parsed.data;

  const set = await createQcmSet({
    ownerId: user.userId,
    title: d.title,
    description: d.description || null,
    subjectId: d.subjectId || null,
    customSubject: d.customSubject || null,
            visibility: d.visibility,
    examDate: d.examDate || null,
    tags: d.tags,
  });

  revalidatePath("/my-qcm");
  redirect(`/my-qcm/${set.id}`);
}

export async function updateQcmSetAction(
  setId: string,
  _prev: QcmActionState,
  formData: FormData,
): Promise<QcmActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };

  const parsed = qcmSetSchema.safeParse({
    title: str(formData.get("title")),
    description: str(formData.get("description")),
    subjectId: str(formData.get("subjectId")),
    customSubject: str(formData.get("customSubject")),
            visibility: str(formData.get("visibility")) || "private",
    examDate: str(formData.get("examDate")),
    tags: parseTags(formData.get("tags")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid set" };
  const d = parsed.data;

  const updated = await updateQcmSet(setId, user.userId, {
    title: d.title,
    description: d.description || null,
    subjectId: d.subjectId || null,
    customSubject: d.customSubject || null,
            visibility: d.visibility,
    examDate: d.examDate || null,
    tags: d.tags,
  });
  if (!updated) return { error: "Set not found." };

  revalidatePath("/my-qcm");
  revalidatePath(`/my-qcm/${setId}`);
  redirect(`/my-qcm/${setId}`);
}

export async function setQcmSetArchivedAction(
  setId: string,
  archived: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await updateQcmSet(setId, user.userId, { isArchived: archived });
  revalidatePath("/my-qcm");
  revalidatePath(`/my-qcm/${setId}`);
}

export async function deleteQcmSetAction(setId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await deleteQcmSet(setId, user.userId);
  revalidatePath("/my-qcm");
  redirect("/my-qcm");
}

/* ── Questions ────────────────────────────────────────── */
function parseQuestion(formData: FormData) {
  return qcmQuestionSchema.safeParse({
    questionText: str(formData.get("questionText")),
    optionA: str(formData.get("optionA")),
    optionB: str(formData.get("optionB")),
    optionC: str(formData.get("optionC")),
    optionD: str(formData.get("optionD")),
    correctOption: str(formData.get("correctOption")),
    explanation: str(formData.get("explanation")),
    difficulty: str(formData.get("difficulty")) || "medium",
    sourceNote: str(formData.get("sourceNote")),
    tags: parseTags(formData.get("tags")),
  });
}

export async function createQcmQuestionAction(
  setId: string,
  _prev: QcmActionState,
  formData: FormData,
): Promise<QcmActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };

  // Ownership guard: the set must belong to this user.
  const set = await getQcmSet(setId, user.userId);
  if (!set) return { error: "Set not found." };

  const parsed = parseQuestion(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question" };
  const d = parsed.data;

  await createQcmQuestion({
    setId,
    ownerId: user.userId,
    questionText: d.questionText,
    options: { A: d.optionA, B: d.optionB, C: d.optionC, D: d.optionD },
    correctOption: d.correctOption,
    explanation: d.explanation,
    difficulty: d.difficulty,
    sourceNote: d.sourceNote || null,
    tags: d.tags,
  });

  revalidatePath(`/my-qcm/${setId}`);
  revalidatePath("/my-qcm");
  redirect(`/my-qcm/${setId}`);
}

export async function updateQcmQuestionAction(
  setId: string,
  questionId: string,
  _prev: QcmActionState,
  formData: FormData,
): Promise<QcmActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };

  const existing = await getQcmQuestion(questionId, user.userId);
  if (!existing || existing.setId !== setId) return { error: "Question not found." };

  const parsed = parseQuestion(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question" };
  const d = parsed.data;

  await updateQcmQuestion(questionId, user.userId, {
    questionText: d.questionText,
    options: { A: d.optionA, B: d.optionB, C: d.optionC, D: d.optionD },
    correctOption: d.correctOption,
    explanation: d.explanation,
    difficulty: d.difficulty,
    sourceNote: d.sourceNote || null,
    tags: d.tags,
  });

  revalidatePath(`/my-qcm/${setId}`);
  redirect(`/my-qcm/${setId}`);
}

export async function setQcmQuestionArchivedAction(
  setId: string,
  questionId: string,
  archived: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await updateQcmQuestion(questionId, user.userId, { isArchived: archived });
  revalidatePath(`/my-qcm/${setId}`);
}

export async function deleteQcmQuestionAction(
  setId: string,
  questionId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await deleteQcmQuestion(questionId, user.userId);
  revalidatePath(`/my-qcm/${setId}`);
  revalidatePath("/my-qcm");
}

/* ── Practice ─────────────────────────────────────────── */
export async function recordQcmPracticeAction(
  setId: string,
  totalQuestions: number,
  correctCount: number,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const total = Math.max(0, Math.floor(totalQuestions));
  const correct = Math.max(0, Math.min(total, Math.floor(correctCount)));
  await recordQcmPractice({ setId, ownerId: user.userId, totalQuestions: total, correctCount: correct });
  revalidatePath("/my-qcm");
  revalidatePath(`/my-qcm/${setId}`);
}
