"use client";

import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toggleSaveAction } from "@/lib/posts/actions";
import { cn } from "@/lib/utils";

export function SaveButton({
  postId,
  saved,
  variant = "icon",
}: {
  postId: string;
  saved: boolean;
  variant?: "icon" | "full";
}) {
  return (
    <form action={toggleSaveAction.bind(null, postId)}>
      {variant === "icon" ? (
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("size-4", saved && "fill-purple-glow text-purple-glow")} />
        </Button>
      ) : (
        <Button type="submit" variant={saved ? "secondary" : "outline"} size="sm">
          <Bookmark className={cn("size-4", saved && "fill-purple-glow text-purple-glow")} />
          {saved ? "Saved" : "Save"}
        </Button>
      )}
    </form>
  );
}
