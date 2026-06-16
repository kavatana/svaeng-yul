import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { disputeRequestSchema } from "@/lib/validators";
import { analyzeDispute } from "@/lib/ai/dispute";

/** Standalone dispute analysis — admin only (e.g. manual re-analysis). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = disputeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dispute request" }, { status: 400 });
  }

  const result = await analyzeDispute(parsed.data);
  return NextResponse.json(result);
}
