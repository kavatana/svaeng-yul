import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarClock, FilePlus2, Lock, Pencil, Play } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getQcmSet, listQcmQuestions } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowCard } from "@/components/glow-card";
import { QcmQuestionRow } from "@/components/qcm/qcm-question-row";
import { QcmSetActions } from "@/components/qcm/qcm-set-actions";
import { cn } from "@/lib/utils";

export default async function QcmSetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  await connection();
  const { setId } = await params;
  const user = await requireUser();

  const set = await getQcmSet(setId, user.userId);
  if (!set) notFound();

  const allQuestions = await listQcmQuestions(setId, user.userId, { includeArchived: true });
  const active = allQuestions.filter((q) => !q.isArchived);
  const archived = allQuestions.filter((q) => q.isArchived);
  const subjectLabel = set.customSubject;
  const meta = [subjectLabel].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      <Link href="/my-qcm" className="text-sm text-muted-foreground hover:text-foreground">
        ← My QCM
      </Link>

      <GlowCard className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{set.title}</h1>
            {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
          </div>
          <Badge variant={set.isArchived ? "outline" : "secondary"} className="shrink-0">
            {set.isArchived ? "Archived" : <><Lock className="size-3" /> Private</>}
          </Badge>
        </div>

        {set.description && <p className="text-sm text-muted-foreground">{set.description}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>{active.length} {active.length === 1 ? "question" : "questions"}</span>
          {set.examDate && (
            <span className="inline-flex items-center gap-1 text-amber">
              <CalendarClock className="size-3.5" />
              Exam {new Date(set.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        {set.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {set.tags.map((t) => (
              <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Primary actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {active.length > 0 ? (
            <Link href={`/my-qcm/${setId}/practice`} className={cn(buttonVariants(), "flex-1 sm:flex-none")}>
              <Play className="size-4" /> Practice
            </Link>
          ) : (
            <span className={cn(buttonVariants({ variant: "secondary" }), "flex-1 cursor-not-allowed opacity-60 sm:flex-none")}>
              <Play className="size-4" /> Add a question to practice
            </span>
          )}
          <Link
            href={`/my-qcm/${setId}/questions/new`}
            className={cn(buttonVariants({ variant: "secondary" }), "flex-1 sm:flex-none")}
          >
            <FilePlus2 className="size-4" /> Add question
          </Link>
          <Link
            href={`/my-qcm/${setId}/edit`}
            className={cn(buttonVariants({ variant: "outline" }), "flex-1 sm:flex-none")}
          >
            <Pencil className="size-4" /> Edit set
          </Link>
        </div>

        <div className="border-t border-border pt-3">
          <QcmSetActions setId={setId} isArchived={set.isArchived} />
        </div>
      </GlowCard>

      {/* Questions */}
      {active.length === 0 && archived.length === 0 ? (
        <GlowCard className="space-y-2 p-6 text-center">
          <p className="font-medium">No questions yet</p>
          <p className="text-sm text-muted-foreground">Add your first question to start practicing.</p>
          <Link
            href={`/my-qcm/${setId}/questions/new`}
            className={cn(buttonVariants(), "mt-1")}
          >
            <FilePlus2 className="size-4" /> Add question
          </Link>
        </GlowCard>
      ) : (
        <div className="space-y-3">
          {active.map((q, i) => (
            <QcmQuestionRow key={q.id} question={q} index={i} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Archived questions ({archived.length})
          </summary>
          <div className="mt-3 space-y-3">
            {archived.map((q, i) => (
              <QcmQuestionRow key={q.id} question={q} index={i} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
