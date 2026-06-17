import { connection } from "next/server";
import { Flame, Star, Zap, Sparkles, User } from "lucide-react";

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
import { ProfileTabs } from "./profile-tabs";

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

  const overviewContent = (
    <div className="space-y-6">
      {(best || weakest) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {best && (
            <GlowCard className="p-5 flex flex-col justify-between h-full border-border/40 hover:border-success/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-success/10 text-success">
                  <Star className="size-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best Subject</span>
              </div>
              <div className="font-semibold text-lg mt-1">{best.subject.name}</div>
              <div className="text-sm text-success font-medium mt-1">{pct(best.stats.accuracy)} accuracy</div>
            </GlowCard>
          )}
          {weakest && best !== weakest && (
            <GlowCard className="p-5 flex flex-col justify-between h-full border-border/40 hover:border-amber/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber/10 text-amber">
                  <Flame className="size-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needs Review</span>
              </div>
              <div className="font-semibold text-lg mt-1">{weakest.subject.name}</div>
              <div className="text-sm text-amber font-medium mt-1">{pct(weakest.stats.accuracy)} accuracy</div>
            </GlowCard>
          )}
        </div>
      )}

      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Study Sessions</h2>
          <GlowCard className="divide-y divide-border/40 p-0 overflow-hidden">
            {history.map((s) => {
              const subject = historySubjects.get(s.subjectId);
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 text-sm transition-colors hover:bg-muted/30">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-base">{subject?.name}</div>
                    <div className="text-xs capitalize text-muted-foreground mt-0.5">
                      {s.mode.replace("_", " ")} · {s.completedAt?.slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-base">{pct(s.scorePercent)}</div>
                    <div className="text-xs font-medium text-purple-glow mt-0.5">+{s.xpEarned} XP</div>
                  </div>
                </div>
              );
            })}
          </GlowCard>
        </section>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No study history yet. Start a quiz to see your progress!</p>
        </div>
      )}
    </div>
  );

  const badgesContent = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50 text-center">
        You have unlocked <strong className="text-foreground">{earned.size}</strong> out of <strong className="text-foreground">{badges.length}</strong> badges.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {badges.map((b) => (
          <BadgeCard key={b.id} badge={b} earned={earned.has(b.id)} />
        ))}
      </div>
    </div>
  );

  const settingsContent = (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h2>
        <GlowCard className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="text-base font-medium">Theme Preferences</div>
            <div className="text-sm text-muted-foreground mt-1">Customize your learning environment.</div>
          </div>
          <ThemeToggle />
        </GlowCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Details</h2>
        <GlowCard className="p-5">
          <ProfileForm profile={profile} />
        </GlowCard>
      </section>
    </div>
  );

  return (
    <div className="pb-8 max-w-4xl mx-auto">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 sm:p-8 shadow-xl backdrop-blur-md mb-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-purple-glow/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-electric/20 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-glow to-electric p-[3px] shadow-lg shadow-purple-glow/20">
            <div className="flex size-full items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-4xl font-bold text-foreground">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.fullName}</h1>
            <p className="mt-1 text-muted-foreground">
              {[profile.school, profile.studyYear].filter(Boolean).join(" · ") || "Med student"}
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              <StatPill icon={<Flame className="size-4 text-amber" />} value={`${profile.streakCount}`} label="Day Streak" />
              <StatPill icon={<Star className="size-4 text-electric" />} value={`Lv ${profile.level}`} label="Level" />
              <StatPill icon={<Zap className="size-4 text-purple-glow" />} value={`${profile.xp}`} label="XP" />
            </div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="mt-8 space-y-2 relative">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-foreground">Level {lp.level}</span>
            <span className="text-muted-foreground">
              {lp.nextThreshold === null ? "Max level 🌟" : `${profile.xp} / ${lp.nextThreshold} XP`}
            </span>
          </div>
          <Progress value={lp.percent} className="h-2.5 bg-secondary/50" indicatorClassName="bg-gradient-to-r from-purple-glow to-electric" />
        </div>
      </div>

      <ProfileTabs overview={overviewContent} badges={badgesContent} settings={settingsContent} />
    </div>
  );
}
