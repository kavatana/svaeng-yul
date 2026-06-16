import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { listQcmSets, qcmDashboardStats } from "@/lib/data";
import { QcmDashboard } from "@/components/qcm/qcm-dashboard";

export default async function MyQcmPage() {
  await connection();
  const user = await requireUser();
  const [sets, stats] = await Promise.all([
    listQcmSets(user.userId),
    qcmDashboardStats(user.userId),
  ]);
  return <QcmDashboard sets={sets} stats={stats} />;
}
