import Link from "next/link";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/data";
import { QcmSetForm } from "@/components/qcm/qcm-set-form";
import { createQcmSetAction } from "@/lib/qcm/actions";

export default async function NewQcmSetPage() {
  await connection();
  await requireUser();
  const subjects = (await listSubjects()).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-4">
      <Link href="/my-qcm" className="text-sm text-muted-foreground hover:text-foreground">
        ← My QCM
      </Link>
      <div>
        <h1 className="text-xl font-semibold">New QCM set</h1>
        <p className="text-sm text-muted-foreground">
          Set up the basics now — you&apos;ll add questions next.
        </p>
      </div>
      <QcmSetForm action={createQcmSetAction} subjects={subjects} submitLabel="Create set" />
    </div>
  );
}
