import type { LeaderboardEntry, Profile } from "@/types/domain";

export interface LeaderboardInput {
  profile: Profile;
  accuracy: number; // 0–100 average accuracy
}

/** leaderboardScore = xp + streak*20 + averageAccuracy*5 (per spec §17). */
export function leaderboardScore(xp: number, streak: number, accuracy: number): number {
  return Math.round(xp + streak * 20 + accuracy * 5);
}

/** Rank profiles into ordered leaderboard entries (highest score first). */
export function buildLeaderboard(inputs: LeaderboardInput[]): LeaderboardEntry[] {
  return inputs
    .map(({ profile, accuracy }) => ({
      userId: profile.userId,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      level: profile.level,
      xp: profile.xp,
      streakCount: profile.streakCount,
      accuracy: Math.round(accuracy),
      score: leaderboardScore(profile.xp, profile.streakCount, accuracy),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
