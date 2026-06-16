import * as React from "react"

import { cn } from "@/lib/utils"

/** A simple, dependency-free progress bar. `value` is 0–100. */
function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: React.ComponentProps<"div"> & { value?: number; indicatorClassName?: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export { Progress }
