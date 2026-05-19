import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

export type PostCursor = { createdAt: Date; id: string } | { voteStatus: number; id: string } | null;

/**
 * Fetches a paginated list of posts based on various filtering criteria.
 * Supports fetching posts for a specific community, a personalized home feed for subscribed users,
 * or a generic home feed for guest users.
 * @param communityId - Optional identifier to fetch posts from a single community.
 * @param communityIds - Optional array of identifiers to fetch posts from multiple subscribed communities.
 * @param isGenericHome - Optional flag to fetch posts for the generic home feed (sorted by vote status).
 * @param lastVisible - Optional Firestore document snapshot for pagination.
 * @returns A promise that resolves to an object containing the array of posts and the next pagination cursor.
 */
export const getPosts = async (
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: PostCursor,
) => {
  const where = [];
  if (communityId) where.push(eq(posts.communityId, communityId));
  else if (communityIds && communityIds.length > 0) where.push(inArray(posts.communityId, communityIds));

  const orderByVote = isGenericHome && !communityId && !(communityIds && communityIds.length);

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