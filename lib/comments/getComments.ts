import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { Comment } from "@/types/comment";
import { desc, eq } from "drizzle-orm";

/**
 * Retrieves all comments for a post, newest first.
 * @param postId - The unique identifier of the post.
 * @returns A promise that resolves to an array of comments.
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
  return rows as unknown as Comment[];
};
