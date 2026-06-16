import Link from "next/link";
import { connection } from "next/server";
import { FileText, FlagTriangleRight, ListChecks, Users } from "lucide-react";

import {
  adminStats,
  adminWeakSubjects,
  getQuestion,
  getSubject,
  listReports,
} from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function AdminDashboard() {
  await connection();
  const stats = await adminStats();
  const recentReports = (await listReports()).slice(0, 5);
  const weak = (await adminWeakSubjects()).slice(0, 5);
  const reportQuestions = new Map(
    await Promise.all(
      recentReports.map(async (r) => [r.questionId, await getQuestion(r.questionId)] as const),
    ),
  );
  const weakSubjects = new Map(
    await Promise.all(
      weak.map(async (w) => [w.subjectId, await getSubject(w.subjectId)] as const),
    ),
  );

  const cards = [
    { label: "Questions", value: stats.totalQuestions, icon: ListChecks, href: "/admin/questions" },
    { label: "Students", value: stats.totalUsers, icon: Users, href: "/admin/users" },
    { label: "Pending reports", value: stats.pendingReports, icon: FlagTriangleRight, href: "/admin/reports" },
    { label: "Quizzes completed", value: stats.quizzesCompleted, icon: FileText, href: "/admin/analytics" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Keep the question bank accurate and the students learning.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <GlowCard className="transition-transform active:scale-[0.99]">
              <c.icon className="size-5 text-purple-glow" />
              <div className="mt-2 text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </GlowCard>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent reports */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Recent reports</h2>
            <Link href="/admin/reports" className="text-xs text-purple-glow hover:underline">
              Review all
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <GlowCard className="py-6 text-center text-sm text-muted-foreground">
              No reports yet.
            </GlowCard>
          ) : (
            <GlowCard className="divide-y divide-border p-0">
              {recentReports.map((r) => {
                const q = reportQuestions.get(r.questionId);
                return (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm">{q?.questionText ?? "Question"}</p>
                      <Badge variant={r.adminStatus === "pending" ? "warning" : "secondary"}>
                        {r.adminStatus.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {r.studentReason}
                    </p>
                  </div>
                );
              })}
            </GlowCard>
          )}
        </section>

        {/* Top weak subjects */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Top weak subjects</h2>
          {weak.length === 0 ? (
            <GlowCard className="py-6 text-center text-sm text-muted-foreground">
              Not enough quiz data yet.
            </GlowCard>
          ) : (
            <GlowCard className="space-y-3">
              {weak.map((w) => {
                const subject = weakSubjects.get(w.subjectId);
                return (
                  <div key={w.subjectId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{subject?.name}</span>
                      <span className="text-muted-foreground">{w.accuracy}%</span>
                    </div>
                    <Progress
                      value={w.accuracy}
                      indicatorClassName={w.accuracy < 60 ? "bg-amber" : "bg-success"}
                    />
                  </div>
                );
              })}
            </GlowCard>
          )}
        </section>
      </div>
    </div>
  );
}
