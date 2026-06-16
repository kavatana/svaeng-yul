import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createHintRequest } from "@/lib/data";
import { hintRequestSchema } from "@/lib/validators";
import { generateHint } from "@/lib/ai/hint";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = hintRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hint request" }, { status: 400 });
  }

  const hint = await generateHint(parsed.data);

  // Persist the hint request (best effort — never block the quiz on a logging failure).
  // We store the served hint text whether it came from the model or the safe fallback.
  if (parsed.data.questionId) {
    try {
      await createHintRequest({
        userId: user.userId,
        sessionId: parsed.data.sessionId ?? null,
        questionId: parsed.data.questionId,
        hintText: hint.hintText,
      });
    } catch (error) {
      console.error("[ai/hint] Failed to persist hint_requests row:", error);
    }
  }

  return NextResponse.json(hint);
}
