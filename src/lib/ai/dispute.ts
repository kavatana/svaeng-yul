import { getAnthropic, extractJson, messageText } from "@/lib/ai/anthropic";
import { DISPUTE_MODEL } from "@/lib/config";
import type { DisputeRequest } from "@/lib/validators";
import type { AiVerdict } from "@/types/domain";

export interface DisputeResult {
  suggestedVerdict: AiVerdict;
  confidence: number;
  reason: string;
  suggestedAdminAction: string;
}

const VERDICTS: AiVerdict[] = [
  "keep_current_answer",
  "change_answer",
  "improve_explanation",
  "mark_ambiguous",
];

const SYSTEM_PROMPT = `You are an AI assistant helping admins review reported QCM answers for a healthcare student quiz platform.

You do not make final decisions. You only suggest a verdict for admin review.

Analyze:
- question wording
- all options
- current correct answer
- explanation
- student reason
- reference note if provided

Possible verdicts:
1. keep_current_answer
2. change_answer
3. improve_explanation
4. mark_ambiguous

Rules:
- Be careful and conservative.
- If the wording is unclear, suggest mark_ambiguous or improve_explanation.
- If the answer key appears wrong, suggest change_answer.
- If the explanation is weak but answer is correct, suggest improve_explanation.
- Do not modify database content directly.
- Return only JSON.

JSON format:
{
  "suggestedVerdict": "improve_explanation",
  "confidence": 78,
  "reason": "Short clear reason.",
  "suggestedAdminAction": "Specific action admin should take."
}`;

const FALLBACK: DisputeResult = {
  suggestedVerdict: "keep_current_answer",
  confidence: 0,
  reason:
    "AI analysis is unavailable. Please review the question wording, options, and the student's reason manually.",
  suggestedAdminAction: "Review the report manually and decide.",
};

/** Ask the model for a conservative dispute verdict. Never changes content. */
export async function analyzeDispute(input: DisputeRequest): Promise<DisputeResult> {
  const client = getAnthropic();
  if (!client) return FALLBACK;

  const userPrompt = [
    `Subject: ${input.subject}`,
    `Topic: ${input.topic}`,
    `Question: ${input.questionText}`,
    `A. ${input.options.A}`,
    `B. ${input.options.B}`,
    `C. ${input.options.C}`,
    `D. ${input.options.D}`,
    `Current correct option: ${input.currentCorrectOption}`,
    `Explanation: ${input.explanation}`,
    input.studentSelectedOption ? `Student selected: ${input.studentSelectedOption}` : "",
    `Student reason: ${input.studentReason}`,
    input.referenceNote ? `Reference note: ${input.referenceNote}` : "",
    `Return only the JSON object.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.messages.create({
      model: DISPUTE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (message.stop_reason === "refusal") return FALLBACK;

    const parsed = extractJson<Partial<DisputeResult>>(messageText(message));
    if (!parsed?.suggestedVerdict || !VERDICTS.includes(parsed.suggestedVerdict)) {
      return FALLBACK;
    }

    return {
      suggestedVerdict: parsed.suggestedVerdict,
      confidence: clampConfidence(parsed.confidence),
      reason: parsed.reason?.trim() || FALLBACK.reason,
      suggestedAdminAction: parsed.suggestedAdminAction?.trim() || FALLBACK.suggestedAdminAction,
    };
  } catch {
    return FALLBACK;
  }
}

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}
