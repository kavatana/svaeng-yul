import { Flame, Star, Zap } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Progress } from "@/components/ui/progress";
import { levelProgress } from "@/lib/gamification/xp";
import { pct } from "@/lib/utils";
import type { QuizResult } from "@/types/domain";

export function ResultSummaryCard({
  result,
  totalXp,
}: {
  result: QuizResult;
  totalXp: number;
}) {
  const { session } = result;
  const lp = levelProgress(totalXp);

  return (
    <GlowCard glow="#a78bfa" className="space-y-4 p-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-4xl font-semibold tracking-tight">
            {session.correctCount}
            <span className="text-2xl text-muted-foreground"> / {session.totalQuestions}</span>
          </div>
          <p className="text-sm text-muted-foreground">{pct(session.scorePercent)} accuracy</p>
        </div>
        {result.leveledUp && (
          <span className="rounded-full bg-amber/15 px-3 py-1 text-sm font-medium text-amber">
            Level up! → {result.newLevel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Zap className="size-4 text-purple-glow" />} value={`+${result.xpEarned}`} label="XP earned" />
        <Stat icon={<Flame className="size-4 text-amber" />} value={`${result.streakCount}d`} label="Streak" />
        <Stat icon={<Star className="size-4 text-electric" />} value={`Lv ${result.newLevel}`} label="Level" />
      </div>

      <div className="space-y-1.5">
        <Progress value={lp.percent} indicatorClassName="bg-[var(--glow)]" />
        <p className="text-xs text-muted-foreground">
          {lp.nextThreshold === null
            ? `${totalXp} XP · max level reached 🌟`
            : `${totalXp} / ${lp.nextThreshold} XP to level ${lp.level + 1}`}
        </p>
      </div>
    </GlowCard>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 py-2.5">
      <div className="flex items-center justify-center gap-1 text-base font-semibold">
        {icon}
        {value}
      </div>
      <div className="text-[0.7rem] text-muted-foreground">{label}</div>
    </div>
  );
}
