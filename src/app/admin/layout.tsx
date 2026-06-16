import { connection } from "next/server";

import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side protection: non-admins are redirected away.
  await connection();
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
