import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Sets a community's image URL.
 *
 * Phase A: the upload pathway is deferred to Phase B — `imageUrl` is an
 * already-resolved URL string; this only persists it.
 * @param communityId - The unique identifier of the community.
 * @param imageUrl - The already-resolved image URL.
 * @returns A promise that resolves to the stored image URL.
 */
export const updateCommunityImage = async (
  communityId: string,
  imageUrl: string
) => {
  await db
    .update(communities)
    .set({ imageUrl })
    .where(eq(communities.id, communityId));

  return imageUrl;
};
