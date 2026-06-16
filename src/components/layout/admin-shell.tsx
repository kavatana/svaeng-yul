import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { AdminNav } from "@/components/layout/admin-nav";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth/actions";

/** Admin shell — desktop-first with a left sidebar; nav scrolls on small screens. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 z-30 flex shrink-0 flex-col gap-5 border-b border-border bg-bg-soft/70 px-4 py-4 backdrop-blur-lg md:h-dvh md:w-64 md:border-b-0 md:border-r md:py-6">
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Brand />
          </Link>
          <Badge variant="warning">Admin</Badge>
        </div>
        <AdminNav />
        <div className="mt-auto hidden gap-2 md:flex md:flex-col">
          <Link
            href="/home"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-4" /> Student view
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
