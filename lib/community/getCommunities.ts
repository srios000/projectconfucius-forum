import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { and, desc, eq, lt, or } from "drizzle-orm";

export type CommunityCursor = { createdAt: Date; id: string } | null;

/**
 * Fetches a paginated list of communities using keyset pagination on
 * (createdAt, id) — the same cursor pattern as `getPosts`.
 * @param limitValue - The maximum number of communities to retrieve.
 * @param lastVisible - The keyset cursor returned by the previous page (or null/undefined for the first page).
 * @returns A promise that resolves to the communities and the next pagination cursor.
 */
export const getCommunities = async (
  limitValue: number,
  lastVisible?: CommunityCursor
) => {
  const where = lastVisible
    ? or(
        lt(communities.createdAt, lastVisible.createdAt),
        and(
          eq(communities.createdAt, lastVisible.createdAt),
          lt(communities.id, lastVisible.id)
        )
      )
    : undefined;

  const rows = await db
    .select()
    .from(communities)
    .where(where)
    .orderBy(desc(communities.createdAt), desc(communities.id))
    .limit(limitValue);

  const result = rows as unknown as Community[];
  const newLastVisible =
    rows.length > 0
      ? { createdAt: rows[rows.length - 1].createdAt, id: rows[rows.length - 1].id }
      : null;

  return { communities: result, newLastVisible };
};
