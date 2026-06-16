import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Home, RefreshCw, Target } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import {
  getProfile,
  getStoredResult,
  getSubject,
} from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { ResultSummaryCard } from "@/components/quiz/result-summary-card";
import { AnswerReviewCard } from "@/components/quiz/answer-review-card";
import { BadgeCard } from "@/components/gamification/badge-card";
import { cn } from "@/lib/utils";

function encouragement(scorePercent: number): string {
  if (scorePercent >= 90) return "Beautiful work 🌙";
  if (scorePercent >= 70) return "Nicely done 🌙";
  if (scorePercent >= 40) return "Good effort — you're improving 🌙";
  return "Small steps today. You showed up 🌙";
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await connection();
  const { sessionId } = await params;
  const profile = await requireUser();
  const result = await getStoredResult(sessionId, profile.userId);
  if (!result) notFound();

  const totalXp = (await getProfile(profile.userId))?.xp ?? 0;
  const subject = await getSubject(result.session.subjectId);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{encouragement(result.session.scorePercent)}</h1>

      <ResultSummaryCard result={result} totalXp={totalXp} />

      {result.newBadges.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">New badge unlocked</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.newBadges.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </section>
      )}

      {/* Next actions */}
      <div className="grid gap-2 sm:grid-cols-3">
        {subject && (
          <Link
            href={`/quiz/setup?subject=${subject.slug}`}
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            <RefreshCw className="size-4" /> Practice again
          </Link>
        )}
        <Link href="/home" className={cn(buttonVariants({ variant: "outline" }))}>
          <Home className="size-4" /> Home
        </Link>
      </div>

      {/* Review */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Review your answers</h2>
        {result.answers.map((a, i) => (
          <AnswerReviewCard key={a.id} index={i} answer={a} />
        ))}
      </section>
    </div>
  );
}
