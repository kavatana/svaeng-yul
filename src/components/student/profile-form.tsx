"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type ActionState } from "@/lib/auth/actions";
import type { Profile } from "@/types/domain";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfileAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast.success("Profile updated.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={profile.fullName} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="school">School</Label>
          <Input id="school" name="school" defaultValue={profile.school ?? ""} placeholder="University of Health Sciences" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="studyYear">Study year</Label>
          <Input id="studyYear" name="studyYear" defaultValue={profile.studyYear ?? ""} placeholder="Year 2" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
        <Input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://…" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
