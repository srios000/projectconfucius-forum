import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Clears a community's image URL.
 * @param communityId - The unique identifier of the community.
 * @returns A promise that resolves when the community row is updated.
 */
export const deleteCommunityImage = async (communityId: string) => {
  await db
    .update(communities)
    .set({ imageUrl: null })
    .where(eq(communities.id, communityId));
};
