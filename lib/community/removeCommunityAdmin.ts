import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Demotes a moderator back to a regular member within a community.
 * The user remains a member but loses moderator privileges.
 * @param communityId - The unique identifier of the community.
 * @param userId - The local user id of the member to demote.
 * @returns A promise that resolves when the membership row is updated.
 */
export const removeCommunityAdmin = async (
  communityId: string,
  userId: string
): Promise<void> => {
  await db
    .update(communityMembers)
    .set({ isModerator: false })
    .where(
      and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      )
    );
};
