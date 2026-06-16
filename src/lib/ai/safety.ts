import type { OptionKey } from "@/types/domain";

export const FALLBACK_HINT =
  "Think about the core definition in the question and compare it carefully with each option.";

/**
 * Guards against a hint that leaks the answer. Returns true if the text looks
 * like it reveals or names the correct option, so the caller can reject it.
 */
export function hintRevealsAnswer(
  hintText: string,
  options: Record<OptionKey, string>,
): boolean {
  const lower = hintText.toLowerCase();

  // Phrases that directly point at an option.
  const revealPatterns = [
    /\bthe answer is\b/,
    /\bcorrect answer\b/,
    /\bthe correct (option|choice)\b/,
    /\bchoose\s+(option\s+)?[abcd]\b/,
    /\bselect\s+(option\s+)?[abcd]\b/,
    /\bpick\s+(option\s+)?[abcd]\b/,
    /\boption\s+[abcd]\s+is\s+(correct|right|the)\b/,
    /\bit\s+is\s+(option\s+)?[abcd]\b/,
    /\beliminate\s+(option\s+)?[abcd]\b/,
    /\banswer:\s*[abcd]\b/,
  ];
  if (revealPatterns.some((re) => re.test(lower))) return true;

  // Quoting a full option's text verbatim is also a reveal.
  for (const text of Object.values(options)) {
    const opt = text.trim().toLowerCase();
    if (opt.length >= 12 && lower.includes(opt)) return true;
  }

  return false;
}
