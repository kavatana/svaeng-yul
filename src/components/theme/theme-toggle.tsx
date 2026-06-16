"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/components/theme/theme-provider";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Segmented System / Light / Dark control. Used on the profile page. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-xl border border-border bg-bg-soft p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact icon-only cycle button for the app header / sidebar. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Cycle system → light → dark → system.
  const next: ThemePreference =
    theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
      className={cn(
        "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
