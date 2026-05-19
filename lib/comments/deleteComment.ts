import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Deletes a comment and all of its threaded descendants, then decrements the
 * post's comment count by the number of comments removed.
 *
 * The descendant count is computed via a recursive CTE before deletion; the
 * children themselves are removed automatically by the `parent_id`
 * self-referential `ON DELETE CASCADE` foreign key.
 * @param commentId - The id of the comment (subtree root) to delete.
 * @param postId - The id of the post the comment belongs to.
 * @returns A promise that resolves to the total number of comments deleted.
 */
export const deleteComment = async (commentId: string, postId: string) => {
  return db.transaction(async (tx) => {
    const ids = await tx.execute(sql`
      WITH RECURSIVE t AS (
        SELECT id FROM comments WHERE id = ${commentId}
        UNION ALL SELECT c.id FROM comments c JOIN t ON c.parent_id = t.id
      ) SELECT count(*)::int AS n FROM t`);
    const n = (ids as unknown as { n: number }[])[0].n;

    await tx.delete(comments).where(eq(comments.id, commentId));

    await tx
      .update(posts)
      .set({ numberOfComments: sql`${posts.numberOfComments} - ${n}` })
      .where(eq(posts.id, postId));

    return n;
  });
};
