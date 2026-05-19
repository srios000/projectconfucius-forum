import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { eq } from "drizzle-orm";

/**
 * Deletes a community. Posts → comments → votes → saved posts and the
 * community_members rows all cascade via `ON DELETE CASCADE` foreign keys.
 * @param communityData - The community to delete (only `id` is required).
 * @returns A promise that resolves when the community has been removed.
 */
export const deleteCommunity = async (communityData: Community) => {
  await db.delete(communities).where(eq(communities.id, communityData.id));
};
