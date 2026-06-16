import { connection } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { listPosts, savedPostIds } from "@/lib/data";
import { PostsList } from "@/components/posts/posts-list";

export default async function PostsPage() {
  await connection();
  const profile = await requireUser();
  const posts = await listPosts();
  const saved = [...(await savedPostIds(profile.userId))];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Study posts</h1>
        <p className="text-sm text-muted-foreground">
          Notes, tips, and resources to read between practice sets.
        </p>
      </header>
      <PostsList posts={posts} savedIds={saved} />
    </div>
  );
}
