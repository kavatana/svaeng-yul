import { connection } from "next/server";

import {
  adminStats,
  adminWeakSubjects,
  listQuestions,
  listSubjects,
} from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { Progress } from "@/components/ui/progress";
import { DIFFICULTIES } from "@/lib/constants";

export default async function AdminAnalyticsPage() {
  await connection();
  const stats = await adminStats();
  const subjects = await listSubjects();
  const weakMap = new Map((await adminWeakSubjects()).map((w) => [w.subjectId, w]));

  const perSubject = await Promise.all(
    subjects.map(async (s) => ({
      subject: s,
      published: (await listQuestions({ subjectId: s.id, status: "published" })).length,
      accuracy: weakMap.get(s.id)?.accuracy ?? null,
    })),
  );

  const allQuestions = await listQuestions();
  const difficultyCounts = DIFFICULTIES.map((d) => ({
    difficulty: d,
    count: allQuestions.filter((q) => q.difficulty === d).length,
  }));
  const maxDiff = Math.max(1, ...difficultyCounts.map((d) => d.count));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">A quick read on the question bank and activity.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published questions" value={stats.publishedQuestions} />
        <Stat label="Total questions" value={stats.totalQuestions} />
        <Stat label="Quizzes completed" value={stats.quizzesCompleted} />
        <Stat label="Pending reports" value={stats.pendingReports} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Questions & accuracy by subject</h2>
        <GlowCard className="space-y-4">
          {perSubject.map(({ subject, published, accuracy }) => (
            <div key={subject.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{subject.name}</span>
                <span className="text-muted-foreground">
                  {published} published{accuracy !== null ? ` · ${accuracy}% acc` : ""}
                </span>
              </div>
              <Progress
                value={accuracy ?? 0}
                indicatorClassName={accuracy !== null && accuracy < 60 ? "bg-amber" : "bg-success"}
              />
            </div>
          ))}
        </GlowCard>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Difficulty distribution</h2>
        <GlowCard className="space-y-3">
          {difficultyCounts.map((d) => (
            <div key={d.difficulty} className="space-y-1">
              <div className="flex justify-between text-sm capitalize">
                <span>{d.difficulty}</span>
                <span className="text-muted-foreground">{d.count}</span>
              </div>
              <Progress value={(d.count / maxDiff) * 100} indicatorClassName="bg-purple-glow" />
            </div>
          ))}
        </GlowCard>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <GlowCard>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </GlowCard>
  );
}
