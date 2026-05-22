import { db } from "@/lib/db";
import { commentVotes, comments } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export type CommentVote = {
  commentId: string;
  voteValue: number;
};

export const getCommentVotes = async (userId: string, postId: string): Promise<CommentVote[]> => {
  const rows = await db
    .select({ commentId: commentVotes.commentId, voteValue: commentVotes.voteValue })
    .from(commentVotes)
    .innerJoin(comments, eq(commentVotes.commentId, comments.id))
    .where(and(
      eq(commentVotes.userId, userId),
      eq(comments.postId, postId)
    ));

  return rows;
};
