import { db } from "@/lib/db";
import { postVotes } from "@/lib/db/schema";
import { PostVote } from "@/types/post";
import { eq } from "drizzle-orm";

/**
 * Retrieves the voting status for a specific set of posts for a given user.
 * This function handles large sets of post IDs by chunking them into batches to comply with Firestore's 'in' query limits.
 * @param userId - The unique identifier of the user whose votes are being retrieved.
 * @param postIds - An array of post identifiers to check for votes.
 * @returns A promise that resolves to an array of post vote objects for the specified posts.
 */
export const getPostVotes = async (userId: string): Promise<PostVote[]> =>
  (await db.select().from(postVotes).where(eq(postVotes.userId, userId))) as unknown as PostVote[];