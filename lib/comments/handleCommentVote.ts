import { db } from "@/lib/db";
import { commentVotes, comments } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const handleCommentVote = async (
  userId: string, commentId: string, vote: number,
) => {
  let voteChange = vote;

  await db.transaction(async (tx) => {
    const existingRows = await tx.select().from(commentVotes)
      .where(and(eq(commentVotes.userId, userId), eq(commentVotes.commentId, commentId)))
      .limit(1);
    
    const existingVote = existingRows[0] as { id: string; voteValue: number } | undefined;

    if (!existingVote) {
      const id = randomUUID();
      await tx.insert(commentVotes).values({ id, userId, commentId, voteValue: vote });
      voteChange = vote;
    } else if (existingVote.voteValue === vote) {
      await tx.delete(commentVotes).where(eq(commentVotes.id, existingVote.id));
      voteChange = -vote;
    } else {
      await tx.update(commentVotes).set({ voteValue: vote }).where(eq(commentVotes.id, existingVote.id));
      voteChange = 2 * vote;
    }

    await tx.update(comments)
      .set({ voteStatus: sql`${comments.voteStatus} + ${voteChange}` })
      .where(eq(comments.id, commentId));
  });

  return { voteChange };
};
