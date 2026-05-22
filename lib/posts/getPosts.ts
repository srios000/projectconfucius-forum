import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";

export type PostCursor = { createdAt: Date; id: string } | { voteStatus: number; id: string } | null;

export const getPosts = async (
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: PostCursor,
  wallUserId?: string,
) => {
  const where = [];
  if (wallUserId) {
    where.push(eq(posts.wallUserId, wallUserId));
  } else if (communityId) {
    where.push(eq(posts.communityId, communityId));
  } else if (communityIds && communityIds.length > 0) {
    where.push(inArray(posts.communityId, communityIds));
  } else {
    where.push(isNull(posts.wallUserId));
  }

  const orderByVote = isGenericHome && !communityId && !wallUserId && !(communityIds && communityIds.length);

  if (lastVisible) {
    if (orderByVote && "voteStatus" in lastVisible) {
      where.push(or(lt(posts.voteStatus, lastVisible.voteStatus),
        and(eq(posts.voteStatus, lastVisible.voteStatus), lt(posts.id, lastVisible.id))));
    } else if ("createdAt" in lastVisible) {
      where.push(or(lt(posts.createdAt, lastVisible.createdAt),
        and(eq(posts.createdAt, lastVisible.createdAt), lt(posts.id, lastVisible.id))));
    }
  }

  const rows = await db.select().from(posts)
    .where(where.length ? and(...where) : undefined)
    .orderBy(orderByVote ? desc(posts.voteStatus) : desc(posts.createdAt), desc(posts.id))
    .limit(10);

  const result = rows as unknown as Post[];
  const last = rows.length
    ? (orderByVote
      ? { voteStatus: rows[rows.length - 1].voteStatus, id: rows[rows.length - 1].id }
      : { createdAt: rows[rows.length - 1].createdAt, id: rows[rows.length - 1].id })
    : null;
  return { posts: result, newLastVisible: last };
};