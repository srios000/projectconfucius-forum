import { db } from "@/lib/db";
import { postVotes, posts } from "@/lib/db/schema";
import { Post, PostVote } from "@/types/post";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const handlePostVote = async (
  userId: string, post: Post, vote: number, communityId: string | null, existingVote?: PostVote,
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