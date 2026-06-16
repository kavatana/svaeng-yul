"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import {
  archiveQuestion,
  createPost,
  createQuestion,
  
  getSubjectBySlug,
  listQuestions,
  reviewReport,
  updatePost,
} from "@/lib/data";
import { questionSchema, reportReviewSchema } from "@/lib/validators";
import { parseQuestionsCsv } from "@/lib/csv/parse";
import { slugify } from "@/lib/utils";
import type { ContentStatus, OptionKey, ReportStatus } from "@/types/domain";

export interface AdminActionState {
  error?: string;
  ok?: boolean;
}

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/* ── Questions ────────────────────────────────────────── */
export async function createQuestionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Admins only." };

  const parsed = questionSchema.safeParse({
    subjectId: formData.get("subjectId"),
        questionText: formData.get("questionText"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctOption: formData.get("correctOption"),
    explanation: formData.get("explanation"),
    difficulty: formData.get("difficulty"),
    sourceReference: formData.get("sourceReference") ?? "",
    status: formData.get("status") ?? "draft",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid question" };
  const d = parsed.data;

  await createQuestion({
    subjectId: d.subjectId,
        questionText: d.questionText,
    options: { A: d.optionA, B: d.optionB, C: d.optionC, D: d.optionD },
    correctOption: d.correctOption,
    explanation: d.explanation,
    difficulty: d.difficulty,
    sourceReference: d.sourceReference || null,
    status: d.status,
  });

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function archiveQuestionAction(id: string): Promise<void> {
  const admin = await assertAdmin();
  if (!admin) return;
  await archiveQuestion(id);
  revalidatePath("/admin/questions");
}

/* ── CSV Import ───────────────────────────────────────── */
export interface ImportResult extends AdminActionState {
  imported?: number;
  failed?: number;
}

export async function importQuestionsAction(csvText: string): Promise<ImportResult> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Admins only." };

  const { valid, errors } = parseQuestionsCsv(csvText);
  let imported = 0;
  let skipped = 0;
  for (const row of valid) {
    const subject = await getSubjectBySlug(row.subjectSlug);
    if (!subject) continue;

    const duplicateKey = row.questionText.trim().toLowerCase().replace(/\s+/g, " ");
    const duplicates = await listQuestions({ subjectId: subject.id });
    const exists = duplicates.some(
      (q) => q.questionText.trim().toLowerCase().replace(/\s+/g, " ") === duplicateKey,
    );
    if (exists) {
      skipped++;
      continue;
    }
    await createQuestion({
      subjectId: subject.id,
            questionText: row.questionText,
      options: row.options,
      correctOption: row.correctOption,
      explanation: row.explanation,
      difficulty: row.difficulty,
      sourceReference: row.sourceReference || "CSV import",
      status: "published",
      verificationStatus: row.verificationStatus,
      cognitiveLevel: row.cognitiveLevel,
      localContextNote: row.localContextNote ?? null,
    });
    imported++;
  }

  revalidatePath("/admin/questions");
  return { ok: true, imported, failed: errors.length + skipped };
}

/* ── Reports review ───────────────────────────────────── */
export async function reviewReportAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Admins only." };

  const parsed = reportReviewSchema.safeParse({
    reportId: formData.get("reportId"),
    action: formData.get("action"),
    adminNote: formData.get("adminNote") ?? "",
    newCorrectOption: formData.get("newCorrectOption") || undefined,
    newExplanation: formData.get("newExplanation") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid review" };

  await reviewReport({
    reportId: parsed.data.reportId,
    reviewerId: admin.userId,
    action: parsed.data.action as ReportStatus,
    adminNote: parsed.data.adminNote,
    newCorrectOption: parsed.data.newCorrectOption as OptionKey | undefined,
    newExplanation: parsed.data.newExplanation,
  });

  revalidatePath("/admin/reports");
  return { ok: true };
}

/* ── Posts ────────────────────────────────────────────── */
export async function createPostAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin();
  if (!admin) return { error: "Admins only." };

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "Study Tips");
  const status = (String(formData.get("status") ?? "published") as ContentStatus);
  if (title.length < 3 || content.length < 10) {
    return { error: "Title and content are required." };
  }

  const words = content.split(/\s+/).length;
  await createPost({
    title,
    slug: `${slugify(title)}-${Date.now().toString(36)}`,
    content,
    subjectId: null,
    category,
    authorName: admin.fullName,
    status,
    readTimeMinutes: Math.max(1, Math.round(words / 200)),
  });

  revalidatePath("/admin/posts");
  revalidatePath("/posts");
  redirect("/admin/posts");
}

export async function setPostStatusAction(id: string, status: ContentStatus): Promise<void> {
  const admin = await assertAdmin();
  if (!admin) return;
  await updatePost(id, { status });
  revalidatePath("/admin/posts");
  revalidatePath("/posts");
}
