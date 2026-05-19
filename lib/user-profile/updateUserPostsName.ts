import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Updates the cached creator username on all of a user's posts so name
 * changes propagate across post feeds.
 * @param userId - The local user id whose posts are updated.
 * @param newUserName - The new username to apply.
 * @returns A promise that resolves when the posts are updated.
 */
export const updateUserPostsName = async (
  userId: string,
  newUserName: string
) => {
  await db
    .update(posts)
    .set({ creatorUsername: newUserName })
    .where(eq(posts.creatorId, userId));
};
