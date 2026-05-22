import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { CommunitySnippet } from "@/types/community";
import { and, eq, isNotNull, sql } from "drizzle-orm";

/**
 * Joins a user to a community and increments the member count.
 * Runs as a transaction so the membership row and the counter stay consistent.
 * @param userId - The local user id of the user joining the community.
 * @param communityId - The unique identifier of the community being joined.
 * @param communityImageURL - Optional community image URL stored in the returned snippet.
 * @param isCreatorOrAdmin - Whether the user should be granted moderator privileges.
 * @returns A promise that resolves to the newly created community snippet.
 */
export const joinCommunity = async (
  userId: string,
  communityId: string,
  communityImageURL?: string,
  isCreatorOrAdmin?: boolean
): Promise<CommunitySnippet> => {
  // Block rejoin if a ban tombstone exists for this user in this community.
  const banned = await db.query.communityMembers.findFirst({
    where: and(
      eq(communityMembers.userId, userId),
      eq(communityMembers.communityId, communityId),
      isNotNull(communityMembers.bannedAt),
    ),
    columns: { userId: true },
  });
  if (banned) throw new Error("You are banned from this community");

  await db.transaction(async (tx) => {
    await tx
      .insert(communityMembers)
      .values({
        userId,
        communityId,
        isModerator: !!isCreatorOrAdmin,
      })
      .onConflictDoNothing();

    await tx
      .update(communities)
      .set({ numberOfMembers: sql`${communities.numberOfMembers} + 1` })
      .where(eq(communities.id, communityId));
  });

  return {
    communityId,
    imageUrl: communityImageURL || undefined,
    isModerator: !!isCreatorOrAdmin,
  };
};
