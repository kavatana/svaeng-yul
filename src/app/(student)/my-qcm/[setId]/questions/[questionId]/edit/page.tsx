import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { getQcmQuestion } from "@/lib/data";
import { QcmQuestionForm } from "@/components/qcm/qcm-question-form";
import { updateQcmQuestionAction } from "@/lib/qcm/actions";

export default async function EditQcmQuestionPage({
  params,
}: {
  params: Promise<{ setId: string; questionId: string }>;
}) {
  await connection();
  const { setId, questionId } = await params;
  const user = await requireUser();

  const question = await getQcmQuestion(questionId, user.userId);
  if (!question || question.setId !== setId) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/my-qcm/${setId}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to set
      </Link>
      <h1 className="text-xl font-semibold">Edit question</h1>
      <QcmQuestionForm
        action={updateQcmQuestionAction.bind(null, setId, questionId)}
        initial={question}
        submitLabel="Save changes"
      />
    </div>
  );
}
