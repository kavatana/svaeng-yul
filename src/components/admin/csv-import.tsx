"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { GlowCard } from "@/components/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseQuestionsCsv, type CsvParseResult } from "@/lib/csv/parse";
import { importQuestionsAction } from "@/lib/admin/actions";

export function CsvImport() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      setResult(parseQuestionsCsv(text));
    };
    reader.readAsText(file);
  }

  async function doImport() {
    if (!result?.valid.length) return;
    setImporting(true);
    try {
      const res = await importQuestionsAction(csvText);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Imported ${res.imported} questions${res.failed ? `, ${res.failed} skipped` : ""}.`);
      router.push("/admin/questions");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlowCard className="space-y-4">
        <label
          htmlFor="csv-file"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background/40 px-4 py-8 text-center transition-colors hover:bg-muted"
        >
          <Upload className="size-6 text-purple-glow" />
          <span className="text-sm font-medium">Choose a CSV file</span>
          <span className="text-xs text-muted-foreground">
            Columns: subject, topic, difficulty, question_text, option_a–d, correct_option, explanation, source_reference
          </span>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
        <a href="/sample-questions.csv" download className="text-xs text-purple-glow hover:underline">
          Download a sample CSV
        </a>
      </GlowCard>

      {result && (
        <GlowCard className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">{result.valid.length} valid</Badge>
            {result.errors.length > 0 && (
              <Badge variant="danger">{result.errors.length} with errors</Badge>
            )}
            <span className="text-xs text-muted-foreground">of {result.totalRows} rows</span>
          </div>

          {result.errors.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              {result.errors.map((e) => (
                <div key={e.rowNumber}>
                  Row {e.rowNumber}: {e.message}
                </div>
              ))}
            </div>
          )}

          {result.valid.length > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {result.valid.slice(0, 8).map((r) => (
                <div key={r.rowNumber} className="rounded-lg bg-secondary/40 p-2.5 text-xs">
                  <div className="font-medium">{r.questionText}</div>
                  <div className="text-muted-foreground">
                    {r.subjectName} · {r.topic} · {r.difficulty} · correct {r.correctOption}
                    {r.verificationStatus === "needs_instructor_verification" && " · needs verification"}
                  </div>
                </div>
              ))}
              {result.valid.length > 8 && (
                <p className="text-center text-xs text-muted-foreground">
                  + {result.valid.length - 8} more
                </p>
              )}
            </div>
          )}

          <Button onClick={doImport} disabled={importing || result.valid.length === 0} className="w-full">
            {importing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Import {result.valid.length} questions
          </Button>
        </GlowCard>
      )}
    </div>
  );
}
