import { Trophy } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Challenge } from "@/types/domain";

export function ChallengeCard({
  challenge,
  progress,
}: {
  challenge: Challenge;
  progress: number;
}) {
  const pctDone = challenge.targetValue
    ? Math.min(100, Math.round((progress / challenge.targetValue) * 100))
    : 0;
  const done = progress >= challenge.targetValue;

  return (
    <GlowCard glow="#f59e0b" className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
          <Trophy className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{challenge.title}</h3>
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        </div>
        {done && <Badge variant="success">Done</Badge>}
      </div>
      <Progress value={pctDone} indicatorClassName="bg-amber" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {Math.min(progress, challenge.targetValue)} / {challenge.targetValue}
        </span>
        <span className="text-amber">
          +{challenge.xpReward} XP
          {challenge.badgeName ? ` · ${challenge.badgeName}` : ""}
        </span>
      </div>
    </GlowCard>
  );
}
