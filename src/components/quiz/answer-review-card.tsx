import { Check, X } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { cn } from "@/lib/utils";
import type { OptionKey, Question, QuizAnswer } from "@/types/domain";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export function AnswerReviewCard({
  index,
  answer,
}: {
  index: number;
  answer: QuizAnswer & { question: Question };
}) {
  const q = answer.question;
  return (
    <GlowCard className="space-y-3 p-4">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold",
            answer.isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
          )}
        >
          {answer.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        </span>
        <p className="text-sm font-medium leading-relaxed">
          <span className="text-muted-foreground">Q{index + 1}. </span>
          {q.questionText}
        </p>
      </div>

      <div className="space-y-1.5 pl-8">
        {OPTION_KEYS.map((key) => {
          const isCorrect = key === q.correctOption;
          const isChosen = key === answer.selectedOption;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                isCorrect && "border-success/40 bg-success/10",
                isChosen && !isCorrect && "border-destructive/40 bg-destructive/10",
                !isCorrect && !isChosen && "border-border",
              )}
            >
              <span className="font-semibold text-muted-foreground">{key}</span>
              <span className="flex-1">{q.options[key]}</span>
              {isCorrect && <span className="text-xs text-success">Correct</span>}
              {isChosen && !isCorrect && <span className="text-xs text-destructive">Your pick</span>}
            </div>
          );
        })}
      </div>

      {q.explanation && q.explanation !== "No explanation provided." && (
        <div className="ml-8 rounded-xl bg-secondary/40 p-3 text-sm">
          <span className="font-medium text-purple-glow">Why: </span>
          {q.explanation}
        </div>
      )}

      {/* Honest trust signal: a real source only for instructor-verified items;
          otherwise an explicit practice-only caveat — this bank is not yet verified. */}
      {q.verificationStatus === "verified" && q.sourceReference ? (
        <p className="ml-8 text-xs text-muted-foreground">Source: {q.sourceReference}</p>
      ) : (
        <p className="ml-8 text-xs text-amber-500/90">
          ⚠ Practice item — not yet instructor-verified. Confirm against your course materials.
        </p>
      )}
    </GlowCard>
  );
}
