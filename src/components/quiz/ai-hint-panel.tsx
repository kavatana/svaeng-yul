"use client";

import { useState } from "react";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";

import { Overlay } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import type { RunnerQuestion } from "@/components/quiz/quiz-runner";

/** Bottom-sheet AI hint. Gives a conceptual clue, never the answer. */
export function AIHintPanel({
  open,
  onClose,
  question,
  sessionId,
  onHintShown,
}: {
  open: boolean;
  onClose: () => void;
  question: RunnerQuestion;
  sessionId: string;
  onHintShown: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function fetchHint() {
    setLoading(true);
    setHint(null);
    onHintShown();
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          subject: question.subjectName,
          topic: question.topicName,
          questionText: question.questionText,
          options: question.options,
          difficulty: question.difficulty,
        }),
      });
      const data = await res.json();
      setHint(
        data.hintText ??
          "Think about the core definition in the question and compare it with each option.",
      );
    } catch {
      setHint(
        "Think about the core definition in the question and compare it with each option.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Overlay open={open} onClose={onClose} variant="sheet" title="Need a hint?">
      <p className="text-sm text-muted-foreground">
        A gentle clue to help you reason — it won&apos;t reveal the answer.
      </p>

      {!hint && !loading && (
        <Button className="mt-4 w-full" onClick={fetchHint}>
          <Sparkles className="size-4" /> Give me a hint
        </Button>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Thinking of a clue…
        </div>
      )}

      {hint && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-purple-glow">
            <Lightbulb className="size-4" /> Hint
          </div>
          <p className="text-sm leading-relaxed">{hint}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            This clue helps you reason, but does not reveal the answer.
          </p>
        </div>
      )}
    </Overlay>
  );
}
