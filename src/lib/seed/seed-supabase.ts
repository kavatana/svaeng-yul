import type { SupabaseClient } from "@supabase/supabase-js";

import { SUBJECTS } from "@/data/seed/subjects";

import { QUESTIONS } from "@/data/seed/questions";
import { POSTS } from "@/data/seed/posts";
import { CHALLENGES } from "@/data/seed/challenges";
import { BADGE_DEFS } from "@/lib/gamification/badges";

/**
 * Idempotent live-Supabase seed. Maps the in-memory `subj-…`/`topic-…` string
 * IDs to real UUIDs via slugs, then upserts on stable keys (slug, composite
 * (subject_id, slug), or `seed_key`) so re-running never duplicates rows.
 *
 * Requires migration 0003 (adds questions.seed_key, challenges.seed_key, and
 * the question metadata columns). Pass a service-role client.
 */

export interface SeedSummary {
  subjects: number;

  questions: number;
  badges: number;
  posts: number;
  challenges: number;
}

type Row = Record<string, unknown>;

const slugFromSubjectId = (subjectId: string) => subjectId.replace(/^subj-/, "");

async function upsert(
  client: SupabaseClient,
  table: string,
  rows: Row[],
  onConflict: string,
): Promise<Row[]> {
  const { data, error } = await client.from(table).upsert(rows, { onConflict }).select();
  if (error) throw new Error(`Upsert into "${table}" failed: ${error.message}`);
  return (data ?? []) as Row[];
}

export async function seedSupabase(
  client: SupabaseClient,
  log: (msg: string) => void = console.log,
): Promise<SeedSummary> {
  // 1. Subjects → map slug → uuid
  const subjectRows = await upsert(
    client,
    "subjects",
    SUBJECTS.map((s) => ({
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      color: s.color,
      order_index: s.orderIndex,
    })),
    "slug",
  );
  const subjectIdBySlug = new Map<string, string>(
    subjectRows.map((r) => [r.slug as string, r.id as string]),
  );
  log(`- ${subjectRows.length} subjects upserted`);

  // 2. Dummy Topics → upsert on subject_id, slug
  const topicRows = await upsert(
    client,
    "topics",
    SUBJECTS.map((s) => ({
      subject_id: subjectIdBySlug.get(s.slug),
      name: "General",
      slug: `general-${s.slug}`,
      description: "General topic for all questions",
    })),
    "subject_id, slug",
  );
  const topicIdBySubjectSlug = new Map<string, string>(
    topicRows.map((r) => {
      const subjectSlug = (r.slug as string).replace('general-', '');
      return [subjectSlug, r.id as string];
    })
  );
  log(`- ${topicRows.length} dummy topics upserted`);

  // 3. Questions → upsert on seed_key (our stable q-… id)
  const questionRows = await upsert(
    client,
    "questions",
    QUESTIONS.map((q) => ({
      subject_id: subjectIdBySlug.get(slugFromSubjectId(q.subjectId)),
      topic_id: topicIdBySubjectSlug.get(slugFromSubjectId(q.subjectId)),
      question_text: q.questionText,
      option_a: q.options.A,
      option_b: q.options.B,
      option_c: q.options.C,
      option_d: q.options.D,
      correct_option: q.correctOption,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source_reference: q.sourceReference,
      status: q.status,
      verification_status: q.verificationStatus ?? null,
      cognitive_level: q.cognitiveLevel ?? null,
      local_context_note: q.localContextNote ?? null,
      hint_seed: q.hintSeed ?? null,
      seed_key: q.id,
    })),
    "seed_key",
  );
  log(`- ${questionRows.length} questions upserted`);

  // 4. Badges → upsert on stable key
  const badgeRows = await upsert(
    client,
    "badges",
    BADGE_DEFS.map((b) => ({
      key: b.key,
      name: b.name,
      description: b.description,
      icon: b.icon,
      condition_type: b.conditionType,
      condition_value: b.conditionValue,
    })),
    "key",
  );
  log(`- ${badgeRows.length} badges upserted`);

  // 5. Posts → upsert on slug
  const postRows = await upsert(
    client,
    "posts",
    POSTS.map((p) => ({
      title: p.title,
      slug: p.slug,
      content: p.content,
      subject_id: p.subjectId ? subjectIdBySlug.get(slugFromSubjectId(p.subjectId)) ?? null : null,
      category: p.category,
      status: p.status,
      read_time_minutes: p.readTimeMinutes,
    })),
    "slug",
  );
  log(`- ${postRows.length} posts upserted`);

  // 6. Challenges → upsert on seed_key
  const challengeRows = await upsert(
    client,
    "challenges",
    CHALLENGES.map((c) => ({
      title: c.title,
      description: c.description,
      subject_id: c.subjectId ? subjectIdBySlug.get(slugFromSubjectId(c.subjectId)) ?? null : null,
      target_type: c.targetType,
      target_value: c.targetValue,
      xp_reward: c.xpReward,
      badge_name: c.badgeName,
      starts_at: c.startsAt,
      ends_at: c.endsAt,
      seed_key: c.id,
    })),
    "seed_key",
  );
  log(`- ${challengeRows.length} challenges upserted`);

  return {
    subjects: subjectRows.length,

    questions: questionRows.length,
    badges: badgeRows.length,
    posts: postRows.length,
    challenges: challengeRows.length,
  };
}
