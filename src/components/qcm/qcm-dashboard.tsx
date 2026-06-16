"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, Layers, NotebookPen, Search, Target } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlowCard } from "@/components/glow-card";
import { QcmSetCard } from "@/components/qcm/qcm-set-card";
import { cn } from "@/lib/utils";
import type { QcmDashboardStats, UserQcmSetSummary } from "@/types/domain";

export function QcmDashboard({
  sets,
  stats,
}: {
  sets: UserQcmSetSummary[];
  stats: QcmDashboardStats;
}) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");

  const subjects = useMemo(
    () => [...new Set(sets.map((s) => s.subjectLabel).filter(Boolean))] as string[],
    [sets],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets.filter((s) => {
      if (subject !== "all" && s.subjectLabel !== subject) return false;
      if (!q) return true;
      const haystack = [s.title, s.description ?? "", ...s.tags, s.subjectLabel ?? "", s.topicLabel ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sets, query, subject]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My QCM</h1>
          <p className="text-sm text-muted-foreground">Your own practice sets for exam prep.</p>
        </div>
        <Link href="/my-qcm/new" className={cn(buttonVariants())}>
          <FilePlus2 className="size-4" /> New set
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={<Layers className="size-4 text-purple-glow" />} value={stats.totalSets} label="Sets" />
        <StatTile icon={<NotebookPen className="size-4 text-teal" />} value={stats.totalQuestions} label="Questions" />
        <StatTile icon={<Target className="size-4 text-amber" />} value={stats.examSets} label="Exam prep" />
      </div>

      {sets.length === 0 ? (
        <GlowCard className="space-y-3 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-purple-glow">
            <NotebookPen className="size-6" />
          </div>
          <h2 className="font-medium">No QCM sets yet</h2>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            Create your first practice set for your next exam — your own questions, answers, and explanations.
          </p>
          <Link href="/my-qcm/new" className={cn(buttonVariants(), "mt-1")}>
            <FilePlus2 className="size-4" /> Create your first set
          </Link>
        </GlowCard>
      ) : (
        <>
          {/* Search + filter */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your sets…"
                className="pl-9"
              />
            </div>
            {subjects.length > 0 && (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:w-56"
              >
                <option value="all">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sets match your search.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((set) => (
                <QcmSetCard key={set.id} set={set} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <GlowCard className="p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-lg font-semibold">
        {icon}
        {value}
      </div>
      <div className="text-[0.7rem] text-muted-foreground">{label}</div>
    </GlowCard>
  );
}
