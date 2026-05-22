import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Updates the privacy setting for a community (public, restricted, or private).
 * @param communityId - The unique identifier of the community.
 * @param privacyType - The new privacy setting to apply.
 * @returns A promise that resolves when the community row is updated.
 */
export const updateCommunityPrivacy = async (
  communityId: string,
  privacyType: string
) => {
  await db
    .update(communities)
    .set({
      privacyType: privacyType as "public" | "restricted" | "private",
    })
    .where(eq(communities.id, communityId));
};
