import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/domain";
import { isSupabaseConfigured } from "@/lib/config";
import { getProfile } from "@/lib/store/repo";

export const SESSION_COOKIE = "sy_session";

/**
 * The currently signed-in user's profile, or null.
 * DEMO MODE → reads the session cookie set by the auth actions.
 * LIVE MODE → Supabase auth user + profiles row.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  if (isSupabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    return data ? mapProfileRow(data) : null;
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return getProfile(userId);
}

/** Redirect to login unless signed in. Returns the profile when present. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  return profile;
}

/** Redirect non-admins away. Students never reach admin routes. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/home");
  return profile;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    school: row.school,
    studyYear: row.study_year,
    xp: row.xp,
    level: row.level,
    streakCount: row.streak_count,
    lastStudyDate: row.last_study_date,
    createdAt: row.created_at,
  };
}
