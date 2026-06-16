import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Flame, NotebookPen, Sparkles, Star, Trophy, Zap } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import {
  getChallengeProgress,
  getSubject,
  listChallenges,
  listSessions,
  listSubjects,
  subjectMeta,
  subjectStats,
} from "@/lib/data";
import { levelProgress } from "@/lib/gamification/xp";
import { GlowCard } from "@/components/glow-card";
import { StatPill } from "@/components/stat-pill";
import { SubjectCard } from "@/components/student/subject-card";
import { ChallengeCard } from "@/components/gamification/challenge-card";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { cn, pct } from "@/lib/utils";

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  await connection();
  const profile = await requireUser();
  const subjects = await listSubjects();
  const lp = levelProgress(profile.xp);

  // Pick a focus subject: lowest accuracy among those practiced, else the first.
  const statsBySubject = await Promise.all(
    subjects.map(async (s) => ({
      subject: s,
      stats: await subjectStats(profile.userId, s.id),
    })),
  );
  const practiced = statsBySubject.filter((x) => x.stats.answered > 0);
  const focus =
    practiced.sort((a, b) => a.stats.accuracy - b.stats.accuracy)[0] ??
    statsBySubject[0];
  const focusMeta = subjectMeta(focus.subject.slug);
  const focusWeakTopic = null;

  const recent = (await listSessions(profile.userId))[0] ?? null;
  const recentSubject = recent ? await getSubject(recent.subjectId) : null;

  // Prefer a subject-less daily challenge; otherwise feature the first one.
  const challenges = await listChallenges();
  const dailyChallenge =
    challenges.find((c) => !c.subjectId) ?? challenges[0] ?? null;
  const dailyChallengeProgress = dailyChallenge
    ? await getChallengeProgress(profile.userId, dailyChallenge.id)
    : 0;
  const weakTopics = new Map<string, string | null>();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-semibold">
          {greeting()}, {profile.fullName} 🌙
        </h1>
        <p className="text-sm text-muted-foreground">Ready for 10 QCM today?</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatPill icon={<Flame className="size-4 text-amber" />} value={`${profile.streakCount}`} label="day streak" />
        <StatPill icon={<Star className="size-4 text-electric" />} value={`Lv ${profile.level}`} label="level" />
        <StatPill icon={<Zap className="size-4 text-purple-glow" />} value={`${profile.xp}`} label="XP" />
      </div>

      {/* Today's focus — the one clear recommended action */}
      <GlowCard glow={focusMeta?.hex} className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5 text-purple-glow" /> Today&apos;s focus
        </div>
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl"
            style={{ background: `${focusMeta?.hex}1f`, color: focusMeta?.hex }}
          >
            <Icon name={focus.subject.icon} />
          </span>
          <div className="min-w-0">
            <div className="font-semibold">{focus.subject.name}</div>
            <p className="truncate text-xs text-muted-foreground">
              {focusWeakTopic
                ? `Recommended: ${''}`
                : focus.stats.answered
                  ? `${pct(focus.stats.accuracy)} accuracy — keep going`
                  : "Start your first set here"}
            </p>
          </div>
        </div>
        <Link
          href={
            focusWeakTopic
              ? `/quiz/setup?subject=${focus.subject.slug}&mode=weak_area`
              : `/quiz/setup?subject=${focus.subject.slug}`
          }
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Practice now <ArrowRight className="size-4" />
        </Link>
      </GlowCard>

      {/* Recent result */}
      {recent && recentSubject && (
        <GlowCard className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Recent result</div>
            <div className="truncate font-medium">{recentSubject.name}</div>
            <div className="text-sm text-muted-foreground">
              {recent.correctCount}/{recent.totalQuestions} · {pct(recent.scorePercent)} · +{recent.xpEarned} XP
            </div>
          </div>
          <Link
            href={`/quiz/${recent.id}/result`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Review
          </Link>
        </GlowCard>
      )}

      {/* Level progress */}
      <GlowCard className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Level {lp.level}</span>
          <span className="text-muted-foreground">
            {lp.nextThreshold === null ? "Max level 🌟" : `${profile.xp} / ${lp.nextThreshold} XP`}
          </span>
        </div>
        <Progress value={lp.percent} indicatorClassName="bg-purple-glow" />
      </GlowCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/my-qcm">
          <GlowCard className="flex h-full items-center gap-3 p-4 transition-colors hover:border-primary/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-purple-glow">
              <NotebookPen className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="font-medium">My QCM</div>
              <div className="truncate text-xs text-muted-foreground">Build your own sets</div>
            </div>
          </GlowCard>
        </Link>
        <Link href="/leaderboard">
          <GlowCard className="flex h-full items-center gap-3 p-4 transition-colors hover:border-primary/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
              <Trophy className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="font-medium">Leaderboard</div>
              <div className="truncate text-xs text-muted-foreground">See your rank</div>
            </div>
          </GlowCard>
        </Link>
      </div>

      {/* Daily challenge */}
      {dailyChallenge && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Daily challenge</h2>
          <ChallengeCard
            challenge={dailyChallenge}
            progress={dailyChallengeProgress}
          />
        </section>
      )}

      {/* Subjects */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Subjects</h2>
          <Link href="/subjects" className="text-xs text-purple-glow hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {statsBySubject.map(({ subject, stats }) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              stats={stats}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
