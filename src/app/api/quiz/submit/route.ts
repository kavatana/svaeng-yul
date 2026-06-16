import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { submitQuizSession } from "@/lib/data";
import { submitQuizSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = submitQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    );
  }

  // Scoring happens entirely server-side; the client's answers are only the
  // selected options. Correctness is decided against stored questions.
  const result = await submitQuizSession({
    userId: user.userId,
    sessionId: parsed.data.sessionId,
    answers: parsed.data.answers.map((a) => ({
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      timeSpentSeconds: a.timeSpentSeconds,
      hintUsed: a.hintUsed,
    })),
  });

  if (!result) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ sessionId: result.session.id });
}
