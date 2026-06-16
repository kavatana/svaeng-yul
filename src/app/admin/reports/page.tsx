import { connection } from "next/server";

import {
  getQuestion,
  getSessionAnswers,
  getSubject,
  listReports,
} from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { ReportReviewPanel } from "@/components/admin/report-review-panel";
import type { OptionKey } from "@/types/domain";

export default async function AdminReportsPage() {
  await connection();
  // Pending first, then resolved (most recent first within each group).
  const reports = (await listReports()).sort((a, b) => {
    if (a.adminStatus === "pending" && b.adminStatus !== "pending") return -1;
    if (a.adminStatus !== "pending" && b.adminStatus === "pending") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const reportRows = await Promise.all(
    reports.map(async (report) => {
      const question = await getQuestion(report.questionId);
      if (!question) return null;
      const selected = report.sessionId
        ? (await getSessionAnswers(report.sessionId)).find(
            (a) => a.questionId === report.questionId,
          )?.selectedOption ?? null
        : null;
      const subject = await getSubject(question.subjectId);
      return { report, question, selected, subjectName: subject?.name ?? "", topicName: "" };
    }),
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Reported answers</h1>
        <p className="text-sm text-muted-foreground">
          AI suggests a verdict. You make the final decision — AI never changes
          a question on its own.
        </p>
      </header>

      {reports.length === 0 ? (
        <GlowCard className="py-10 text-center text-sm text-muted-foreground">
          No reports yet. When students flag a question, it appears here with an
          AI analysis.
        </GlowCard>
      ) : (
        <div className="grid gap-4">
          {reportRows.map((row) => {
            if (!row) return null;
            return (
              <ReportReviewPanel
                key={row.report.id}
                report={row.report}
                question={row.question}
                subjectName={row.subjectName}
                topicName={row.topicName}
                studentSelectedOption={row.selected as OptionKey | null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
