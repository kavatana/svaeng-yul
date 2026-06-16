import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Clock } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getPost, getPostBySlug, savedPostIds } from "@/lib/data";
import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/posts/save-button";
import { MEDICAL_SAFETY_NOTE } from "@/lib/constants";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  await connection();
  const { postId } = await params;
  const profile = await requireUser();
  const post = (await getPost(postId)) ?? (await getPostBySlug(postId));
  if (!post || post.status !== "published") notFound();

  const saved = (await savedPostIds(profile.userId)).has(post.id);

  return (
    <article className="space-y-5">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Posts
      </Link>

      <header className="space-y-3">
        <Badge variant="secondary">{post.category}</Badge>
        <h1 className="text-2xl font-semibold leading-tight">{post.title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{post.authorName}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {post.readTimeMinutes} min read
            </span>
          </div>
          <SaveButton postId={post.id} saved={saved} variant="full" />
        </div>
      </header>

      <GlowCard className="space-y-3 p-5 leading-relaxed">
        {post.content.split("\n").map((line, i) =>
          line.trim() === "" ? (
            <div key={i} className="h-2" />
          ) : (
            <p key={i} className="text-sm">
              {line}
            </p>
          ),
        )}
      </GlowCard>

      <p className="text-center text-xs text-muted-foreground">{MEDICAL_SAFETY_NOTE}</p>
    </article>
  );
}
