"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction, type AdminActionState } from "@/lib/admin/actions";
import { POST_CATEGORIES } from "@/lib/constants";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none";

export function PostComposer() {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createPostAction,
    {},
  );

  return (
    <form action={formAction}>
      <GlowCard className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className={selectClass} defaultValue="Study Tips">
            {POST_CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" name="content" rows={6} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={selectClass} defaultValue="published">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Publish post
        </Button>
      </GlowCard>
    </form>
  );
}
