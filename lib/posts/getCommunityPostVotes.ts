import { db } from "@/lib/db";
import { postVotes } from "@/lib/db/schema";
import { PostVote } from "@/types/post";
import { and, eq } from "drizzle-orm";

/**
 * Retrieves all post votes cast by a specific user within a particular community.
 * This is used to hydrate the voting state for posts when a user views a community's feed.
 * @param userId - The unique identifier of the user whose votes are being retrieved.
 * @param communityId - The unique identifier of the community to filter votes by.
 * @returns A promise that resolves to an array of post vote objects.
 */
export const getCommunityPostVotes = async (userId: string, communityId: string): Promise<PostVote[]> =>
  (await db.select().from(postVotes)
    .where(and(eq(postVotes.userId, userId), eq(postVotes.communityId, communityId)))) as unknown as PostVote[];