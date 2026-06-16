import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import {
  getChallengeProgress,
  listChallenges,
  listStudentProfiles,
  overallAccuracy,
} from "@/lib/data";
import { buildLeaderboard } from "@/lib/leaderboard";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export default async function LeaderboardPage() {
  await connection();
  const profile = await requireUser();

  const entries = buildLeaderboard(
    await Promise.all((await listStudentProfiles()).map(async (p) => ({
      profile: p,
      accuracy: await overallAccuracy(p.userId),
    }))),
  );

  const challenges = await Promise.all(
    (await listChallenges()).map(async (challenge) => ({
      challenge,
      progress: await getChallengeProgress(profile.userId, challenge.id),
    })),
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Friendly competition. Keep your streak alive 🔥
        </p>
      </header>
      <LeaderboardView
        entries={entries}
        currentUserId={profile.userId}
        challenges={challenges}
      />
    </div>
  );
}
