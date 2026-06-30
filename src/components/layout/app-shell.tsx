import Link from "next/link";
import { FlaskConical, LogOut } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { StudentBottomNav, StudentSideNav } from "@/components/layout/student-nav";
import { ThemeToggleButton } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { MEDICAL_SAFETY_NOTE } from "@/lib/constants";

/** Subtle, persistent reminder that demo data is in-memory and resets on restart. */
function DemoModeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[0.7rem] font-medium text-amber ${className}`}
      title="Running without Supabase — data lives in memory and resets when the server restarts."
    >
      <FlaskConical className="size-3" />
      Demo mode — data resets on restart
    </span>
  );
}

/** Student app shell: sidebar on tablet/desktop, bottom nav on phone. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const isDemo = !isSupabaseConfigured;
  return (
    <div className="min-h-dvh md:flex">
      {/* Tablet / desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-bg-soft/60 px-4 py-6 md:flex">
        <Link href="/home">
          <Brand />
        </Link>
        <StudentSideNav />
        <div className="mt-auto space-y-3">
          {isDemo && <DemoModeBadge className="mx-2" />}
          <p className="px-2 text-[0.7rem] leading-relaxed text-muted-foreground">
            {MEDICAL_SAFETY_NOTE}
          </p>
          <div className="flex items-center justify-between gap-2">
            <form action={signOut} className="flex-1">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
            <ThemeToggleButton />
          </div>
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-soft/80 px-4 py-3 pt-safe backdrop-blur-lg md:hidden">
        <Link href="/home">
          <Brand />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggleButton />
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:px-8 md:py-8 md:pb-8">
        {isDemo && (
          <div className="mb-4 flex justify-center md:hidden">
            <DemoModeBadge />
          </div>
        )}
        {children}
      </main>

      <StudentBottomNav />
    </div>
  );
}
