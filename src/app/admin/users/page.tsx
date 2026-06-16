import { connection } from "next/server";
import { Flame } from "lucide-react";

import { listStudentProfiles, overallAccuracy } from "@/lib/data";
import { GlowCard } from "@/components/glow-card";

export default async function AdminUsersPage() {
  await connection();
  const users = (await Promise.all(
    (await listStudentProfiles()).map(async (p) => ({
      profile: p,
      accuracy: await overallAccuracy(p.userId),
    })),
  ))
    .sort((a, b) => b.profile.xp - a.profile.xp);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} students</p>
      </header>

      <GlowCard className="divide-y divide-border p-0">
        {users.map(({ profile, accuracy }) => (
          <div key={profile.userId} className="flex items-center gap-3 px-4 py-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 font-semibold text-purple-glow">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{profile.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {[profile.school, profile.studyYear].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">Lv {profile.level} · {profile.xp} XP</div>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span>{accuracy}% acc</span>
                <span className="flex items-center gap-1 text-amber">
                  <Flame className="size-3" /> {profile.streakCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </GlowCard>
    </div>
  );
}
