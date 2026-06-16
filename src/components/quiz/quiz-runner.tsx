"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FlagTriangleRight, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowCard } from "@/components/glow-card";
import { QuizProgressBar } from "@/components/quiz/quiz-progress-bar";
import { CountdownTimer } from "@/components/quiz/countdown-timer";
import { AIHintPanel } from "@/components/quiz/ai-hint-panel";
import { ReportQuestionModal } from "@/components/quiz/report-question-modal";
import { cn } from "@/lib/utils";
import type { OptionKey } from "@/types/domain";

export interface RunnerQuestion {
  id: string;
  questionText: string;
  options: Record<OptionKey, string>;
  difficulty: "easy" | "medium" | "hard";
  subjectName: string;
  topicName: string;
}

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export function QuizRunner({
  sessionId,
  questions,
  durationSeconds,
}: {
  sessionId: string;
  questions: RunnerQuestion[];
  durationSeconds: number | null;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [hintOpen, setHintOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hintUsed = useRef<Set<string>>(new Set());
  const timeSpent = useRef<Record<string, number>>({});
  const clockStart = useRef<number>(0);
  const activeId = useRef<string>(questions[0]?.id ?? "");

  // Start the per-question clock on mount (avoids an impure Date.now() in render).
  useEffect(() => {
    clockStart.current = Date.now();
  }, []);

  const current = questions[index];

  // Commit elapsed time to whichever question was active, then reset the clock.
  const commitTime = useCallback(() => {
    const elapsed = Math.round((Date.now() - clockStart.current) / 1000);
    const id = activeId.current;
    if (id) timeSpent.current[id] = (timeSpent.current[id] ?? 0) + elapsed;
    clockStart.current = Date.now();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      commitTime();
      const clamped = Math.min(questions.length - 1, Math.max(0, next));
      setIndex(clamped);
      activeId.current = questions[clamped]?.id ?? "";
    },
    [commitTime, questions],
  );

  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    commitTime();
    const payload = {
      sessionId,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] ?? null,
        timeSpentSeconds: timeSpent.current[q.id] ?? 0,
        hintUsed: hintUsed.current.has(q.id),
      })),
    };
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit the quiz.");
        setSubmitting(false);
        return;
      }
      router.push(`/quiz/${sessionId}/result`);
    } catch {
      toast.error("Network error while submitting.");
      setSubmitting(false);
    }
  }, [answers, commitTime, questions, router, sessionId, submitting]);

  if (!current) {
    return <p className="text-muted-foreground">This quiz has no questions.</p>;
  }

  const isLast = index === questions.length - 1;

  return (
    <div className="space-y-4">
      {/* Header: progress + timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {index + 1} / {questions.length}
          </span>
          {durationSeconds !== null && (
            <CountdownTimer durationSeconds={durationSeconds} onExpire={submit} />
          )}
        </div>
        <QuizProgressBar total={questions.length} current={index} answers={answers} questions={questions} />
      </div>

      {/* Question */}
      <GlowCard className="space-y-4 p-5">
        <Badge variant="secondary">
          {current.subjectName}
          {current.topicName ? ` · ${current.topicName}` : ""}
        </Badge>
        <h2 className="text-lg font-medium leading-relaxed">{current.questionText}</h2>

        <div className="space-y-2.5">
          {OPTION_KEYS.map((key) => {
            const selected = answers[current.id] === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [current.id]: key }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  selected
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                    : "border-border bg-background/40 hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg text-sm font-semibold transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {selected ? <Check className="size-4" /> : key}
                </span>
                <span className="text-sm">{current.options[key]}</span>
              </button>
            );
          })}
        </div>
      </GlowCard>

      {/* Hint + Report */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setHintOpen(true)}>
          <Lightbulb className="size-4" /> Need a hint
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setReportOpen(true)}>
          <FlagTriangleRight className="size-4" /> Report
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          Previous
        </Button>
        {isLast ? (
          <Button className="flex-1" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit quiz
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => goTo(index + 1)}>
            Next
          </Button>
        )}
      </div>

      {/* Navigator dots */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            aria-label={`Go to question ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              "size-7 rounded-lg text-xs font-medium transition-colors",
              i === index
                ? "bg-primary text-primary-foreground"
                : answers[q.id]
                  ? "bg-primary/20 text-purple-glow"
                  : "bg-secondary text-muted-foreground hover:bg-muted",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="pt-1 text-center text-xs text-muted-foreground">
        {answeredCount} of {questions.length} answered
      </p>

      <AIHintPanel
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        question={current}
        sessionId={sessionId}
        onHintShown={() => hintUsed.current.add(current.id)}
      />
      <ReportQuestionModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        questionId={current.id}
        sessionId={sessionId}
      />
    </div>
  );
}
