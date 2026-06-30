import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getSubject, getSubjectBySlug, startQuizSession } from "@/lib/data";
import { quizSetupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = quizSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid setup" },
      { status: 400 },
    );
  }

  const { subjectId, mode, count, timePerQuestionSeconds } = parsed.data;
  // The client may pass a slug or a UUID — resolve either.
  const subject = (await getSubjectBySlug(subjectId)) ?? (await getSubject(subjectId));
  if (!subject) return NextResponse.json({ error: "Unknown subject" }, { status: 404 });

  try {
    const { session, questions } = await startQuizSession({
      userId: user.userId,
      subjectId: subject.id,
      timePerQuestionSeconds,
      mode,
      count,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this selection yet." },
        { status: 422 },
      );
    }

    return NextResponse.json({ sessionId: session.id, questions });
  } catch (error: unknown) {
    console.error("Quiz Start Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred while starting the quiz.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
