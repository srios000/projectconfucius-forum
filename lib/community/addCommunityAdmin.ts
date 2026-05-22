import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Promotes a member to moderator within a community.
 * @param communityId - The unique identifier of the community.
 * @param userId - The local user id of the member to promote.
 * @param _communityImageURL - Unused in Phase A (snippets no longer cache the image).
 * @returns A promise that resolves when the membership row is updated.
 */
export const addCommunityAdmin = async (
  communityId: string,
  userId: string,
  _communityImageURL?: string
): Promise<void> => {
  await db
    .update(communityMembers)
    .set({ isModerator: true })
    .where(
      and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      )
    );
};
