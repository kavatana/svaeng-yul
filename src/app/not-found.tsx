import Link from "next/link";
import { Moon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { GlowCard } from "@/components/glow-card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="starfield flex min-h-dvh items-center justify-center p-4">
      <GlowCard glow="#a78bfa" className="relative z-10 max-w-sm space-y-3 text-center">
        <Moon className="mx-auto size-8 text-purple-glow text-glow" />
        <h1 className="text-lg font-semibold">Lost in the dark</h1>
        <p className="text-sm text-muted-foreground">
          This page drifted off. Let&apos;s get you back to studying.
        </p>
        <Link href="/home" className={cn(buttonVariants(), "w-full")}>
          Back to home
        </Link>
      </GlowCard>
    </div>
  );
}
