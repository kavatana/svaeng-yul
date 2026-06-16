/**
 * Runtime feature detection. Svaeng-Yul runs in two modes:
 *  - DEMO MODE  → no Supabase env. Uses the in-memory store + seed data so
 *                 the whole UI and quiz loop work with zero setup.
 *  - LIVE MODE  → Supabase env present. Real auth + Postgres + RLS.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** AI is optional; without a key the app returns safe canned hints/verdicts. */
export const isAIConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export const AI_HINT_PROVIDER = process.env.AI_HINT_PROVIDER ?? "anthropic";
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
export const OLLAMA_HINT_MODEL = process.env.OLLAMA_HINT_MODEL ?? "qwen2.5:14b";
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 15_000);

// Anthropic remains optional. Hints can use local Ollama; dispute analysis uses
// Anthropic only when configured and otherwise returns a safe manual-review fallback.
export const HINT_MODEL = process.env.ANTHROPIC_HINT_MODEL ?? "claude-haiku-4-5";
export const DISPUTE_MODEL = process.env.ANTHROPIC_DISPUTE_MODEL ?? "claude-opus-4-8";
