/**
 * Demo-mode (memory repo) smoke for My QCM. Exercises the exact data-layer
 * functions the server actions wrap: CRUD, practice recording, archive,
 * cascade delete, and cross-user ownership protection.
 *
 * Run WITHOUT Supabase env so isSupabaseConfigured === false (memory mode):
 *   npx tsx scripts/qcm-demo-smoke.ts
 */
import { isSupabaseConfigured } from "@/lib/config";
import { DEMO_ADMIN_ID, DEMO_STUDENT_ID } from "@/lib/store/db";
import { qcmQuestionSchema, qcmSetSchema } from "@/lib/validators";
import {
  createQcmQuestion,
  createQcmSet,
  deleteQcmQuestion,
  deleteQcmSet,
  getQcmQuestion,
  getQcmSet,
  listQcmQuestions,
  listQcmSets,
  qcmDashboardStats,
  recordQcmPractice,
  updateQcmQuestion,
  updateQcmSet,
} from "@/lib/data";

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗ FAIL"}  ${label}`);
  if (!cond) failures++;
}

async function main() {
  const STUDENT = DEMO_STUDENT_ID;
  const OTHER = DEMO_ADMIN_ID; // a different owner — must never see student's sets

  check("running in memory/demo mode (Supabase not configured)", isSupabaseConfigured === false);

  // Seeded set is present
  const seeded = await listQcmSets(STUDENT);
  check("seeded demo set present", seeded.some((s) => s.title === "Nursing Midterm Practice"));
  const seededSet = seeded.find((s) => s.title === "Nursing Midterm Practice");
  check("seeded set reports 2 questions", seededSet?.questionCount === 2);

  // Create a set (the friend's exam-prep story)
  const set = await createQcmSet({
    ownerId: STUDENT,
    title: "Pharmacology Final",
    description: "My drug cards",
    subjectId: null,
    customSubject: "Pharmacology",
            visibility: "private",
    examDate: "2026-09-01",
    tags: ["final", "drugs"],
  });
  check("createQcmSet returns id + private visibility", Boolean(set.id) && set.visibility === "private");

  // Add two questions
  const q1 = await createQcmQuestion({
    setId: set.id,
    ownerId: STUDENT,
    questionText: "Which class inhibits bacterial cell wall synthesis?",
    options: { A: "Beta-lactams", B: "Aminoglycosides", C: "Macrolides", D: "Quinolones" },
    correctOption: "A",
    explanation: "Beta-lactams (e.g. penicillins) inhibit cell wall synthesis.",
    difficulty: "medium",
    sourceNote: "Lecture 4",
    tags: [],
  });
  await createQcmQuestion({
    setId: set.id,
    ownerId: STUDENT,
    questionText: "Gentamicin belongs to which class?",
    options: { A: "Macrolides", B: "Aminoglycosides", C: "Tetracyclines", D: "Sulfonamides" },
    correctOption: "B",
    explanation: "Gentamicin is an aminoglycoside.",
    difficulty: "easy",
    sourceNote: null,
    tags: ["aminoglycoside"],
  });
  const qs = await listQcmQuestions(set.id, STUDENT);
  check("two questions created", qs.length === 2);

  // Edit set + question
  const updatedSet = await updateQcmSet(set.id, STUDENT, { title: "Pharmacology Final (v2)" });
  check("updateQcmSet changes title", updatedSet?.title === "Pharmacology Final (v2)");
  const updatedQ = await updateQcmQuestion(q1.id, STUDENT, { correctOption: "B", difficulty: "hard" });
  check("updateQcmQuestion changes correct option", updatedQ?.correctOption === "B");

  // Record practice → accuracy + last practiced surface on dashboard
  await recordQcmPractice({ setId: set.id, ownerId: STUDENT, totalQuestions: 2, correctCount: 1 });
  const afterPractice = (await listQcmSets(STUDENT)).find((s) => s.id === set.id);
  check("practice recorded: lastAccuracy = 50%", afterPractice?.lastAccuracy === 50);
  check("practice recorded: lastPracticedAt set", Boolean(afterPractice?.lastPracticedAt));

  // Archive a question → excluded from active list, present with includeArchived
  await updateQcmQuestion(q1.id, STUDENT, { isArchived: true });
  const active = await listQcmQuestions(set.id, STUDENT);
  const withArchived = await listQcmQuestions(set.id, STUDENT, { includeArchived: true });
  check("archived question hidden from active list", active.length === 1);
  check("archived question visible with includeArchived", withArchived.length === 2);

  // ── Cross-user ownership (the security heart of My QCM) ──
  check("OTHER user cannot read the set", (await getQcmSet(set.id, OTHER)) === null);
  check("OTHER user cannot read a question", (await getQcmQuestion(q1.id, OTHER)) === null);
  check("OTHER user update is a no-op", (await updateQcmSet(set.id, OTHER, { title: "hacked" })) === null);
  check("OTHER user delete-question is a no-op", (await deleteQcmQuestion(set.id, OTHER)) === false);
  check("OTHER user delete-set is a no-op", (await deleteQcmSet(set.id, OTHER)) === false);
  // Confirm the set survived the hostile attempts unchanged
  const survived = await getQcmSet(set.id, STUDENT);
  check("set survived hostile attempts with original title", survived?.title === "Pharmacology Final (v2)");
  check("OTHER user's set list does not include the set", !(await listQcmSets(OTHER)).some((s) => s.id === set.id));

  // Delete a question (owner)
  check("owner deletes a question", (await deleteQcmQuestion(q1.id, STUDENT)) === true);
  check("question gone after delete", (await getQcmQuestion(q1.id, STUDENT)) === null);

  // Dashboard stats reflect the active set
  const stats = await qcmDashboardStats(STUDENT);
  check("dashboard stats count sets", stats.totalSets >= 2);
  check("dashboard stats count exam sets (future-dated)", stats.examSets >= 2);

  // Cascade delete the whole set (owner)
  check("owner deletes the whole set", (await deleteQcmSet(set.id, STUDENT)) === true);
  check("set gone after delete", (await getQcmSet(set.id, STUDENT)) === null);
  check("questions cascade-deleted with set", (await listQcmQuestions(set.id, STUDENT, { includeArchived: true })).length === 0);

  // ── Validators reject bad input ──
  check("validator rejects blank question", !qcmQuestionSchema.safeParse({
    questionText: "", optionA: "a", optionB: "b", optionC: "c", optionD: "d",
    correctOption: "A", explanation: "because reasons", difficulty: "easy", tags: [],
  }).success);
  check("validator rejects duplicate options", !qcmQuestionSchema.safeParse({
    questionText: "A valid question stem?", optionA: "same", optionB: "same", optionC: "c", optionD: "d",
    correctOption: "A", explanation: "because reasons", difficulty: "easy", tags: [],
  }).success);
  check("validator rejects set with no subject at all", !qcmSetSchema.safeParse({
    title: "No subject set", visibility: "private", tags: [],
  }).success);
  check("validator accepts a good set", qcmSetSchema.safeParse({
    title: "Good set", customSubject: "Anatomy", visibility: "private", tags: [],
  }).success);

  console.log(failures === 0 ? "\nQCM DEMO SMOKE: PASS" : `\nQCM DEMO SMOKE: FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
