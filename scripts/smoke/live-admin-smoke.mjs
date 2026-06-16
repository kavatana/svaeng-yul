// Live admin-flow smoke: page access + admin data-layer capabilities.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = "http://localhost:3000";
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function session(email) {
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const jar = new Map();
  const sb = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data } = await sb.auth.verifyOtp({ type: "magiclink", email, token: link.properties.email_otp });
  // also return a JWT-scoped data client
  const jwtClient = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data: link2 } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  await jwtClient.auth.verifyOtp({ type: "magiclink", email, token: link2.properties.email_otp });
  return {
    cookie: [...jar.entries()].map(([n, v]) => `${n}=${v}`).join("; "),
    userId: data.user.id,
    jwtClient,
  };
}

const adminS = await session("admin@svaeng.app");
console.log("admin session:", adminS.userId);

const get = (path) =>
  fetch(`${BASE}${path}`, { headers: { Cookie: adminS.cookie }, redirect: "manual" });

// ── 1. Admin page access (all routes; must NOT redirect to /home) ──
const routes = [
  "/admin",
  "/admin/questions",
  "/admin/questions/new",
  "/admin/import",
  "/admin/reports",
  "/admin/posts",
  "/admin/users",
  "/admin/analytics",
];
for (const r of routes) {
  const res = await get(r);
  const body = res.status === 200 ? await res.text() : "";
  const bounced = /http-equiv=["“]?refresh[^>]*url=\/home/i.test(body);
  check(`admin can load ${r}`, res.status === 200 && !bounced, `status ${res.status}${bounced ? " BOUNCED" : ""}`);
}

// ── 2. Admin sees seeded questions on /admin/questions ──
{
  const body = await (await get("/admin/questions")).text();
  const { count } = await admin.from("questions").select("*", { count: "exact", head: true });
  // a sample question text should appear
  const sample = (await admin.from("questions").select("question_text").limit(1).single()).data.question_text;
  check("admin questions page shows seeded data", body.includes(sample.slice(0, 30)), `${count} questions in db`);
  // source references + verification status columns rendered
  check("admin questions page renders content table", /Subject|Difficulty|Status|Source/i.test(body));
}

// ── 3. Admin data-layer: CAN update questions (RLS allows admin) ──
{
  const q = (await admin.from("questions").select("id,correct_option,explanation").limit(1).single()).data;
  const orig = q.correct_option;
  const flipped = orig === "A" ? "B" : "A";
  const { error: upErr } = await adminS.jwtClient
    .from("questions")
    .update({ correct_option: flipped })
    .eq("id", q.id);
  const afterFlip = (await admin.from("questions").select("correct_option").eq("id", q.id).single()).data.correct_option;
  // restore immediately
  await adminS.jwtClient.from("questions").update({ correct_option: orig }).eq("id", q.id);
  const restored = (await admin.from("questions").select("correct_option").eq("id", q.id).single()).data.correct_option;
  check("admin CAN update questions.correct_option", !upErr && afterFlip === flipped, upErr ? upErr.message : `${orig}->${afterFlip}`);
  check("admin update restored cleanly", restored === orig, `${restored}`);
}

// ── 4. Admin can read all reports (review surface) ──
{
  const { data: reports, error } = await adminS.jwtClient
    .from("answer_reports")
    .select("id,user_id,ai_verdict,ai_confidence,ai_suggested_action,admin_status")
    .limit(10);
  check("admin can read answer_reports", !error && Array.isArray(reports), `${reports?.length ?? 0} reports`);
  const withAi = (reports ?? []).filter((r) => r.ai_verdict != null);
  check("reports carry AI verdict/confidence/action", withAi.length > 0 || (reports ?? []).length === 0, `${withAi.length} with AI`);
}

// ── 5. Admin can read all profiles (users page) ──
{
  const { data: profs, error } = await adminS.jwtClient.from("profiles").select("user_id,role").limit(50);
  check("admin can read profiles (users)", !error && (profs ?? []).length >= 2, `${profs?.length ?? 0} profiles`);
}

console.log("\n=== SUMMARY ===");
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join("; "));
process.exit(failed.length ? 1 : 0);
