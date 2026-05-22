"use server";

import { requireUser } from "@/lib/auth/session";
import { getActorContext, isCommunityModerator } from "@/lib/auth/permissions";
import { createComment } from "@/lib/comments/createComment";
import { deleteComment } from "@/lib/comments/deleteComment";
import { handleCommentVote } from "@/lib/comments/handleCommentVote";
import { getCommentVotes } from "@/lib/comments/getCommentVotes";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Comment } from "@/types/comment";

export async function createCommentAction(
  communityId: string | null,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
): Promise<Comment> {
  const { user } = await requireUser();
  return createComment(
    { id: user.id, username: user.username ?? null },
    communityId,
    postId,
    postTitle,
    commentText,
    parentId
  );
}

async function resolveCommentActor(commentId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();
  const row = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { creatorId: true, communityId: true, postId: true },
  });
  if (!row) throw new Error("Comment not found");
  const isAuthor = row.creatorId === userId;
  const isMod = !isAuthor && !!row.communityId && (await isCommunityModerator(userId, row.communityId));
  const role = isAuthor ? "author" : superadmin ? "superadmin" : isMod ? "moderator" : null;
  return { userId, row, isAuthor, isMod, isSuper: superadmin, role };
}

export async function deleteCommentAction(commentId: string, postId: string) {
  const actor = await resolveCommentActor(commentId);
  if (!actor.role) throw new Error("Forbidden");
  return deleteComment(commentId, postId);
}

export async function editCommentAction(commentId: string, newText: string) {
  const actor = await resolveCommentActor(commentId);
  if (!actor.role) throw new Error("Forbidden");
  const trimmed = newText.trim();
  if (!trimmed) throw new Error("Comment text required");
  const [updated] = await db
    .update(comments)
    .set({
      text: trimmed,
      editedAt: new Date(),
      editedById: actor.userId,
      editedByRole: actor.role,
    })
    .where(eq(comments.id, commentId))
    .returning();
  return updated;
}

export async function voteCommentAction(commentId: string, vote: number) {
  const { user } = await requireUser();
  return handleCommentVote(user.id, commentId, vote);
}

export async function getCommentVotesAction(postId: string) {
  const { user } = await requireUser();
  return getCommentVotes(user.id, postId);
}
