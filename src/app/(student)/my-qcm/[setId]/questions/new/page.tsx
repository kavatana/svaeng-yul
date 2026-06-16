import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { getQcmSet } from "@/lib/data";
import { QcmQuestionForm } from "@/components/qcm/qcm-question-form";
import { createQcmQuestionAction } from "@/lib/qcm/actions";

export default async function NewQcmQuestionPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  await connection();
  const { setId } = await params;
  const user = await requireUser();

  const set = await getQcmSet(setId, user.userId);
  if (!set) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/my-qcm/${setId}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {set.title}
      </Link>
      <h1 className="text-xl font-semibold">Add question</h1>
      <QcmQuestionForm action={createQcmQuestionAction.bind(null, setId)} submitLabel="Add question" />
    </div>
  );
}
