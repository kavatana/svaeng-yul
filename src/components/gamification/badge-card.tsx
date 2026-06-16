import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { Badge } from "@/types/domain";

export function BadgeCard({
  badge,
  earned = true,
  className,
}: {
  badge: Badge;
  earned?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glow-card flex items-center gap-3 rounded-2xl p-3",
        !earned && "opacity-45 grayscale",
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
        <Icon name={badge.icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{badge.name}</div>
        <div className="truncate text-xs text-muted-foreground">{badge.description}</div>
      </div>
    </div>
  );
}
