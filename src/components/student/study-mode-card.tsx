import Link from "next/link";

import { GlowCard } from "@/components/glow-card";
import { Icon } from "@/components/icon";
import type { ModeMeta } from "@/lib/constants";

export function StudyModeCard({
  mode,
  subjectSlug,
}: {
  mode: ModeMeta;
  subjectSlug: string;
}) {
  return (
    <Link href={`/quiz/setup?subject=${subjectSlug}&mode=${mode.mode}`} className="block">
      <GlowCard className="h-full transition-transform active:scale-[0.99]">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-secondary/70 text-purple-glow">
            <Icon name={mode.icon} className="size-4.5" />
          </span>
          <h3 className="font-medium">{mode.label}</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{mode.blurb}</p>
      </GlowCard>
    </Link>
  );
}
