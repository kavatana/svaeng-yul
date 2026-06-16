import { cn } from "@/lib/utils";
import type { OptionKey } from "@/types/domain";

/** Thin segmented bar: filled = answered, ring = current. */
export function QuizProgressBar({
  total,
  current,
  answers,
  questions,
}: {
  total: number;
  current: number;
  answers: Record<string, OptionKey>;
  questions: { id: string }[];
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }).map((_, i) => {
        const answered = Boolean(answers[questions[i]?.id]);
        return (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i === current
                ? "bg-purple-glow"
                : answered
                  ? "bg-primary/50"
                  : "bg-secondary",
            )}
          />
        );
      })}
    </div>
  );
}
