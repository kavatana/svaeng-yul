import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import {
  getQuestion,
  getSession,
  getSubject,
} from "@/lib/data";
import { QuizRunner, type RunnerQuestion } from "@/components/quiz/quiz-runner";
import type { Question } from "@/types/domain";

export default async function QuizSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await connection();
  const { sessionId } = await params;
  const profile = await requireUser();

  const session = await getSession(sessionId);
  if (!session || session.userId !== profile.userId) notFound();
  if (session.completedAt) redirect(`/quiz/${sessionId}/result`);

  const subject = await getSubject(session.subjectId);

  // Build client questions WITHOUT the correct answer. Include subject/topic
  // names so the AI hint endpoint has context.
  const sessionQuestions = (
    await Promise.all(session.questionIds.map((id) => getQuestion(id)))
  ).filter((q): q is Question => Boolean(q));
  const questions: RunnerQuestion[] = sessionQuestions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    difficulty: q.difficulty,
    subjectName: subject?.name ?? "",
    topicName: "",
  }));

  return (
    <QuizRunner
      sessionId={session.id}
      questions={questions}
      durationSeconds={questions.length * session.timePerQuestionSeconds}
    />
  );
}
