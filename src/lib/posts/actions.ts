"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { toggleSavedPost } from "@/lib/data";

/** Toggle a post's saved state for the current user. */
export async function toggleSaveAction(postId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await toggleSavedPost(user.userId, postId);
  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
}
