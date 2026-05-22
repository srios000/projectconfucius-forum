import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { Comment } from "@/types/comment";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Creates a comment on a post and increments the post's comment count.
 * Threads can nest indefinitely (Reddit-style); UI may collapse deep branches
 * behind a "continue this thread" link, but the data model has no depth cap.
 * @param author - The comment creator: `{ id, username }` (local user id).
 * @param communityId - The community the post belongs to.
 * @param postId - The post being commented on.
 * @param postTitle - The post title, cached for activity feeds.
 * @param commentText - The comment body.
 * @param parentId - The parent comment id when this is a reply.
 * @returns A promise that resolves to the newly created comment.
 */
export const createComment = async (
  author: { id: string; username: string | null },
  communityId: string | null,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
): Promise<Comment> => {
  let depth = 0;
  if (parentId) {
    const parent = await db.query.comments.findFirst({
      where: eq(comments.id, parentId),
      columns: { depth: true },
    });
    depth = (parent?.depth ?? 0) + 1;
  }

  const id = randomUUID();
  const createdAt = new Date();
  const newComment: Comment = {
    id,
    creatorId: author.id,
    creatorDisplayText: author.username,
    communityId,
    postId,
    postTitle,
    text: commentText,
    createdAt,
    depth,
    ...(parentId ? { parentId } : {}),
  };

  await db.transaction(async (tx) => {
    await tx.insert(comments).values({
      id,
      postId,
      parentId: parentId ?? null,
      communityId,
      postTitle,
      creatorId: author.id,
      creatorDisplayText: author.username,
      text: commentText,
      depth,
    });

    await tx
      .update(posts)
      .set({ numberOfComments: sql`${posts.numberOfComments} + 1` })
      .where(eq(posts.id, postId));
  });

  return newComment;
};
