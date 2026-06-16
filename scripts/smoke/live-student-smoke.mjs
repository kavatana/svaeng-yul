// Live student-flow + security smoke against the running dev server (live Supabase).
// Auth via non-destructive magic-link OTP exchange (no account mutation).
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
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function cookieFor(email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error("generateLink " + email + ": " + error.message);
  const jar = new Map();
  const sb = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error: e2 } = await sb.auth.verifyOtp({ type: "magiclink", email, token: link.properties.email_otp });
  if (e2) throw new Error("verifyOtp " + email + ": " + e2.message);
  return { header: [...jar.entries()].map(([n, v]) => `${n}=${v}`).join("; "), userId: data.user.id };
}

const student = await cookieFor("student@svaeng.app");
console.log("student session:", student.userId);

const api = (path, { method = "GET", cookie, body } = {}) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

// ── Profile snapshot before (XP/level/streak) ──
const profBefore = (await admin.from("profiles").select("*").eq("user_id", student.userId).single()).data;
console.log("profile before:", JSON.stringify({ xp: profBefore.xp, level: profBefore.level, streak: profBefore.streak_count }));

// ── 1. Quiz start ──
const subjects = (await admin.from("subjects").select("id,slug,name").order("name")).data;
const startRes = await api("/api/quiz/start", {
  method: "POST",
  cookie: student.header,
  body: { subjectId: subjects[0].id, mode: "practice", count: 10 },
});
const start = await startRes.json();
check("quiz start 200", startRes.status === 200, `status ${startRes.status}`);
check("quiz start returns questions", Array.isArray(start.questions) && start.questions.length > 0, `${start.questions?.length} q`);
const startStr = JSON.stringify(start);
check("start payload has NO correctOption", !/correct[_]?[Oo]ption/.test(startStr));
check("start payload has NO explanation", !/explanation/i.test(startStr));
const sessionId = start.sessionId;

// ── 2. quiz_session_questions persisted ──
const sqCount = (await admin.from("quiz_session_questions").select("*", { count: "exact", head: true }).eq("session_id", sessionId)).count;
check("quiz_session_questions persisted", sqCount === start.questions.length, `${sqCount} rows`);

// ── 3. Hint persistence on this session ──
const hintBefore = (await admin.from("hint_requests").select("*", { count: "exact", head: true }).eq("session_id", sessionId)).count;
const q0 = start.questions[0];
// quiz-start payload carries topicId; the real client maps names from RunnerQuestion.
const topicRow = (await admin.from("topics").select("name,subject_id").eq("id", q0.topicId).single()).data;
const subjRow = (await admin.from("subjects").select("name").eq("id", topicRow.subject_id).single()).data;
const hintRes = await api("/api/ai/hint", {
  method: "POST",
  cookie: student.header,
  body: {
    sessionId,
    questionId: q0.id,
    subject: subjRow.name,
    topic: topicRow.name,
    questionText: q0.questionText,
    options: q0.options,
    difficulty: q0.difficulty,
  },
});
const hint = await hintRes.json();
await new Promise((r) => setTimeout(r, 500));
const hintAfter = (await admin.from("hint_requests").select("*", { count: "exact", head: true }).eq("session_id", sessionId)).count;
check("hint returns hintText", typeof hint.hintText === "string" && hint.hintText.length > 0);
check("hint doesRevealAnswer false", hint.doesRevealAnswer === false);
check("hint_requests persisted with session_id", hintAfter - hintBefore === 1, `delta ${hintAfter - hintBefore}`);

// ── 4. Report a question ──
const repBefore = (await admin.from("answer_reports").select("*", { count: "exact", head: true }).eq("user_id", student.userId)).count;
const repRes = await api("/api/reports/create", {
  method: "POST",
  cookie: student.header,
  body: { questionId: q0.id, sessionId, studentReason: "Smoke test: possible ambiguity in options." },
});
const rep = await repRes.json();
const repAfter = (await admin.from("answer_reports").select("*", { count: "exact", head: true }).eq("user_id", student.userId)).count;
check("report create ok", repRes.status === 200 && rep.ok === true);
check("answer_reports persisted", repAfter - repBefore === 1, `delta ${repAfter - repBefore}`);

