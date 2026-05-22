import { db } from "@/lib/db";
import { communityMembers, users } from "@/lib/db/schema";
import { CommunityMember } from "@/types/communityMember";
import { eq } from "drizzle-orm";

/**
 * Retrieves all members of a community, joined with their user profile,
 * sorted alphabetically by display name (falling back to id).
 * @param communityId - The unique identifier of the community.
 * @returns A promise that resolves to a sorted array of community members.
 */
export const fetchCommunityMembers = async (
  communityId: string
): Promise<CommunityMember[]> => {
  const rows = await db
    .select({ id: users.id, name: users.name, username: users.username, imageUrl: users.imageUrl })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(eq(communityMembers.communityId, communityId));

  const members: CommunityMember[] = rows.map((r) => ({
    id: r.id,
    displayName: r.name ?? null,
    username: r.username ?? null,
    imageUrl: r.imageUrl ?? null,
  }));

  members.sort((a, b) => {
    const nameA = (a.displayName || a.id).toLowerCase();
    const nameB = (b.displayName || b.id).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return members;
};
