"use client";

import { useActionState, useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/glow-card";
import type { QcmActionState } from "@/lib/qcm/actions";
import type { UserQcmSet } from "@/types/domain";

const OTHER = "__other__";
const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function QcmSetForm({
  action,
  subjects,
  initial,
  submitLabel,
}: {
  action: (prev: QcmActionState, formData: FormData) => Promise<QcmActionState>;
  subjects: { id: string; name: string }[];
  initial?: UserQcmSet;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<QcmActionState, FormData>(action, {});
  const initialChoice = initial?.subjectId ?? (initial?.customSubject ? OTHER : subjects[0]?.id ?? OTHER);
  const [subjectChoice, setSubjectChoice] = useState(initialChoice);
  const isOther = subjectChoice === OTHER;

  return (
    <form action={formAction}>
      <GlowCard className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Set title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Nursing Midterm Practice"
            defaultValue={initial?.title ?? ""}
            required
            autoFocus
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="subjectChoice">Subject</Label>
            <select
              id="subjectChoice"
              className={selectClass}
              value={subjectChoice}
              onChange={(e) => setSubjectChoice(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value={OTHER}>Other (type my own)…</option>
            </select>
            {/* Real values submitted: subjectId when an official subject is picked. */}
            <input type="hidden" name="subjectId" value={isOther ? "" : subjectChoice} />
          </div>
        </div>

        {isOther && (
          <div className="space-y-1.5">
            <Label htmlFor="customSubject">Your subject</Label>
            <Input
              id="customSubject"
              name="customSubject"
              placeholder="Type a subject name"
              defaultValue={initial?.customSubject ?? ""}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="What is this set for?"
            defaultValue={initial?.description ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="examDate">Exam date (optional)</Label>
            <Input id="examDate" name="examDate" type="date" defaultValue={initial?.examDate ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="midterm, infection-control"
              defaultValue={(initial?.tags ?? []).join(", ")}
            />
          </div>
        </div>

        {/* Sharing is deferred — sets are private to their owner. */}
        <input type="hidden" name="visibility" value="private" />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Private — only you can see and practice this set.
        </p>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </GlowCard>
    </form>
  );
}
