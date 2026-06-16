"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Overlay } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

/** Bottom-sheet modal to report a possibly-incorrect answer. */
export function ReportQuestionModal({
  open,
  onClose,
  questionId,
  sessionId,
}: {
  open: boolean;
  onClose: () => void;
  questionId: string;
  sessionId: string | null;
}) {
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (reason.trim().length < 5) {
      toast.error("Please add a short reason.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          sessionId,
          studentReason: reason,
          referenceNote: reference,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not send report.");
        return;
      }
      toast.success(
        "Thanks. Your report was sent for review. AI will analyze it and an admin will decide.",
      );
      setReason("");
      setReference("");
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant="sheet"
      title="Report this question"
      description="Why do you think this answer may be wrong?"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reason">Your reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what seems incorrect…"
            rows={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reference">Optional reference</Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Book, page, or teacher note"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          You cannot change the answer key — an admin reviews every report.
        </p>
        <Button className="w-full" onClick={submit} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Submit report
        </Button>
      </div>
    </Overlay>
  );
}
