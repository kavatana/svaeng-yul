import { OLLAMA_BASE_URL, OLLAMA_HINT_MODEL, OLLAMA_TIMEOUT_MS } from "@/lib/config";
import { extractJson } from "@/lib/ai/anthropic";

export async function generateOllamaJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_HINT_MODEL,
        stream: false,
        format: "json",
        options: {
          temperature: params.temperature ?? 0.2,
          num_predict: params.maxTokens ?? 300,
        },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    return text ? extractJson<T>(text) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
