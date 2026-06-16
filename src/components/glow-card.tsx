import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The core surface of Svaeng-Yul: a soft, glassy card. Pass `glow` (a hex or
 * css color) to give it a colored halo — used for subject identity.
 */
export function GlowCard({
  className,
  glow,
  children,
  ...props
}: React.ComponentProps<"div"> & { glow?: string }) {
  return (
    <div
      className={cn("glow-card rounded-2xl p-4", glow && "glow-ring", className)}
      style={glow ? ({ "--glow": glow } as React.CSSProperties) : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
