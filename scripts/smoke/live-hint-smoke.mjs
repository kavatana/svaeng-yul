// Live smoke: sign in as student, drive the real /api/ai/hint route, verify
// hint_requests persistence. Uses @supabase/ssr to produce auth cookies in the
// exact format the route expects, then replays them over HTTP.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local
const env = {};
for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = "http://localhost:3000";

const STUDENT_EMAIL = process.env.SMOKE_EMAIL || "student@svaeng.app";
const adminAuth = createClient(URL_, SERVICE, { auth: { persistSession: false } });

// Non-destructive: mint a one-time OTP for the student (does NOT change the account),
// then exchange it through the SSR client so we get real auth cookies.
const { data: link, error: linkErr } = await adminAuth.auth.admin.generateLink({
  type: "magiclink",
  email: STUDENT_EMAIL,
});
if (linkErr) throw new Error("generateLink failed: " + linkErr.message);

const jar = new Map(); // name -> value
const supabase = createServerClient(URL_, ANON, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
  },
});

const { data: signIn, error: signInErr } = await supabase.auth.verifyOtp({
  type: "magiclink",
  email: STUDENT_EMAIL,
  token: link.properties.email_otp,
});
if (signInErr) throw new Error("verifyOtp failed: " + signInErr.message);
const userId = signIn.user.id;
console.log("signed in as", signIn.user.email, userId);

const cookieHeader = [...jar.entries()].map(([n, v]) => `${n}=${v}`).join("; ");
console.log("auth cookies set:", [...jar.keys()].join(", "));

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

async function countHints() {
  const { count, error } = await admin
    .from("hint_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error("count failed: " + error.message);
  return count;
}

// Pull a real published question + its session-free metadata for the payload.
const { data: q, error: qErr } = await admin
  .from("questions")
  .select("id, question_text, option_a, option_b, option_c, option_d, difficulty, correct_option, topic_id")
  .eq("status", "published")
  .limit(1)
  .single();
if (qErr) throw new Error("question fetch failed: " + qErr.message);
const { data: topic } = await admin.from("topics").select("id,name,subject_id").eq("id", q.topic_id).single();
const { data: subject } = await admin.from("subjects").select("name").eq("id", topic.subject_id).single();

const payload = {
  questionId: q.id,
  subject: subject.name,
  topic: topic.name,
  questionText: q.question_text,
  options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
  difficulty: q.difficulty,
};

const before = await countHints();
console.log("hint_requests before:", before);

const res = await fetch(`${BASE}/api/ai/hint`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader },
  body: JSON.stringify(payload),
});
const hint = await res.json();
console.log("HTTP status:", res.status);
console.log("response:", JSON.stringify(hint));

// Safety checks
const correctText = (q[`option_${q.correct_option.toLowerCase()}`] || "").toLowerCase();
const ht = (hint.hintText || "").toLowerCase();
const leaks =
  ht.includes(`option ${q.correct_option.toLowerCase()}`) ||
  /\bthe answer is\b/.test(ht) ||
  (correctText.length > 6 && ht.includes(correctText));
console.log("doesRevealAnswer:", hint.doesRevealAnswer);
console.log("leak-correct-option:", leaks);

// allow async insert to settle
await new Promise((r) => setTimeout(r, 600));
const after = await countHints();
console.log("hint_requests after:", after);
console.log("delta:", after - before);

const { data: lastRow } = await admin
  .from("hint_requests")
  .select("user_id, session_id, question_id, hint_text, created_at")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
console.log("persisted row:", JSON.stringify(lastRow));

const ok =
  res.status === 200 &&
  typeof hint.hintText === "string" &&
  hint.doesRevealAnswer === false &&
  !leaks &&
  after - before === 1 &&
  lastRow.question_id === q.id;
console.log(ok ? "\nLIVE HINT SMOKE: PASS" : "\nLIVE HINT SMOKE: FAIL");
process.exit(ok ? 0 : 1);
