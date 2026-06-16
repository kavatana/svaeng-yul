import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { listSubjects } from "@/lib/data";
import { QuestionForm } from "@/components/admin/question-form";

export default async function NewQuestionPage() {
  await connection();
  const subjects = (await listSubjects()).map((s) => ({ id: s.id, name: s.name }));


  return (
    <div className="space-y-5">
      <Link
        href="/admin/questions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Question bank
      </Link>
      <h1 className="text-2xl font-semibold">New question</h1>
      <QuestionForm subjects={subjects} />
    </div>
  );
}
