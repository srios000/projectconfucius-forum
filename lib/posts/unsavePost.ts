import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Removes a previously saved post from a user's personal collection.
 * @param userId - The unique identifier of the user unsaving the post.
 * @param postId - The unique identifier of the post to be removed from the saved list.
 * @returns A promise that resolves when the saved post document is deleted.
 */
export const unsavePost = async (userId: string, postId: string) => {
  await db.delete(savedPosts).where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
};