import Link from "next/link";
import { CalendarClock, FileQuestion, Lock, Target } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import type { UserQcmSetSummary } from "@/types/domain";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Days until an exam date (negative = past). */
function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function QcmSetCard({ set }: { set: UserQcmSetSummary }) {
  const examIn = set.examDate ? daysUntil(set.examDate) : null;
  return (
    <Link href={`/my-qcm/${set.id}`} className="block">
      <GlowCard className="space-y-3 p-4 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{set.title}</h3>
            {(set.subjectLabel || set.topicLabel) && (
              <p className="truncate text-xs text-muted-foreground">
                {[set.subjectLabel, set.topicLabel].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <Badge variant={set.isArchived ? "outline" : "secondary"} className="shrink-0">
            {set.isArchived ? "Archived" : <><Lock className="size-3" /> Private</>}
          </Badge>
        </div>

        {set.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{set.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="size-3.5" />
            {set.questionCount} {set.questionCount === 1 ? "question" : "questions"}
          </span>
          {set.lastAccuracy !== null && (
            <span className="inline-flex items-center gap-1">
              <Target className="size-3.5" />
              {set.lastAccuracy}% last
            </span>
          )}
          {set.examDate && (
            <span className="inline-flex items-center gap-1 text-amber">
              <CalendarClock className="size-3.5" />
              {examIn !== null && examIn >= 0
                ? examIn === 0
                  ? "Exam today"
                  : `Exam in ${examIn}d`
                : `Exam ${formatDate(set.examDate)}`}
            </span>
          )}
        </div>

        {set.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {set.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
      </GlowCard>
    </Link>
  );
}
