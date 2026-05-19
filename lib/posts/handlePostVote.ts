import { db } from "@/lib/db";
import { postVotes, posts } from "@/lib/db/schema";
import { Post, PostVote } from "@/types/post";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Processes a vote (upvote or downvote) on a post and updates the aggregate vote count.
 * This function handles three scenarios:
 * 1. Creating a new vote if none exists.
 * 2. Removing an existing vote if the user clicks the same vote button again (toggle off).
 * 3. Updating an existing vote if the user switches from upvote to downvote or vice versa.
 * All operations are performed in a Firestore batch to ensure atomicity.
 * @param userId - The unique identifier of the user casting the vote.
 * @param post - The post object being voted on.
 * @param vote - The value of the vote (1 for upvote, -1 for downvote).
 * @param communityId - The identifier of the community where the post resides.
 * @param existingVote - The user's previous vote on this post, if any.
 * @returns A promise that resolves to an object containing the vote delta, the new vote record, and any deleted vote ID.
 */
export const handlePostVote = async (
  userId: string, post: Post, vote: number, communityId: string, existingVote?: PostVote,
) => {
  let voteChange = vote;
  let newVote: PostVote | undefined;
  let voteIdToDelete: string | undefined;

  await db.transaction(async (tx) => {
    if (!existingVote) {
      const id = randomUUID();
      await tx.insert(postVotes).values({ id, userId, postId: post.id!, communityId, voteValue: vote });
      newVote = { id, postId: post.id!, communityId, voteValue: vote };
      voteChange = vote;
    } else if (existingVote.voteValue === vote) {
      await tx.delete(postVotes).where(eq(postVotes.id, existingVote.id));
      voteChange = -vote;
      voteIdToDelete = existingVote.id;
    } else {
      await tx.update(postVotes).set({ voteValue: vote }).where(eq(postVotes.id, existingVote.id));
      voteChange = 2 * vote;
      newVote = { ...existingVote, voteValue: vote };
    }
    await tx.update(posts).set({ voteStatus: sql`${posts.voteStatus} + ${voteChange}` })
      .where(eq(posts.id, post.id!));
  });

  return { voteChange, newVote, voteIdToDelete };
};