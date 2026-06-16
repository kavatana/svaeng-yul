import {
  BookOpen,
  Bug,
  Dna,
  Flame,
  HeartPulse,
  Moon,
  ScrollText,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Undo2,
  Users,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Explicit registry so icon names stored as strings (subjects, badges, modes)
 * resolve to real components while staying tree-shakeable.
 */
const REGISTRY: Record<string, LucideIcon> = {
  Users,
  HeartPulse,
  ScrollText,
  Bug,
  Dna,
  BookOpen,
  Timer,
  Target,
  Trophy,
  Flame,
  Star,
  Moon,
  Undo2,
  Sparkles,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = REGISTRY[name] ?? HelpCircle;
  return <Cmp className={cn("size-5", className)} aria-hidden />;
}
