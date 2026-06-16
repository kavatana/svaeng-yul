"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/glow-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <GlowCard glow="#ef4444" className="max-w-sm space-y-3 text-center">
        <AlertTriangle className="mx-auto size-8 text-destructive" />
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          A small bump in the night sky. Try again in a moment.
        </p>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </GlowCard>
    </div>
  );
}
