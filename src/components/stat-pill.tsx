import * as React from "react";

import { cn } from "@/lib/utils";

/** Compact stat chip: an emoji/icon, a value, and a label. */
export function StatPill({
  icon,
  value,
  label,
  className,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glow-card flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center sm:flex-row sm:justify-start sm:gap-3 sm:px-3.5 sm:text-left",
        className
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/70 text-lg">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold leading-tight sm:text-lg">{value}</div>
        <div className="text-[0.68rem] leading-tight text-muted-foreground sm:text-xs">{label}</div>
      </div>
    </div>
  );
}