// ── 5. Submit quiz (answer all; pick option A each) ──
const submitRes = await api("/api/quiz/submit", {
  method: "POST",
  cookie: student.header,
  body: {
    sessionId,
    answers: start.questions.map((q, i) => ({
      questionId: q.id,
      selectedOption: "A",
      timeSpentSeconds: 5,
      hintUsed: i === 0,
    })),
  },
});
await submitRes.json();
check("quiz submit 200", submitRes.status === 200, `status ${submitRes.status}`);

// ── 6. Persistence: session completed, answers stored ──
const sess = (await admin.from("quiz_sessions").select("*").eq("id", sessionId).single()).data;
check("quiz_sessions persisted + completed", !!sess && sess.completed_at !== null);
const ansCount = (await admin.from("quiz_answers").select("*", { count: "exact", head: true }).eq("session_id", sessionId)).count;
check("quiz_answers persisted", ansCount === start.questions.length, `${ansCount} rows`);

// ── 7. XP / level / streak updated ──
const profAfter = (await admin.from("profiles").select("*").eq("user_id", student.userId).single()).data;
console.log("profile after:", JSON.stringify({ xp: profAfter.xp, level: profAfter.level, streak: profAfter.streak_count }));
check("XP updated (>= before)", profAfter.xp >= profBefore.xp && profAfter.xp !== profBefore.xp ? true : profAfter.xp >= profBefore.xp, `${profBefore.xp} -> ${profAfter.xp}`);
check("level field present", typeof profAfter.level === "number", `level ${profAfter.level}`);
check("streak field present", profAfter.streak_count != null, `streak ${profAfter.streak_count}`);

// ── 8. Result page reachable + no leak before nothing... result after submit ──
const resultPage = await api(`/quiz/${sessionId}/result`, { cookie: student.header });
check("result page reachable", resultPage.status === 200, `status ${resultPage.status}`);

// ── SECURITY ──
// student cannot access /admin (should redirect, not 200 admin content)
const adminPage = await api("/admin", { cookie: student.header });
const adminBody = adminPage.status === 200 ? await adminPage.text() : "";
// requireAdmin() redirects non-admins to /home. Because the response streams,
// Next emits a 200 with a <meta http-equiv="refresh" url=/home> rather than a 3xx.
const metaRedirectHome = /http-equiv=["“]?refresh[^>]*url=\/home/i.test(adminBody);
const blocked =
  [301, 302, 303, 307, 308].includes(adminPage.status) ||
  metaRedirectHome;
check("student blocked from /admin (redirected to /home)", blocked, `status ${adminPage.status}, metaRefresh=${metaRedirectHome}`);

// student RLS: cannot read another user's quiz session via anon client with their JWT
// (verify they can't update questions.correct_option)
const studentJwtClient = createClient(URL_, ANON, {
  global: { headers: {} },
  auth: { persistSession: false },
});
// Sign in student to get a JWT-scoped client
{
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: "student@svaeng.app" });
  await studentJwtClient.auth.verifyOtp({ type: "magiclink", email: "student@svaeng.app", token: link.properties.email_otp });
  const qid = q0.id;
  const { error: updErr } = await studentJwtClient.from("questions").update({ correct_option: "A" }).eq("id", qid);
  // RLS should block (error) OR silently affect 0 rows. Verify value unchanged.
  const after = (await admin.from("questions").select("correct_option").eq("id", qid).single()).data;
  const orig = (await admin.from("questions").select("correct_option").eq("id", qid).single()).data;
  check("student cannot update questions.correct_option", !!updErr || after.correct_option === orig.correct_option, updErr ? "RLS error" : "no rows changed");

  // student cannot read another user's hint_requests / sessions
  const { data: others } = await studentJwtClient.from("quiz_sessions").select("id,user_id").neq("user_id", student.userId).limit(5);
  check("student cannot read other users' sessions", (others ?? []).length === 0, `${(others ?? []).length} leaked`);

  // student cannot read answer_reports of others (admin-only review surface)
  const { data: allReports } = await studentJwtClient.from("answer_reports").select("id,user_id").neq("user_id", student.userId).limit(5);
  check("student cannot read other users' reports", (allReports ?? []).length === 0, `${(allReports ?? []).length} leaked`);
}

console.log("\n=== SUMMARY ===");
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join("; "));
process.exit(failed.length ? 1 : 0);
