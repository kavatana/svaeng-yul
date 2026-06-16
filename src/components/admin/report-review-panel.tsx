"use client";

import { useActionState, useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewReportAction, type AdminActionState } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";
import type { AnswerReport, OptionKey, Question } from "@/types/domain";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

const ACTIONS = [
  { value: "approved", label: "Keep current answer" },
  { value: "changed_answer", label: "Change correct answer" },
  { value: "improved_explanation", label: "Improve explanation" },
  { value: "marked_ambiguous", label: "Mark ambiguous" },
  { value: "rejected", label: "Reject report" },
];

const selectClass =
  "h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none";

export function ReportReviewPanel({
  report,
  question,
  subjectName,
  topicName,
  studentSelectedOption,
}: {
  report: AnswerReport;
  question: Question;
  subjectName: string;
  topicName: string;
  studentSelectedOption: OptionKey | null;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    reviewReportAction,
    {},
  );
  const [action, setAction] = useState("approved");
  const resolved = report.adminStatus !== "pending";

  useEffect(() => {
    if (state.ok) toast.success("Report reviewed.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  const verdictLabel = report.aiVerdict?.replace(/_/g, " ");

  return (
    <GlowCard className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {subjectName} · {topicName}
        </div>
        <Badge variant={resolved ? "secondary" : "warning"}>
          {report.adminStatus.replace(/_/g, " ")}
        </Badge>
      </div>

      <p className="text-sm font-medium">{question.questionText}</p>

      <div className="space-y-1.5">
        {OPTION_KEYS.map((k) => (
          <div
            key={k}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
              k === question.correctOption && "border-success/40 bg-success/10",
              k === studentSelectedOption && k !== question.correctOption && "border-destructive/40 bg-destructive/10",
            )}
          >
            <span className="font-semibold text-muted-foreground">{k}</span>
            <span className="flex-1">{question.options[k]}</span>
            {k === question.correctOption && <span className="text-xs text-success">Current key</span>}
            {k === studentSelectedOption && <span className="text-xs text-muted-foreground">Student</span>}
          </div>
        ))}
      </div>

      {/* Source + verification — context for judging the dispute */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Source: {question.sourceReference ?? "—"}</span>
        {question.verificationStatus === "needs_instructor_verification" && (
          <Badge variant="warning">Needs instructor verification</Badge>
        )}
      </div>

      <div className="rounded-xl bg-secondary/40 p-3 text-sm">
        <div className="text-xs font-medium text-muted-foreground">Student&apos;s reason</div>
        <p>{report.studentReason}</p>
        {report.referenceNote && (
          <p className="mt-1 text-xs text-muted-foreground">Reference: {report.referenceNote}</p>
        )}
      </div>

      {/* AI suggestion */}
      {report.aiVerdict && (
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-medium text-purple-glow">
            <Bot className="size-4" /> AI suggestion: {verdictLabel}
            {report.aiConfidence !== null && (
              <Badge variant="default">{report.aiConfidence}% confident</Badge>
            )}
          </div>
          {report.aiReason && <p className="text-muted-foreground">{report.aiReason}</p>}
          {report.aiSuggestedAction && (
            <p className="mt-1 text-xs text-muted-foreground">Suggested: {report.aiSuggestedAction}</p>
          )}
        </div>
      )}

      {resolved ? (
        <p className="text-sm text-muted-foreground">
          Resolved as <span className="font-medium">{report.adminStatus.replace(/_/g, " ")}</span>
          {report.adminNote ? ` — ${report.adminNote}` : ""}.
        </p>
      ) : (
        <form action={formAction} className="space-y-3 border-t border-border pt-3">
          <input type="hidden" name="reportId" value={report.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`action-${report.id}`}>Decision</Label>
            <select
              id={`action-${report.id}`}
              name="action"
              className={selectClass}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {action === "changed_answer" && (
            <div className="space-y-1.5">
              <Label htmlFor={`newCorrect-${report.id}`}>New correct option</Label>
              <select
                id={`newCorrect-${report.id}`}
                name="newCorrectOption"
                className={selectClass}
                defaultValue={question.correctOption}
              >
                {OPTION_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k} — {question.options[k]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {action === "improved_explanation" && (
            <div className="space-y-1.5">
              <Label htmlFor={`newExpl-${report.id}`}>Improved explanation</Label>
              <Textarea
                id={`newExpl-${report.id}`}
                name="newExplanation"
                rows={3}
                defaultValue={question.explanation}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`note-${report.id}`}>Admin note (optional)</Label>
            <Textarea id={`note-${report.id}`} name="adminNote" rows={2} />
          </div>

          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Submit decision
          </Button>
        </form>
      )}
    </GlowCard>
  );
}
