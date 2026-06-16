import Link from "next/link";
import { Clock } from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/posts/save-button";
import type { Post } from "@/types/domain";

function excerpt(content: string, max = 120): string {
  const text = content.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function PostCard({ post, saved }: { post: Post; saved: boolean }) {
  return (
    <GlowCard className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary">{post.category}</Badge>
        <SaveButton postId={post.id} saved={saved} />
      </div>
      <Link href={`/posts/${post.id}`} className="block">
        <h3 className="font-semibold leading-snug hover:text-purple-glow">{post.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{excerpt(post.content)}</p>
      </Link>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{post.authorName}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" /> {post.readTimeMinutes} min read
        </span>
      </div>
    </GlowCard>
  );
}
