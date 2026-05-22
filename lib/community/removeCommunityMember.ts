import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Removes a member from a community and decrements the member count.
 * Typically used by moderators to manage the member list.
 * @param communityId - The unique identifier of the community.
 * @param memberId - The local user id of the member to remove.
 * @returns A promise that resolves when the transaction is committed.
 */
export const removeCommunityMember = async (
  communityId: string,
  memberId: string
) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, memberId),
          eq(communityMembers.communityId, communityId)
        )
      );

    await tx
      .update(communities)
      .set({ numberOfMembers: sql`${communities.numberOfMembers} - 1` })
      .where(eq(communities.id, communityId));
  });
};
