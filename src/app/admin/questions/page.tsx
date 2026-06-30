import Link from "next/link";
import { connection } from "next/server";
import { Archive, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  archiveQuestionAction,
} from "@/lib/admin/actions";
import {
  getSubject,
  listQuestions,
  listSubjects,
} from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentStatus, Difficulty } from "@/types/domain";

const selectClass =
  "h-9 rounded-lg border border-input bg-background/40 px-2 text-sm outline-none";

const PAGE_SIZE = 50;

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject?: string;
    status?: string;
    difficulty?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await connection();
  const sp = await searchParams;
  const subjects = await listSubjects();
  const subject = sp.subject ? subjects.find((s) => s.slug === sp.subject) : undefined;

  const questions = await listQuestions({
    subjectId: subject?.id,
    status: (sp.status as ContentStatus) || undefined,
    difficulty: (sp.difficulty as Difficulty) || undefined,
    search: sp.q || undefined,
  });

  const totalQuestions = questions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / PAGE_SIZE));
  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const currentPage = Math.min(
    Math.max(Number.isNaN(parsedPage) ? 1 : parsedPage, 1),
    totalPages,
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageQuestions = questions.slice(startIndex, startIndex + PAGE_SIZE);

  // Preserve active filters across pagination links; only `page` changes.
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.subject) params.set("subject", sp.subject);
    if (sp.status) params.set("status", sp.status);
    if (sp.difficulty) params.set("difficulty", sp.difficulty);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/admin/questions?${query}` : "/admin/questions";
  };

  // Only resolve subjects referenced by the visible page (small + fast).
  const subjectsById = new Map(
    await Promise.all(
      [...new Set(pageQuestions.map((q) => q.subjectId))].map(
        async (id) => [id, await getSubject(id)] as const,
      ),
    ),
  );

  const statusVariant = (s: ContentStatus) =>
    s === "published" ? "success" : s === "draft" ? "warning" : "secondary";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Question bank</h1>
          <p className="text-sm text-muted-foreground">
            {totalQuestions === 0
              ? "0 questions"
              : `Showing ${startIndex + 1}–${startIndex + pageQuestions.length} of ${totalQuestions} questions`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import" className={cn(buttonVariants({ variant: "outline" }))}>
            Import CSV
          </Link>
          <Link href="/admin/questions/new" className={cn(buttonVariants())}>
            <Plus className="size-4" /> New question
          </Link>
        </div>
      </header>

      {/* Filters (GET form) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search questions…"
          className="h-9 min-w-48 flex-1 rounded-lg border border-input bg-background/40 px-3 text-sm outline-none"
        />
        <select name="subject" defaultValue={sp.subject ?? ""} className={selectClass}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={selectClass}>
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select name="difficulty" defaultValue={sp.difficulty ?? ""} className={selectClass}>
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>

      {totalQuestions === 0 ? (
        <GlowCard className="py-10 text-center text-sm text-muted-foreground">
          No questions match these filters.
        </GlowCard>
      ) : (
        <GlowCard className="divide-y divide-border p-0">
          {pageQuestions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{q.questionText}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{subjectsById.get(q.subjectId)?.name}</span>
                  <span>·</span>
                  <span className="capitalize">{q.difficulty}</span>
                  {q.sourceReference && (
                    <>
                      <span>·</span>
                      <span className="max-w-full truncate">Source: {q.sourceReference}</span>
                    </>
                  )}
                  <span className="text-success">· correct {q.correctOption}</span>
                </div>
              </div>
              {q.verificationStatus === "needs_instructor_verification" && (
                <Badge variant="warning">Needs verification</Badge>
              )}
              <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
              {q.status !== "archived" && (
                <form action={archiveQuestionAction.bind(null, q.id)}>
                  <Button type="submit" variant="ghost" size="icon-sm" aria-label="Archive">
                    <Archive className="size-4" />
                  </Button>
                </form>
              )}
            </div>
          ))}
        </GlowCard>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Question pages"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                rel="prev"
              >
                <ChevronLeft className="size-4" /> Previous
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="size-4" /> Previous
              </Button>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                rel="next"
              >
                Next <ChevronRight className="size-4" />
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
