"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QUIZ_MODES } from "@/lib/constants";
import type { QuizMode } from "@/types/domain";

interface Opt {
  id: string;
  slug?: string;
  name: string;
}

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function QuizSetup({
  subjects,
  defaultSubject,
  defaultMode,
}: {
  subjects: Opt[];
  defaultSubject?: string;
  defaultMode?: string;
}) {
  const router = useRouter();
  const initialSubject =
    subjects.find((s) => s.slug === defaultSubject || s.id === defaultSubject)?.id ??
    subjects[0]?.id ??
    "";

  const [subjectId, setSubjectId] = useState(initialSubject);
  const [mode, setMode] = useState<QuizMode>(
    (QUIZ_MODES.find((m) => m.mode === defaultMode)?.mode ?? "random_practice") as QuizMode,
  );
  
  const [count, setCount] = useState<number>(50);
  const [timePerQuestionSeconds, setTimePerQuestionSeconds] = useState<number>(60);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subjectId, 
          mode, 
          count, 
          timePerQuestionSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start the quiz.");
        return;
      }
      router.push(`/quiz/${data.sessionId}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlowCard glow="#a78bfa" className="space-y-5 p-5">
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <select
          id="subject"
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

      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {QUIZ_MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => setMode(m.mode)}
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                mode === m.mode
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background/40 text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon name={m.icon} className="mt-0.5 size-4 shrink-0 text-purple-glow" />
              <span>
                <span className="block text-sm font-medium text-foreground">{m.label}</span>
                <span className="block text-[0.7rem] leading-snug">{m.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="count">Number of Questions</Label>
        <Input
          id="count"
          type="number"
          min={1}
          max={500}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="time">Time per question (sec)</Label>
        <Input
          id="time"
          type="number"
          min={5}
          max={600}
          value={timePerQuestionSeconds}
          onChange={(e) => setTimePerQuestionSeconds(Number(e.target.value))}
        />
      </div>

      <Button size="lg" className="w-full" onClick={start} disabled={loading || !subjectId}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Start Quiz
      </Button>
    </GlowCard>
  );
}
