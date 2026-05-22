import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { and, desc, eq, lt, or } from "drizzle-orm";

export type CommunityCursorRecent = { createdAt: Date; id: string };
export type CommunityCursorTop = { numberOfMembers: number; id: string };
export type CommunityCursor = CommunityCursorRecent | CommunityCursorTop | null;

export type CommunitySort = "recent" | "top";

export const getCommunities = async (
  limitValue: number,
  lastVisible?: CommunityCursor,
  sort: CommunitySort = "recent",
) => {
  const where =
    sort === "top"
      ? lastVisible && "numberOfMembers" in lastVisible
        ? or(
            lt(communities.numberOfMembers, lastVisible.numberOfMembers),
            and(
              eq(communities.numberOfMembers, lastVisible.numberOfMembers),
              lt(communities.id, lastVisible.id),
            ),
          )
        : undefined
      : lastVisible && "createdAt" in lastVisible
        ? or(
            lt(communities.createdAt, lastVisible.createdAt),
            and(
              eq(communities.createdAt, lastVisible.createdAt),
              lt(communities.id, lastVisible.id),
            ),
          )
        : undefined;

  const orderBy =
    sort === "top"
      ? [desc(communities.numberOfMembers), desc(communities.id)]
      : [desc(communities.createdAt), desc(communities.id)];

  const rows = await db
    .select()
    .from(communities)
    .where(where)
    .orderBy(...orderBy)
    .limit(limitValue);

  const result = rows as unknown as Community[];
  const last = rows[rows.length - 1];
  const newLastVisible: CommunityCursor = last
    ? sort === "top"
      ? { numberOfMembers: last.numberOfMembers, id: last.id }
      : { createdAt: last.createdAt, id: last.id }
    : null;

  return { communities: result, newLastVisible };
};
