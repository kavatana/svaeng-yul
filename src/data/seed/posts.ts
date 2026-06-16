import type { Post } from "@/types/domain";

const now = "2026-01-01T00:00:00.000Z";

/** 8 admin-authored study posts. Educational only — no clinical advice. */
export const POSTS: Post[] = [
  {
    id: "post-daily-10",
    title: "How to use Svaeng-Yul for 10-minute daily QCM",
    slug: "daily-10-minute-qcm",
    content:
      "Ten focused minutes beats one exhausting hour.\n\n1. Pick one subject and one mode — Practice is perfect for daily reps.\n2. Choose 10 questions, not 30.\n3. Read every explanation, even when you were right.\n4. Note one weak topic and let tomorrow's session start there.\n\nThe streak is the point. Small, honest practice every night builds memory that cramming never will.",
    subjectId: null,
    category: "Study Tips",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
  {
    id: "post-review-wrong",
    title: "How to review wrong answers properly",
    slug: "review-wrong-answers-properly",
    content:
      "A wrong answer is the most useful thing in a quiz — if you review it well.\n\nFor each mistake, ask three questions:\n- What did the stem actually ask?\n- Why is the correct option right?\n- Why did my option feel right (what was the trap)?\n\nWrite the misconception in one sentence. Re-test the same topic in Weak Area mode within a day or two. Mastery comes from closing the gap, not from avoiding it.",
    subjectId: null,
    category: "Study Tips",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
  {
    id: "post-infection-traps",
    title: "Common QCM traps in Infection Disease Agents",
    slug: "infection-disease-qcm-traps",
    content:
      "Most infection mistakes come from mixing up the agent and its vector.\n\nKeep these pairs separate:\n- Dengue = dengue virus, carried by Aedes mosquitoes.\n- Malaria = Plasmodium parasite, carried by Anopheles mosquitoes.\n- Schistosoma mekongi = water contact via a freshwater snail host.\n- Opisthorchis viverrini = eating raw or undercooked freshwater fish.\n\nWhen artemisinin resistance or PfKelch13 comes up, think malaria (Plasmodium falciparum) — never dengue.",
    subjectId: "subj-infection-disease-agents",
    category: "Infection Disease Agents",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
  {
    id: "post-five-moments",
    title: "Remembering WHO's Five Moments for hand hygiene",
    slug: "remembering-who-five-moments",
    content:
      "WHO's Five Moments tell you when to clean your hands during care:\n\n1. Before touching a patient.\n2. Before a clean or aseptic procedure.\n3. After body-fluid exposure risk.\n4. After touching a patient.\n5. After touching patient surroundings.\n\nA simple way to hold them: moments 1 and 2 protect the patient; moments 3, 4, and 5 protect you and the wider environment. Picture the timeline of a single bedside visit and the five points fall into place.",
    subjectId: "subj-fundamental-of-nursing-sciences",
    category: "Nursing Sciences",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
  {
    id: "post-population-pyramid",
    title: "How to read a population pyramid",
    slug: "how-to-read-a-population-pyramid",
    content:
      "A population pyramid is a back-to-back bar chart: age groups stacked vertically, males on one side and females on the other.\n\n- A wide base means many young children — plan for maternal and child health.\n- A narrow base with a wide top means an ageing population — plan for chronic and geriatric care.\n- A bulge in the working ages hints at a possible demographic dividend.\n\nRead the shape first, then the numbers. The shape tells you what services a population needs next.",
    subjectId: "subj-demography",
    category: "Demography",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 3,
    createdAt: now,
  },
  {
    id: "post-embryo-memory-map",
    title: "Embryology week 1–3 memory map",
    slug: "embryology-week-1-3-memory-map",
    content:
      "The first three weeks follow a clean storyline:\n\n- Week 1: fertilization in the uterine tube, cleavage to a morula, then a blastocyst that reaches the uterus.\n- End of week 1 into week 2: implantation in the endometrium; the embryo becomes a bilaminar disc (epiblast + hypoblast).\n- Week 3: gastrulation creates the trilaminar disc — ectoderm, mesoderm, endoderm — and neurulation begins.\n\nHold the chain: zygote → morula → blastocyst → implantation → two layers → three layers.",
    subjectId: "subj-embryology",
    category: "Embryology",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 3,
    createdAt: now,
  },
  {
    id: "post-history-respect",
    title: "Understanding Cambodia's medical education history respectfully",
    slug: "cambodia-medical-history-respectfully",
    content:
      "Cambodia's medical education has a long arc: early institutions from the 1940s–1960s, a severe disruption during 1975–1979 when the trained workforce was nearly lost, and determined rebuilding from 1980 onward that led to today's University of Health Sciences.\n\nWhen you study this history, hold it with respect. The numbers represent people and a profession rebuilt against great odds. Focus on the pattern — growth, loss, recovery — rather than memorizing a single disputed figure.",
    subjectId: "subj-history",
    category: "History",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
  {
    id: "post-timed-exam",
    title: "How to study before a timed QCM exam",
    slug: "study-before-a-timed-qcm-exam",
    content:
      "In the last few days before a timed exam, practice the way you'll be tested.\n\n- Use Timed mode so the countdown feels familiar, not frightening.\n- Read each stem fully before looking at the options.\n- Flag hard questions and move on; don't lose easy points to one tough item.\n- Sleep beats one more hour of cramming.\n\nThe night before, do a short, gentle review — not a marathon. Calm and rested reads questions better than tired and rushed.",
    subjectId: null,
    category: "Exam Tips",
    authorName: "Svaeng-Yul Team",
    status: "published",
    readTimeMinutes: 2,
    createdAt: now,
  },
];
