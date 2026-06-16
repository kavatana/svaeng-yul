import type { OptionKey, Question } from "@/types/domain";

export interface SubmittedAnswer {
  questionId: string;
  selectedOption: OptionKey | null;
  timeSpentSeconds: number;
  hintUsed: boolean;
}

export interface GradedAnswer extends SubmittedAnswer {
  isCorrect: boolean;
  correctOption: OptionKey;
}

export interface ScoreResult {
  graded: GradedAnswer[];
  correctCount: number;
  scorePercent: number;
}

/**
 * Server-side authority for grading a quiz. The client never decides
 * correctness — we always compare against the stored `correctOption`.
 */
export function gradeQuiz(
  questions: Question[],
  submitted: SubmittedAnswer[],
): ScoreResult {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const graded: GradedAnswer[] = [];

  for (const ans of submitted) {
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const isCorrect = ans.selectedOption === q.correctOption;
    graded.push({ ...ans, isCorrect, correctOption: q.correctOption });
  }

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const total = graded.length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return { graded, correctCount, scorePercent };
}
