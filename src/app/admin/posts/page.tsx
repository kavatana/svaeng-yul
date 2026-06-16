import { connection } from "next/server";

import { listAllPosts } from "@/lib/data";
import { setPostStatusAction } from "@/lib/admin/actions";
import { GlowCard } from "@/components/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostComposer } from "@/components/admin/post-composer";

export default async function AdminPostsPage() {
  await connection();
  const posts = await listAllPosts();

  const statusVariant = (s: string) =>
    s === "published" ? "success" : s === "draft" ? "warning" : "secondary";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Posts</h1>
        <p className="text-sm text-muted-foreground">
          Write study notes and resources for students.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">New post</h2>
        <PostComposer />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">All posts ({posts.length})</h2>
        <GlowCard className="divide-y divide-border p-0">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {p.category} · {p.authorName}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                {p.status !== "published" ? (
                  <form action={setPostStatusAction.bind(null, p.id, "published")}>
                    <Button type="submit" size="xs" variant="secondary">
                      Publish
                    </Button>
                  </form>
                ) : (
                  <form action={setPostStatusAction.bind(null, p.id, "archived")}>
                    <Button type="submit" size="xs" variant="ghost">
                      Archive
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </GlowCard>
      </section>
    </div>
  );
}
