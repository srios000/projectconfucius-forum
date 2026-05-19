"use server";

import { requireUser } from "@/lib/auth/session";
import { createComment } from "@/lib/comments/createComment";
import { deleteComment } from "@/lib/comments/deleteComment";
import type { Comment } from "@/types/comment";

function displayName(user: { name?: string | null; email: string }) {
  return user.name?.trim() || user.email.split("@")[0];
}

export async function createCommentAction(
  communityId: string,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
): Promise<Comment> {
  const { session, userId } = await requireUser();
  return createComment(
    { id: userId, displayName: displayName(session.user) },
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
