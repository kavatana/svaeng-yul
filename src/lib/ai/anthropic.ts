import Anthropic from "@anthropic-ai/sdk";
import { isAIConfigured } from "@/lib/config";

/** Returns a configured Anthropic client, or null in DEMO MODE (no API key). */
export function getAnthropic(): Anthropic | null {
  if (!isAIConfigured) return null;
  return new Anthropic();
}

/** Concatenate all text blocks from a message response. */
export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Extract the first JSON object from model text. Models are instructed to
 * return only JSON, but this tolerates stray prose or markdown fences.
 */
export function extractJson<T>(text: string): T | null {
  const fenced = text.replace(/```json\s*|\s*```/g, "");
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(fenced.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
