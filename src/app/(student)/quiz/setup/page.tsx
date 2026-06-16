import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/data";
import { QuizSetup } from "@/components/quiz/quiz-setup";

export default async function QuizSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string; mode?: string }>;
}) {
  await connection();
  await requireUser();
  const sp = await searchParams;
  const subjects = (await listSubjects()).map((s) => ({ id: s.id, slug: s.slug, name: s.name }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">New practice</h1>
        <p className="text-sm text-muted-foreground">
          Choose what to practice. You can change this anytime.
        </p>
      </header>
      <QuizSetup
        subjects={subjects}
        defaultSubject={sp.subject}
        defaultMode={sp.mode}
      />
    </div>
  );
}
