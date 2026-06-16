import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Icon } from "@/components/icon";
import { Progress } from "@/components/ui/progress";
import { pct } from "@/lib/utils";
import { subjectMeta } from "@/lib/data";
import type { Subject, SubjectStats } from "@/types/domain";

export function SubjectCard({
  subject,
  stats,
}: {
  subject: Subject;
  stats: SubjectStats;
}) {
  const meta = subjectMeta(subject.slug);
  const hex = meta?.hex ?? "#a78bfa";
  const progress = stats.totalQuestions
    ? Math.round((stats.answered / stats.totalQuestions) * 100)
    : 0;

  return (
    <Link href={`/subjects/${subject.slug}`} className="block">
      <GlowCard glow={hex} className="transition-transform active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl"
            style={{ background: `${hex}1f`, color: hex }}
          >
            <Icon name={subject.icon} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-semibold">{subject.name}</h3>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="truncate text-xs text-muted-foreground">{meta?.tagline}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <Progress value={progress} indicatorClassName="bg-[var(--glow)]" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% explored</span>
            <span>{stats.answered ? `${pct(stats.accuracy)} accuracy` : "Not started"}</span>
          </div>
        </div>
      </GlowCard>
    </Link>
  );
}
