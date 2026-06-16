"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import { loginSchema, registerSchema, profileSchema } from "@/lib/validators";
import { isSupabaseConfigured } from "@/lib/config";
import { store } from "@/lib/store/db";
import { createProfile, getProfile, updateProfile } from "@/lib/store/repo";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/auth/session";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { email, password } = parsed.data;

  let destination = "/home";

  if (isSupabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  } else {
    const cred = store.credentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!cred || cred.password !== password) {
      return { error: "Email or password is incorrect." };
    }
    await setSession(cred.userId);
    const profile = getProfile(cred.userId);
    destination = profile?.role === "admin" ? "/admin" : "/home";
  }

  redirect(destination);
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { fullName, email, password } = parsed.data;

  if (isSupabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    // A DB trigger (see migrations) creates the matching profiles row.
    if (!data.session) {
      // Email confirmation required.
      redirect("/login?check-email=1");
    }
  } else {
    const exists = store.credentials.some((c) => c.email.toLowerCase() === email.toLowerCase());
    if (exists) return { error: "That email is already registered." };
    const userId = uuid();
    store.credentials.push({ email, password, userId });
    createProfile({ userId, fullName, role: "student" });
    await setSession(userId);
  }

  redirect("/home");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentUser();
  if (!profile) return { error: "Not signed in." };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    school: formData.get("school") ?? "",
    studyYear: formData.get("studyYear") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { fullName, school, studyYear, avatarUrl } = parsed.data;

  if (isSupabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        school: school || null,
        study_year: studyYear || null,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", profile.userId);
    if (error) return { error: error.message };
  } else {
    updateProfile(profile.userId, {
      fullName,
      school: school || null,
      studyYear: studyYear || null,
      avatarUrl: avatarUrl || null,
    });
  }

  return { ok: true };
}

/** DEMO-ONLY: quick-switch between the seeded student and admin accounts. */
export async function demoSwitch(role: "student" | "admin"): Promise<void> {
  if (isSupabaseConfigured) return;
  const target = store.credentials.find((c) => {
    const p = getProfile(c.userId);
    return p?.role === role;
  });
  if (target) await setSession(target.userId);
  redirect(role === "admin" ? "/admin" : "/home");
}
