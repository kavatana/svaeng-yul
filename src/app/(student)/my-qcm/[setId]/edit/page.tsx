import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { getQcmSet, listSubjects } from "@/lib/data";
import { QcmSetForm } from "@/components/qcm/qcm-set-form";
import { updateQcmSetAction } from "@/lib/qcm/actions";

export default async function EditQcmSetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  await connection();
  const { setId } = await params;
  const user = await requireUser();

  const set = await getQcmSet(setId, user.userId);
  if (!set) notFound();
  const subjects = (await listSubjects()).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-4">
      <Link href={`/my-qcm/${setId}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to set
      </Link>
      <h1 className="text-xl font-semibold">Edit set</h1>
      <QcmSetForm
        action={updateQcmSetAction.bind(null, setId)}
        subjects={subjects}
        initial={set}
        submitLabel="Save changes"
      />
    </div>
  );
}
