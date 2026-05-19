import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { CommunitySnippet } from "@/types/community";
import { eq } from "drizzle-orm";

/**
 * Returns the current user's community memberships as snippets, joined with
 * the community image. Replaces the old Firestore
 * `users/{uid}/communitySnippets` subcollection.
 * @param userId - The local user id.
 * @returns A promise that resolves to the user's community snippets.
 */
export const getCommunitySnippets = async (
  userId: string
): Promise<CommunitySnippet[]> => {
  const rows = await db
    .select({
      communityId: communityMembers.communityId,
      isModerator: communityMembers.isModerator,
      imageUrl: communities.imageUrl,
    })
    .from(communityMembers)
    .innerJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(eq(communityMembers.userId, userId));

  return rows.map((r) => ({
    communityId: r.communityId,
    isModerator: r.isModerator,
    imageUrl: r.imageUrl ?? undefined,
  }));
};
