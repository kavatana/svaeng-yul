import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

/** Landing → route by auth + role. */
export default async function RootPage() {
  await connection();
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  redirect(profile.role === "admin" ? "/admin" : "/home");
}
