"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/glow-card";
import { createQuestionAction, type AdminActionState } from "@/lib/admin/actions";
import type { OptionKey } from "@/types/domain";

interface Opt {
  id: string;
  subjectId?: string;
  name: string;
}

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

export function QuestionForm({ subjects }: { subjects: Opt[] }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createQuestionAction,
    {},
  );
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");


  return (
    <form action={formAction}>
      <GlowCard className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="subjectId">Subject</Label>
            <select
              id="subjectId"
              name="subjectId"
              className={selectClass}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="questionText">Question</Label>
          <Textarea id="questionText" name="questionText" rows={3} required />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {OPTION_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`option${k}`}>Option {k}</Label>
              <Input id={`option${k}`} name={`option${k}`} required />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="correctOption">Correct</Label>
            <select id="correctOption" name="correctOption" className={selectClass} defaultValue="A">
              {OPTION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select id="difficulty" name="difficulty" className={selectClass} defaultValue="medium">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className={selectClass} defaultValue="published">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea id="explanation" name="explanation" rows={2} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sourceReference">Source reference (optional)</Label>
          <Input id="sourceReference" name="sourceReference" placeholder="Lecture note, textbook…" />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Create question
        </Button>
      </GlowCard>
    </form>
  );
}
