"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmButton } from "@/components/qcm/confirm-button";
import { GlowCard } from "@/components/glow-card";
import {
  deleteQcmQuestionAction,
  setQcmQuestionArchivedAction,
} from "@/lib/qcm/actions";
import { cn } from "@/lib/utils";
import type { OptionKey, UserQcmQuestion } from "@/types/domain";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export function QcmQuestionRow({
  question,
  index,
}: {
  question: UserQcmQuestion;
  index: number;
}) {
  const [pending, startTransition] = useTransition();
  const setId = question.setId;

  return (
    <GlowCard className={cn("space-y-3 p-4", question.isArchived && "opacity-70")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-relaxed">
          <span className="text-muted-foreground">Q{index + 1}. </span>
          {question.questionText}
        </p>
        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[0.7rem] text-muted-foreground">
          {question.difficulty}
        </span>
      </div>

      <div className="space-y-1.5">
        {OPTION_KEYS.map((key) => {
          const correct = key === question.correctOption;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                correct ? "border-success/40 bg-success/10" : "border-border",
              )}
            >
              <span className="font-semibold text-muted-foreground">{key}</span>
              <span className="flex-1">{question.options[key]}</span>
              {correct && <span className="text-xs text-success">Correct</span>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-secondary/40 p-3 text-sm">
        <span className="font-medium text-purple-glow">Why: </span>
        {question.explanation}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/my-qcm/${setId}/questions/${question.id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Pencil className="size-3.5" /> Edit
        </Link>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setQcmQuestionArchivedAction(setId, question.id, !question.isArchived);
            })
          }
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : question.isArchived ? (
            <ArchiveRestore className="size-3.5" />
          ) : (
            <Archive className="size-3.5" />
          )}
          {question.isArchived ? "Restore" : "Archive"}
        </Button>
        <ConfirmButton
          variant="ghost"
          size="sm"
          className="ml-auto text-destructive"
          action={() => deleteQcmQuestionAction(setId, question.id)}
          title="Delete this question?"
          description="This permanently removes the question. This can't be undone."
          confirmLabel="Delete"
        >
          <Trash2 className="size-3.5" /> Delete
        </ConfirmButton>
      </div>
    </GlowCard>
  );
}
