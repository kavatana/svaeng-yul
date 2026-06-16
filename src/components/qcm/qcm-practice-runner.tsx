"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, Shuffle, Sparkles, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowCard } from "@/components/glow-card";
import { Progress } from "@/components/ui/progress";
import { QuizProgressBar } from "@/components/quiz/quiz-progress-bar";
import { recordQcmPracticeAction } from "@/lib/qcm/actions";
import { cn } from "@/lib/utils";
import type { OptionKey } from "@/types/domain";

export interface PracticeQuestion {
  id: string;
  questionText: string;
  localContextNote?: string | null;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "setup" | "run" | "result";

export function QcmPracticeRunner({
  setId,
  setTitle,
  pool,
}: {
  setId: string;
  setTitle: string;
  pool: PracticeQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState<number | "all">(pool.length > 10 ? 10 : "all");
  const [randomize, setRandomize] = useState(true);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const recorded = useRef(false);

  const begin = useCallback(
    (source: PracticeQuestion[], shouldRandomize: boolean, take: number | "all") => {
      let qs = shouldRandomize ? shuffle(source) : [...source];
      if (take !== "all") qs = qs.slice(0, take);
      setQuestions(qs);
      setAnswers({});
      setIndex(0);
      recorded.current = false;
      setPhase("run");
    },
    [],
  );

  const score = useMemo(() => {
    const correct = questions.filter((q) => answers[q.id] === q.correctOption).length;
    const total = questions.length;
    return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
  }, [questions, answers]);

  const finish = useCallback(() => {
    setPhase("result");
    if (!recorded.current) {
      recorded.current = true;
      // Best-effort: persist for accuracy / last-practiced. Never blocks the UI.
      void recordQcmPracticeAction(setId, score.total, score.correct).catch(() => {});
    }
  }, [setId, score.total, score.correct]);

  /* ── Setup ─────────────────────────────────────────── */
  if (phase === "setup") {
    return (
      <div className="space-y-4">
        <BackLink setId={setId} />
        <GlowCard className="space-y-5 p-5">
          <div>
            <h1 className="text-lg font-semibold">Practice · {setTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {pool.length} {pool.length === 1 ? "question" : "questions"} ready.
            </p>
          </div>

          {pool.length > 10 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">How many?</p>
              <div className="flex gap-2">
                <Chip active={count === 10} onClick={() => setCount(10)}>
                  10 questions
                </Chip>
                <Chip active={count === "all"} onClick={() => setCount("all")}>
                  All {pool.length}
                </Chip>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setRandomize((r) => !r)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <Shuffle className="size-4 text-purple-glow" /> Shuffle order
            </span>
            <span
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                randomize ? "bg-primary" : "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                  randomize ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </span>
          </button>

          <Button className="w-full" onClick={() => begin(pool, randomize, count)}>
            <Sparkles className="size-4" /> Start practice
          </Button>
        </GlowCard>
      </div>
    );
  }

  /* ── Result ────────────────────────────────────────── */
  if (phase === "result") {
    const wrong = questions.filter((q) => answers[q.id] !== q.correctOption);
    return (
      <div className="space-y-4">
        <GlowCard glow="var(--purple-glow)" className="space-y-3 p-5">
          <div className="text-4xl font-semibold tracking-tight">
            {score.correct}
            <span className="text-2xl text-muted-foreground"> / {score.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">{score.percent}% correct</p>
          <Progress value={score.percent} indicatorClassName="bg-[var(--glow)]" />
        </GlowCard>

        <div className="flex flex-wrap gap-2">
          {wrong.length > 0 && (
            <Button variant="secondary" className="flex-1" onClick={() => begin(wrong, randomize, "all")}>
              <RotateCcw className="size-4" /> Retry {wrong.length} wrong
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={() => setPhase("setup")}>
            Practice again
          </Button>
          <Link href={`/my-qcm/${setId}`} className={cn(buttonVariants({ variant: "ghost" }), "flex-1")}>
            Back to set
          </Link>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const chosen = answers[q.id] ?? null;
            const isCorrect = chosen === q.correctOption;
            return (
              <GlowCard key={q.id} className="space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                      isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">
                    <span className="text-muted-foreground">Q{i + 1}. </span>
                    {q.localContextNote && (
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mr-2">[{q.localContextNote}]</span>
                    )}
                    {q.questionText}
                  </p>
                </div>
                <div className="space-y-1.5 pl-8">
                  {OPTION_KEYS.map((key) => {
                    const correct = key === q.correctOption;
                    const picked = key === chosen;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                          correct && "border-success/40 bg-success/10",
                          picked && !correct && "border-destructive/40 bg-destructive/10",
                          !correct && !picked && "border-border",
                        )}
                      >
                        <span className="font-semibold text-muted-foreground">{key}</span>
                        <span className="flex-1">{q.options[key]}</span>
                        {correct && <span className="text-xs text-success">Correct</span>}
                        {picked && !correct && <span className="text-xs text-destructive">Your pick</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="ml-8 rounded-xl bg-secondary/40 p-3 text-sm">
                  <span className="font-medium text-purple-glow">Why: </span>
                  {q.explanation}
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Run ───────────────────────────────────────────── */
  const current = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {index + 1} / {questions.length}
          </span>
          <span className="text-muted-foreground">{answeredCount} answered</span>
        </div>
        <QuizProgressBar total={questions.length} current={index} answers={answers} questions={questions} />
      </div>

      <GlowCard className="space-y-4 p-5">
        <Badge variant="secondary">{current.difficulty}</Badge>
        {current.localContextNote && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {current.localContextNote}
          </p>
        )}
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
                    selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
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

      <div className="flex items-center gap-2">
        <Button variant="ghost" className="flex-1" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        {isLast ? (
          <Button className="flex-1" onClick={finish}>
            Finish
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => setIndex((i) => i + 1)}>
            Next
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            aria-label={`Go to question ${i + 1}`}
            onClick={() => setIndex(i)}
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
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "border-primary/50 bg-primary/10 text-purple-glow" : "border-border bg-background/40 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function BackLink({ setId }: { setId: string }) {
  return (
    <Link href={`/my-qcm/${setId}`} className="text-sm text-muted-foreground hover:text-foreground">
      ← Back to set
    </Link>
  );
}
