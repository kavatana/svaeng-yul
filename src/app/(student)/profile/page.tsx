import { connection } from "next/server";
import { Flame, Star, Zap } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import {
  getEarnedBadgeIds,
  getSubject,
  listBadges,
  listSessions,
  listSubjects,
  subjectStats,
} from "@/lib/data";
import { levelProgress } from "@/lib/gamification/xp";
import { GlowCard } from "@/components/glow-card";
import { StatPill } from "@/components/stat-pill";
import { Progress } from "@/components/ui/progress";
import { BadgeCard } from "@/components/gamification/badge-card";
import { ProfileForm } from "@/components/student/profile-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { pct } from "@/lib/utils";

export default async function ProfilePage() {
  await connection();
  const profile = await requireUser();
  const lp = levelProgress(profile.xp);
  const badges = await listBadges();
  const earned = await getEarnedBadgeIds(profile.userId);

  // Best / weakest subject by accuracy (among practiced subjects).
  const practiced = (
    await Promise.all(
      (await listSubjects()).map(async (s) => ({
        subject: s,
        stats: await subjectStats(profile.userId, s.id),
      })),
    )
  )
    .filter((x) => x.stats.answered > 0)
    .sort((a, b) => b.stats.accuracy - a.stats.accuracy);
  const best = practiced[0];
  const weakest = practiced[practiced.length - 1];

  const history = (await listSessions(profile.userId)).slice(0, 8);
  const historySubjects = new Map(
    await Promise.all(
      history.map(async (session) => [session.subjectId, await getSubject(session.subjectId)] as const),
    ),
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-2xl font-semibold text-purple-glow">
          {profile.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{profile.fullName}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {[profile.school, profile.studyYear].filter(Boolean).join(" · ") || "Med student"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <StatPill icon={<Flame className="size-4 text-amber" />} value={`${profile.streakCount}`} label="day streak" />
        <StatPill icon={<Star className="size-4 text-electric" />} value={`Lv ${profile.level}`} label="level" />
        <StatPill icon={<Zap className="size-4 text-purple-glow" />} value={`${profile.xp}`} label="XP" />
      </div>

      <GlowCard className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Level {lp.level}</span>
          <span className="text-muted-foreground">
            {lp.nextThreshold === null ? "Max level 🌟" : `${profile.xp} / ${lp.nextThreshold} XP`}
          </span>
        </div>
        <Progress value={lp.percent} indicatorClassName="bg-purple-glow" />
      </GlowCard>

      {(best || weakest) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {best && (
            <GlowCard className="p-4">
              <div className="text-xs text-muted-foreground">Best subject</div>
              <div className="font-medium text-success">{best.subject.name}</div>
              <div className="text-sm text-muted-foreground">{pct(best.stats.accuracy)} accuracy</div>
            </GlowCard>
          )}
          {weakest && best !== weakest && (
            <GlowCard className="p-4">
              <div className="text-xs text-muted-foreground">Needs review</div>
              <div className="font-medium text-amber">{weakest.subject.name}</div>
              <div className="text-sm text-muted-foreground">{pct(weakest.stats.accuracy)} accuracy</div>
            </GlowCard>
          )}
        </div>
      )}

      {/* Badges */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Badges ({earned.size}/{badges.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {badges.map((b) => (
            <BadgeCard key={b.id} badge={b} earned={earned.has(b.id)} />
          ))}
        </div>
      </section>

      {/* History */}
      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Study history</h2>
          <GlowCard className="divide-y divide-border p-0">
            {history.map((s) => {
              const subject = historySubjects.get(s.subjectId);
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{subject?.name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {s.mode.replace("_", " ")} · {s.completedAt?.slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pct(s.scorePercent)}</div>
                    <div className="text-xs text-muted-foreground">+{s.xpEarned} XP</div>
                  </div>
                </div>
              );
            })}
          </GlowCard>
        </section>
      )}

      {/* Appearance */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Appearance</h2>
        <GlowCard className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-muted-foreground">Follow your device, or pick light / dark.</div>
          </div>
          <ThemeToggle />
        </GlowCard>
      </section>

      {/* Edit */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Edit profile</h2>
        <GlowCard>
          <ProfileForm profile={profile} />
        </GlowCard>
      </section>
    </div>
  );
}
