import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { getQcmSet, listQcmQuestions } from "@/lib/data";
import { QcmPracticeRunner, type PracticeQuestion } from "@/components/qcm/qcm-practice-runner";

export default async function QcmPracticePage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  await connection();
  const { setId } = await params;
  const user = await requireUser();

  const set = await getQcmSet(setId, user.userId);
  if (!set) notFound();

  // Owner practising their own set, so it's fine to ship answers + explanations.
  const questions = await listQcmQuestions(setId, user.userId);
  if (questions.length === 0) redirect(`/my-qcm/${setId}`);

  const pool: PracticeQuestion[] = questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    localContextNote: q.localContextNote,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    difficulty: q.difficulty,
  }));

  return <QcmPracticeRunner setId={setId} setTitle={set.title} pool={pool} />;
}
