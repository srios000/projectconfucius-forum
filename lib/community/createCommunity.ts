import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Orchestrates the creation of a new community and the initial membership for the creator.
 * Executes as a transaction so the community row and the creator's moderator membership
 * are created atomically.
 * @param communityName - The unique identifier for the new community.
 * @param communityType - The privacy setting (public, restricted, or private).
 * @param userId - The local user id of the creator.
 * @returns A promise that resolves when the transaction is successfully committed.
 */
export const createCommunity = async (
  communityName: string,
  communityType: string,
  userId: string
) => {
  const existing = await db.query.communities.findFirst({
    where: eq(communities.id, communityName),
    columns: { id: true },
  });
  if (existing) {
    throw new Error(`Sorry, /r/${communityName} is taken. Try another.`);
  }

  await db.transaction(async (tx) => {
    await tx.insert(communities).values({
      id: communityName,
      creatorId: userId,
      privacyType: communityType as "public" | "restricted" | "private",
      numberOfMembers: 1,
    });

    await tx.insert(communityMembers).values({
      userId,
      communityId: communityName,
      isModerator: true,
    });
  });
};
