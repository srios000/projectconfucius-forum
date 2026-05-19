import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Updates the cached display name on all of a user's comments so name
 * changes propagate across comment threads.
 * @param userId - The local user id whose comments are updated.
 * @param newUserName - The new display name to apply.
 * @returns A promise that resolves when the comments are updated.
 */
export const updateUserCommentsName = async (
  userId: string,
  newUserName: string
) => {
  await db
    .update(comments)
    .set({ creatorDisplayText: newUserName })
    .where(eq(comments.creatorId, userId));
};
