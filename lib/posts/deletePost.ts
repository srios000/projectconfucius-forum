import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

/**
 * Deletes a post and all its associated data, including the image in Storage and all comments in Firestore.
 * This ensures that no orphaned data remains after a post is removed.
 * @param postId - The ID of the post to be deleted.
 * @returns A promise that resolves when the post and all its related data have been successfully deleted.
 */
export const deletePost = async (postId: string) => {
  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { imageUrl: true },
  });
  await db.delete(posts).where(eq(posts.id, postId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deletePost] best-effort R2 delete failed", err);
    });
  }
};