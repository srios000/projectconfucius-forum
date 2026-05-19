import { db } from "@/lib/db";
import { communityMembers, users } from "@/lib/db/schema";
import { CommunityMember } from "@/types/communityMember";
import { and, eq } from "drizzle-orm";

/**
 * Retrieves the moderators of a community (members with `isModerator = true`),
 * joined with their user profile.
 *
 * Note: the previous `creatorId`/`adminIds` arguments were removed in Phase A —
 * moderator status now lives on `community_members.isModerator`.
 * @param communityId - The unique identifier of the community.
 * @returns A promise that resolves to an array of moderator members.
 */
export const fetchCommunityAdmins = async (
  communityId: string
): Promise<CommunityMember[]> => {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.isModerator, true)
      )
    );

  return rows.map((r) => ({
    id: r.id,
    email: r.email || "Unknown email",
    displayName: r.name ?? null,
  }));
};
