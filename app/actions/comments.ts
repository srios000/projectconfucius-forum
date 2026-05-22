"use server";

import { requireUser } from "@/lib/auth/session";
import { createComment } from "@/lib/comments/createComment";
import { deleteComment } from "@/lib/comments/deleteComment";
import { handleCommentVote } from "@/lib/comments/handleCommentVote";
import { getCommentVotes } from "@/lib/comments/getCommentVotes";
import type { Comment } from "@/types/comment";

function displayName(user: { name?: string | null; email: string }) {
  return user.name?.trim() || user.email.split("@")[0];
}

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

export async function deleteCommentAction(commentId: string, postId: string) {
  await requireUser();
  return deleteComment(commentId, postId);
}

export async function voteCommentAction(commentId: string, vote: number) {
  const { user } = await requireUser();
  return handleCommentVote(user.id, commentId, vote);
}

export async function getCommentVotesAction(postId: string) {
  const { user } = await requireUser();
  return getCommentVotes(user.id, postId);
}
