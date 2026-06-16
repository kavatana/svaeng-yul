import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import {
  getSubject,
  getSubjectBySlug,
  listQuestions,
  subjectMeta,
  subjectStats,
} from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { Icon } from "@/components/icon";
import { Progress } from "@/components/ui/progress";
import { StudyModeCard } from "@/components/student/study-mode-card";
import { QUIZ_MODES } from "@/lib/constants";
import { pct } from "@/lib/utils";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  await connection();
  const { subjectId } = await params;
  const profile = await requireUser();

  const subject = (await getSubjectBySlug(subjectId)) ?? (await getSubject(subjectId));
  if (!subject) notFound();

  const meta = subjectMeta(subject.slug);
  const hex = meta?.hex ?? "#a78bfa";
  const stats = await subjectStats(profile.userId, subject.id);
  
  const progress = stats.totalQuestions
    ? Math.round((stats.answered / stats.totalQuestions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Subjects
      </Link>

      <GlowCard glow={hex}>
        <div className="flex items-start gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl"
            style={{ background: `${hex}1f`, color: hex }}
          >
            <Icon name={subject.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">{subject.description}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Progress value={progress} indicatorClassName="bg-[var(--glow)]" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% explored</span>
            <span>
              {stats.answered ? `${pct(stats.accuracy)} accuracy` : "Not started yet"}
            </span>
          </div>
        </div>
      </GlowCard>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Study modes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUIZ_MODES.map((mode) => (
            <StudyModeCard key={mode.mode} mode={mode} subjectSlug={subject.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
