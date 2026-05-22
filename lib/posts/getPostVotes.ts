import { db } from "@/lib/db";
import { postVotes } from "@/lib/db/schema";
import { PostVote } from "@/types/post";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Retrieves a user's votes, optionally narrowed to a specific set of posts.
 * @param userId - The unique identifier of the user whose votes are being retrieved.
 * @param postIds - Optional list of post ids to filter to.
 * @returns A promise that resolves to an array of post vote objects.
 */
export const getPostVotes = async (
  userId: string,
  postIds?: string[]
): Promise<PostVote[]> => {
  const where =
    postIds && postIds.length > 0
      ? and(eq(postVotes.userId, userId), inArray(postVotes.postId, postIds))
      : eq(postVotes.userId, userId);
  return (await db.select().from(postVotes).where(where)) as unknown as PostVote[];
};