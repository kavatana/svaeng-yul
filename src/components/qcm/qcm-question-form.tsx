"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/glow-card";
import { cn } from "@/lib/utils";
import type { QcmActionState } from "@/lib/qcm/actions";
import type { OptionKey, UserQcmQuestion } from "@/types/domain";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];
const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function QcmQuestionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: QcmActionState, formData: FormData) => Promise<QcmActionState>;
  initial?: UserQcmQuestion;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<QcmActionState, FormData>(action, {});

  const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
  const [options, setOptions] = useState<Record<OptionKey, string>>({
    A: initial?.options.A ?? "",
    B: initial?.options.B ?? "",
    C: initial?.options.C ?? "",
    D: initial?.options.D ?? "",
  });
  const [correctOption, setCorrectOption] = useState<OptionKey>(initial?.correctOption ?? "A");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");

  // Live client-side hints (the server still validates authoritatively).
  const duplicateOptions = useMemo(() => {
    const filled = OPTION_KEYS.map((k) => options[k].trim().toLowerCase()).filter(Boolean);
    return new Set(filled).size !== filled.length;
  }, [options]);

  const allFilled = OPTION_KEYS.every((k) => options[k].trim().length > 0);
  const canPreview = questionText.trim().length > 0 && allFilled;

  return (
    <form action={formAction} className="space-y-4">
      <GlowCard className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="questionText">Question</Label>
          <Textarea
            id="questionText"
            name="questionText"
            rows={3}
            required
            placeholder="Write the question stem…"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </div>

        <div className="space-y-2.5">
          <Label>Options · tap the circle to mark the correct one</Label>
          {OPTION_KEYS.map((k) => {
            const correct = correctOption === k;
            return (
              <div key={k} className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Mark option ${k} correct`}
                  aria-pressed={correct}
                  onClick={() => setCorrectOption(k)}
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl border text-sm font-semibold transition-colors",
                    correct
                      ? "border-success/50 bg-success/20 text-success"
                      : "border-border bg-background/40 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {correct ? <Check className="size-4" /> : k}
                </button>
                <Input
                  name={`option${k}`}
                  required
                  placeholder={`Option ${k}`}
                  value={options[k]}
                  onChange={(e) => setOptions((o) => ({ ...o, [k]: e.target.value }))}
                />
              </div>
            );
          })}
          <input type="hidden" name="correctOption" value={correctOption} />
          {duplicateOptions && (
            <p className="text-xs text-amber">Two options look identical — make each one distinct.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea
            id="explanation"
            name="explanation"
            rows={2}
            required
            placeholder="Why is this the correct answer? Future-you will thank you."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              name="difficulty"
              className={selectClass}
              defaultValue={initial?.difficulty ?? "medium"}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input id="tags" name="tags" placeholder="comma, separated" defaultValue={(initial?.tags ?? []).join(", ")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sourceNote">Source / reference (optional)</Label>
          <Input
            id="sourceNote"
            name="sourceNote"
            placeholder="Lecture note, textbook page…"
            defaultValue={initial?.sourceNote ?? ""}
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </GlowCard>

      {/* Live preview — shows the student exactly how their card will read. */}
      {canPreview && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
          <GlowCard className="space-y-3 p-4">
            <p className="text-sm font-medium leading-relaxed">{questionText}</p>
            <div className="space-y-1.5">
              {OPTION_KEYS.map((k) => (
                <div
                  key={k}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                    correctOption === k ? "border-success/40 bg-success/10" : "border-border",
                  )}
                >
                  <span className="font-semibold text-muted-foreground">{k}</span>
                  <span className="flex-1">{options[k]}</span>
                  {correctOption === k && <span className="text-xs text-success">Correct</span>}
                </div>
              ))}
            </div>
            {explanation.trim() && (
              <div className="rounded-xl bg-secondary/40 p-3 text-sm">
                <span className="font-medium text-purple-glow">Why: </span>
                {explanation}
              </div>
            )}
          </GlowCard>
        </div>
      )}
    </form>
  );
}
