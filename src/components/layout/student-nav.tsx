"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  GraduationCap,
  Home,
  NotebookPen,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should also light this tab. */
  match?: string[];
  /** Shown only in the desktop sidebar (keeps the phone bar to 5 tabs). */
  desktopOnly?: boolean;
}

export const STUDENT_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/subjects", label: "Practice", icon: GraduationCap, match: ["/subjects", "/quiz"] },
  { href: "/my-qcm", label: "My QCM", icon: NotebookPen, match: ["/my-qcm"] },
  { href: "/posts", label: "Library", icon: BookMarked, match: ["/posts"] },
  { href: "/leaderboard", label: "Rank", icon: Trophy, desktopOnly: true },
  { href: "/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, item: NavItem) {
  if (pathname === item.href) return true;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname.startsWith(p));
}

/** Phone bottom navigation. Hidden on md+ where the sidebar is used. */
export function StudentBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-soft/90 pb-safe backdrop-blur-lg md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {STUDENT_NAV.filter((item) => !item.desktopOnly).map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[0.65rem] font-medium transition-colors",
                  active ? "text-purple-glow" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl transition-colors",
                    active && "bg-primary/15"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet / desktop left sidebar. Hidden on phones. */
export function StudentSideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {STUDENT_NAV.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-purple-glow ring-1 ring-primary/25"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
