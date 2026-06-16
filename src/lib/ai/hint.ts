import { getAnthropic, extractJson, messageText } from "@/lib/ai/anthropic";
import { generateOllamaJson } from "@/lib/ai/ollama";
import { FALLBACK_HINT, hintRevealsAnswer } from "@/lib/ai/safety";
import { AI_HINT_PROVIDER, HINT_MODEL } from "@/lib/config";
import type { HintRequest } from "@/lib/validators";

export interface HintResult {
  hintText: string;
  hintLevel: 1 | 2 | 3;
  doesRevealAnswer: false;
}

const SYSTEM_PROMPT = `You are an AI Study Assistant for Cambodian healthcare students practicing medical QCM.

Your job is to give a short contextual hint that helps the student think, without revealing the direct answer.

Rules:
- Never reveal the correct option.
- Never say "the answer is A/B/C/D."
- Never tell the student which option to choose.
- Never eliminate options directly.
- Give conceptual guidance only.
- Keep the hint short, calm, and useful.
- Use simple language.
- If the question is medical, explain conceptually for study purposes only.
- Do not provide clinical diagnosis or treatment advice.
- Return only JSON.

JSON format:
{
  "hintText": "...",
  "hintLevel": 1,
  "doesRevealAnswer": false
}`;

/** Generate a safe conceptual hint. Falls back to a canned clue on any issue. */
export async function generateHint(input: HintRequest): Promise<HintResult> {
  const fallback: HintResult = { hintText: FALLBACK_HINT, hintLevel: 1, doesRevealAnswer: false };
  const userPrompt = [
    `Subject: ${input.subject}`,
    `Topic: ${input.topic}`,
    `Difficulty: ${input.difficulty}`,
    `Question: ${input.questionText}`,
    `Options:`,
    `A. ${input.options.A}`,
    `B. ${input.options.B}`,
    `C. ${input.options.C}`,
    `D. ${input.options.D}`,
    input.studentWeakAreas?.length
      ? `The student tends to struggle with: ${input.studentWeakAreas.join(", ")}.`
      : "",
    `Give one short conceptual hint. Return only the JSON object.`,
  ]
    .filter(Boolean)
    .join("\n");

  if (AI_HINT_PROVIDER === "ollama") {
    const parsed = await generateOllamaJson<{ hintText?: string; hintLevel?: number }>({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 300,
      temperature: 0.2,
    });
    const ollamaHint = toSafeHint(parsed, input);
    return ollamaHint ?? fallback;
  }

  const client = getAnthropic();
  if (!client) return fallback;

  try {
    const message = await client.messages.create({
      model: HINT_MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (message.stop_reason === "refusal") return fallback;

    const parsed = extractJson<{ hintText?: string; hintLevel?: number }>(
      messageText(message),
    );
    return toSafeHint(parsed, input) ?? fallback;
  } catch {
    return fallback;
  }
}

function toSafeHint(
  parsed: { hintText?: string; hintLevel?: number } | null,
  input: HintRequest,
): HintResult | null {
  const hintText = parsed?.hintText?.trim();
  if (!hintText) return null;
  if (hintRevealsAnswer(hintText, input.options)) return null;

  const level = parsed?.hintLevel;
  const hintLevel: 1 | 2 | 3 = level === 2 ? 2 : level === 3 ? 3 : 1;
  return { hintText, hintLevel, doesRevealAnswer: false };
}
