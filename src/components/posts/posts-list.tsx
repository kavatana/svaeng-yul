"use client";

import { useState } from "react";

import { PostCard } from "@/components/posts/post-card";
import { GlowCard } from "@/components/glow-card";
import { POST_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/domain";

export function PostsList({
  posts,
  savedIds,
}: {
  posts: Post[];
  savedIds: string[];
}) {
  const [category, setCategory] = useState<string>("All");
  const saved = new Set(savedIds);
  const filtered =
    category === "All" ? posts : posts.filter((p) => p.category === category);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {POST_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
              category === c
                ? "bg-primary/15 text-purple-glow ring-1 ring-primary/25"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlowCard className="py-8 text-center text-sm text-muted-foreground">
          No posts in this category yet.
        </GlowCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} saved={saved.has(post.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
