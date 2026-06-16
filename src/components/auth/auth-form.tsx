"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/glow-card";
import { signIn, signUp, demoSwitch, type ActionState } from "@/lib/auth/actions";

export function AuthForm({
  mode,
  demoMode,
}: {
  mode: "login" | "register";
  demoMode: boolean;
}) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <GlowCard glow="#a78bfa" className="p-5">
      <h1 className="text-xl font-semibold">
        {mode === "login" ? "Welcome back 🌙" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "login"
          ? "Sign in to continue your practice."
          : "Small practice. Strong memory."}
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" placeholder="Dara" autoComplete="name" required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="text-purple-glow hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-purple-glow hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      {demoMode && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            Exploring? Jump in with a demo account — no setup needed.
          </p>
          <div className="flex gap-2">
            <form action={demoSwitch.bind(null, "student")} className="flex-1">
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Demo student
              </Button>
            </form>
            <form action={demoSwitch.bind(null, "admin")} className="flex-1">
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Demo admin
              </Button>
            </form>
          </div>
        </div>
      )}
    </GlowCard>
  );
}
