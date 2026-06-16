import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { reportSchema } from "@/lib/validators";
import {
  attachAiVerdict,
  createReport,
  getQuestion,
  getSubject,
} from "@/lib/data";
import { analyzeDispute } from "@/lib/ai/dispute";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid report" },
      { status: 400 },
    );
  }

  const question = await getQuestion(parsed.data.questionId);
  if (!question) return NextResponse.json({ error: "Unknown question" }, { status: 404 });

  // 1. Store the report (always pending until an admin acts).
  const report = await createReport({
    userId: user.userId,
    questionId: parsed.data.questionId,
    sessionId: parsed.data.sessionId ?? null,
    studentReason: parsed.data.studentReason,
    referenceNote: parsed.data.referenceNote || null,
  });

  // 2. Run AI dispute analysis and attach the suggested verdict for the admin.
  //    AI never changes content — it only advises.
  try {
    const ai = await analyzeDispute({
      subject: (await getSubject(question.subjectId))?.name ?? "",
      topic: "",
      questionText: question.questionText,
      options: question.options,
      currentCorrectOption: question.correctOption,
      explanation: question.explanation,
      studentReason: parsed.data.studentReason,
      referenceNote: parsed.data.referenceNote || undefined,
    });
    await attachAiVerdict(report.id, {
      verdict: ai.suggestedVerdict,
      confidence: ai.confidence,
      reason: ai.reason,
      action: ai.suggestedAdminAction,
    });
  } catch {
    // Non-fatal: the report still reaches the admin without an AI suggestion.
  }

  return NextResponse.json({ ok: true, reportId: report.id });
}
