import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { and, asc, desc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";

export type PostCursor =
  | { createdAt: Date; id: string }
  | { voteStatus: number; id: string }
  | { voteStatus: number; numberOfComments: number; id: string }
  | null;

export type PostSort = "new" | "top" | "controversial";

export const getPosts = async (
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: PostCursor,
  wallUserId?: string,
  sort?: PostSort,
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

  // Default: generic home shows top; everything else shows new (existing behavior).
  // Explicit `sort` overrides.
  const resolvedSort: PostSort = sort
    ?? (isGenericHome && !communityId && !wallUserId && !(communityIds && communityIds.length)
      ? "top"
      : "new");

  if (lastVisible) {
    if (resolvedSort === "top" && "voteStatus" in lastVisible && !("numberOfComments" in lastVisible)) {
      where.push(or(
        lt(posts.voteStatus, lastVisible.voteStatus),
        and(eq(posts.voteStatus, lastVisible.voteStatus), lt(posts.id, lastVisible.id)),
      ));
    } else if (resolvedSort === "controversial" && "voteStatus" in lastVisible && "numberOfComments" in lastVisible) {
      // Smaller (more negative) voteStatus comes first; tiebreak by more comments first.
      where.push(or(
        gt(posts.voteStatus, lastVisible.voteStatus),
        and(eq(posts.voteStatus, lastVisible.voteStatus), lt(posts.numberOfComments, lastVisible.numberOfComments)),
        and(eq(posts.voteStatus, lastVisible.voteStatus), eq(posts.numberOfComments, lastVisible.numberOfComments), lt(posts.id, lastVisible.id)),
      ));
    } else if ("createdAt" in lastVisible) {
      where.push(or(
        lt(posts.createdAt, lastVisible.createdAt),
        and(eq(posts.createdAt, lastVisible.createdAt), lt(posts.id, lastVisible.id)),
      ));
    }
  }

  const orderBy = resolvedSort === "top"
    ? [desc(posts.voteStatus), desc(posts.id)]
    : resolvedSort === "controversial"
      // True controversy requires upvote/downvote split (not stored yet). Proxy:
      // most-negative voteStatus first, with high comment count as tiebreaker.
      ? [asc(posts.voteStatus), desc(posts.numberOfComments), desc(posts.id)]
      : [desc(posts.createdAt), desc(posts.id)];

  const rows = await db.select().from(posts)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(10);

  const result = rows as unknown as Post[];
  const lastRow = rows[rows.length - 1];
  const last: PostCursor = lastRow
    ? resolvedSort === "top"
      ? { voteStatus: lastRow.voteStatus, id: lastRow.id }
      : resolvedSort === "controversial"
        ? { voteStatus: lastRow.voteStatus, numberOfComments: lastRow.numberOfComments, id: lastRow.id }
        : { createdAt: lastRow.createdAt, id: lastRow.id }
    : null;
  return { posts: result, newLastVisible: last };
};