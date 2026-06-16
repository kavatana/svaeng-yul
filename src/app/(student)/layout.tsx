import { connection } from "next/server";

import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login when signed out. Admins can still use student pages.
  await connection();
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
