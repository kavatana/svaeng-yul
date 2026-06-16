"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

import { cn } from "@/lib/utils";

export function CountdownTimer({
  durationSeconds,
  onExpire,
}: {
  durationSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
    // onExpire is stable enough for this timer; re-run only on remaining change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const mins = Math.floor(Math.max(0, remaining) / 60);
  const secs = Math.max(0, remaining) % 60;
  const low = remaining <= 30;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium tabular-nums",
        low ? "bg-destructive/15 text-destructive" : "text-muted-foreground",
      )}
    >
      <Timer className="size-3.5" />
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}
