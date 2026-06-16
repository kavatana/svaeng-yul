import { Moon } from "lucide-react";

import { cn } from "@/lib/utils";

/** The Svaeng-Yul wordmark: a small glowing moon + name. */
export function Brand({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-primary/15 text-purple-glow ring-1 ring-primary/30">
        <Moon className="size-5 text-glow" />
      </span>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">Svaeng-Yul</div>
        {showTagline && (
          <div className="text-xs text-muted-foreground">
            Your calm QCM space for med school
          </div>
        )}
      </div>
    </div>
  );
}
