"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Tabs } from "@/components/ui/tabs";
import { ChallengeCard } from "@/components/gamification/challenge-card";
import { cn } from "@/lib/utils";
import type { Challenge, LeaderboardEntry } from "@/types/domain";

const TABS = [
  { value: "all", label: "All time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function LeaderboardView({
  entries,
  currentUserId,
  challenges,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
  challenges: Array<{ challenge: Challenge; progress: number }>;
}) {
  const [tab, setTab] = useState("all");
  const me = entries.find((e) => e.userId === currentUserId);

  return (
    <div className="space-y-5">
      <Tabs tabs={TABS} value={tab} onValueChange={setTab} />

      {tab !== "all" ? (
        <GlowCard className="py-8 text-center text-sm text-muted-foreground">
          {tab === "weekly" ? "Weekly" : "Monthly"} rankings are coming soon.
          <br />
          For now, here&apos;s the all-time board.
        </GlowCard>
      ) : (
        <>
          {me && (
            <GlowCard glow="#a78bfa" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/20 font-semibold text-purple-glow">
                #{me.rank}
              </span>
              <div className="flex-1">
                <div className="font-semibold">You · {me.fullName}</div>
                <div className="text-xs text-muted-foreground">
                  Lv {me.level} · {me.xp} XP · {me.accuracy}% accuracy
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm text-amber">
                <Flame className="size-4" /> {me.streakCount}
              </span>
            </GlowCard>
          )}

          <GlowCard className="divide-y divide-border p-0">
            {entries.map((e) => (
              <div
                key={e.userId}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  e.userId === currentUserId && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold",
                    e.rank === 1
                      ? "bg-amber/20 text-amber"
                      : e.rank <= 3
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {e.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    Lv {e.level} · {e.accuracy}% acc
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{e.xp} XP</div>
                  <div className="flex items-center justify-end gap-1 text-xs text-amber">
                    <Flame className="size-3" /> {e.streakCount}
                  </div>
                </div>
              </div>
            ))}
          </GlowCard>
        </>
      )}

      {challenges.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Study-group challenges</h2>
          <div className="grid gap-3">
            {challenges.map(({ challenge, progress }) => (
              <ChallengeCard key={challenge.id} challenge={challenge} progress={progress} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
