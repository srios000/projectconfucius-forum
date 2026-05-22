import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { eq } from "drizzle-orm";

/**
 * Retrieves community data by id.
 * @param communityId - Id of the community to fetch.
 * @returns Community object or null if it does not exist.
 */
export async function getCommunityData(
  communityId: string
): Promise<Community | null> {
  const row = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
  });
  return (row as unknown as Community) ?? null;
}
