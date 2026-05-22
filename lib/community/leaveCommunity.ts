import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Removes a user from a community and decrements the member count.
 * Runs as a transaction so the membership row and the counter stay consistent.
 * @param userId - The local user id of the user leaving the community.
 * @param communityId - The unique identifier of the community being left.
 * @returns A promise that resolves when the transaction is committed.
 */
export const leaveCommunity = async (userId: string, communityId: string) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    await tx
      .update(communities)
      .set({ numberOfMembers: sql`${communities.numberOfMembers} - 1` })
      .where(eq(communities.id, communityId));
  });
};
