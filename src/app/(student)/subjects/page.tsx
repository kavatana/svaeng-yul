import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { listSubjects, subjectStats } from "@/lib/data";
import { SubjectCard } from "@/components/student/subject-card";

export default async function SubjectsPage() {
  await connection();
  const profile = await requireUser();
  const subjects = await listSubjects();
  const subjectRows = await Promise.all(
    subjects.map(async (subject) => {
      const stats = await subjectStats(profile.userId, subject.id);
      const weakTopic = null;
      return { subject, stats, weakTopic };
    }),
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <p className="text-sm text-muted-foreground">
          Pick a subject to practice. Small steps today.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {subjectRows.map(({ subject, stats, weakTopic }) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            stats={stats}
          />
        ))}
      </div>
    </div>
  );
}
