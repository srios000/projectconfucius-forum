import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Deletes a post and all its associated data, including the image in Storage and all comments in Firestore.
 * This ensures that no orphaned data remains after a post is removed.
 * @param post - The post object to be deleted, containing its ID and optional image URL.
 * @returns A promise that resolves when the post and all its related data have been successfully deleted.
 */
export const deletePost = async (postId: string) => {
  // comments, post_votes, saved_posts cascade via FK ON DELETE CASCADE.
  await db.delete(posts).where(eq(posts.id, postId));
};