import Link from "next/link";
import { Play } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export function TopicCard({
  topic,
  subjectSlug,
  questionCount,
  isWeak,
}: {
  topic: any;
  subjectSlug: string;
  questionCount: number;
  isWeak?: boolean;
}) {
  const disabled = questionCount === 0;
  return (
    <GlowCard className="flex items-center justify-between gap-3 p-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{topic.name}</h3>
          {isWeak && <Badge variant="warning">Needs review</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {questionCount} {questionCount === 1 ? "question" : "questions"}
        </p>
      </div>
      {disabled ? (
        <span className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "opacity-50")}>
          Soon
        </span>
      ) : (
        <Link
          href={`/quiz/setup?subject=${subjectSlug}&topic=${topic.id}`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          <Play className="size-4" /> Start
        </Link>
      )}
    </GlowCard>
  );
}
